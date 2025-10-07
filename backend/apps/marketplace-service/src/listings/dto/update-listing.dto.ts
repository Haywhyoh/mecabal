import { PartialType } from '@nestjs/swagger';
import { CreateListingDto } from './create-listing.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum ListingStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  EXPIRED = 'expired',
  DRAFT = 'draft',
}

export class UpdateListingDto extends PartialType(CreateListingDto) {
  @ApiPropertyOptional({
    description: 'Listing status',
    enum: ListingStatus,
    example: ListingStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;
}
