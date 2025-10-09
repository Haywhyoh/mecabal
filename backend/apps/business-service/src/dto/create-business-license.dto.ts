import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBusinessLicenseDto {
  @ApiProperty({ example: 'CAC Registration' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  licenseType: string;

  @ApiProperty({ example: 'RC123456789' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  licenseNumber: string;

  @ApiProperty({ example: 'Corporate Affairs Commission' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  issuingAuthority: string;

  @ApiProperty({ example: '2023-01-15' })
  @IsDateString()
  issueDate: string;

  @ApiPropertyOptional({ example: '2025-01-15' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ example: 'https://example.com/license.pdf' })
  @IsString()
  @IsOptional()
  documentUrl?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}
