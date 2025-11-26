import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Neighborhood } from './neighborhood.entity';
import { VisitorPass } from './visitor-pass.entity';

@Entity('visitors')
@Index(['estateId'])
@Index(['phoneNumber'])
@Index(['email'])
export class Visitor {
  @ApiProperty({ description: 'Unique identifier for the visitor' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Visitor full name', example: 'John Doe' })
  @Column({ name: 'full_name', length: 200 })
  fullName: string;

  @ApiProperty({ description: 'Visitor phone number', example: '+2348123456789' })
  @Column({ name: 'phone_number', length: 20, nullable: true })
  phoneNumber?: string;

  @ApiProperty({ description: 'Visitor email address', required: false })
  @Column({ nullable: true })
  email?: string;

  @ApiProperty({ description: 'Visitor photo URL', required: false })
  @Column({ name: 'photo_url', nullable: true })
  photoUrl?: string;

  @ApiProperty({ description: 'Vehicle registration number', required: false })
  @Column({ name: 'vehicle_registration', length: 50, nullable: true })
  vehicleRegistration?: string;

  @ApiProperty({ description: 'Vehicle make/model', required: false })
  @Column({ name: 'vehicle_make', length: 100, nullable: true })
  vehicleMake?: string;

  @ApiProperty({ description: 'Vehicle color', required: false })
  @Column({ name: 'vehicle_color', length: 50, nullable: true })
  vehicleColor?: string;

  @ApiProperty({ description: 'ID card number', required: false })
  @Column({ name: 'id_card_number', length: 50, nullable: true })
  idCardNumber?: string;

  @ApiProperty({ description: 'ID card type', required: false })
  @Column({ name: 'id_card_type', length: 50, nullable: true })
  idCardType?: string;

  @ApiProperty({ description: 'Company/Organization name', required: false })
  @Column({ name: 'company_name', length: 200, nullable: true })
  companyName?: string;

  @ApiProperty({ description: 'Purpose of visit', required: false })
  @Column({ type: 'text', nullable: true })
  purpose?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ApiProperty({ description: 'Estate (Neighborhood) ID this visitor is associated with' })
  @Column({ name: 'estate_id' })
  estateId: string;

  @ApiProperty({ description: 'Whether visitor is blacklisted', default: false })
  @Column({ name: 'is_blacklisted', default: false })
  isBlacklisted: boolean;

  @ApiProperty({ description: 'Blacklist reason', required: false })
  @Column({ name: 'blacklist_reason', type: 'text', nullable: true })
  blacklistReason?: string;

  @ApiProperty({ description: 'Visitor creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Neighborhood, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'estate_id' })
  estate: Neighborhood;

  @OneToMany(() => VisitorPass, (pass) => pass.visitor)
  passes: VisitorPass[];
}

