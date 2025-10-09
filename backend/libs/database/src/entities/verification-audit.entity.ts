import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('verification_audit')
@Index(['userId', 'verificationType', 'createdAt'])
export class VerificationAudit {
  @ApiProperty({ description: 'Audit ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Verification type' })
  @Column({ name: 'verification_type', length: 50 })
  verificationType: string;

  @ApiProperty({ description: 'Action performed' })
  @Column({ length: 50 })
  action: string;

  @ApiProperty({ description: 'Status' })
  @Column({ length: 20 })
  status: string;

  @ApiProperty({ description: 'Previous value' })
  @Column({ name: 'previous_value', type: 'jsonb', nullable: true })
  previousValue?: any;

  @ApiProperty({ description: 'New value' })
  @Column({ name: 'new_value', type: 'jsonb', nullable: true })
  newValue?: any;

  @ApiProperty({ description: 'Metadata' })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @ApiProperty({ description: 'IP address' })
  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress?: string;

  @ApiProperty({ description: 'User agent' })
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @ApiProperty({ description: 'Performed by user ID' })
  @Column({ name: 'performed_by', type: 'uuid', nullable: true })
  performedBy?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
