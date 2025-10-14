import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MarkAsReadDto {
  @ApiPropertyOptional({
    description: 'ID of the specific message to mark as read (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  messageId?: string;
}

export class MarkConversationAsReadDto {
  @ApiProperty({
    description: 'ID of the conversation to mark as read',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  conversationId: string;

  @ApiPropertyOptional({
    description: 'ID of the specific message to mark as read (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  messageId?: string;
}
