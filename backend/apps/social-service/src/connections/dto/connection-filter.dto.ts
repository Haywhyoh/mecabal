import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConnectionType, ConnectionStatus } from '@app/database';

export class ConnectionFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by connection type',
    enum: ConnectionType,
  })
  @IsOptional()
  @IsEnum(ConnectionType)
  connectionType?: ConnectionType;

  @ApiPropertyOptional({
    description: 'Filter by connection status',
    enum: ConnectionStatus,
  })
  @IsOptional()
  @IsEnum(ConnectionStatus)
  status?: ConnectionStatus;

  @ApiPropertyOptional({
    description: 'Filter by estate ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  estateId?: string;

  @ApiPropertyOptional({
    description: 'Filter by neighborhood ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  neighborhoodId?: string;

  @ApiPropertyOptional({
    description: 'Filter by LGA ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  lgaId?: string;

  @ApiPropertyOptional({
    description: 'Search by user name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}





