import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GamificationBadge } from './gamification-badge.entity';

export enum BadgeType {
  VERIFIED = 'verified',
  CONTRIBUTION = 'contribution',
  LEADERSHIP = 'leadership',
  SAFETY = 'safety',
  SOCIAL = 'social',
  BUSINESS = 'business',
}

@Entity('badges')
@Index(['type', 'isActive'])
export class Badge {
  @ApiProperty({ description: 'Badge ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Badge name' })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({ description: 'Badge description' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ description: 'Icon name' })
  @Column({ length: 100 })
  icon: string;

  @ApiProperty({ description: 'Color hex code' })
  @Column({ length: 50 })
  color: string;

  @ApiProperty({ description: 'Badge type', enum: BadgeType })
  @Column({ type: 'varchar', length: 50 })
  type: BadgeType;

  @ApiProperty({ description: 'Requirements text' })
  @Column({ name: 'requirements_text', type: 'text' })
  requirementsText: string;

  @ApiProperty({ description: 'Requirements configuration' })
  @Column({ name: 'requirements_config', type: 'jsonb', nullable: true })
  requirementsConfig?: any;

  @ApiProperty({ description: 'Is active' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => GamificationBadge, (gb) => gb.badge)
  gamificationBadges: GamificationBadge[];
}
