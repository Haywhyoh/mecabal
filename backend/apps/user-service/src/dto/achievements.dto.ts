import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { AchievementCategory, AchievementRarity } from '@app/database';

export class AchievementProgressDto {
  @ApiProperty({ description: 'Achievement ID' })
  achievementId: string;

  @ApiProperty({ description: 'Progress percentage (0-100)' })
  progress: number;

  @ApiProperty({ description: 'Whether achievement is unlocked' })
  isUnlocked: boolean;

  @ApiProperty({ description: 'Unlocked timestamp', required: false })
  unlockedAt?: Date;

  @ApiProperty({ description: 'Achievement requirements' })
  requirements: any;
}

export class AchievementDto {
  @ApiProperty({ description: 'Achievement ID' })
  id: string;

  @ApiProperty({ description: 'Achievement name' })
  name: string;

  @ApiProperty({ description: 'Achievement description' })
  description: string;

  @ApiProperty({ description: 'Icon name' })
  icon: string;

  @ApiProperty({ description: 'Color hex code' })
  color: string;

  @ApiProperty({ description: 'Achievement category', enum: AchievementCategory })
  category: AchievementCategory;

  @ApiProperty({ description: 'Points awarded' })
  points: number;

  @ApiProperty({ description: 'Achievement rarity', enum: AchievementRarity })
  rarity: AchievementRarity;

  @ApiProperty({ description: 'Requirements configuration' })
  requirements: {
    type: string;
    count: number;
    description: string;
  };

  @ApiProperty({ description: 'Is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  updatedAt: Date;
}

export class AchievementUnlockDto {
  @ApiProperty({ description: 'Whether achievement was unlocked' })
  unlocked: boolean;

  @ApiProperty({ description: 'Achievement details', type: AchievementDto, required: false })
  achievement?: AchievementDto;

  @ApiProperty({ description: 'Points awarded for unlocking', required: false })
  pointsAwarded?: number;
}

export class AchievementStatsDto {
  @ApiProperty({ description: 'Total achievements available' })
  total: number;

  @ApiProperty({ description: 'Achievements unlocked' })
  unlocked: number;

  @ApiProperty({ description: 'Overall progress percentage' })
  progress: number;

  @ApiProperty({ description: 'Stats by category' })
  byCategory: Record<string, { total: number; unlocked: number }>;

  @ApiProperty({ description: 'Stats by rarity' })
  byRarity: Record<string, { total: number; unlocked: number }>;
}

export class RecentUnlockDto {
  @ApiProperty({ description: 'User achievement ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Achievement ID' })
  achievementId: string;

  @ApiProperty({ description: 'Unlocked timestamp' })
  unlockedAt: Date;

  @ApiProperty({ description: 'Achievement details', type: AchievementDto })
  achievement: AchievementDto;

  @ApiProperty({ description: 'User details' })
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export class AchievementQueryDto {
  @ApiProperty({ description: 'Filter by category', enum: AchievementCategory, required: false })
  @IsOptional()
  @IsEnum(AchievementCategory)
  category?: AchievementCategory;

  @ApiProperty({ description: 'Filter by rarity', enum: AchievementRarity, required: false })
  @IsOptional()
  @IsEnum(AchievementRarity)
  rarity?: AchievementRarity;

  @ApiProperty({ description: 'Filter by unlocked status', required: false })
  @IsOptional()
  @IsBoolean()
  unlocked?: boolean;

  @ApiProperty({ description: 'Number of results to return', default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({ description: 'Number of results to skip', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

export class ActivityHistoryQueryDto {
  @ApiProperty({ description: 'Number of results to return', default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({ description: 'Number of results to skip', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}
