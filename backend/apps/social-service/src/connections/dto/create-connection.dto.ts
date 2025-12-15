import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsUUID,
  IsOptional,
  IsObject,
  IsString,
  IsArray,
} from 'class-validator';
import { ConnectionType } from '@app/database';

export class CreateConnectionDto {
  @ApiProperty({
    description: 'User ID to connect with',
    format: 'uuid',
  })
  @IsUUID()
  toUserId: string;

  @ApiProperty({
    description: 'Type of connection',
    enum: ConnectionType,
    example: ConnectionType.CONNECT,
  })
  @IsEnum(ConnectionType)
  connectionType: ConnectionType;

  @ApiPropertyOptional({
    description: 'Additional metadata about the connection',
    example: {
      howTheyMet: 'Estate security meeting',
      sharedInterests: ['Estate Security', 'Emergency Response'],
      proximityLevel: 'same_building',
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}




