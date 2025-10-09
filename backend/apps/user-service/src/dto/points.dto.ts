import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ActivityType {
  POST_CREATED = 'post_created',
  COMMENT_CREATED = 'comment_created',
  EVENT_CREATED = 'event_created',
  EVENT_ATTENDED = 'event_attended',
  SAFETY_ALERT_CREATED = 'safety_alert_created',
  MARKETPLACE_LISTING = 'marketplace_listing',
  HELPFUL_VOTE = 'helpful_vote',
  PROFILE_COMPLETED = 'profile_completed',
}

export class AwardPointsDto {
  @ApiProperty({ enum: ActivityType })
  @IsEnum(ActivityType)
  activityType: ActivityType;

  @ApiProperty({ description: 'Base points for activity' })
  @IsInt()
  @Min(0)
  basePoints: number;

  @ApiProperty({ description: 'Multiplier (default 1.0)', required: false })
  @IsOptional()
  @Min(0)
  multiplier?: number;

  @ApiProperty({ description: 'Reference type (e.g., post, event)', required: false })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiProperty({ description: 'Reference ID', required: false })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: any;
}

export class UserPointsResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  totalPoints: number;

  @ApiProperty()
  level: number;

  @ApiProperty()
  levelName: string;

  @ApiProperty()
  rank: number;

  @ApiProperty()
  dailyPoints: number;

  @ApiProperty()
  weeklyPoints: number;

  @ApiProperty()
  monthlyPoints: number;

  @ApiProperty()
  streakDays: number;

  @ApiProperty()
  lastActivityAt: Date;
}