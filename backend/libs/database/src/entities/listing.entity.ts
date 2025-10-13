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
    enum: ['property', 'item', 'service', 'job'],
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

  // Service-specific fields
  @ApiProperty({
    description: 'Service type',
    enum: ['offering', 'request'],
    required: false,
  })
  @Column({ name: 'service_type', length: 50, nullable: true })
  serviceType?: string;

  @ApiProperty({ description: 'Service availability schedule', required: false })
  @Column({ name: 'availability_schedule', type: 'jsonb', nullable: true })
  availabilitySchedule?: {
    days: string[];
    startTime: string;
    endTime: string;
    timezone: string;
  };

  @ApiProperty({ description: 'Service radius in kilometers', required: false })
  @Column({ name: 'service_radius', type: 'int', nullable: true })
  serviceRadius?: number;

  @ApiProperty({ description: 'Professional credentials', required: false })
  @Column({ name: 'professional_credentials', type: 'jsonb', nullable: true })
  professionalCredentials?: {
    licenses: string[];
    certifications: string[];
    experience: number;
    insurance: boolean;
  };

  @ApiProperty({
    description: 'Pricing model for services',
    enum: ['hourly', 'project', 'fixed', 'negotiable'],
    required: false,
  })
  @Column({ name: 'pricing_model', length: 20, nullable: true })
  pricingModel?: string;

  @ApiProperty({ description: 'Response time in hours', required: false })
  @Column({ name: 'response_time', type: 'int', nullable: true })
  responseTime?: number;

  // Job-specific fields
  @ApiProperty({
    description: 'Employment type',
    enum: ['full_time', 'part_time', 'contract', 'freelance'],
    required: false,
  })
  @Column({ name: 'employment_type', length: 20, nullable: true })
  employmentType?: string;

  @ApiProperty({ description: 'Minimum salary', required: false })
  @Column({ name: 'salary_min', type: 'decimal', precision: 12, scale: 2, nullable: true })
  salaryMin?: number;

  @ApiProperty({ description: 'Maximum salary', required: false })
  @Column({ name: 'salary_max', type: 'decimal', precision: 12, scale: 2, nullable: true })
  salaryMax?: number;

  @ApiProperty({ description: 'Application deadline', required: false })
  @Column({ name: 'application_deadline', type: 'timestamp', nullable: true })
  applicationDeadline?: Date;

  @ApiProperty({ description: 'Required skills', required: false })
  @Column({ name: 'required_skills', type: 'jsonb', nullable: true })
  requiredSkills?: string[];

  @ApiProperty({
    description: 'Work location type',
    enum: ['remote', 'on_site', 'hybrid'],
    required: false,
  })
  @Column({ name: 'work_location', length: 20, nullable: true })
  workLocation?: string;

  @ApiProperty({ description: 'Company information', required: false })
  @Column({ name: 'company_info', type: 'jsonb', nullable: true })
  companyInfo?: {
    name: string;
    size: string;
    industry: string;
    website?: string;
  };

  // Enhanced property fields
  @ApiProperty({ description: 'Property amenities', required: false })
  @Column({ name: 'property_amenities', type: 'jsonb', nullable: true })
  propertyAmenities?: string[];

  @ApiProperty({ description: 'Utilities included', required: false })
  @Column({ name: 'utilities_included', type: 'jsonb', nullable: true })
  utilitiesIncluded?: string[];

  @ApiProperty({
    description: 'Pet policy',
    enum: ['allowed', 'not_allowed', 'case_by_case'],
    required: false,
  })
  @Column({ name: 'pet_policy', length: 20, nullable: true })
  petPolicy?: string;

  @ApiProperty({ description: 'Number of parking spaces', required: false })
  @Column({ name: 'parking_spaces', type: 'int', nullable: true })
  parkingSpaces?: number;

  @ApiProperty({ description: 'Security features', required: false })
  @Column({ name: 'security_features', type: 'jsonb', nullable: true })
  securityFeatures?: string[];

  @ApiProperty({ description: 'Property size in square meters', required: false })
  @Column({ name: 'property_size', type: 'decimal', precision: 10, scale: 2, nullable: true })
  propertySize?: number;

  @ApiProperty({ description: 'Land size in square meters', required: false })
  @Column({ name: 'land_size', type: 'decimal', precision: 10, scale: 2, nullable: true })
  landSize?: number;

  // Enhanced location fields

  @ApiProperty({ description: 'Estate ID', required: false })
  @Column({ name: 'estate_id', length: 36, nullable: true })
  estateId?: string;

  @ApiProperty({ description: 'City', required: false })
  @Column({ name: 'city', length: 100, nullable: true })
  city?: string;

  @ApiProperty({ description: 'State', required: false })
  @Column({ name: 'state', length: 50, nullable: true })
  state?: string;

  // Enhanced status and metadata
  @ApiProperty({ description: 'Whether listing is featured', default: false })
  @Column({ name: 'featured', type: 'boolean', default: false })
  featured: boolean;

  @ApiProperty({ description: 'Whether listing is boosted', default: false })
  @Column({ name: 'boosted', type: 'boolean', default: false })
  boosted: boolean;

  @ApiProperty({
    description: 'Verification status',
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  })
  @Column({ name: 'verification_status', length: 20, default: 'pending' })
  verificationStatus: string;

  @ApiProperty({ description: 'Contact preferences', required: false })
  @Column({ name: 'contact_preferences', type: 'jsonb', nullable: true })
  contactPreferences?: {
    allowCalls: boolean;
    allowMessages: boolean;
    allowWhatsApp: boolean;
    preferredTime: string;
  };

  // Location stored as separate latitude/longitude columns
  @ApiProperty({ description: 'Latitude coordinate' })
  @Column({ type: 'decimal', precision: 10, scale: 8, default: 0 })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @Column({ type: 'decimal', precision: 11, scale: 8, default: 0 })
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
