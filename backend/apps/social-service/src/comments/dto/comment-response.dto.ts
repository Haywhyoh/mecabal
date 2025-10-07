import { ApiProperty } from '@nestjs/swagger';

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

export class MediaInfoDto {
  @ApiProperty({ description: 'Media ID' })
  id: string;

  @ApiProperty({ description: 'Media URL' })
  url: string;

  @ApiProperty({ description: 'Media type' })
  type: 'image' | 'video';

  @ApiProperty({ description: 'Media caption', required: false })
  caption?: string;
}

export class CommentResponseDto {
  @ApiProperty({ description: 'Comment ID' })
  id: string;

  @ApiProperty({ description: 'Post ID' })
  postId: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({
    description: 'Parent comment ID for replies',
    required: false,
  })
  parentCommentId?: string;

  @ApiProperty({ description: 'Comment content' })
  content: string;

  @ApiProperty({ description: 'Whether comment is approved' })
  isApproved: boolean;

  @ApiProperty({ description: 'Comment creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'User information', required: false })
  user?: UserInfoDto;

  @ApiProperty({ description: 'Media attachments', type: [MediaInfoDto] })
  media: MediaInfoDto[];

  @ApiProperty({ description: 'Comment replies', type: [CommentResponseDto] })
  replies: CommentResponseDto[];

  @ApiProperty({ description: 'Whether this is a reply' })
  isReply: boolean;
}
