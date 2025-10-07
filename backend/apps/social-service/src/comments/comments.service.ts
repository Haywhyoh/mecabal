import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { PostComment } from '@app/database/entities/post-comment.entity';
import { CommentMedia } from '@app/database/entities/comment-media.entity';
import { Post } from '@app/database/entities/post.entity';
import { CreateCommentDto, UpdateCommentDto, CommentResponseDto } from './dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(PostComment)
    private commentRepository: Repository<PostComment>,
    @InjectRepository(CommentMedia)
    private commentMediaRepository: Repository<CommentMedia>,
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
        throw new BadRequestException(
          'Parent comment does not belong to this post',
        );
      }
    }

    const comment = this.commentRepository.create({
      postId,
      userId,
      parentCommentId: createCommentDto.parentCommentId,
      content: createCommentDto.content,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Handle media attachments if provided
    if (createCommentDto.media && createCommentDto.media.length > 0) {
      const mediaEntities = createCommentDto.media.map((media, index) =>
        this.commentMediaRepository.create({
          commentId: savedComment.id,
          mediaType: media.type,
          fileUrl: media.url,
          caption: media.caption,
          uploadOrder: index,
        })
      );

      await this.commentMediaRepository.save(mediaEntities);
    }

    // Fetch the comment with user for response
    const commentWithUser = await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
    });

    if (!commentWithUser) {
      throw new NotFoundException('Comment not found after creation');
    }

    // Manually fetch media
    const media = await this.commentMediaRepository.find({
      where: { commentId: savedComment.id },
      order: { uploadOrder: 'ASC' },
    });

    return this.mapToResponseDto(commentWithUser, media);
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

    // Update comment content if provided
    if (updateCommentDto.content !== undefined) {
      comment.content = updateCommentDto.content;
    }
    const updatedComment = await this.commentRepository.save(comment);

    // Note: Media updates are not currently supported in the UpdateCommentDto
    // This functionality can be added later if needed

    // Fetch the comment with user for response
    const commentWithUser = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!commentWithUser) {
      throw new NotFoundException('Comment not found after update');
    }

    // Manually fetch media
    const media = await this.commentMediaRepository.find({
      where: { commentId },
      order: { uploadOrder: 'ASC' },
    });

    return this.mapToResponseDto(commentWithUser, media);
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

    // Delete associated media first (cascade should handle this, but being explicit)
    await this.commentMediaRepository.delete({ commentId });

    await this.commentRepository.remove(comment);
  }

  async getPostComments(postId: string): Promise<CommentResponseDto[]> {
    const comments = await this.commentRepository.find({
      where: { postId, parentCommentId: IsNull() }, // Only top-level comments
      relations: ['user', 'replies', 'replies.user'],
      order: { createdAt: 'DESC' },
    });

    // Fetch all media for these comments and their replies in one query
    const commentIds = comments.flatMap(c => [c.id, ...c.replies.map(r => r.id)]);
    const allMedia = await this.commentMediaRepository.find({
      where: commentIds.map(id => ({ commentId: id })),
      order: { uploadOrder: 'ASC' },
    });

    // Group media by commentId
    const mediaByCommentId = allMedia.reduce((acc, media) => {
      if (!acc[media.commentId]) acc[media.commentId] = [];
      acc[media.commentId].push(media);
      return acc;
    }, {} as Record<string, CommentMedia[]>);

    return comments.map((comment) => this.mapToResponseDto(comment, mediaByCommentId[comment.id] || [], comment.replies.map(reply => this.mapToResponseDto(reply, mediaByCommentId[reply.id] || []))));
  }

  async getCommentReplies(commentId: string): Promise<CommentResponseDto[]> {
    const replies = await this.commentRepository.find({
      where: { parentCommentId: commentId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    // Fetch media for all replies
    const replyIds = replies.map(r => r.id);
    const allMedia = await this.commentMediaRepository.find({
      where: replyIds.map(id => ({ commentId: id })),
      order: { uploadOrder: 'ASC' },
    });

    // Group media by commentId
    const mediaByCommentId = allMedia.reduce((acc, media) => {
      if (!acc[media.commentId]) acc[media.commentId] = [];
      acc[media.commentId].push(media);
      return acc;
    }, {} as Record<string, CommentMedia[]>);

    return replies.map((reply) => this.mapToResponseDto(reply, mediaByCommentId[reply.id] || []));
  }

  async getCommentById(commentId: string): Promise<CommentResponseDto> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'replies', 'replies.user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Fetch media for comment and its replies
    const commentIds = [comment.id, ...comment.replies.map(r => r.id)];
    const allMedia = await this.commentMediaRepository.find({
      where: commentIds.map(id => ({ commentId: id })),
      order: { uploadOrder: 'ASC' },
    });

    // Group media by commentId
    const mediaByCommentId = allMedia.reduce((acc, media) => {
      if (!acc[media.commentId]) acc[media.commentId] = [];
      acc[media.commentId].push(media);
      return acc;
    }, {} as Record<string, CommentMedia[]>);

    return this.mapToResponseDto(comment, mediaByCommentId[comment.id] || [], comment.replies.map(reply => this.mapToResponseDto(reply, mediaByCommentId[reply.id] || [])));
  }

  async getUserComments(userId: string): Promise<CommentResponseDto[]> {
    const comments = await this.commentRepository.find({
      where: { userId },
      relations: ['post', 'user'],
      order: { createdAt: 'DESC' },
    });

    // Fetch media for all comments
    const commentIds = comments.map(c => c.id);
    const allMedia = await this.commentMediaRepository.find({
      where: commentIds.map(id => ({ commentId: id })),
      order: { uploadOrder: 'ASC' },
    });

    // Group media by commentId
    const mediaByCommentId = allMedia.reduce((acc, media) => {
      if (!acc[media.commentId]) acc[media.commentId] = [];
      acc[media.commentId].push(media);
      return acc;
    }, {} as Record<string, CommentMedia[]>);

    return comments.map((comment) => this.mapToResponseDto(comment, mediaByCommentId[comment.id] || []));
  }

  async getCommentStats(postId: string): Promise<{
    totalComments: number;
    topLevelComments: number;
    replies: number;
  }> {
    const [totalComments, topLevelComments, replies] = await Promise.all([
      this.commentRepository.count({ where: { postId } }),
      this.commentRepository.count({
        where: { postId, parentCommentId: IsNull() },
      }),
      this.commentRepository.count({
        where: { postId, parentCommentId: Not(IsNull()) },
      }),
    ]);

    return {
      totalComments,
      topLevelComments,
      replies,
    };
  }

  private mapToResponseDto(comment: PostComment, media: CommentMedia[] = [], replies: CommentResponseDto[] = []): CommentResponseDto {
    return {
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      parentCommentId: comment.parentCommentId,
      content: comment.content,
      isApproved: comment.isApproved,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: comment.user
        ? {
            id: comment.user.id,
            firstName: comment.user.firstName,
            lastName: comment.user.lastName,
            profilePictureUrl: comment.user.profilePictureUrl,
            isVerified: comment.user.isVerified,
            trustScore: comment.user.trustScore,
          }
        : undefined,
      media: media.map((m) => ({
        id: m.id,
        url: m.fileUrl,
        type: m.type as 'image' | 'video',
        caption: m.caption,
      })),
      replies: replies,
      isReply: comment.isReply(),
    };
  }
}
