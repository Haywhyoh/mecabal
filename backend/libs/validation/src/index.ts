// Auth DTOs
export * from './dto/auth/google-auth.dto';
export * from './dto/auth/social-auth.dto';

// Re-export common validation decorators for convenience
export {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsArray,
  IsObject,
  IsDate,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
  ValidateNested,
  IsNotEmpty,
  IsDefined,
} from 'class-validator';

export { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
