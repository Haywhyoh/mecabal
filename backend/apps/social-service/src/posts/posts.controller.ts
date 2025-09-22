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
import { JwtAuthGuard } from '@mecabal/auth';
import { PostsService } from './posts.service';
import {
  CreatePostDto,
  UpdatePostDto,
  PostFilterDto,
  PostResponseDto,
  PaginatedPostsDto,
} from './dto';

@ApiTags('Posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @Request() req: any,
  ): Promise<PostResponseDto> {
    const userId = req.user.id;
    const neighborhoodId = req.user.neighborhoodId; // Assuming user has neighborhoodId
    
    if (!neighborhoodId) {
      throw new Error('User must be associated with a neighborhood to create posts');
    }

    return this.postsService.createPost(createPostDto, userId, neighborhoodId);
  }

  @Get()
  @ApiOperation({ summary: 'Get neighborhood feed with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Posts retrieved successfully',
    type: PaginatedPostsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPosts(
    @Query() filterDto: PostFilterDto,
    @Request() req: any,
  ): Promise<PaginatedPostsDto> {
    const userId = req.user.id;
    const neighborhoodId = req.user.neighborhoodId;
    
    if (!neighborhoodId) {
      throw new Error('User must be associated with a neighborhood to view posts');
    }

    return this.postsService.getPosts(filterDto, neighborhoodId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Post retrieved successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPostById(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<PostResponseDto> {
    const userId = req.user.id;
    return this.postsService.getPostById(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only update own posts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req: any,
  ): Promise<PostResponseDto> {
    const userId = req.user.id;
    return this.postsService.updatePost(id, updatePostDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post (soft delete)' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 204, description: 'Post deleted successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only delete own posts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deletePost(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    const userId = req.user.id;
    return this.postsService.deletePost(id, userId);
  }

  @Post(':id/pin')
  @ApiOperation({ summary: 'Pin or unpin a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiQuery({ name: 'isPinned', description: 'Whether to pin the post', type: 'boolean' })
  @ApiResponse({
    status: 200,
    description: 'Post pin status updated successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only pin own posts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async pinPost(
    @Param('id') id: string,
    @Query('isPinned') isPinned: string,
    @Request() req: any,
  ): Promise<PostResponseDto> {
    const userId = req.user.id;
    const pinStatus = isPinned === 'true';
    return this.postsService.pinPost(id, userId, pinStatus);
  }
}
