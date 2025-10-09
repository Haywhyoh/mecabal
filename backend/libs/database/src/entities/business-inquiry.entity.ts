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
import { User } from './user.entity';

@Entity('business_inquiries')
@Index(['businessId', 'status'])
export class BusinessInquiry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => BusinessProfile, (business) => business.inquiries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: BusinessProfile;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 50 })
  inquiryType: string; // 'booking', 'question', 'quote'

  @Column({ type: 'text' })
  message: string;

  @Column({ length: 20, nullable: true })
  phoneNumber: string;

  @Column({ length: 20, nullable: true })
  preferredContact: string; // 'phone', 'whatsapp', 'in-app'

  @Column({ type: 'timestamp', nullable: true })
  preferredDate: Date;

  @Column({ length: 20, default: 'pending' })
  status: string; // 'pending', 'responded', 'closed'

  @Column({ type: 'text', nullable: true })
  response: string;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
