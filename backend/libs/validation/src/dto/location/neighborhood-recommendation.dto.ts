import { IsNumber, IsOptional, IsArray, IsString, IsBoolean, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class NeighborhoodRecommendationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  radius?: number; // in meters

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  types?: string[];

  @IsOptional()
  @IsBoolean()
  isGated?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresVerification?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minMemberCount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxMemberCount?: number;
}

export class UserLocationPreferencesDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxDistance?: number; // in meters

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredTypes?: string[];

  @IsOptional()
  @IsBoolean()
  preferGated?: boolean;

  @IsOptional()
  @IsBoolean()
  preferVerified?: boolean;

  @IsOptional()
  @IsUUID()
  currentNeighborhoodId?: string;
}

export class NeighborhoodRecommendationResponseDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  detectedLocation: {
    state: string;
    lga: string;
    ward?: string;
    city?: string;
  };

  @IsArray()
  recommendations: Array<{
    neighborhood: {
      id: string;
      name: string;
      type: string;
      isGated: boolean;
      requiresVerification: boolean;
    };
    distance: number; // in meters
    score: number; // 0-1
    reasons: string[];
    landmarks: Array<{
      id: string;
      name: string;
      type: string;
    }>;
    memberCount: number;
  }>;
}
