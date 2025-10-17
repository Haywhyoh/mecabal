import { IsString, IsEnum, IsBoolean, IsOptional, IsUUID, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NeighborhoodType } from '../../../libs/database/src/entities';

export class CreateNeighborhoodDto {
  @IsString()
  name: string;

  @IsEnum(NeighborhoodType)
  type: NeighborhoodType;

  @IsUUID()
  wardId: string;

  @IsOptional()
  @IsUUID()
  parentNeighborhoodId?: string;

  @IsOptional()
  @IsObject()
  boundaries?: any; // GeoJSON polygon

  @IsOptional()
  @IsBoolean()
  isGated?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresVerification?: boolean;

  @IsOptional()
  @IsUUID()
  adminUserId?: string;
}

export class UpdateNeighborhoodDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(NeighborhoodType)
  type?: NeighborhoodType;

  @IsOptional()
  @IsUUID()
  parentNeighborhoodId?: string;

  @IsOptional()
  @IsObject()
  boundaries?: any;

  @IsOptional()
  @IsBoolean()
  isGated?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresVerification?: boolean;

  @IsOptional()
  @IsUUID()
  adminUserId?: string;
}

export class NeighborhoodSearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsUUID()
  stateId?: string;

  @IsOptional()
  @IsUUID()
  lgaId?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsBoolean()
  isGated?: boolean;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}

export class NeighborhoodRecommendationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  radius?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class EstateVerificationDto {
  @IsUUID()
  estateId: string;

  @IsString()
  address: string;

  @IsString()
  moveInDate: string; // ISO date string

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  message?: string;
}
