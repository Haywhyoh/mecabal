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
import { User } from './user.entity';
import { State } from './state.entity';
import { LocalGovernmentArea } from './local-government-area.entity';
import { Ward } from './ward.entity';
import { Neighborhood } from './neighborhood.entity';

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
}

@Entity('user_locations')
@Index(['userId'])
@Index(['stateId'])
@Index(['lgaId'])
@Index(['wardId'])
@Index(['neighborhoodId'])
@Index(['isPrimary'])
@Index(['coordinates'])
export class UserLocation {
  @ApiProperty({ description: 'Unique identifier for the user location' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({ description: 'State ID' })
  @Column({ name: 'state_id' })
  stateId: string;

  @ApiProperty({ description: 'LGA ID' })
  @Column({ name: 'lga_id' })
  lgaId: string;

  @ApiProperty({ 
    description: 'Ward ID',
    required: false 
  })
  @Column({ name: 'ward_id', nullable: true })
  wardId?: string;

  @ApiProperty({ description: 'Neighborhood ID' })
  @Column({ name: 'neighborhood_id' })
  neighborhoodId: string;

  @ApiProperty({ 
    description: 'City or town name',
    required: false 
  })
  @Column({ name: 'city_town', length: 100, nullable: true })
  cityTown?: string;

  @ApiProperty({ 
    description: 'Full address',
    required: false 
  })
  @Column({ type: 'text', nullable: true })
  address?: string;

  @ApiProperty({ 
    description: 'User coordinates as PostGIS Point',
    required: false 
  })
  @Column({ 
    type: 'geometry', 
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true 
  })
  coordinates?: any; // PostGIS Point

  @ApiProperty({ description: 'Whether this is the primary location' })
  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @ApiProperty({ 
    description: 'Location verification status', 
    enum: VerificationStatus,
    example: VerificationStatus.UNVERIFIED 
  })
  @Column({ 
    type: 'enum', 
    enum: VerificationStatus, 
    default: VerificationStatus.UNVERIFIED 
  })
  verificationStatus: VerificationStatus;

  @ApiProperty({ description: 'Location creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Location update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => State)
  @JoinColumn({ name: 'state_id' })
  state: State;

  @ManyToOne(() => LocalGovernmentArea)
  @JoinColumn({ name: 'lga_id' })
  lga: LocalGovernmentArea;

  @ManyToOne(() => Ward)
  @JoinColumn({ name: 'ward_id' })
  ward?: Ward;

  @ManyToOne(() => Neighborhood)
  @JoinColumn({ name: 'neighborhood_id' })
  neighborhood: Neighborhood;
}


