import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMessageDto {
  @ApiProperty({
    description: 'New content for the message',
    example: 'Updated message content',
  })
  @IsString()
  @MaxLength(5000)
  content: string;
}

export class EditMessageDto {
  @ApiProperty({
    description: 'ID of the message to edit',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  messageId: string;

  @ApiProperty({
    description: 'New content for the message',
    example: 'Updated message content',
  })
  @IsString()
  @MaxLength(5000)
  content: string;
}
