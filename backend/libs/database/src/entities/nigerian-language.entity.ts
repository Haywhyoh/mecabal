import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('nigerian_languages')
@Index(['isMajor'])
export class NigerianLanguage {
  @ApiProperty({ description: 'Language ID (lowercase slug)' })
  @PrimaryColumn({ length: 50 })
  id: string;

  @ApiProperty({ description: 'Language name (English)' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: 'Native name' })
  @Column({ name: 'native_name', length: 100 })
  nativeName: string;

  @ApiProperty({ description: 'Common greeting' })
  @Column({ length: 100 })
  greeting: string;

  @ApiProperty({ description: 'Language description' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ description: 'Number of speakers' })
  @Column({ name: 'speakers_count', type: 'int', nullable: true })
  speakersCount?: number;

  @ApiProperty({ description: 'Regions where spoken' })
  @Column({ type: 'jsonb' })
  regions: string[];

  @ApiProperty({ description: 'Is major language' })
  @Column({ name: 'is_major', type: 'boolean', default: false })
  isMajor: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations - handled through UserLanguage junction entity
}
