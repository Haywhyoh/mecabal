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
  BadRequestException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SocialAuthGuard } from '../guards/social-auth.guard';
import { PostsService } from './posts.service';
import { CategoriesService } from '../categories/categories.service';
import {
  CreatePostDto,
  UpdatePostDto,
  PostFilterDto,
  PostResponseDto,
  PaginatedPostsDto,
} from './dto';

// Type definitions for request objects
interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    userNeighborhoods?: Array<{
      isPrimary: boolean;
      neighborhoodId: string;
    }>;
  };
}

@ApiTags('Posts')
@Controller('posts')
@UseGuards(SocialAuthGuard)
@ApiBearerAuth()
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly categoriesService: CategoriesService,
  ) {}

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
    @Request() req: AuthenticatedRequest,
  ): Promise<PostResponseDto> {
    const userId = req.user.id;

    // Log received DTO at controller level
    console.log('🎮 Posts Controller - Received createPostDto:', {
      hasContent: !!createPostDto.content,
      hasTitle: !!createPostDto.title,
      postType: createPostDto.postType,
      hasMedia: !!createPostDto.media,
      mediaCount: Array.isArray(createPostDto.media) ? createPostDto.media.length : 0,
      mediaArray: createPostDto.media,
    });

    // Get user's primary neighborhood
    const primaryNeighborhood = req.user.userNeighborhoods?.find(
      (un) => un.isPrimary,
    );

    if (!primaryNeighborhood) {
      throw new Error(
        'User must be associated with a neighborhood to create posts',
      );
    }

    return this.postsService.createPost(
      createPostDto,
      userId,
      primaryNeighborhood.neighborhoodId,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get neighborhood feed with filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Posts retrieved successfully',
    type: PaginatedPostsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPosts(
    @Query() filterDto: PostFilterDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<PaginatedPostsDto> {
    const userId = req.user.id;

    // Get user's primary neighborhood
    const primaryNeighborhood = req.user.userNeighborhoods?.find(
      (un) => un.isPrimary,
    );

    if (!primaryNeighborhood) {
      throw new Error(
        'User must be associated with a neighborhood to view posts',
      );
    }

    return this.postsService.getPosts(
      filterDto,
      primaryNeighborhood.neighborhoodId,
      userId,
    );
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all post categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPostCategories(): Promise<any[]> {
    return this.categoriesService.getCategories({});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Post retrieved successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid post ID format' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPostById(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<PostResponseDto> {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException(
        `Invalid post ID format. Expected UUID, got: ${id}`,
      );
    }
    
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
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only update own posts',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req: AuthenticatedRequest,
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
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only delete own posts',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deletePost(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    const userId = req.user.id;
    return this.postsService.deletePost(id, userId);
  }

  @Post(':id/pin')
  @ApiOperation({ summary: 'Pin or unpin a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiQuery({
    name: 'isPinned',
    description: 'Whether to pin the post',
    type: 'boolean',
  })
  @ApiResponse({
    status: 200,
    description: 'Post pin status updated successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only pin own posts',
  })
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
