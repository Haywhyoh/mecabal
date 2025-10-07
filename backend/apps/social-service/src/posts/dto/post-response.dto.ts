import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostType, PrivacyLevel, HelpCategory, Urgency } from './create-post.dto';

export class UserInfoDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User first name' })
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  lastName: string;

  @ApiPropertyOptional({ description: 'User profile picture URL' })
  profilePicture?: string;

  @ApiProperty({ description: 'User verification status' })
  isVerified: boolean;

  @ApiProperty({ description: 'User trust score' })
  trustScore: number;
}

export class CategoryInfoDto {
  @ApiProperty({ description: 'Category ID' })
  id: number;

  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiPropertyOptional({ description: 'Category description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Category icon URL' })
  iconUrl?: string;

  @ApiPropertyOptional({ description: 'Category color code' })
  colorCode?: string;
}

export class MediaInfoDto {
  @ApiProperty({ description: 'Media ID' })
  id: string;

  @ApiProperty({ description: 'Media URL' })
  url: string;

  @ApiProperty({ description: 'Media type' })
  type: 'image' | 'video';

  @ApiPropertyOptional({ description: 'Media caption' })
  caption?: string;
}

export class EngagementMetricsDto {
  @ApiProperty({ description: 'Total reactions count' })
  reactionsCount: number;

  @ApiProperty({ description: 'Total comments count' })
  commentsCount: number;

  @ApiProperty({ description: 'Total views count' })
  viewsCount: number;

  @ApiProperty({ description: 'Total shares count' })
  sharesCount: number;

  @ApiProperty({ description: 'User reaction type if reacted' })
  userReaction?: string;
}

export class PostResponseDto {
  @ApiProperty({ description: 'Post ID' })
  id: string;

  @ApiProperty({ description: 'Post title' })
  title?: string;

  @ApiProperty({ description: 'Post content' })
  content: string;

  @ApiProperty({ description: 'Post type', enum: PostType })
  postType: PostType;

  @ApiProperty({ description: 'Privacy level', enum: PrivacyLevel })
  privacyLevel: PrivacyLevel;

  @ApiProperty({ description: 'Whether post is pinned' })
  isPinned: boolean;

  @ApiProperty({ description: 'Whether post is approved' })
  isApproved: boolean;

  @ApiProperty({ description: 'Moderation status' })
  moderationStatus: string;

  @ApiProperty({ description: 'Post creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Post last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Post expiration time' })
  expiresAt?: Date;

  @ApiProperty({ description: 'Author information' })
  author: UserInfoDto;

  @ApiPropertyOptional({ description: 'Category information' })
  category?: CategoryInfoDto;

  @ApiProperty({ description: 'Media attachments', type: [MediaInfoDto] })
  media: MediaInfoDto[];

  @ApiProperty({ description: 'Engagement metrics' })
  engagement: EngagementMetricsDto;

  @ApiProperty({ description: 'Whether post is visible to current user' })
  isVisible: boolean;

  @ApiProperty({ description: 'Whether post has expired' })
  isExpired: boolean;

  // Help-specific fields
  @ApiPropertyOptional({ description: 'Help category', enum: HelpCategory })
  helpCategory?: HelpCategory;

  @ApiPropertyOptional({ description: 'Urgency level', enum: Urgency })
  urgency?: Urgency;

  @ApiPropertyOptional({ description: 'Budget for help request' })
  budget?: string;

  @ApiPropertyOptional({ description: 'Deadline for help request' })
  deadline?: Date;
}

export class PaginatedPostsDto {
  @ApiProperty({ description: 'Array of posts', type: [PostResponseDto] })
  data: PostResponseDto[];

  @ApiProperty({ description: 'Total number of posts' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of posts per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}
