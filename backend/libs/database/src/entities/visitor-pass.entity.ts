import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Visitor } from './visitor.entity';
import { User } from './user.entity';
import { Neighborhood } from './neighborhood.entity';

export enum VisitorPassStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export enum SendMethod {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  QR = 'QR',
}

@Entity('visitor_passes')
@Index(['visitorId'])
@Index(['hostId'])
@Index(['estateId'])
@Index(['status'])
@Index(['qrCode'])
@Index(['accessCode'])
@Index(['expiresAt'])
export class VisitorPass {
  @ApiProperty({ description: 'Unique identifier for the visitor pass' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Visitor ID' })
  @Column({ name: 'visitor_id' })
  visitorId: string;

  @ApiProperty({ description: 'Host (User) ID who invited the visitor' })
  @Column({ name: 'host_id' })
  hostId: string;

  @ApiProperty({ description: 'Estate (Neighborhood) ID' })
  @Column({ name: 'estate_id' })
  estateId: string;

  @ApiProperty({ description: 'QR code token for entry validation' })
  @Column({ name: 'qr_code', unique: true })
  qrCode: string;

  @ApiProperty({ description: 'Encrypted QR payload', required: false })
  @Column({ name: 'qr_payload', type: 'text', nullable: true })
  qrPayload?: string;

  @ApiProperty({
    description: 'Pass status',
    enum: VisitorPassStatus,
    example: VisitorPassStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: VisitorPassStatus,
    default: VisitorPassStatus.PENDING,
  })
  status: VisitorPassStatus;

  @ApiProperty({ description: 'Expected arrival date and time' })
  @Column({ name: 'expected_arrival', type: 'timestamp' })
  expectedArrival: Date;

  @ApiProperty({ description: 'Pass expiration date and time' })
  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @ApiProperty({ description: 'Actual check-in time', required: false })
  @Column({ name: 'checked_in_at', type: 'timestamp', nullable: true })
  checkedInAt?: Date;

  @ApiProperty({ description: 'Actual check-out time', required: false })
  @Column({ name: 'checked_out_at', type: 'timestamp', nullable: true })
  checkedOutAt?: Date;

  @ApiProperty({ description: 'Gate entry point', required: false })
  @Column({ name: 'entry_gate', length: 100, nullable: true })
  entryGate?: string;

  @ApiProperty({ description: 'Gate exit point', required: false })
  @Column({ name: 'exit_gate', length: 100, nullable: true })
  exitGate?: string;

  @ApiProperty({ description: 'Number of guests accompanying visitor', default: 0 })
  @Column({ name: 'guest_count', default: 0 })
  guestCount: number;

  @ApiProperty({ description: 'Purpose of visit', required: false })
  @Column({ type: 'text', nullable: true })
  purpose?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ApiProperty({ description: '4-digit access code for visitor', required: false })
  @Column({ name: 'access_code', length: 4, nullable: true })
  accessCode?: string;

  @ApiProperty({
    description: 'Method used to send the pass',
    enum: SendMethod,
    required: false,
  })
  @Column({
    name: 'send_method',
    type: 'enum',
    enum: SendMethod,
    nullable: true,
  })
  sendMethod?: SendMethod;

  @ApiProperty({ description: 'Pass creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Visitor, (visitor) => visitor.passes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'visitor_id' })
  visitor: Visitor;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'host_id' })
  host: User;

  @ManyToOne(() => Neighborhood, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'estate_id' })
  estate: Neighborhood;
}





