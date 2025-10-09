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

export enum EndorsementType {
  NEIGHBOR = 'neighbor',
  PROFESSIONAL = 'professional',
  CHARACTER = 'character',
  SAFETY = 'safety',
}

@Entity('community_endorsements')
@Index(['endorseeUserId', 'isVerified'])
@Index(['endorseeUserId', 'endorserUserId', 'endorsementType'], { unique: true })
export class CommunityEndorsement {
  @ApiProperty({ description: 'Endorsement ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Endorsee user ID (being endorsed)' })
  @Column({ name: 'endorsee_user_id', type: 'uuid' })
  endorseeUserId: string;

  @ApiProperty({ description: 'Endorser user ID (giving endorsement)' })
  @Column({ name: 'endorser_user_id', type: 'uuid' })
  endorserUserId: string;

  @ApiProperty({ description: 'Endorsement type', enum: EndorsementType })
  @Column({ name: 'endorsement_type', type: 'varchar', length: 50 })
  endorsementType: EndorsementType;

  @ApiProperty({ description: 'Endorsement message' })
  @Column({ type: 'text', nullable: true })
  message?: string;

  @ApiProperty({ description: 'Rating (1-5)' })
  @Column({ type: 'int', nullable: true })
  rating?: number;

  @ApiProperty({ description: 'Is verified' })
  @Column({ name: 'is_verified', type: 'boolean', default: true })
  isVerified: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'endorsee_user_id' })
  endorsee: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'endorser_user_id' })
  endorser: User;
}
