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
