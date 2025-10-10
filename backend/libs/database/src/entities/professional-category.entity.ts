import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('professional_categories')
@Index(['displayOrder'])
export class ProfessionalCategory {
  @ApiProperty({ description: 'Category ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Category name' })
  @Column({ length: 100 })
  category: string;

  @ApiProperty({ description: 'Professional titles in this category' })
  @Column({ type: 'jsonb' })
  titles: string[];

  @ApiProperty({ description: 'Icon name' })
  @Column({ length: 100, nullable: true })
  icon?: string;

  @ApiProperty({ description: 'Display order' })
  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

