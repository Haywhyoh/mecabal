import { IsString, IsOptional, IsEnum, IsNotEmpty, IsLatitude, IsLongitude, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export enum LocationMethod {
  GPS = 'gps',
  MAP = 'map',
  LANDMARK = 'landmark',
  MANUAL = 'manual'
}

export enum NigerianState {
  ABIA = 'Abia',
  ADAMAWA = 'Adamawa',
  AKWA_IBOM = 'Akwa Ibom',
  ANAMBRA = 'Anambra',
  BAUCHI = 'Bauchi',
  BAYELSA = 'Bayelsa',
  BENUE = 'Benue',
  BORNO = 'Borno',
  CROSS_RIVER = 'Cross River',
  DELTA = 'Delta',
  EBONYI = 'Ebonyi',
  EDO = 'Edo',
  EKITI = 'Ekiti',
  ENUGU = 'Enugu',
  GOMBE = 'Gombe',
  IMO = 'Imo',
  JIGAWA = 'Jigawa',
  KADUNA = 'Kaduna',
  KANO = 'Kano',
  KATSINA = 'Katsina',
  KEBBI = 'Kebbi',
  KOGI = 'Kogi',
  KWARA = 'Kwara',
  LAGOS = 'Lagos',
  NASARAWA = 'Nasarawa',
  NIGER = 'Niger',
  OGUN = 'Ogun',
  ONDO = 'Ondo',
  OSUN = 'Osun',
  OYO = 'Oyo',
  PLATEAU = 'Plateau',
  RIVERS = 'Rivers',
  SOKOTO = 'Sokoto',
  TARABA = 'Taraba',
  YOBE = 'Yobe',
  ZAMFARA = 'Zamfara',
  FCT = 'Federal Capital Territory'
}

export class LocationSetupDto {
  @ApiProperty({ 
    example: 'gps',
    description: 'Method used to set location',
    enum: LocationMethod 
  })
  @IsEnum(LocationMethod, { 
    message: 'Method must be gps, map, landmark, or manual' 
  })
  method: LocationMethod;

  @ApiProperty({ 
    example: 'Lagos',
    description: 'Nigerian state',
    enum: NigerianState 
  })
  @IsEnum(NigerianState, { message: 'Please select a valid Nigerian state' })
  state: NigerianState;

  @ApiProperty({ 
    example: 'Ikeja',
    description: 'City within the state' 
  })
  @IsString({ message: 'City must be a string' })
  @IsNotEmpty({ message: 'City is required' })
  @Transform(({ value }) => value?.trim())
  city: string;

  @ApiProperty({ 
    example: 'Victoria Island Estate',
    description: 'Estate or compound name',
    required: false 
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  estate?: string;

  @ApiProperty({ 
    example: 6.5244,
    description: 'GPS latitude coordinate',
    required: false 
  })
  @IsOptional()
  @IsLatitude({ message: 'Please provide a valid latitude' })
  @Type(() => Number)
  latitude?: number;

  @ApiProperty({ 
    example: 3.3792,
    description: 'GPS longitude coordinate',
    required: false 
  })
  @IsOptional()
  @IsLongitude({ message: 'Please provide a valid longitude' })
  @Type(() => Number)
  longitude?: number;

  @ApiProperty({ 
    example: 'Ikeja City Mall',
    description: 'Landmark reference point',
    required: false 
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  landmark?: string;

  @ApiProperty({ 
    example: '123 Main Street, Victoria Island, Lagos',
    description: 'Full address text',
    required: false 
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  address?: string;

  @ApiProperty({ 
    example: 'user123',
    description: 'User ID for location update',
    required: false 
  })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class LandmarkSearchDto {
  @ApiProperty({ 
    example: 'Lagos',
    description: 'State to search landmarks in',
    enum: NigerianState 
  })
  @IsEnum(NigerianState)
  state: NigerianState;

  @ApiProperty({ 
    example: 'Ikeja',
    description: 'City to search landmarks in' 
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  city: string;

  @ApiProperty({ 
    example: 'mall',
    description: 'Search query for landmark type or name',
    required: false 
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  query?: string;

  @ApiProperty({ 
    example: 2000,
    description: 'Search radius in meters',
    required: false,
    default: 5000 
  })
  @IsOptional()
  @IsNumber({}, { message: 'Radius must be a number' })
  @Type(() => Number)
  radius?: number = 5000;
}

export class EstateSearchDto {
  @ApiProperty({ 
    example: 'Lagos',
    description: 'State to search estates in',
    enum: NigerianState 
  })
  @IsEnum(NigerianState)
  state: NigerianState;

  @ApiProperty({ 
    example: 'Ikeja',
    description: 'City to search estates in' 
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  city: string;

  @ApiProperty({ 
    example: 'Victoria',
    description: 'Search query for estate name',
    required: false 
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  query?: string;
}