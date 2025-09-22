import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';

export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ReportReason {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  FALSE_INFORMATION = 'false_information',
  HATE_SPEECH = 'hate_speech',
  VIOLENCE = 'violence',
  COPYRIGHT_VIOLATION = 'copyright_violation',
  PRIVACY_VIOLATION = 'privacy_violation',
  OTHER = 'other',
}

export class ReportContentDto {
  @ApiProperty({
    description: 'Reason for reporting',
    enum: ReportReason,
    example: ReportReason.SPAM,
  })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiPropertyOptional({
    description: 'Additional details about the report',
    example: 'This post contains spam content',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  details?: string;
}

export class ModerateContentDto {
  @ApiProperty({
    description: 'Moderation decision',
    enum: ModerationStatus,
    example: ModerationStatus.APPROVED,
  })
  @IsEnum(ModerationStatus)
  status: ModerationStatus;

  @ApiPropertyOptional({
    description: 'Reason for moderation decision',
    example: 'Content violates community guidelines',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason?: string;
}

export class ModerationQueueItemDto {
  @ApiProperty({ description: 'Content ID' })
  id: string;

  @ApiProperty({ description: 'Content type', enum: ['post', 'comment'] })
  contentType: 'post' | 'comment';

  @ApiProperty({ description: 'Content preview' })
  contentPreview: string;

  @ApiProperty({ description: 'Author information' })
  author: {
    id: string;
    firstName: string;
    lastName: string;
    trustScore: number;
  };

  @ApiProperty({ description: 'Current moderation status' })
  status: ModerationStatus;

  @ApiProperty({ description: 'Number of reports' })
  reportCount: number;

  @ApiProperty({ description: 'Content creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last report timestamp' })
  lastReportedAt: Date;
}

export class ModerationStatsDto {
  @ApiProperty({ description: 'Total pending items' })
  pendingCount: number;

  @ApiProperty({ description: 'Total approved items today' })
  approvedToday: number;

  @ApiProperty({ description: 'Total rejected items today' })
  rejectedToday: number;

  @ApiProperty({ description: 'Average moderation time in minutes' })
  averageModerationTime: number;

  @ApiProperty({ description: 'Most common report reasons' })
  topReportReasons: Array<{
    reason: ReportReason;
    count: number;
  }>;
}

export class ContentReportDto {
  @ApiProperty({ description: 'Report ID' })
  id: string;

  @ApiProperty({ description: 'Content ID' })
  contentId: string;

  @ApiProperty({ description: 'Content type' })
  contentType: 'post' | 'comment';

  @ApiProperty({ description: 'Reporter ID' })
  reporterId: string;

  @ApiProperty({ description: 'Report reason' })
  reason: ReportReason;

  @ApiPropertyOptional({ description: 'Report details' })
  details?: string;

  @ApiProperty({ description: 'Report timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Report status' })
  status: 'pending' | 'reviewed' | 'resolved';

  @ApiProperty({ description: 'Reporter information' })
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
