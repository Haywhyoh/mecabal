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
import { Neighborhood } from './neighborhood.entity';

@Entity('wards')
@Index(['lgaId'])
@Index(['name'])
export class Ward {
  @ApiProperty({ description: 'Unique identifier for the ward' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Ward name', example: 'Ikeja Ward 1' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: 'Ward code', example: 'IKE01' })
  @Column({ length: 10 })
  code: string;

  @ApiProperty({ description: 'LGA ID this ward belongs to' })
  @Column({ name: 'lga_id' })
  lgaId: string;

  @ApiProperty({ 
    description: 'Ward boundaries as PostGIS Polygon',
    required: false 
  })
  @Column({ 
    type: 'geometry', 
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true 
  })
  boundaries?: any; // PostGIS Polygon

  @ApiProperty({ description: 'Ward creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Ward update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => LocalGovernmentArea, (lga) => lga.wards)
  @JoinColumn({ name: 'lga_id' })
  lga: LocalGovernmentArea;

  @OneToMany(() => Neighborhood, (neighborhood) => neighborhood.ward)
  neighborhoods: Neighborhood[];
}

