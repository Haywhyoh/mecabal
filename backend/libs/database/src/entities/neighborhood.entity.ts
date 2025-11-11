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
import { LocalGovernmentArea } from './local-government-area.entity';
import { Ward } from './ward.entity';
import { User } from './user.entity';
import { UserNeighborhood } from './user-neighborhood.entity';
import { Post } from './post.entity';
import { Landmark } from './landmark.entity';
// import { Listing } from './listing.entity'; // Removed to avoid circular dependency

export enum NeighborhoodType {
  AREA = 'AREA',
  ESTATE = 'ESTATE',
  COMMUNITY = 'COMMUNITY',
}

@Entity('neighborhoods')
@Index(['lgaId'])
@Index(['wardId'])
@Index(['parentNeighborhoodId'])
@Index(['type'])
@Index(['isGated'])
@Index(['name'])
export class Neighborhood {
  @ApiProperty({ description: 'Unique identifier for the neighborhood' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Neighborhood name', example: 'Victoria Island' })
  @Column({ length: 200 })
  name: string;

  @ApiProperty({
    description: 'Neighborhood type',
    enum: NeighborhoodType,
    example: NeighborhoodType.AREA
  })
  @Column({
    type: 'enum',
    enum: NeighborhoodType,
    default: NeighborhoodType.AREA
  })
  type: NeighborhoodType;

  @ApiProperty({ description: 'Local Government Area ID' })
  @Column({ name: 'lga_id' })
  lgaId: string;

  @ApiProperty({
    description: 'Ward ID this neighborhood belongs to',
    required: false
  })
  @Column({ name: 'ward_id', nullable: true })
  wardId?: string;

  @ApiProperty({
    description: 'Parent neighborhood ID for sub-neighborhoods',
    required: false
  })
  @Column({ name: 'parent_neighborhood_id', nullable: true })
  parentNeighborhoodId?: string;

  @ApiProperty({ description: 'Neighborhood description', required: false })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'GeoJSON boundary coordinates', required: false })
  @Column({ name: 'boundary_coordinates', type: 'jsonb', nullable: true })
  boundaryCoordinates?: any;

  @ApiProperty({ 
    description: 'Neighborhood boundaries as PostGIS Polygon',
    required: false 
  })
  @Column({ 
    type: 'geometry', 
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true 
  })
  boundaries?: any; // PostGIS Polygon

  @ApiProperty({ description: 'Center latitude', example: 6.4281 })
  @Column({ name: 'center_latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  centerLatitude?: number;

  @ApiProperty({ description: 'Center longitude', example: 3.4219 })
  @Column({
    name: 'center_longitude',
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true
  })
  centerLongitude?: number;

  @ApiProperty({ description: 'Radius in meters', example: 1000 })
  @Column({ name: 'radius_meters', default: 1000 })
  radiusMeters: number;

  @ApiProperty({ description: 'Whether this is a gated community' })
  @Column({ name: 'is_gated', default: false })
  isGated: boolean;

  @ApiProperty({ description: 'Whether verification is required to join' })
  @Column({ name: 'requires_verification', default: false })
  requiresVerification: boolean;

  @ApiProperty({ description: 'Whether neighborhood is verified' })
  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @ApiProperty({ 
    description: 'Admin user ID for estate management',
    required: false 
  })
  @Column({ name: 'admin_user_id', nullable: true })
  adminUserId?: string;

  @ApiProperty({ description: 'User ID who created this neighborhood' })
  @Column({ name: 'created_by' })
  createdBy: string;

  @ApiProperty({ description: 'Neighborhood creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => LocalGovernmentArea, (lga) => lga.neighborhoods)
  @JoinColumn({ name: 'lga_id' })
  lga: LocalGovernmentArea;

  @ManyToOne(() => Ward, (ward) => ward.neighborhoods)
  @JoinColumn({ name: 'ward_id' })
  ward?: Ward;

  @ManyToOne(() => Neighborhood, (neighborhood) => neighborhood.subNeighborhoods)
  @JoinColumn({ name: 'parent_neighborhood_id' })
  parentNeighborhood?: Neighborhood;

  @OneToMany(() => Neighborhood, (neighborhood) => neighborhood.parentNeighborhood)
  subNeighborhoods: Neighborhood[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(
    () => UserNeighborhood,
    (userNeighborhood) => userNeighborhood.neighborhood,
  )
  userNeighborhoods: UserNeighborhood[];

  @OneToMany(() => Post, (post) => post.neighborhood)
  posts: Post[];

  @OneToMany(() => Landmark, (landmark) => landmark.neighborhood)
  landmarks: Landmark[];

  // Helper methods
  getDistanceFromPoint(lat: number, lng: number): number {
    if (!this.centerLatitude || !this.centerLongitude) {
      return Infinity;
    }
    
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (this.centerLatitude * Math.PI) / 180;
    const φ2 = (lat * Math.PI) / 180;
    const Δφ = ((lat - this.centerLatitude) * Math.PI) / 180;
    const Δλ = ((lng - this.centerLongitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  isPointWithinRadius(lat: number, lng: number): boolean {
    return this.getDistanceFromPoint(lat, lng) <= this.radiusMeters;
  }
}
