import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('nigerian_states')
@Index(['region'])
export class NigerianState {
  @ApiProperty({ description: 'State ID (lowercase slug)' })
  @PrimaryColumn({ length: 50 })
  id: string;

  @ApiProperty({ description: 'State name' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: 'Geopolitical region' })
  @Column({ length: 50 })
  region: string;

  @ApiProperty({ description: 'State capital' })
  @Column({ length: 100 })
  capital: string;

  @ApiProperty({ description: 'Local Government Areas' })
  @Column({ type: 'jsonb' })
  lgas: string[];

  @ApiProperty({ description: 'Population' })
  @Column({ type: 'int', nullable: true })
  population?: number;

  @ApiProperty({ description: 'Area in square kilometers' })
  @Column({ name: 'area_sqkm', type: 'decimal', precision: 10, scale: 2, nullable: true })
  areaSqKm?: number;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

