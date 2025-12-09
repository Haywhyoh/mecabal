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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from './user.entity';

export enum ConnectionType {
  CONNECT = 'connect',
  FOLLOW = 'follow',
  TRUSTED = 'trusted',
  NEIGHBOR = 'neighbor',
  COLLEAGUE = 'colleague',
  FAMILY = 'family',
}

export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  BLOCKED = 'blocked',
}

@Entity('connections')
@Index(['fromUserId', 'toUserId'], { unique: true })
@Index(['fromUserId', 'status'])
@Index(['toUserId', 'status'])
@Index(['connectionType'])
export class Connection {
  @ApiProperty({ description: 'Unique identifier for the connection' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User who initiated the connection' })
  @Column({ name: 'from_user_id', type: 'uuid' })
  fromUserId: string;

  @ApiProperty({ description: 'User receiving the connection' })
  @Column({ name: 'to_user_id', type: 'uuid' })
  toUserId: string;

  @ApiProperty({
    description: 'Type of connection',
    enum: ConnectionType,
    example: ConnectionType.CONNECT,
  })
  @Column({
    name: 'connection_type',
    type: 'enum',
    enum: ConnectionType,
    default: ConnectionType.CONNECT,
  })
  connectionType: ConnectionType;

  @ApiProperty({
    description: 'Status of the connection',
    enum: ConnectionStatus,
    example: ConnectionStatus.PENDING,
  })
  @Column({
    name: 'status',
    type: 'enum',
    enum: ConnectionStatus,
    default: ConnectionStatus.PENDING,
  })
  status: ConnectionStatus;

  @ApiProperty({ description: 'User who initiated the connection request' })
  @Column({ name: 'initiated_by', type: 'uuid' })
  initiatedBy: string;

  @ApiProperty({ description: 'Connection creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Connection last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Connection acceptance timestamp' })
  @Column({ name: 'accepted_at', type: 'timestamp', nullable: true })
  acceptedAt?: Date;

  @ApiPropertyOptional({
    description: 'Additional metadata about the connection',
    example: {
      howTheyMet: 'Estate security meeting',
      sharedInterests: ['Estate Security', 'Emergency Response'],
      mutualConnections: 5,
      proximityLevel: 'same_building',
    },
  })
  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'from_user_id' })
  fromUser: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'to_user_id' })
  toUser: User;
}

