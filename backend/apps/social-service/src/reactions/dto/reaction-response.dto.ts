import { ApiProperty } from '@nestjs/swagger';
import { ReactionType } from '@app/database/entities/post-reaction.entity';

export class UserInfoDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User first name' })
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  lastName: string;

  @ApiProperty({ description: 'Profile picture URL', required: false })
  profilePictureUrl?: string;

  @ApiProperty({ description: 'Whether user is verified' })
  isVerified: boolean;

  @ApiProperty({ description: 'User trust score' })
  trustScore: number;
}

export class ReactionResponseDto {
  @ApiProperty({ description: 'Reaction ID' })
  id: string;

  @ApiProperty({ description: 'Post ID' })
  postId: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({
    description: 'Type of reaction',
    enum: ReactionType,
  })
  reactionType: ReactionType;

  @ApiProperty({ description: 'Reaction creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'User information', required: false })
  user?: UserInfoDto;
}
