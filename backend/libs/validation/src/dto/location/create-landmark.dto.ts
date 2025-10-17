import { IsString, IsEnum, IsUUID, IsOptional, IsObject, IsNumber } from 'class-validator';
import { LandmarkType } from '../../../database/src/entities';

export class CreateLandmarkDto {
  @IsString()
  name: string;

  @IsEnum(LandmarkType)
  type: LandmarkType;

  @IsUUID()
  neighborhoodId: string;

  @IsObject()
  location: {
    @IsNumber()
    latitude: number;

    @IsNumber()
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
