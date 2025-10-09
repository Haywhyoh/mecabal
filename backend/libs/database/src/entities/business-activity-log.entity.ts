import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { BusinessProfile } from './business-profile.entity';

@Entity('business_activity_log')
@Index(['businessId', 'createdAt'])
export class BusinessActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => BusinessProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: BusinessProfile;

  @Column({ length: 50 })
  activityType: string; // 'job_completed', 'review_received', 'inquiry_received', 'profile_updated'

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
