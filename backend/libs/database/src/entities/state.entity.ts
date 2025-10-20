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
import { LocalGovernmentArea } from './local-government-area.entity';

export enum LGAType {
  LGA = 'LGA',
  LCDA = 'LCDA',
}

@Entity('states')
@Index(['code'], { unique: true })
@Index(['name'])
@Index(['region'])
export class State {
  @ApiProperty({ description: 'Unique identifier for the state' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'State name', example: 'Lagos' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: 'State code', example: 'LA' })
  @Column({ length: 10, unique: true })
  code: string;

  @ApiProperty({ description: 'Country name', example: 'Nigeria' })
  @Column({ length: 100, default: 'Nigeria' })
  country: string;

  @ApiProperty({ description: 'Geopolitical region', example: 'South West', required: false })
  @Column({ length: 50, nullable: true })
  region?: string;

  @ApiProperty({ description: 'State capital', example: 'Ikeja', required: false })
  @Column({ length: 100, nullable: true })
  capital?: string;

  @ApiProperty({ description: 'Population', required: false })
  @Column({ type: 'int', nullable: true })
  population?: number;

  @ApiProperty({ description: 'Area in square kilometers', required: false })
  @Column({ name: 'area_sqkm', type: 'decimal', precision: 10, scale: 2, nullable: true })
  areaSqKm?: number;

  @ApiProperty({ description: 'State creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'State update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => LocalGovernmentArea, (lga) => lga.state)
  localGovernmentAreas: LocalGovernmentArea[];
}
