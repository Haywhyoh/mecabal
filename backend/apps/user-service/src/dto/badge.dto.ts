import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsObject } from 'class-validator';
import { BadgeCategory } from '@app/database';

export class AwardBadgeDto {
  @ApiProperty({
    description: 'User ID to award badge to',
    example: 'uuid-here',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Type of badge to award',
    example: 'NIN Verified',
  })
  @IsString()
  @IsNotEmpty()
  badgeType: string;

  @ApiProperty({
    description: 'Category of the badge',
    enum: BadgeCategory,
    example: BadgeCategory.VERIFICATION,
  })
  @IsEnum(BadgeCategory)
  @IsNotEmpty()
  badgeCategory: BadgeCategory;

  @ApiProperty({
    description: 'ID of user awarding the badge (admin)',
    example: 'uuid-here',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  awardedBy?: string;

  @ApiProperty({
    description: 'Additional metadata for the badge',
    example: { reason: 'Completed NIN verification', autoAwarded: false },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}

export class RevokeBadgeDto {
  @ApiProperty({
    description: 'ID of the badge to revoke',
    example: 'uuid-here',
  })
  @IsUUID()
  @IsNotEmpty()
  badgeId: string;

  @ApiProperty({
    description: 'Reason for revoking the badge',
    example: 'Violation of community guidelines',
  })
  @IsString()
  @IsNotEmpty()
  revocationReason: string;
}

export class BadgeResponseDto {
  @ApiProperty({
    description: 'Whether the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Badge awarded successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Badge ID (if applicable)',
    example: 'uuid-here',
    required: false,
  })
  badgeId?: string;
}

export class BadgeStatsDto {
  @ApiProperty({
    description: 'Total number of active badges',
    example: 5,
  })
  totalBadges: number;

  @ApiProperty({
    description: 'Number of badges by category',
    example: { verification: 3, leadership: 1, contribution: 1 },
  })
  badgesByCategory: Record<BadgeCategory, number>;

  @ApiProperty({
    description: 'Recently awarded badges',
    type: 'array',
  })
  recentBadges: any[];

  @ApiProperty({
    description: 'Top badge types by count',
    type: 'array',
    example: [{ badgeType: 'NIN Verified', count: 1 }],
  })
  topBadgeTypes: Array<{ badgeType: string; count: number }>;
}

export class UserBadgesResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'User badges data',
    type: 'object',
    additionalProperties: true,
  })
  data: {
    activeBadges: any[];
    revokedBadges: any[];
    stats: BadgeStatsDto;
  };

  @ApiProperty({
    description: 'Response message',
    example: 'User badges retrieved successfully',
  })
  message: string;
}

export class AvailableBadgeTypesDto {
  @ApiProperty({
    description: 'Available badge types by category',
    type: 'object',
    additionalProperties: true,
    example: {
      verification: ['NIN Verified', 'Identity Verified'],
      leadership: ['Estate Manager', 'Community Leader'],
    },
  })
  badgeTypes: Record<BadgeCategory, string[]>;
}

export class AwardLeadershipBadgeDto {
  @ApiProperty({
    description: 'User ID to award badge to',
    example: 'uuid-here',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Type of leadership badge',
    example: 'Estate Manager',
    enum: ['Estate Manager', 'Community Leader', 'Religious Leader', 'Youth Leader', 'Women Leader', 'Elder'],
  })
  @IsString()
  @IsNotEmpty()
  leadershipType: string;

  @ApiProperty({
    description: 'Additional metadata for the badge',
    example: { reason: 'Elected by community', term: '2024-2025' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}

export class AwardContributionBadgeDto {
  @ApiProperty({
    description: 'User ID to award badge to',
    example: 'uuid-here',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Type of contribution badge',
    example: 'Event Organizer',
    enum: ['Event Organizer', 'Community Helper', 'Volunteer', 'Donor', 'Mentor', 'Active Member'],
  })
  @IsString()
  @IsNotEmpty()
  contributionType: string;

  @ApiProperty({
    description: 'Additional metadata for the badge',
    example: { reason: 'Organized community event', eventId: 'uuid-here' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}
