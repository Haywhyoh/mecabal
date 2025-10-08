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
import { User } from './user.entity';
import { Neighborhood } from './neighborhood.entity';
import { EventCategory } from './event-category.entity';
import { EventMedia } from './event-media.entity';
import { EventAttendee } from './event-attendee.entity';

@Entity('events')
@Index(['neighborhoodId', 'eventDate'])
@Index(['categoryId'])
@Index(['userId'])
@Index(['status'])
@Index(['eventDate', 'status'])
export class Event {
  @ApiProperty({ description: 'Unique identifier for the event' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID who created the event' })
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({ description: 'Neighborhood ID where event is happening' })
  @Column({ name: 'neighborhood_id' })
  neighborhoodId: string;

  @ApiProperty({ description: 'Event category ID' })
  @Column({ name: 'category_id' })
  categoryId: number;

  @ApiProperty({
    description: 'Event title',
    example: 'Community Cleanup Drive',
    maxLength: 200,
  })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({
    description: 'Event description',
    example: 'Join us for a community cleanup drive to keep our neighborhood clean and beautiful.',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    description: 'Event date',
    example: '2025-01-15',
  })
  @Column({ name: 'event_date', type: 'date' })
  eventDate: Date;

  @ApiProperty({
    description: 'Event start time',
    example: '09:00',
  })
  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @ApiProperty({
    description: 'Event end time',
    example: '17:00',
    required: false,
  })
  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime?: string;

  @ApiProperty({
    description: 'Event timezone',
    example: 'Africa/Lagos',
    default: 'Africa/Lagos',
  })
  @Column({ length: 50, default: 'Africa/Lagos' })
  timezone: string;

  @ApiProperty({
    description: 'Location name',
    example: 'Victoria Island Community Center',
    maxLength: 200,
  })
  @Column({ name: 'location_name', length: 200 })
  locationName: string;

  @ApiProperty({
    description: 'Full location address',
    example: '123 Ahmadu Bello Way, Victoria Island, Lagos',
  })
  @Column({ name: 'location_address', type: 'text' })
  locationAddress: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 6.4281,
  })
  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 3.4219,
  })
  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @ApiProperty({
    description: 'Landmark for location reference',
    example: 'Near Eko Hotel',
    maxLength: 200,
    required: false,
  })
  @Column({ length: 200, nullable: true })
  landmark?: string;

  @ApiProperty({
    description: 'Whether event is free',
    default: true,
  })
  @Column({ name: 'is_free', default: true })
  isFree: boolean;

  @ApiProperty({
    description: 'Event price in Naira',
    example: 5000,
    required: false,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'NGN',
    default: 'NGN',
  })
  @Column({ length: 3, default: 'NGN' })
  currency: string;

  @ApiProperty({
    description: 'Maximum number of attendees',
    example: 100,
    required: false,
  })
  @Column({ name: 'max_attendees', nullable: true })
  maxAttendees?: number;

  @ApiProperty({
    description: 'Whether guests are allowed',
    default: true,
  })
  @Column({ name: 'allow_guests', default: true })
  allowGuests: boolean;

  @ApiProperty({
    description: 'Whether verification is required',
    default: false,
  })
  @Column({ name: 'require_verification', default: false })
  requireVerification: boolean;

  @ApiProperty({
    description: 'Age restriction',
    example: '18+',
    maxLength: 50,
    required: false,
  })
  @Column({ name: 'age_restriction', length: 50, nullable: true })
  ageRestriction?: string;

  @ApiProperty({
    description: 'Languages spoken at event',
    example: ['English', 'Yoruba'],
    default: ['English'],
  })
  @Column({ type: 'jsonb', default: '["English"]' })
  languages: string[];

  @ApiProperty({
    description: 'Whether event is private',
    default: false,
  })
  @Column({ name: 'is_private', default: false })
  isPrivate: boolean;

  @ApiProperty({
    description: 'Cover image URL',
    required: false,
  })
  @Column({ name: 'cover_image_url', type: 'text', nullable: true })
  coverImageUrl?: string;

  @ApiProperty({
    description: 'Event status',
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft',
  })
  @Column({ length: 20, default: 'draft' })
  status: string;

  @ApiProperty({
    description: 'Number of views',
    default: 0,
  })
  @Column({ name: 'views_count', default: 0 })
  viewsCount: number;

  @ApiProperty({
    description: 'Number of attendees',
    default: 0,
  })
  @Column({ name: 'attendees_count', default: 0 })
  attendeesCount: number;

  @ApiProperty({
    description: 'Special requirements or notes',
    required: false,
  })
  @Column({ name: 'special_requirements', type: 'text', nullable: true })
  specialRequirements?: string;

  @ApiProperty({ description: 'Event creation timestamp' })
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

  @ManyToOne('EventCategory', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: any;

  @OneToMany(() => EventMedia, (media) => media.event, {
    cascade: true,
    eager: true,
  })
  media: EventMedia[];

  @OneToMany(() => EventAttendee, (attendee) => attendee.event)
  attendees: EventAttendee[];

  // Helper methods
  isPublished(): boolean {
    return this.status === 'published';
  }

  isDraft(): boolean {
    return this.status === 'draft';
  }

  isCancelled(): boolean {
    return this.status === 'cancelled';
  }

  isCompleted(): boolean {
    return this.status === 'completed';
  }

  isAtCapacity(): boolean {
    return this.maxAttendees ? this.attendeesCount >= this.maxAttendees : false;
  }

  hasSpotsAvailable(): boolean {
    return !this.isAtCapacity();
  }

  getFormattedPrice(): string {
    if (this.isFree) {
      return 'Free';
    }
    
    if (!this.price) {
      return 'Price not set';
    }

    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(Number(this.price));
  }

  getEventDateTime(): Date {
    const dateStr = this.eventDate.toISOString().split('T')[0];
    return new Date(`${dateStr}T${this.startTime}`);
  }

  getEndDateTime(): Date | null {
    if (!this.endTime) {
      return null;
    }
    const dateStr = this.eventDate.toISOString().split('T')[0];
    return new Date(`${dateStr}T${this.endTime}`);
  }

  getDuration(): number | null {
    const start = this.getEventDateTime();
    const end = this.getEndDateTime();
    
    if (!end) {
      return null;
    }
    
    return end.getTime() - start.getTime();
  }

  getDurationString(): string {
    const duration = this.getDuration();
    if (!duration) {
      return 'Duration not specified';
    }
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  }

  isUpcoming(): boolean {
    return this.getEventDateTime() > new Date();
  }

  isPast(): boolean {
    const endTime = this.getEndDateTime() || this.getEventDateTime();
    return endTime < new Date();
  }

  isToday(): boolean {
    const today = new Date();
    const eventDate = new Date(this.eventDate);
    return (
      today.getFullYear() === eventDate.getFullYear() &&
      today.getMonth() === eventDate.getMonth() &&
      today.getDate() === eventDate.getDate()
    );
  }

  getLocationString(): string {
    const parts = [this.locationName, this.locationAddress].filter(Boolean);
    return parts.join(', ');
  }

  getFullLocationString(): string {
    const parts = [
      this.locationName,
      this.locationAddress,
      this.landmark,
    ].filter(Boolean);
    return parts.join(', ');
  }
}
