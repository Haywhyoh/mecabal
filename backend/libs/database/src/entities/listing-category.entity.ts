import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
// import { Listing } from './listing.entity'; // Removed to avoid circular dependency

@Entity('listing_categories')
@Index(['listingType'])
@Index(['isActive'])
export class ListingCategory {
  @ApiProperty({ description: 'Unique identifier for the category' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Type of listing this category belongs to',
    enum: ['property', 'item', 'service', 'job'],
    example: 'item',
  })
  @Column({ name: 'listing_type', length: 20 })
  listingType: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Electronics',
  })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({
    description: 'Category description',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Icon identifier (Material Community Icons)',
    example: 'laptop',
    required: false,
  })
  @Column({ name: 'icon_url', type: 'text', nullable: true })
  iconUrl?: string;

  @ApiProperty({
    description: 'Category color code (hex)',
    example: '#3498db',
    required: false,
  })
  @Column({ name: 'color_code', length: 7, nullable: true })
  colorCode?: string;

  @ApiProperty({
    description: 'Display order for sorting categories',
    default: 0,
  })
  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @ApiProperty({
    description: 'Whether category is active',
    default: true,
  })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Parent category ID for hierarchical structure', required: false })
  @Column({ name: 'parent_id', type: 'int', nullable: true })
  parentId?: number;

  @ApiProperty({ description: 'Dynamic field definitions for this category', required: false })
  @Column({ name: 'field_definitions', type: 'jsonb', nullable: true })
  fieldDefinitions?: {
    required: string[];
    optional: string[];
    validation: Record<string, any>;
  };

  @ApiProperty({ description: 'Search keywords for this category', required: false })
  @Column({ name: 'search_keywords', type: 'jsonb', nullable: true })
  searchKeywords?: string[];

  @ApiProperty({ description: 'Whether category is featured', default: false })
  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  @ApiProperty({ description: 'Sort order for category display', default: 0 })
  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty({ description: 'Category creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany('Listing', (listing: any) => listing.category)
  listings: any[];

  @OneToMany('ListingCategory', (category: any) => category.parent)
  children: any[];

  @ManyToOne('ListingCategory', (category: any) => category.children)
  @JoinColumn({ name: 'parent_id' })
  parent: any;
}
