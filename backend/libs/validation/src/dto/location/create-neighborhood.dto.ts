import { IsString, IsEnum, IsBoolean, IsOptional, IsUUID, IsObject } from 'class-validator';
import { NeighborhoodType } from '../../../database/src/entities';

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

  @IsOptional()
  @IsString()
  description?: string;
}
