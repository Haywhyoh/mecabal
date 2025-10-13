import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BusinessProfile } from './business-profile.entity';
import { User } from './user.entity';

@Entity('service_inquiries')
@Index(['businessId', 'status'])
@Index(['customerId', 'status'])
export class ServiceInquiry {
  @ApiProperty({ description: 'Unique identifier for the inquiry' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Business ID' })
  @Column({ name: 'business_id' })
  businessId: string;

  @ApiProperty({ description: 'Customer ID' })
  @Column({ name: 'customer_id' })
  customerId: string;

  @ApiProperty({ description: 'Service type' })
  @Column({ name: 'service_type', length: 100 })
  serviceType: string;

  @ApiProperty({ description: 'Service description' })
  @Column({ name: 'description', type: 'text' })
  description: string;

  @ApiProperty({
    description: 'Urgency level',
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  })
  @Column({ name: 'urgency', length: 20, default: 'normal' })
  urgency: string;

  @ApiProperty({ description: 'Minimum budget', required: false })
  @Column({ name: 'budget_min', type: 'decimal', precision: 12, scale: 2, nullable: true })
  budgetMin?: number;

  @ApiProperty({ description: 'Maximum budget', required: false })
  @Column({ name: 'budget_max', type: 'decimal', precision: 12, scale: 2, nullable: true })
  budgetMax?: number;

  @ApiProperty({
    description: 'Preferred contact method',
    enum: ['call', 'message', 'whatsapp'],
  })
  @Column({ name: 'preferred_contact', length: 20 })
  preferredContact: string;

  @ApiProperty({
    description: 'Inquiry status',
    enum: ['pending', 'responded', 'completed', 'cancelled'],
    default: 'pending',
  })
  @Column({ name: 'status', length: 20, default: 'pending' })
  status: string;

  @ApiProperty({ description: 'Business response', required: false })
  @Column({ name: 'business_response', type: 'text', nullable: true })
  businessResponse?: string;

  @ApiProperty({ description: 'Response timestamp', required: false })
  @Column({ name: 'responded_at', type: 'timestamp', nullable: true })
  respondedAt?: Date;

  @ApiProperty({ description: 'Inquiry creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => BusinessProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: BusinessProfile;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;
}
