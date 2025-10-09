import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { BusinessProfile } from './business-profile.entity';

@Entity('business_services')
export class BusinessService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => BusinessProfile, (business) => business.services, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: BusinessProfile;

  @Column({ length: 255 })
  serviceName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceMin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceMax: number;

  @Column({ length: 50, nullable: true })
  duration: string; // '30-mins', '1-hour', '2-hours', 'half-day', 'full-day'

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
