import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LicenseType {
  CAC = 'CAC',
  TIN = 'TIN',
  NAFDAC = 'NAFDAC',
  SON = 'SON',
  SCUML = 'SCUML',
  NBA = 'NBA',
  NMA = 'NMA',
  ICAN = 'ICAN',
  NSE = 'NSE',
  APCON = 'APCON',
  BUSINESS_PREMISES = 'BUSINESS_PREMISES',
  HEALTH_CERT = 'HEALTH_CERT',
  FIRE_CERT = 'FIRE_CERT',
  SIGNAGE = 'SIGNAGE',
  OTHER = 'OTHER',
}

export class CreateBusinessLicenseDto {
  @ApiProperty({ enum: LicenseType, example: LicenseType.CAC })
  @IsEnum(LicenseType)
  licenseType: LicenseType;

  @ApiProperty({ example: 'RC1234567' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  licenseNumber: string;

  @ApiProperty({ example: 'Corporate Affairs Commission' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  issuingAuthority: string;

  @ApiPropertyOptional({ example: '2023-01-15' })
  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2028-01-15' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ example: 'https://storage.mecabal.com/licenses/document.pdf' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  documentUrl?: string;
}

export class UpdateBusinessLicenseDto {
  @ApiPropertyOptional({ enum: LicenseType })
  @IsEnum(LicenseType)
  @IsOptional()
  licenseType?: LicenseType;

  @ApiPropertyOptional({ example: 'RC1234567' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 'Corporate Affairs Commission' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  issuingAuthority?: string;

  @ApiPropertyOptional({ example: '2023-01-15' })
  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2028-01-15' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ example: 'https://storage.mecabal.com/licenses/document.pdf' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  documentUrl?: string;
}

export class VerifyLicenseDto {
  @ApiProperty({ example: true })
  @IsNotEmpty()
  isVerified: boolean;
}
