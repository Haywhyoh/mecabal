import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SocialAuthGuard } from '../guards/social-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto, CommentResponseDto } from './dto';

@ApiTags('comments')
@Controller('comments')
@UseGuards(SocialAuthGuard)
@ApiBearerAuth()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('posts/:postId')
  @ApiOperation({ summary: 'Create a new comment on a post' })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async createComment(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: any,
  ): Promise<CommentResponseDto> {
    return this.commentsService.createComment(
      postId,
      req.user.id,
      createCommentDto,
    );
  }

  @Put(':commentId')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({
    status: 200,
    description: 'Comment updated successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not comment owner' })
  async updateComment(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req: any,
  ): Promise<CommentResponseDto> {
    return this.commentsService.updateComment(
      commentId,
      req.user.id,
      updateCommentDto,
    );
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 204, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not comment owner' })
  async deleteComment(
    @Param('commentId') commentId: string,
    @Request() req: any,
  ): Promise<void> {
    return this.commentsService.deleteComment(commentId, req.user.id);
  }

  @Get('posts/:postId')
  @ApiOperation({ summary: 'Get all comments for a post' })
  @ApiResponse({
    status: 200,
    description: 'Comments retrieved successfully',
    type: [CommentResponseDto],
  })
  async getPostComments(
    @Param('postId') postId: string,
  ): Promise<CommentResponseDto[]> {
    return this.commentsService.getPostComments(postId);
  }

  @Get(':commentId/replies')
  @ApiOperation({ summary: 'Get replies to a comment' })
  @ApiResponse({
    status: 200,
    description: 'Comment replies retrieved successfully',
    type: [CommentResponseDto],
  })
  async getCommentReplies(
    @Param('commentId') commentId: string,
  ): Promise<CommentResponseDto[]> {
    return this.commentsService.getCommentReplies(commentId);
  }

  @Get(':commentId')
  @ApiOperation({ summary: 'Get a specific comment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Comment retrieved successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async getCommentById(
    @Param('commentId') commentId: string,
  ): Promise<CommentResponseDto> {
    return this.commentsService.getCommentById(commentId);
  }

  @Get('users/me')
  @ApiOperation({ summary: 'Get current user comments' })
  @ApiResponse({
    status: 200,
    description: 'User comments retrieved successfully',
    type: [CommentResponseDto],
  })
  async getUserComments(
    @Request() req: any,
  ): Promise<CommentResponseDto[]> {
    return this.commentsService.getUserComments(req.user.id);
  }

  @Get('posts/:postId/stats')
  @ApiOperation({ summary: 'Get comment statistics for a post' })
  @ApiResponse({
    status: 200,
    description: 'Comment statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalComments: { type: 'number' },
        topLevelComments: { type: 'number' },
        replies: { type: 'number' },
      },
    },
  })
  async getCommentStats(
    @Param('postId') postId: string,
  ): Promise<{
    totalComments: number;
    topLevelComments: number;
    replies: number;
  }> {
    return this.commentsService.getCommentStats(postId);
  }
}