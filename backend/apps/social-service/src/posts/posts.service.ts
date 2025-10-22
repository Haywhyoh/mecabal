import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  Post,
  PostCategory,
  PostMedia,
  PostReaction,
  PostComment,
  User,
} from '@app/database';
import {
  CreatePostDto,
  UpdatePostDto,
  PostFilterDto,
  PostResponseDto,
  PaginatedPostsDto,
  UserInfoDto,
  CategoryInfoDto,
  MediaInfoDto,
  EngagementMetricsDto,
} from './dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostCategory)
    private readonly categoryRepository: Repository<PostCategory>,
    @InjectRepository(PostMedia)
    private readonly mediaRepository: Repository<PostMedia>,
    @InjectRepository(PostReaction)
    private readonly reactionRepository: Repository<PostReaction>,
    @InjectRepository(PostComment)
    private readonly commentRepository: Repository<PostComment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createPost(
    createPostDto: CreatePostDto,
    userId: string,
    neighborhoodId: string,
  ): Promise<PostResponseDto> {
    // Validate category if provided
    if (createPostDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: createPostDto.categoryId, isActive: true },
      });
      if (!category) {
        throw new BadRequestException('Invalid category ID');
      }
    }

    // Validate help-specific fields
    if (createPostDto.postType === 'help') {
      if (!createPostDto.helpCategory) {
        throw new BadRequestException(
          'Help category is required for help posts',
        );
      }

      // Borrow-specific validation
      if (createPostDto.helpCategory === 'borrow') {
        if (!createPostDto.borrowItem || !createPostDto.borrowDuration) {
          throw new BadRequestException(
            'Borrow item and duration are required for borrow requests',
          );
        }
      }

    }

    // Create the post
    const post = this.postRepository.create({
      ...createPostDto,
      userId,
      neighborhoodId,
      expiresAt: createPostDto.expiresAt
        ? new Date(createPostDto.expiresAt)
        : undefined,
      deadline: createPostDto.deadline
        ? new Date(createPostDto.deadline)
        : undefined,
    });

    const savedPost = await this.postRepository.save(post);

    // Create media attachments if provided
    if (createPostDto.media && createPostDto.media.length > 0) {
      const mediaEntities = createPostDto.media.map((media) =>
        this.mediaRepository.create({
          postId: (savedPost as any).id,
          fileUrl: media.url,
          mediaType: media.type,
          caption: media.caption,
        }),
      );
      await this.mediaRepository.save(mediaEntities);
    }

    // Reload the post with all relations for formatting
    const postWithRelations = await this.postRepository.findOne({
      where: { id: savedPost.id },
      relations: ['user', 'category', 'media', 'reactions', 'comments'],
    });

    if (!postWithRelations) {
      throw new NotFoundException('Post not found after creation');
    }

    return this.formatPostResponse(postWithRelations);
  }

  async getPosts(
    filterDto: PostFilterDto,
    neighborhoodId: string,
    userId: string,
  ): Promise<PaginatedPostsDto> {
    const queryBuilder = this.createPostsQueryBuilder(neighborhoodId, userId);

    // Apply filters
    this.applyFilters(queryBuilder, filterDto);

    // Apply pagination
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 20;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Apply sorting
    const sortBy = filterDto.sortBy || 'createdAt';
    const sortOrder = filterDto.sortOrder || 'DESC';
    queryBuilder.orderBy(`post.${sortBy}`, sortOrder);

    // Execute query
    const [posts, total] = await queryBuilder.getManyAndCount();

    // Format response
    const formattedPosts = await Promise.all(
      posts.map((post) => this.formatPostResponse(post)),
    );

    return {
      data: formattedPosts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  async getPostById(id: string, userId: string): Promise<PostResponseDto> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['user', 'category', 'media', 'reactions', 'comments'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.formatPostResponse(post);
  }

  async updatePost(
    id: string,
    updatePostDto: UpdatePostDto,
    userId: string,
  ): Promise<PostResponseDto> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['user', 'category', 'media'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user is the author or has permission to update
    if (post.userId !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    // Update post
    Object.assign(post, updatePostDto);
    if (updatePostDto.expiresAt) {
      post.expiresAt = new Date(updatePostDto.expiresAt);
    }

    const updatedPost = await this.postRepository.save(post);

    // Update media if provided
    if (updatePostDto.media) {
      // Remove existing media
      await this.mediaRepository.delete({ postId: id });

      // Add new media
      if (updatePostDto.media.length > 0) {
        const mediaEntities = updatePostDto.media.map((media) =>
          this.mediaRepository.create({
            postId: id,
            fileUrl: media.url,
            mediaType: media.type,
            caption: media.caption,
          }),
        );
        await this.mediaRepository.save(mediaEntities);
      }
    }

    return this.formatPostResponse(updatedPost);
  }

  async deletePost(id: string, userId: string): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user is the author or has permission to delete
    if (post.userId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    // Soft delete by setting isApproved to false
    await this.postRepository.update(id, { isApproved: false });
  }

  async pinPost(
    id: string,
    userId: string,
    isPinned: boolean,
  ): Promise<PostResponseDto> {
    const post = await this.postRepository.findOne({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user has permission to pin (author or moderator)
    if (post.userId !== userId) {
      // TODO: Add moderator role check
      throw new ForbiddenException('You can only pin your own posts');
    }

    await this.postRepository.update(id, { isPinned });
    return this.getPostById(id, userId);
  }

  private createPostsQueryBuilder(
    neighborhoodId: string,
    userId: string,
  ): SelectQueryBuilder<Post> {
    return this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.media', 'media')
      .leftJoinAndSelect('post.reactions', 'reactions')
      .leftJoinAndSelect('post.comments', 'comments')
      .where('post.neighborhoodId = :neighborhoodId', { neighborhoodId })
      .andWhere('post.isApproved = :isApproved', { isApproved: true })
      .andWhere('post.moderationStatus = :moderationStatus', {
        moderationStatus: 'approved',
      });
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Post>,
    filterDto: PostFilterDto,
  ): void {
    if (filterDto.postType) {
      queryBuilder.andWhere('post.postType = :postType', {
        postType: filterDto.postType,
      });
    }

    if (filterDto.privacyLevel) {
      queryBuilder.andWhere('post.privacyLevel = :privacyLevel', {
        privacyLevel: filterDto.privacyLevel,
      });
    }

    if (filterDto.categoryId) {
      queryBuilder.andWhere('post.categoryId = :categoryId', {
        categoryId: filterDto.categoryId,
      });
    }

    if (filterDto.userId) {
      queryBuilder.andWhere('post.userId = :userId', {
        userId: filterDto.userId,
      });
    }

    if (filterDto.search) {
      queryBuilder.andWhere(
        '(post.title ILIKE :search OR post.content ILIKE :search)',
        { search: `%${filterDto.search}%` },
      );
    }

    if (filterDto.startDate) {
      queryBuilder.andWhere('post.createdAt >= :startDate', {
        startDate: filterDto.startDate,
      });
    }

    if (filterDto.endDate) {
      queryBuilder.andWhere('post.createdAt <= :endDate', {
        endDate: filterDto.endDate,
      });
    }

    if (filterDto.isPinned !== undefined) {
      queryBuilder.andWhere('post.isPinned = :isPinned', {
        isPinned: filterDto.isPinned,
      });
    }

    if (filterDto.isApproved !== undefined) {
      queryBuilder.andWhere('post.isApproved = :isApproved', {
        isApproved: filterDto.isApproved,
      });
    }

    // Help-specific filters
    if (filterDto.helpCategory) {
      queryBuilder.andWhere('post.helpCategory = :helpCategory', {
        helpCategory: filterDto.helpCategory,
      });
    }

    if (filterDto.urgency) {
      queryBuilder.andWhere('post.urgency = :urgency', {
        urgency: filterDto.urgency,
      });
    }
  }

  private async formatPostResponse(post: Post): Promise<PostResponseDto> {
    // Get user reaction if exists
    const userReaction = await this.reactionRepository.findOne({
      where: { postId: post.id },
      select: ['reactionType'],
    });

    // Get engagement metrics
    const [reactionsCount, commentsCount] = await Promise.all([
      this.reactionRepository.count({ where: { postId: post.id } }),
      this.commentRepository.count({ where: { postId: post.id } }),
    ]);

    const author: UserInfoDto = {
      id: post.user.id,
      firstName: post.user.firstName,
      lastName: post.user.lastName,
      profilePicture: post.user.profilePictureUrl,
      isVerified: post.user.isVerified || false,
      trustScore: post.user.trustScore || 0,
    };

    const category: CategoryInfoDto | undefined = post.category
      ? {
          id: post.category.id,
          name: post.category.name,
          description: post.category.description,
          iconUrl: post.category.iconUrl,
          colorCode: post.category.colorCode,
        }
      : undefined;

    const media: MediaInfoDto[] =
      post.media?.map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type as 'image' | 'video',
        caption: m.caption,
      })) || [];

    const engagement: EngagementMetricsDto = {
      reactionsCount,
      commentsCount,
      viewsCount: 0, // TODO: Implement views tracking
      sharesCount: 0, // TODO: Implement shares tracking
      userReaction: userReaction?.reactionType,
    };

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      postType: post.postType as any,
      privacyLevel: post.privacyLevel as any,
      isPinned: post.isPinned,
      isApproved: post.isApproved,
      moderationStatus: post.moderationStatus,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      expiresAt: post.expiresAt,
      author,
      category,
      media,
      engagement,
      isVisible: post.isVisible(),
      isExpired: post.isExpired(),
      // Help-specific fields
      helpCategory: post.helpCategory as any,
      urgency: post.urgency as any,
      budget: post.budget,
      deadline: post.deadline,
    };
  }
}
