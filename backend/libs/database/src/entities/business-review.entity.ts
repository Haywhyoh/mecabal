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

@Entity('business_reviews')
@Index(['businessId', 'createdAt'])
export class BusinessReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => BusinessProfile, (business) => business.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: BusinessProfile;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int' })
  rating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  reviewText: string;

  @Column({ type: 'int', nullable: true })
  serviceQuality: number; // 1-5

  @Column({ type: 'int', nullable: true })
  professionalism: number; // 1-5

  @Column({ type: 'int', nullable: true })
  valueForMoney: number; // 1-5

  @Column({ type: 'text', nullable: true })
  response: string;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
