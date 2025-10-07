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
import { User } from './user.entity';

@Entity('listing_saves')
@Index(['listingId', 'userId'], { unique: true })
@Index(['userId'])
export class ListingSave {
  @ApiProperty({ description: 'Unique identifier for the save' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Listing ID that was saved' })
  @Column({ name: 'listing_id' })
  listingId: string;

  @ApiProperty({ description: 'User ID who saved the listing' })
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({ description: 'When the listing was saved' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Listing, (listing) => listing.saves, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
