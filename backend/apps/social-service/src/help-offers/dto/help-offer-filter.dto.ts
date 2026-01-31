import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { HelpOfferStatus } from '@app/database';

export class HelpOfferFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by post ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  postId?: string;

  @ApiPropertyOptional({
    description: 'Filter by user ID (helper)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: HelpOfferStatus,
  })
  @IsOptional()
  @IsEnum(HelpOfferStatus)
  status?: HelpOfferStatus;
}





