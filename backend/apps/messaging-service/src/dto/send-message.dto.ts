import { IsUUID, IsString, IsEnum, IsOptional, ValidateNested, IsNumber, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../entities/message.entity';

export class LocationDataDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: 6.5244,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 3.3792,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({
    description: 'Human-readable address',
    example: 'Lagos, Nigeria',
  })
  @IsOptional()
  @IsString()
  address?: string;
}

export class MessageMetadataDto {
  @ApiPropertyOptional({
    description: 'URL of the image',
    example: 'https://example.com/image.jpg',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Width of the image in pixels',
    example: 800,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4096)
  imageWidth?: number;

  @ApiPropertyOptional({
    description: 'Height of the image in pixels',
    example: 600,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4096)
  imageHeight?: number;

  @ApiPropertyOptional({
    description: 'URL of the video',
    example: 'https://example.com/video.mp4',
  })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Duration of the video in seconds',
    example: 120,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  videoDuration?: number;

  @ApiPropertyOptional({
    description: 'URL of the audio file',
    example: 'https://example.com/audio.mp3',
  })
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional({
    description: 'Duration of the audio in seconds',
    example: 45,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  audioDuration?: number;

  @ApiPropertyOptional({
    description: 'URL of the file',
    example: 'https://example.com/document.pdf',
  })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({
    description: 'Name of the file',
    example: 'document.pdf',
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    description: 'Size of the file in bytes',
    example: 1024000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'Location data for location messages',
    example: { latitude: 6.5244, longitude: 3.3792, address: 'Lagos, Nigeria' },
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDataDto)
  location?: LocationDataDto;
}

export class SendMessageDto {
  @ApiProperty({
    description: 'ID of the conversation to send the message to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  conversationId: string;

  @ApiProperty({
    description: 'Content of the message',
    example: 'Hello! How are you doing?',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Type of the message',
    enum: MessageType,
    example: MessageType.TEXT,
    default: MessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType = MessageType.TEXT;

  @ApiPropertyOptional({
    description: 'ID of the message this is replying to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  replyToMessageId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the message',
    type: MessageMetadataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MessageMetadataDto)
  metadata?: MessageMetadataDto;
}
