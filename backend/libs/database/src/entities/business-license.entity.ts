import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { BusinessProfile } from './business-profile.entity';

@Entity('business_licenses')
export class BusinessLicense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => BusinessProfile, (business) => business.licenses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: BusinessProfile;

  @Column({ length: 100 })
  licenseType: string; // 'CAC', 'TIN', 'NAFDAC', 'FIRS', 'SCUML', etc.

  @Column({ length: 100 })
  licenseNumber: string;

  @Column({ length: 255 })
  issuingAuthority: string;

  @Column({ type: 'date', nullable: true })
  issueDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ length: 500, nullable: true })
  documentUrl: string;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
