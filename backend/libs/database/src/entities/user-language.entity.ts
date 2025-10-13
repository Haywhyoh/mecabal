import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { NigerianLanguage } from './nigerian-language.entity';

export enum LanguageProficiency {
  NATIVE = 'native',
  FLUENT = 'fluent',
  INTERMEDIATE = 'intermediate',
  BASIC = 'basic',
}

@Entity('user_languages')
@Index(['userId', 'languageId'], { unique: true })
export class UserLanguage {
  @ApiProperty({ description: 'User ID' })
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Language ID' })
  @PrimaryColumn({ name: 'language_id', type: 'varchar', length: 50 })
  languageId: string;

  @ApiProperty({ description: 'Language proficiency', enum: LanguageProficiency })
  @Column({ type: 'varchar', length: 20, nullable: true })
  proficiency?: LanguageProficiency;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.userLanguages)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => NigerianLanguage)
  @JoinColumn({ name: 'language_id' })
  language: NigerianLanguage;
}


