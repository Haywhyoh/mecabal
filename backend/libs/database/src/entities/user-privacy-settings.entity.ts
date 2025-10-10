import {
  Entity,
  Column,
  PrimaryColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('user_privacy_settings')
export class UserPrivacySettings {
  @ApiProperty({ description: 'User ID' })
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Show state on profile' })
  @Column({ name: 'show_state_on_profile', type: 'boolean', default: true })
  showStateOnProfile: boolean;

  @ApiProperty({ description: 'Show languages on profile' })
  @Column({ name: 'show_languages_on_profile', type: 'boolean', default: true })
  showLanguagesOnProfile: boolean;

  @ApiProperty({ description: 'Show culture on profile' })
  @Column({ name: 'show_culture_on_profile', type: 'boolean', default: false })
  showCultureOnProfile: boolean;

  @ApiProperty({ description: 'Show profession on profile' })
  @Column({ name: 'show_profession_on_profile', type: 'boolean', default: true })
  showProfessionOnProfile: boolean;

  @ApiProperty({ description: 'Show location on profile' })
  @Column({ name: 'show_location_on_profile', type: 'boolean', default: true })
  showLocationOnProfile: boolean;

  @ApiProperty({ description: 'Show bio on profile' })
  @Column({ name: 'show_bio_on_profile', type: 'boolean', default: true })
  showBioOnProfile: boolean;

  @ApiProperty({ description: 'Show age on profile' })
  @Column({ name: 'show_age_on_profile', type: 'boolean', default: false })
  showAgeOnProfile: boolean;

  @ApiProperty({ description: 'Allow cultural matching' })
  @Column({ name: 'allow_cultural_matching', type: 'boolean', default: true })
  allowCulturalMatching: boolean;

  @ApiProperty({ description: 'Allow professional networking' })
  @Column({ name: 'allow_professional_networking', type: 'boolean', default: true })
  allowProfessionalNetworking: boolean;

  @ApiProperty({ description: 'Update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.privacySettings)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

