import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth';
import { CommentsService } from './comments.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentResponseDto,
  CommentFilterDto,
  PaginatedCommentsDto,
} from './dto';

@ApiTags('Comments')
@Controller('posts/:postId/comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new comment on a post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createComment(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: any,
  ): Promise<CommentResponseDto> {
    const userId = req.user.id;
    return this.commentsService.createComment(postId, userId, createCommentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get comments for a post with pagination' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Comments retrieved successfully',
    type: PaginatedCommentsDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPostComments(
    @Param('postId') postId: string,
    @Query() filterDto: CommentFilterDto,
    @Request() req: any,
  ): Promise<PaginatedCommentsDto> {
    const userId = req.user.id;
    return this.commentsService.getPostComments(postId, filterDto, userId);
  }

  @Get(':commentId')
  @ApiOperation({ summary: 'Get a single comment by ID' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({
    status: 200,
    description: 'Comment retrieved successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCommentById(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Request() req: any,
  ): Promise<CommentResponseDto> {
    const userId = req.user.id;
    return this.commentsService.getCommentById(commentId, userId);
  }

  @Put(':commentId')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({
    status: 200,
    description: 'Comment updated successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only update own comments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req: any,
  ): Promise<CommentResponseDto> {
    const userId = req.user.id;
    return this.commentsService.updateComment(commentId, userId, updateCommentDto);
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 204, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only delete own comments' })
  @ApiResponse({ status: 400, description: 'Bad request - comment has replies' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Request() req: any,
  ): Promise<void> {
    const userId = req.user.id;
    return this.commentsService.deleteComment(commentId, userId);
  }
}
