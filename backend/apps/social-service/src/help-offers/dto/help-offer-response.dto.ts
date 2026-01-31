import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HelpOfferStatus, ContactMethod } from '@app/database';

export class UserInfoDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User first name' })
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  lastName: string;

  @ApiPropertyOptional({ description: 'Profile picture URL' })
  profilePictureUrl?: string;

  @ApiProperty({ description: 'Whether user is verified' })
  isVerified: boolean;

  @ApiProperty({ description: 'User trust score' })
  trustScore: number;
}

export class PostInfoDto {
  @ApiProperty({ description: 'Post ID' })
  id: string;

  @ApiProperty({ description: 'Post content' })
  content: string;

  @ApiProperty({ description: 'Post type' })
  postType: string;

  @ApiPropertyOptional({ description: 'Help category' })
  helpCategory?: string;
}

export class HelpOfferResponseDto {
  @ApiProperty({ description: 'Help offer ID' })
  id: string;

  @ApiProperty({ description: 'Post ID this offer is for' })
  postId: string;

  @ApiProperty({ description: 'User ID who is offering help' })
  userId: string;

  @ApiProperty({ description: 'Message explaining how they can help' })
  message: string;

  @ApiProperty({
    description: 'Preferred contact method',
    enum: ContactMethod,
  })
  contactMethod: ContactMethod;

  @ApiPropertyOptional({ description: 'Availability information' })
  availability?: string;

  @ApiPropertyOptional({ description: 'Estimated time to complete' })
  estimatedTime?: string;

  @ApiProperty({
    description: 'Status of the help offer',
    enum: HelpOfferStatus,
  })
  status: HelpOfferStatus;

  @ApiPropertyOptional({ description: 'When the offer was accepted' })
  acceptedAt?: Date;

  @ApiProperty({ description: 'Help offer creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'User information', type: UserInfoDto })
  user?: UserInfoDto;

  @ApiPropertyOptional({ description: 'Post information', type: PostInfoDto })
  post?: PostInfoDto;
}





