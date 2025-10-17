import { IsString, IsEnum, IsBoolean, IsOptional, IsUUID, IsObject } from 'class-validator';
import { NeighborhoodType } from '../../../database/src/entities';

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

  @IsOptional()
  @IsString()
  description?: string;
}
