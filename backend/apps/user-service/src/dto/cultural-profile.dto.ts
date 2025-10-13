import { IsString, IsArray, IsOptional, IsEnum, IsUUID, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LanguageProficiency {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  NATIVE = 'native',
}

export class UserLanguageDto {
  @ApiProperty({ description: 'Language ID' })
  @IsString()
  languageId: string;

  @ApiProperty({ 
    description: 'Proficiency level',
    enum: LanguageProficiency 
  })
  @IsEnum(LanguageProficiency)
  proficiency: LanguageProficiency;
}

export class UserPrivacySettingsDto {
  @ApiProperty({ description: 'Show cultural background in profile' })
  @IsBoolean()
  showCulturalBackground: boolean;

  @ApiProperty({ description: 'Show languages in profile' })
  @IsBoolean()
  showLanguages: boolean;

  @ApiProperty({ description: 'Show professional category in profile' })
  @IsBoolean()
  showProfessionalCategory: boolean;

  @ApiProperty({ description: 'Show state of origin in profile' })
  @IsBoolean()
  showStateOfOrigin: boolean;

  @ApiProperty({ description: 'Allow cultural matching' })
  @IsBoolean()
  allowCulturalMatching: boolean;
}

export class CreateCulturalProfileDto {
  @ApiProperty({ description: 'State of origin ID' })
  @IsString()
  stateOfOriginId: string;

  @ApiProperty({ description: 'Cultural background ID' })
  @IsString()
  culturalBackgroundId: string;

  @ApiProperty({ description: 'Professional category ID' })
  @IsString()
  professionalCategoryId: string;

  @ApiProperty({ description: 'Professional title' })
  @IsString()
  professionalTitle: string;

  @ApiProperty({ 
    description: 'User languages',
    type: [UserLanguageDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserLanguageDto)
  languages: UserLanguageDto[];

  @ApiProperty({ 
    description: 'Privacy settings',
    type: UserPrivacySettingsDto
  })
  @ValidateNested()
  @Type(() => UserPrivacySettingsDto)
  privacySettings: UserPrivacySettingsDto;
}

export class UpdateCulturalProfileDto {
  @ApiPropertyOptional({ description: 'State of origin ID' })
  @IsOptional()
  @IsString()
  stateOfOriginId?: string;

  @ApiPropertyOptional({ description: 'Cultural background ID' })
  @IsOptional()
  @IsString()
  culturalBackgroundId?: string;

  @ApiPropertyOptional({ description: 'Professional category ID' })
  @IsOptional()
  @IsString()
  professionalCategoryId?: string;

  @ApiPropertyOptional({ description: 'Professional title' })
  @IsOptional()
  @IsString()
  professionalTitle?: string;

  @ApiPropertyOptional({ 
    description: 'User languages',
    type: [UserLanguageDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserLanguageDto)
  languages?: UserLanguageDto[];

  @ApiPropertyOptional({ 
    description: 'Privacy settings',
    type: UserPrivacySettingsDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserPrivacySettingsDto)
  privacySettings?: UserPrivacySettingsDto;
}

export class AddLanguageDto {
  @ApiProperty({ description: 'Language ID' })
  @IsString()
  languageId: string;

  @ApiProperty({ 
    description: 'Proficiency level',
    enum: LanguageProficiency 
  })
  @IsEnum(LanguageProficiency)
  proficiency: LanguageProficiency;
}

export class UpdateLanguageDto {
  @ApiProperty({ 
    description: 'Proficiency level',
    enum: LanguageProficiency 
  })
  @IsEnum(LanguageProficiency)
  proficiency: LanguageProficiency;
}

export class CulturalProfileResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'State of origin' })
  stateOfOrigin: {
    id: string;
    name: string;
    region: string;
  };

  @ApiProperty({ description: 'Cultural background' })
  culturalBackground: {
    id: string;
    name: string;
    region: string;
  };

  @ApiProperty({ description: 'Professional information' })
  professional: {
    categoryId: string;
    category: string;
    title: string;
  };

  @ApiProperty({ description: 'User languages' })
  languages: Array<{
    id: string;
    name: string;
    nativeName: string;
    proficiency: LanguageProficiency;
  }>;

  @ApiProperty({ description: 'Privacy settings' })
  privacySettings: UserPrivacySettingsDto;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class ReferenceDataResponseDto {
  @ApiProperty({ description: 'Nigerian states' })
  states: Array<{
    id: string;
    name: string;
    region: string;
    capital: string;
    lgas: string[];
    population: number;
    areaSqKm: number;
  }>;

  @ApiProperty({ description: 'Nigerian languages' })
  languages: Array<{
    id: string;
    name: string;
    nativeName: string;
    greeting: string;
    description: string;
    speakersCount: number;
    regions: string[];
    isMajor: boolean;
  }>;

  @ApiProperty({ description: 'Cultural backgrounds' })
  culturalBackgrounds: Array<{
    id: string;
    name: string;
    region: string;
    description: string;
    traditions: any;
    populationEstimate: number;
  }>;

  @ApiProperty({ description: 'Professional categories' })
  professionalCategories: Array<{
    id: string;
    category: string;
    titles: string[];
    icon: string;
    displayOrder: number;
  }>;
}




