import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('business_categories')
export class BusinessCategory {
  @PrimaryColumn({ length: 100 })
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100, nullable: true })
  icon: string;

  @Column({ length: 50, nullable: true })
  color: string;

  @Column({ type: 'jsonb' })
  subcategories: string[];

  @CreateDateColumn()
  createdAt: Date;
}
