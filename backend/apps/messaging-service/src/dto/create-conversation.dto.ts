import { IsEnum, IsOptional, IsString, IsArray, IsUUID, ValidateNested, IsBoolean, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationType, ContextType } from '../entities/conversation.entity';

export class CreateConversationDto {
  @ApiProperty({
    description: 'Type of conversation to create',
    enum: ConversationType,
    example: ConversationType.DIRECT,
  })
  @IsEnum(ConversationType)
  type: ConversationType;

  @ApiPropertyOptional({
    description: 'Title of the conversation',
    example: 'Event Discussion',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Description of the conversation',
    example: 'Discussion about the upcoming community event',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Array of user IDs to include in the conversation',
    example: ['123e4567-e89b-12d3-a456-426614174000', '987fcdeb-51a2-43d1-b456-426614174000'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  participantIds: string[];

  @ApiPropertyOptional({
    description: 'Context type of the conversation',
    enum: ContextType,
    example: ContextType.EVENT,
  })
  @IsOptional()
  @IsEnum(ContextType)
  contextType?: ContextType;

  @ApiPropertyOptional({
    description: 'ID of the related context (event, business, listing)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  contextId?: string;

  @ApiPropertyOptional({
    description: 'Whether to archive the conversation immediately',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
