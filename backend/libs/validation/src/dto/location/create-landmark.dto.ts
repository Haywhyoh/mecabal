import { IsString, IsEnum, IsUUID, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { LandmarkType } from '@app/database/entities';

class LocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

export class CreateLandmarkDto {
  @IsString()
  name: string;

  @IsEnum(LandmarkType)
  type: LandmarkType;

  @IsUUID()
  neighborhoodId: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

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
