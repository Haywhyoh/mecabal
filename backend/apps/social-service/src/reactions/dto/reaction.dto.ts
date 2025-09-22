import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsOptional } from 'class-validator';

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  LAUGH = 'laugh',
  ANGRY = 'angry',
  SAD = 'sad',
}

export class CreateReactionDto {
  @ApiProperty({
    description: 'Type of reaction',
    enum: ReactionType,
    example: ReactionType.LIKE,
  })
  @IsEnum(ReactionType)
  reactionType: ReactionType;
}

export class ReactionResponseDto {
  @ApiProperty({ description: 'Reaction ID' })
  id: string;

  @ApiProperty({ description: 'Post ID' })
  postId: string;

  @ApiProperty({ description: 'User ID who reacted' })
  userId: string;

  @ApiProperty({ description: 'Type of reaction', enum: ReactionType })
  reactionType: ReactionType;

  @ApiProperty({ description: 'Reaction creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'User information' })
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

export class ReactionStatsDto {
  @ApiProperty({ description: 'Total number of reactions' })
  total: number;

  @ApiProperty({ description: 'Reaction counts by type' })
  byType: Record<ReactionType, number>;

  @ApiPropertyOptional({ description: 'Current user reaction type if reacted' })
  userReaction?: ReactionType;
}
