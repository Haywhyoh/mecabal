import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsUUID,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BookingStatus } from '@app/database/entities/booking.entity';

export class CreateBookingDto {
  @ApiProperty({ example: 'uuid-of-business' })
  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @ApiPropertyOptional({ example: 'uuid-of-service' })
  @IsUUID()
  @IsOptional()
  serviceId?: string;

  @ApiProperty({ example: 'Plumbing Repair' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  serviceName: string;

  @ApiPropertyOptional({ example: '2024-12-25' })
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @ApiPropertyOptional({ example: '10:00' })
  @IsString()
  @IsOptional()
  scheduledTime?: string;

  @ApiPropertyOptional({ example: '123 Main Street, Lekki, Lagos' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: 'Need urgent plumbing repair for leaking pipe' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  price: number;
}

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus, example: BookingStatus.CONFIRMED })
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status: BookingStatus;

  @ApiPropertyOptional({ example: 'Customer requested cancellation' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  cancellationReason?: string;
}

export class BookingFilterDto {
  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  businessId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

