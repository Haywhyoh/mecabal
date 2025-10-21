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

export enum LandmarkType {
  MARKET = 'MARKET',
  SCHOOL = 'SCHOOL',
  HOSPITAL = 'HOSPITAL',
  MOSQUE = 'MOSQUE',
  CHURCH = 'CHURCH',
  PARK = 'PARK',
  GATE = 'GATE',
  OTHER = 'OTHER',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

@Entity('landmarks')
@Index(['neighborhoodId'])
@Index(['type'])
@Index(['verificationStatus'])
@Index(['location'])
export class Landmark {
  @ApiProperty({ description: 'Unique identifier for the landmark' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Landmark name', example: 'Ikeja City Mall' })
  @Column({ length: 200 })
  name: string;

  @ApiProperty({ 
    description: 'Landmark type', 
    enum: LandmarkType,
    example: LandmarkType.MARKET 
  })
  @Column({ 
    type: 'enum', 
    enum: LandmarkType, 
    default: LandmarkType.OTHER 
  })
  type: LandmarkType;

  @ApiProperty({ description: 'Neighborhood ID this landmark belongs to' })
  @Column({ name: 'neighborhood_id' })
  neighborhoodId: string;

  @ApiProperty({ 
    description: 'Landmark location as PostGIS Point',
    required: false 
  })
  @Column({ 
    type: 'geometry', 
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true 
  })
  location?: any; // PostGIS Point

  @ApiProperty({ 
    description: 'Landmark address',
    required: false 
  })
  @Column({ type: 'text', nullable: true })
  address?: string;

  @ApiProperty({ 
    description: 'Landmark description',
    required: false 
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ 
    description: 'User ID who created this landmark',
    required: false 
  })
  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @ApiProperty({
    description: 'Verification status',
    enum: VerificationStatus,
    example: VerificationStatus.PENDING
  })
  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING
  })
  verificationStatus: VerificationStatus;

  @ApiProperty({ description: 'Landmark creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Landmark update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Neighborhood, (neighborhood) => neighborhood.landmarks)
  @JoinColumn({ name: 'neighborhood_id' })
  neighborhood: Neighborhood;
}


