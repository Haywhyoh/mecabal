import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InquiryType {
  BOOKING = 'booking',
  QUESTION = 'question',
  QUOTE = 'quote',
}

export enum InquiryStatus {
  PENDING = 'pending',
  RESPONDED = 'responded',
  CLOSED = 'closed',
}

export enum PreferredContact {
  PHONE = 'phone',
  WHATSAPP = 'whatsapp',
  IN_APP = 'in-app',
}

export class CreateBusinessInquiryDto {
  @ApiProperty({ enum: InquiryType, example: InquiryType.BOOKING })
  @IsEnum(InquiryType)
  inquiryType: InquiryType;

  @ApiProperty({
    example: 'I need plumbing services for a burst pipe. Available tomorrow?',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ enum: PreferredContact, example: PreferredContact.WHATSAPP })
  @IsEnum(PreferredContact)
  @IsOptional()
  preferredContact?: PreferredContact;

  @ApiPropertyOptional({ example: '2025-10-15T09:00:00Z' })
  @IsDateString()
  @IsOptional()
  preferredDate?: string;
}

export class RespondToInquiryDto {
  @ApiProperty({ example: 'Yes, I can help you tomorrow at 10am.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  response: string;
}

export class UpdateInquiryStatusDto {
  @ApiProperty({ enum: InquiryStatus, example: InquiryStatus.CLOSED })
  @IsEnum(InquiryStatus)
  status: InquiryStatus;
}
