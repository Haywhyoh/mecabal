import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { ListingType, PriceType, PropertyType, ItemCondition, RentalPeriod } from './create-listing.dto';
import { ListingStatus } from './update-listing.dto';

export class LocationResponseDto {
  @ApiProperty({ description: 'Latitude coordinate' })
  @Expose()
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @Expose()
  longitude: number;

  @ApiProperty({ description: 'Full address' })
  @Expose()
  address: string;
}

export class ListingMediaResponseDto {
  @ApiProperty({ description: 'Media ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Media URL' })
  @Expose()
  url: string;

  @ApiProperty({ description: 'Media type' })
  @Expose()
  type: 'image' | 'video';

  @ApiPropertyOptional({ description: 'Media caption' })
  @Expose()
  caption?: string;

  @ApiProperty({ description: 'Display order' })
  @Expose()
  displayOrder: number;

  @ApiProperty({ description: 'Created timestamp' })
  @Expose()
  createdAt: Date;
}

export class ListingCategoryResponseDto {
  @ApiProperty({ description: 'Category ID' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Listing type' })
  @Expose()
  listingType: ListingType;

  @ApiProperty({ description: 'Category name' })
  @Expose()
  name: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @Expose()
  description?: string;

  @ApiPropertyOptional({ description: 'Icon URL' })
  @Expose()
  iconUrl?: string;

  @ApiPropertyOptional({ description: 'Color code' })
  @Expose()
  colorCode?: string;
}

export class ListingAuthorResponseDto {
  @ApiProperty({ description: 'User ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'First name' })
  @Expose()
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @Expose()
  lastName: string;

  @ApiPropertyOptional({ description: 'Profile picture URL' })
  @Expose()
  profilePicture?: string;

  @ApiProperty({ description: 'Whether user is verified' })
  @Expose()
  isVerified: boolean;

  @ApiProperty({ description: 'User joined date' })
  @Expose()
  createdAt: Date;
}

export class ListingResponseDto {
  @ApiProperty({ description: 'Listing ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'Listing type' })
  @Expose()
  listingType: ListingType;

  @ApiProperty({ description: 'Category information' })
  @Expose()
  @Type(() => ListingCategoryResponseDto)
  category: ListingCategoryResponseDto;

  @ApiProperty({ description: 'Listing title' })
  @Expose()
  title: string;

  @ApiProperty({ description: 'Listing description' })
  @Expose()
  description: string;

  @ApiProperty({ description: 'Price in Naira' })
  @Expose()
  price: number;

  @ApiProperty({ description: 'Currency code' })
  @Expose()
  currency: string;

  @ApiProperty({ description: 'Price type' })
  @Expose()
  priceType: PriceType;

  // Property-specific fields
  @ApiPropertyOptional({ description: 'Property type' })
  @Expose()
  propertyType?: PropertyType;

  @ApiPropertyOptional({ description: 'Number of bedrooms' })
  @Expose()
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Number of bathrooms' })
  @Expose()
  bathrooms?: number;

  @ApiPropertyOptional({ description: 'Rental period' })
  @Expose()
  rentalPeriod?: RentalPeriod;

  // Item-specific fields
  @ApiPropertyOptional({ description: 'Item condition' })
  @Expose()
  condition?: ItemCondition;

  @ApiPropertyOptional({ description: 'Brand name' })
  @Expose()
  brand?: string;

  @ApiPropertyOptional({ description: 'Model name' })
  @Expose()
  model?: string;

  @ApiPropertyOptional({ description: 'Year of manufacture' })
  @Expose()
  year?: number;

  @ApiPropertyOptional({ description: 'Warranty period' })
  @Expose()
  warranty?: string;

  // Location
  @ApiProperty({ description: 'Location information' })
  @Expose()
  @Type(() => LocationResponseDto)
  location: LocationResponseDto;

  // Media
  @ApiProperty({ description: 'Media attachments' })
  @Expose()
  @Type(() => ListingMediaResponseDto)
  media: ListingMediaResponseDto[];

  // Status
  @ApiProperty({ description: 'Listing status' })
  @Expose()
  status: ListingStatus;

  // Metrics
  @ApiProperty({ description: 'Number of views' })
  @Expose()
  viewsCount: number;

  @ApiProperty({ description: 'Number of saves' })
  @Expose()
  savesCount: number;

  @ApiProperty({ description: 'Whether current user has saved this listing' })
  @Expose()
  isSaved: boolean;

  // Author
  @ApiProperty({ description: 'Listing author information' })
  @Expose()
  @Type(() => ListingAuthorResponseDto)
  author: ListingAuthorResponseDto;

  // Timestamps
  @ApiProperty({ description: 'Created timestamp' })
  @Expose()
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Expiration timestamp' })
  @Expose()
  expiresAt?: Date;

  @ApiProperty({ description: 'Last updated timestamp' })
  @Expose()
  updatedAt: Date;
}

export class PaginatedListingsResponseDto {
  @ApiProperty({ description: 'Listings array', type: [ListingResponseDto] })
  @Expose()
  @Type(() => ListingResponseDto)
  data: ListingResponseDto[];

  @ApiProperty({ description: 'Total number of listings' })
  @Expose()
  total: number;

  @ApiProperty({ description: 'Current page' })
  @Expose()
  page: number;

  @ApiProperty({ description: 'Items per page' })
  @Expose()
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  @Expose()
  totalPages: number;

  @ApiProperty({ description: 'Whether there are more pages' })
  @Expose()
  hasMore: boolean;
}
