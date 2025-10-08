import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
  Relation,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Event } from './event.entity';
import { User } from './user.entity';

@Entity('event_attendees')
@Unique(['eventId', 'userId'])
@Index(['eventId'])
@Index(['userId'])
@Index(['rsvpStatus'])
@Index(['paymentStatus'])
export class EventAttendee {
  @ApiProperty({ description: 'Unique identifier for the event attendee' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Event ID' })
  @Column({ name: 'event_id' })
  eventId: string;

  @ApiProperty({ description: 'User ID of the attendee' })
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({
    description: 'RSVP status',
    enum: ['going', 'maybe', 'not_going'],
    example: 'going',
  })
  @Column({ name: 'rsvp_status', length: 20 })
  rsvpStatus: 'going' | 'maybe' | 'not_going';

  @ApiProperty({
    description: 'Number of guests the user is bringing',
    default: 0,
  })
  @Column({ name: 'guests_count', default: 0 })
  guestsCount: number;

  @ApiProperty({
    description: 'Payment status',
    enum: ['pending', 'completed', 'failed', 'refunded'],
    required: false,
  })
  @Column({ name: 'payment_status', length: 20, nullable: true })
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';

  @ApiProperty({
    description: 'Payment reference from payment provider',
    example: 'PAY_123456789',
    maxLength: 100,
    required: false,
  })
  @Column({ name: 'payment_reference', length: 100, nullable: true })
  paymentReference?: string;

  @ApiProperty({
    description: 'Amount paid in Naira',
    example: 5000,
    required: false,
  })
  @Column({ name: 'amount_paid', type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountPaid?: number;

  @ApiProperty({
    description: 'Whether attendee has checked in',
    default: false,
  })
  @Column({ name: 'checked_in', default: false })
  checkedIn: boolean;

  @ApiProperty({
    description: 'Check-in timestamp',
    required: false,
  })
  @Column({ name: 'checked_in_at', type: 'timestamp', nullable: true })
  checkedInAt?: Date;

  @ApiProperty({ description: 'RSVP timestamp' })
  @CreateDateColumn({ name: 'rsvp_at' })
  rsvpAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne('Event', 'attendees', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: any;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;

  // Helper methods
  isGoing(): boolean {
    return this.rsvpStatus === 'going';
  }

  isMaybe(): boolean {
    return this.rsvpStatus === 'maybe';
  }

  isNotGoing(): boolean {
    return this.rsvpStatus === 'not_going';
  }

  isPaid(): boolean {
    return this.paymentStatus === 'completed';
  }

  isPaymentPending(): boolean {
    return this.paymentStatus === 'pending';
  }

  isPaymentFailed(): boolean {
    return this.paymentStatus === 'failed';
  }

  isRefunded(): boolean {
    return this.paymentStatus === 'refunded';
  }

  hasCheckedIn(): boolean {
    return this.checkedIn;
  }

  getTotalAttendees(): number {
    return 1 + this.guestsCount; // User + guests
  }

  getFormattedAmountPaid(): string {
    if (!this.amountPaid) {
      return 'No payment';
    }

    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(Number(this.amountPaid));
  }

  getRsvpStatusText(): string {
    switch (this.rsvpStatus) {
      case 'going':
        return 'Going';
      case 'maybe':
        return 'Maybe';
      case 'not_going':
        return 'Not Going';
      default:
        return 'Unknown';
    }
  }

  getPaymentStatusText(): string {
    switch (this.paymentStatus) {
      case 'pending':
        return 'Payment Pending';
      case 'completed':
        return 'Paid';
      case 'failed':
        return 'Payment Failed';
      case 'refunded':
        return 'Refunded';
      default:
        return 'No Payment Required';
    }
  }

  canCheckIn(): boolean {
    return this.isGoing() && !this.hasCheckedIn();
  }

  canCancel(): boolean {
    return this.isGoing() || this.isMaybe();
  }

  getCheckInTime(): string | null {
    if (!this.checkedInAt) {
      return null;
    }
    return this.checkedInAt.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
