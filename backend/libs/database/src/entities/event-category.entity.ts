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
// import { Event } from './event.entity'; // Removed to avoid circular dependency

@Entity('event_categories')
@Index(['isActive'])
@Index(['displayOrder'])
export class EventCategory {
  @ApiProperty({ description: 'Unique identifier for the event category' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Category name',
    example: 'Religious Services',
    maxLength: 100,
  })
  @Column({ length: 100, unique: true })
  name: string;

  @ApiProperty({
    description: 'Icon identifier (Material Community Icons)',
    example: 'church',
    maxLength: 50,
  })
  @Column({ length: 50 })
  icon: string;

  @ApiProperty({
    description: 'Category color code (hex)',
    example: '#7B68EE',
    maxLength: 7,
  })
  @Column({ name: 'color_code', length: 7 })
  colorCode: string;

  @ApiProperty({
    description: 'Category description',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Whether category is active',
    default: true,
  })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Display order for sorting categories',
    default: 0,
  })
  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @ApiProperty({ description: 'Category creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany('Event', (event: any) => event.category)
  events: any[];
}
