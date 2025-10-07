import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Listing } from './listing.entity';

@Entity('listing_media')
@Index(['listingId'])
export class ListingMedia {
  @ApiProperty({ description: 'Unique identifier for the media' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Listing ID this media belongs to' })
  @Column({ name: 'listing_id' })
  listingId: string;

  @ApiProperty({ description: 'Media file URL' })
  @Column({ type: 'text' })
  url: string;

  @ApiProperty({
    description: 'Media type',
    enum: ['image', 'video'],
    example: 'image',
  })
  @Column({ length: 10 })
  type: string;

  @ApiProperty({ description: 'Media caption', required: false })
  @Column({ type: 'text', nullable: true })
  caption?: string;

  @ApiProperty({
    description: 'Display order for sorting media',
    default: 0,
  })
  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @ApiProperty({ description: 'Media upload timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Listing, (listing) => listing.media, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;
}
