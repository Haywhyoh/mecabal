import { IsString, IsEnum, IsUUID, IsOptional, IsNumber, IsObject, IsArray } from 'class-validator';
import { LandmarkType, LandmarkVerificationStatus } from '../../../libs/database/src/entities';

export class CreateLandmarkDto {
  @IsString()
  name: string;

  @IsEnum(LandmarkType)
  type: LandmarkType;

  @IsUUID()
  neighborhoodId: string;

  @IsObject()
  location: {
    latitude: number;
    longitude: number;
  };

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  createdBy?: string;
}

export class UpdateLandmarkDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(LandmarkType)
  type?: LandmarkType;

  @IsOptional()
  @IsObject()
  location?: {
    latitude: number;
    longitude: number;
  };

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class LandmarkSearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsUUID()
  neighborhoodId?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}

export class LandmarkVerificationDto {
  @IsUUID()
  landmarkId: string;

  @IsEnum(LandmarkVerificationStatus)
  status: LandmarkVerificationStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
