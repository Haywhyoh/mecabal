import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PostComment, Post, User } from '@app/database';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentResponseDto,
  CommentFilterDto,
  PaginatedCommentsDto,
} from './dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(PostComment)
    private readonly commentRepository: Repository<PostComment>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createComment(
    postId: string,
    userId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    // Check if post exists
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // If this is a reply, check if parent comment exists
    if (createCommentDto.parentCommentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: createCommentDto.parentCommentId, postId },
      });
      if (!parentComment) {
        throw new BadRequestException('Parent comment not found');
      }

      // Check if parent comment is not already a reply (max 2 levels deep)
      if (parentComment.parentCommentId) {
        throw new BadRequestException('Cannot reply to a reply (max 2 levels deep)');
      }
    }

    // Create the comment
    const comment = this.commentRepository.create({
      postId,
      userId,
      content: createCommentDto.content,
      parentCommentId: createCommentDto.parentCommentId,
    });

    const savedComment = await this.commentRepository.save(comment);
    return this.formatCommentResponse(savedComment);
  }

  async getPostComments(
    postId: string,
    filterDto: CommentFilterDto,
    userId: string,
  ): Promise<PaginatedCommentsDto> {
    // Check if post exists
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const queryBuilder = this.createCommentsQueryBuilder(postId);

    // Apply filters
    if (filterDto.topLevelOnly) {
      queryBuilder.andWhere('comment.parentCommentId IS NULL');
    }

    // Apply pagination
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 20;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [comments, total] = await queryBuilder.getManyAndCount();

    // Format response with nested replies
    const formattedComments = await this.formatCommentsWithReplies(comments);

    return {
      data: formattedComments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
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

    // Check if user is the author
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    // Update comment
    comment.content = updateCommentDto.content;
    const updatedComment = await this.commentRepository.save(comment);

    return this.formatCommentResponse(updatedComment);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user is the author
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Check if comment has replies
    const replyCount = await this.commentRepository.count({
      where: { parentCommentId: commentId },
    });

    if (replyCount > 0) {
      throw new BadRequestException('Cannot delete comment with replies');
    }

    await this.commentRepository.remove(comment);
  }

  async getCommentById(commentId: string, userId: string): Promise<CommentResponseDto> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'replies', 'replies.user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return this.formatCommentResponse(comment);
  }

  private createCommentsQueryBuilder(postId: string): SelectQueryBuilder<PostComment> {
    return this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.replies', 'replies')
      .leftJoinAndSelect('replies.user', 'replyUser')
      .where('comment.postId = :postId', { postId })
      .andWhere('comment.isApproved = :isApproved', { isApproved: true })
      .orderBy('comment.createdAt', 'ASC');
  }

  private async formatCommentsWithReplies(comments: PostComment[]): Promise<CommentResponseDto[]> {
    const formattedComments: CommentResponseDto[] = [];

    for (const comment of comments) {
      const formattedComment = await this.formatCommentResponse(comment);
      
      // Get replies for this comment
      const replies = await this.commentRepository.find({
        where: { parentCommentId: comment.id },
        relations: ['user'],
        order: { createdAt: 'ASC' },
      });

      formattedComment.replies = await Promise.all(
        replies.map(reply => this.formatCommentResponse(reply))
      );

      formattedComments.push(formattedComment);
    }

    return formattedComments;
  }

  private async formatCommentResponse(comment: PostComment): Promise<CommentResponseDto> {
    return {
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      parentCommentId: comment.parentCommentId,
      content: comment.content,
      isApproved: comment.isApproved,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: {
        id: comment.user.id,
        firstName: comment.user.firstName,
        lastName: comment.user.lastName,
        profilePicture: comment.user.profilePictureUrl,
        isVerified: comment.user.isVerified || false,
        trustScore: comment.user.trustScore || 0,
      },
      replies: [], // Will be populated by formatCommentsWithReplies
      isReply: comment.isReply(),
    };
  }
}
