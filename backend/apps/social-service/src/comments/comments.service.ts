import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { PostComment } from '@app/database/entities/post-comment.entity';
import { Post } from '@app/database/entities/post.entity';
import { CreateCommentDto, UpdateCommentDto, CommentResponseDto } from './dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(PostComment)
    private commentRepository: Repository<PostComment>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async createComment(
    postId: string,
    userId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    // Check if post exists
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if parent comment exists (for replies)
    if (createCommentDto.parentCommentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: createCommentDto.parentCommentId },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      // Check if parent comment belongs to the same post
      if (parentComment.postId !== postId) {
        throw new BadRequestException('Parent comment does not belong to this post');
      }
    }

    const comment = this.commentRepository.create({
      postId,
      userId,
      parentCommentId: createCommentDto.parentCommentId,
      content: createCommentDto.content,
    });

    const savedComment = await this.commentRepository.save(comment);
    return this.mapToResponseDto(savedComment);
  }

  async updateComment(
    commentId: string,
    userId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user owns the comment
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    // Update comment
    Object.assign(comment, updateCommentDto);
    const updatedComment = await this.commentRepository.save(comment);
    return this.mapToResponseDto(updatedComment);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user owns the comment
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.remove(comment);
  }

  async getPostComments(postId: string): Promise<CommentResponseDto[]> {
    const comments = await this.commentRepository.find({
      where: { postId, parentCommentId: IsNull() }, // Only top-level comments
      relations: ['user', 'replies', 'replies.user'],
      order: { createdAt: 'DESC' },
    });

    return comments.map(comment => this.mapToResponseDto(comment));
  }

  async getCommentReplies(commentId: string): Promise<CommentResponseDto[]> {
    const replies = await this.commentRepository.find({
      where: { parentCommentId: commentId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return replies.map(reply => this.mapToResponseDto(reply));
  }

  async getCommentById(commentId: string): Promise<CommentResponseDto> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'replies', 'replies.user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return this.mapToResponseDto(comment);
  }

  async getUserComments(userId: string): Promise<CommentResponseDto[]> {
    const comments = await this.commentRepository.find({
      where: { userId },
      relations: ['post', 'user'],
      order: { createdAt: 'DESC' },
    });

    return comments.map(comment => this.mapToResponseDto(comment));
  }

  async getCommentStats(postId: string): Promise<{
    totalComments: number;
    topLevelComments: number;
    replies: number;
  }> {
    const [totalComments, topLevelComments, replies] = await Promise.all([
      this.commentRepository.count({ where: { postId } }),
      this.commentRepository.count({ where: { postId, parentCommentId: IsNull() } }),
      this.commentRepository.count({ where: { postId, parentCommentId: Not(IsNull()) } }),
    ]);

    return {
      totalComments,
      topLevelComments,
      replies,
    };
  }

  private mapToResponseDto(comment: PostComment): CommentResponseDto {
    return {
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      parentCommentId: comment.parentCommentId,
      content: comment.content,
      isApproved: comment.isApproved,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: comment.user ? {
        id: comment.user.id,
        firstName: comment.user.firstName,
        lastName: comment.user.lastName,
        profilePictureUrl: comment.user.profilePictureUrl,
        isVerified: comment.user.isVerified,
        trustScore: comment.user.trustScore,
      } : undefined,
      replies: comment.replies?.map(reply => this.mapToResponseDto(reply)) || [],
    };
  }
}