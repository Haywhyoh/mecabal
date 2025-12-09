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
import { Neighborhood } from './neighborhood.entity';
import { Visitor } from './visitor.entity';
import { User } from './user.entity';

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AlertType {
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  EXPIRED_PASS = 'EXPIRED_PASS',
  REVOKED_PASS = 'REVOKED_PASS',
  BLACKLISTED_VISITOR = 'BLACKLISTED_VISITOR',
  UNUSUAL_ACTIVITY = 'UNUSUAL_ACTIVITY',
  MANUAL = 'MANUAL',
}

export enum AlertStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

@Entity('visitor_alerts')
@Index(['estateId'])
@Index(['visitorId'])
@Index(['severity'])
@Index(['status'])
@Index(['createdAt'])
export class VisitorAlert {
  @ApiProperty({ description: 'Unique identifier for the alert' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Estate (Neighborhood) ID' })
  @Column({ name: 'estate_id' })
  estateId: string;

  @ApiProperty({ description: 'Visitor ID (if related to a visitor)', required: false })
  @Column({ name: 'visitor_id', nullable: true })
  visitorId?: string;

  @ApiProperty({ description: 'Visitor Pass ID (if related to a pass)', required: false })
  @Column({ name: 'visitor_pass_id', nullable: true })
  visitorPassId?: string;

  @ApiProperty({
    description: 'Alert type',
    enum: AlertType,
    example: AlertType.UNAUTHORIZED_ACCESS,
  })
  @Column({
    type: 'enum',
    enum: AlertType,
  })
  type: AlertType;

  @ApiProperty({
    description: 'Alert severity',
    enum: AlertSeverity,
    example: AlertSeverity.HIGH,
  })
  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.MEDIUM,
  })
  severity: AlertSeverity;

  @ApiProperty({
    description: 'Alert status',
    enum: AlertStatus,
    example: AlertStatus.OPEN,
  })
  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.OPEN,
  })
  status: AlertStatus;

  @ApiProperty({ description: 'Alert title' })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({ description: 'Alert description' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ description: 'Location where alert occurred', required: false })
  @Column({ length: 200, nullable: true })
  location?: string;

  @ApiProperty({ description: 'Gate where alert occurred', required: false })
  @Column({ name: 'gate_name', length: 100, nullable: true })
  gateName?: string;

  @ApiProperty({ description: 'QR code that triggered alert', required: false })
  @Column({ name: 'qr_code', length: 500, nullable: true })
  qrCode?: string;

  @ApiProperty({ description: 'IP address of the request', required: false })
  @Column({ name: 'ip_address', length: 50, nullable: true })
  ipAddress?: string;

  @ApiProperty({ description: 'User agent of the request', required: false })
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @ApiProperty({ description: 'User ID who created/resolved the alert', required: false })
  @Column({ name: 'resolved_by', nullable: true })
  resolvedBy?: string;

  @ApiProperty({ description: 'Resolution notes', required: false })
  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes?: string;

  @ApiProperty({ description: 'Alert creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty({ description: 'Resolution timestamp', required: false })
  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  // Relations
  @ManyToOne(() => Neighborhood, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'estate_id' })
  estate: Neighborhood;

  @ManyToOne(() => Visitor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'visitor_id' })
  visitor?: Visitor;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolved_by' })
  resolver?: User;
}













