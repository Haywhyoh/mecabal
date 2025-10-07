import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ListingMedia } from './listing-media.entity';
import { ListingSave } from './listing-save.entity';
import type { User } from './user.entity';
import type { Neighborhood } from './neighborhood.entity';
import type { ListingCategory } from './listing-category.entity';

@Entity('listings')
@Index(['neighborhoodId', 'createdAt'])
@Index(['userId'])
@Index(['categoryId'])
@Index(['listingType'])
@Index(['status'])
export class Listing {
  @ApiProperty({ description: 'Unique identifier for the listing' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID who created the listing' })
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({ description: 'Neighborhood ID where listing is posted' })
  @Column({ name: 'neighborhood_id' })
  neighborhoodId: string;

  @ApiProperty({
    description: 'Type of listing',
    enum: ['property', 'item', 'service'],
    example: 'item',
  })
  @Column({ name: 'listing_type', length: 20 })
  listingType: string;

  @ApiProperty({ description: 'Category ID' })
  @Column({ name: 'category_id' })
  categoryId: number;

  @ApiProperty({
    description: 'Listing title',
    example: 'iPhone 12 Pro Max 256GB',
    maxLength: 200,
  })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({ description: 'Detailed description of the listing' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ description: 'Price in Naira' })
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @ApiProperty({ description: 'Currency code', default: 'NGN' })
  @Column({ length: 3, default: 'NGN' })
  currency: string;

  @ApiProperty({
    description: 'Price type',
    enum: ['fixed', 'negotiable', 'per_hour', 'per_day'],
    example: 'negotiable',
  })
  @Column({ name: 'price_type', length: 20 })
  priceType: string;

  // Property-specific fields
  @ApiProperty({
    description: 'Property type',
    enum: ['apartment', 'house', 'land', 'office'],
    required: false,
  })
  @Column({ name: 'property_type', length: 20, nullable: true })
  propertyType?: string;

  @ApiProperty({ description: 'Number of bedrooms', required: false })
  @Column({ nullable: true })
  bedrooms?: number;

  @ApiProperty({ description: 'Number of bathrooms', required: false })
  @Column({ nullable: true })
  bathrooms?: number;

  @ApiProperty({
    description: 'Rental period',
    enum: ['monthly', 'yearly'],
    required: false,
  })
  @Column({ name: 'rental_period', length: 20, nullable: true })
  rentalPeriod?: string;

  // Item-specific fields
  @ApiProperty({
    description: 'Item condition',
    enum: ['new', 'like_new', 'good', 'fair'],
    required: false,
  })
  @Column({ length: 20, nullable: true })
  condition?: string;

  @ApiProperty({ description: 'Brand name', required: false })
  @Column({ length: 100, nullable: true })
  brand?: string;

  // Location (using separate lat/lng columns for better compatibility)
  @ApiProperty({ description: 'Latitude coordinate' })
  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @ApiProperty({ description: 'Full address text' })
  @Column({ type: 'text' })
  address: string;

  // Status
  @ApiProperty({
    description: 'Listing status',
    enum: ['active', 'sold', 'expired', 'draft'],
    default: 'active',
  })
  @Column({ length: 20, default: 'active' })
  status: string;

  // Metrics
  @ApiProperty({ description: 'Number of views' })
  @Column({ name: 'views_count', default: 0 })
  viewsCount: number;

  @ApiProperty({ description: 'Number of saves/bookmarks' })
  @Column({ name: 'saves_count', default: 0 })
  savesCount: number;

  @ApiProperty({ description: 'Listing expiration time', required: false })
  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @ApiProperty({ description: 'Listing creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;

  @ManyToOne('Neighborhood', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'neighborhood_id' })
  neighborhood: any;

  @ManyToOne('ListingCategory')
  @JoinColumn({ name: 'category_id' })
  category: any;

  @OneToMany(() => ListingMedia, (media) => media.listing, {
    cascade: true,
    eager: true,
  })
  media: ListingMedia[];

  @OneToMany(() => ListingSave, (save) => save.listing)
  saves: ListingSave[];

  // Helper methods
  isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  isActive(): boolean {
    return this.status === 'active' && !this.isExpired();
  }

  isSold(): boolean {
    return this.status === 'sold';
  }

  // Format price with currency
  getFormattedPrice(): string {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(Number(this.price));
  }
}
