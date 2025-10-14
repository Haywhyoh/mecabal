import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Conversation, Message, ConversationParticipant } from '../entities';

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPrev: boolean;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Array of items',
    isArray: true,
  })
  data: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}

export class ConversationResponseDto {
  @ApiProperty({
    description: 'Conversation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Conversation type',
    example: 'direct',
  })
  type: string;

  @ApiPropertyOptional({
    description: 'Conversation title',
    example: 'Event Discussion',
  })
  title?: string;

  @ApiPropertyOptional({
    description: 'Conversation description',
    example: 'Discussion about the upcoming community event',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Conversation avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  avatarUrl?: string;

  @ApiProperty({
    description: 'Context type',
    example: 'event',
  })
  contextType?: string;

  @ApiProperty({
    description: 'Context ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  contextId?: string;

  @ApiProperty({
    description: 'Whether conversation is archived',
    example: false,
  })
  isArchived: boolean;

  @ApiProperty({
    description: 'Creator ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  creatorId: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Last message timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  lastMessageAt?: Date;

  @ApiProperty({
    description: 'Number of participants',
    example: 2,
  })
  participantCount: number;

  @ApiProperty({
    description: 'Number of messages',
    example: 15,
  })
  messageCount: number;

  @ApiPropertyOptional({
    description: 'Last message in the conversation',
    type: 'object',
    additionalProperties: true,
  })
  lastMessage?: any;

  @ApiProperty({
    description: 'Array of participants',
    isArray: true,
  })
  participants: ConversationParticipantResponseDto[];
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'Message ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Conversation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  conversationId: string;

  @ApiProperty({
    description: 'Sender ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  senderId: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello! How are you doing?',
  })
  content: string;

  @ApiProperty({
    description: 'Message type',
    example: 'text',
  })
  type: string;

  @ApiPropertyOptional({
    description: 'Reply to message ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  replyToMessageId?: string;

  @ApiPropertyOptional({
    description: 'Message metadata',
    example: { imageUrl: 'https://example.com/image.jpg' },
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Whether message is edited',
    example: false,
  })
  isEdited: boolean;

  @ApiPropertyOptional({
    description: 'Edit timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  editedAt?: Date;

  @ApiProperty({
    description: 'Whether message is deleted',
    example: false,
  })
  isDeleted: boolean;

  @ApiPropertyOptional({
    description: 'Delete timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  deletedAt?: Date;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Sender information',
  })
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };

  @ApiPropertyOptional({
    description: 'Reply to message information',
    type: 'object',
    additionalProperties: true,
  })
  replyToMessage?: any;
}

export class ConversationParticipantResponseDto {
  @ApiProperty({
    description: 'Participant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Participant role',
    example: 'member',
  })
  role: string;

  @ApiProperty({
    description: 'Whether participant has muted the conversation',
    example: false,
  })
  isMuted: boolean;

  @ApiProperty({
    description: 'Whether participant has pinned the conversation',
    example: false,
  })
  isPinned: boolean;

  @ApiProperty({
    description: 'Number of unread messages',
    example: 5,
  })
  unreadCount: number;

  @ApiProperty({
    description: 'Join timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  joinedAt: Date;

  @ApiPropertyOptional({
    description: 'User information',
  })
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
}

export class ApiResponseDto<T> {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response data',
  })
  data: T;

  @ApiPropertyOptional({
    description: 'Error message',
    example: 'Something went wrong',
  })
  message?: string;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  timestamp: Date;
}
