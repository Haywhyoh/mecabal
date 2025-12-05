import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { BusinessProfile } from './business-profile.entity';
import { BusinessService } from './business-service.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

@Entity('bookings')
@Index(['userId', 'status'])
@Index(['businessId', 'status'])
@Index(['scheduledDate'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => BusinessProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: BusinessProfile;

  @Column({ type: 'uuid', nullable: true })
  serviceId: string;

  @ManyToOne(() => BusinessService, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'serviceId' })
  service: BusinessService;

  @Column({ length: 255 })
  serviceName: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ type: 'date', nullable: true })
  scheduledDate: Date;

  @Column({ type: 'time', nullable: true })
  scheduledTime: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'uuid', nullable: true })
  paymentId: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ type: 'boolean', default: false })
  canReview: boolean;

  @Column({ type: 'boolean', default: false })
  hasReviewed: boolean;

  @Column({ type: 'uuid', nullable: true })
  reviewId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



