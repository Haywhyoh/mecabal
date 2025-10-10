import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cultural_backgrounds')
@Index(['region'])
export class CulturalBackground {
  @ApiProperty({ description: 'Culture ID (lowercase slug)' })
  @PrimaryColumn({ length: 50 })
  id: string;

  @ApiProperty({ description: 'Culture name' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: 'Primary region' })
  @Column({ length: 50, nullable: true })
  region?: string;

  @ApiProperty({ description: 'Cultural description' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Cultural traditions' })
  @Column({ type: 'jsonb', nullable: true })
  traditions?: any;

  @ApiProperty({ description: 'Population estimate' })
  @Column({ name: 'population_estimate', type: 'int', nullable: true })
  populationEstimate?: number;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

