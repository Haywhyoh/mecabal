import { IsNumber, IsOptional, IsString } from 'class-validator';

export class LocationCoordinatesDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number; // in meters

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class LocationBoundaryDto {
  @IsString()
  type: 'Polygon' | 'MultiPolygon';

  @IsNumber({}, { each: true })
  coordinates: number[][][];
}

export class LocationSearchDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  radius?: number; // in meters

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  type?: string;
}
