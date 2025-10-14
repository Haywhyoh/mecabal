import { IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TypingIndicatorDto {
  @ApiProperty({
    description: 'ID of the conversation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  conversationId: string;

  @ApiProperty({
    description: 'Whether the user is typing',
    example: true,
  })
  @IsBoolean()
  isTyping: boolean;
}
