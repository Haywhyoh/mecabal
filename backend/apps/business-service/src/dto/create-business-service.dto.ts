import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBusinessServiceDto {
  @ApiProperty({ example: 'Plumbing Repair' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  serviceName: string;

  @ApiPropertyOptional({
    example: 'Professional plumbing repair services for residential and commercial properties',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 5000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  priceMin?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  priceMax?: number;

  @ApiPropertyOptional({ example: '2 hours' })
  @IsString()
  @IsOptional()
  duration?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
