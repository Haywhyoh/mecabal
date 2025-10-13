import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { BusinessLicense } from './business-license.entity';
import { BusinessService } from './business-service.entity';
import { BusinessReview } from './business-review.entity';
import { BusinessInquiry } from './business-inquiry.entity';

@Entity('business_profiles')
@Index(['category', 'serviceArea', 'isActive'])
export class BusinessProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 255 })
  businessName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100 })
  category: string;

  @Column({ length: 100, nullable: true })
  subcategory: string;

  @Column({ length: 50 })
  serviceArea: string; // 'neighborhood', '2km', '5km', '10km', 'city-wide', 'state-wide', 'nationwide'

  @Column({ length: 50 })
  pricingModel: string; // 'fixed-rate', 'hourly', 'per-item', 'project-based', 'custom-quote'

  @Column({ length: 50 })
  availability: string; // 'business-hours', 'weekdays', '24/7', 'weekends', 'custom'

  @Column({ length: 20, nullable: true })
  phoneNumber: string;

  @Column({ length: 20, nullable: true })
  whatsappNumber: string;

  @Column({ type: 'text', nullable: true })
  businessAddress: string;

  // Geographic coordinates (regular decimal fields for now)
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ length: 100, nullable: true })
  state: string; // Nigerian state

  @Column({ length: 100, nullable: true })
  city: string; // City or LGA

  @Column({ type: 'int', default: 0 })
  yearsOfExperience: number;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ length: 20, default: 'basic' })
  verificationLevel: string; // 'basic', 'enhanced', 'premium'

  @Column({ length: 500, nullable: true })
  profileImageUrl: string;

  @Column({ length: 500, nullable: true })
  coverImageUrl: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'int', default: 0 })
  completedJobs: number;


  @Column({ type: 'boolean', default: false })
  hasInsurance: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  paymentMethods: string[]; // ['cash', 'bank-transfer', 'card', 'mobile-money', 'opay', 'crypto']

  @Column({ type: 'jsonb', nullable: true })
  businessHours: Record<string, { open: string; close: string }>;

  // Enhanced service offerings
  @Column({ name: 'services_offered', type: 'jsonb', nullable: true })
  servicesOffered?: {
    category: string;
    subcategory: string;
    description: string;
    pricing: {
      model: 'hourly' | 'project' | 'fixed' | 'negotiable';
      rate?: number;
    };
    availability: {
      days: string[];
      startTime: string;
      endTime: string;
    };
  }[];

  @Column({ name: 'service_areas', type: 'jsonb', nullable: true })
  serviceAreas?: {
    type: 'estate' | 'neighborhood' | 'city' | 'state';
    radius?: number;
    specificAreas?: string[];
  };

  @Column({ name: 'response_time', type: 'int', default: 24 })
  responseTime: number; // in hours

  @Column({ name: 'contact_preferences', type: 'jsonb', nullable: true })
  contactPreferences?: {
    allowCalls: boolean;
    allowMessages: boolean;
    allowWhatsApp: boolean;
    preferredTime: string;
  };

  @CreateDateColumn()
  joinedDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => BusinessLicense, (license) => license.business)
  licenses: BusinessLicense[];

  @OneToMany(() => BusinessService, (service) => service.business)
  services: BusinessService[];

  @OneToMany(() => BusinessReview, (review) => review.business)
  reviews: BusinessReview[];

  @OneToMany(() => BusinessInquiry, (inquiry) => inquiry.business)
  inquiries: BusinessInquiry[];
}
