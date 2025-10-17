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
import { State } from './state.entity';
import { Neighborhood } from './neighborhood.entity';
import { Ward } from './ward.entity';
import { LGAType } from './state.entity';

@Entity('local_government_areas')
@Index(['stateId'])
@Index(['type'])
@Index(['name'])
export class LocalGovernmentArea {
  @ApiProperty({ description: 'Unique identifier for the LGA' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'LGA name', example: 'Ikeja' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: 'LGA code', example: 'IKE' })
  @Column({ length: 10 })
  code: string;

  @ApiProperty({ description: 'State ID this LGA belongs to' })
  @Column({ name: 'state_id' })
  stateId: string;

  @ApiProperty({ 
    description: 'LGA type', 
    enum: LGAType,
    example: LGAType.LGA 
  })
  @Column({ 
    type: 'enum', 
    enum: LGAType, 
    default: LGAType.LGA 
  })
  type: LGAType;

  @ApiProperty({ description: 'LGA creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'LGA update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => State, (state) => state.localGovernmentAreas)
  @JoinColumn({ name: 'state_id' })
  state: State;

  @OneToMany(() => Ward, (ward) => ward.lga)
  wards: Ward[];

  @OneToMany(() => Neighborhood, (neighborhood) => neighborhood.lga)
  neighborhoods: Neighborhood[];
}
