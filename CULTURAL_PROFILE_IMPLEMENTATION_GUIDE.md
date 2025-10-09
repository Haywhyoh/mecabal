# Cultural Profile System Implementation Guide
**MeCabal - Gap 4 Implementation**
*Detailed Developer Tasks & Instructions*

---

## Table of Contents
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Reference Data Management](#reference-data-management)
4. [Cultural Profile Service](#cultural-profile-service)
5. [Privacy Settings](#privacy-settings)
6. [Cultural Matching](#cultural-matching)
7. [Nigerian Context Features](#nigerian-context-features)
8. [Testing Requirements](#testing-requirements)
9. [Deployment Checklist](#deployment-checklist)

---

## Overview

### Goals
- Implement cultural profile management for Nigerian users
- Create reference data for states, languages, cultures, and professions
- Add privacy controls for cultural information
- Enable cultural matching and recommendations
- Support multiple Nigerian languages

### Tech Stack
- NestJS framework
- TypeORM for database operations
- PostgreSQL database
- JSON storage for reference data

### Development Timeline
- **Sprint 6 (10 days):** Complete Cultural Profile System

---

## GAP 4: CULTURAL PROFILE SYSTEM

### Sprint 6: Cultural Profile Implementation (10 days)

---

## TASK 4.1: Database Schema for Cultural Data (Days 1-2)

### Objective
Create reference data tables and user privacy settings.

---

#### 4.1.1: Create Cultural Profile Migration

**Create migration file:**

```bash
cd backend
npm run migration:create -- AddCulturalProfileTables
```

**File:** `backend/libs/database/src/migrations/[timestamp]-AddCulturalProfileTables.ts`

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddCulturalProfileTables1234567890126 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create nigerian_states table
    await queryRunner.createTable(
      new Table({
        name: 'nigerian_states',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'region',
            type: 'varchar',
            length: '50',
            comment: 'North Central, North East, North West, South East, South South, South West',
          },
          {
            name: 'capital',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'lgas',
            type: 'jsonb',
            comment: 'Array of Local Government Areas',
          },
          {
            name: 'population',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'area_sqkm',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create nigerian_languages table
    await queryRunner.createTable(
      new Table({
        name: 'nigerian_languages',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'native_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'greeting',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'speakers_count',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'regions',
            type: 'jsonb',
            comment: 'Array of regions where spoken',
          },
          {
            name: 'is_major',
            type: 'boolean',
            default: false,
            comment: 'Is it a major language (Hausa, Yoruba, Igbo, English)',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create cultural_backgrounds table
    await queryRunner.createTable(
      new Table({
        name: 'cultural_backgrounds',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'region',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'traditions',
            type: 'jsonb',
            isNullable: true,
            comment: 'Cultural traditions and practices',
          },
          {
            name: 'population_estimate',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create professional_categories table
    await queryRunner.createTable(
      new Table({
        name: 'professional_categories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'titles',
            type: 'jsonb',
            comment: 'Array of professional titles in this category',
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'display_order',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create user_privacy_settings table
    await queryRunner.createTable(
      new Table({
        name: 'user_privacy_settings',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'show_state_on_profile',
            type: 'boolean',
            default: true,
          },
          {
            name: 'show_languages_on_profile',
            type: 'boolean',
            default: true,
          },
          {
            name: 'show_culture_on_profile',
            type: 'boolean',
            default: false,
          },
          {
            name: 'show_profession_on_profile',
            type: 'boolean',
            default: true,
          },
          {
            name: 'show_location_on_profile',
            type: 'boolean',
            default: true,
          },
          {
            name: 'show_bio_on_profile',
            type: 'boolean',
            default: true,
          },
          {
            name: 'show_age_on_profile',
            type: 'boolean',
            default: false,
          },
          {
            name: 'allow_cultural_matching',
            type: 'boolean',
            default: true,
          },
          {
            name: 'allow_professional_networking',
            type: 'boolean',
            default: true,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create user_languages table (many-to-many)
    await queryRunner.createTable(
      new Table({
        name: 'user_languages',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'language_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'proficiency',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'native, fluent, intermediate, basic',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['language_id'],
            referencedTableName: 'nigerian_languages',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'nigerian_states',
      new TableIndex({
        name: 'IDX_STATES_REGION',
        columnNames: ['region'],
      }),
    );

    await queryRunner.createIndex(
      'nigerian_languages',
      new TableIndex({
        name: 'IDX_LANGUAGES_MAJOR',
        columnNames: ['is_major'],
      }),
    );

    await queryRunner.createIndex(
      'cultural_backgrounds',
      new TableIndex({
        name: 'IDX_CULTURAL_REGION',
        columnNames: ['region'],
      }),
    );

    await queryRunner.createIndex(
      'professional_categories',
      new TableIndex({
        name: 'IDX_PROFESSIONAL_ORDER',
        columnNames: ['display_order'],
      }),
    );

    await queryRunner.createIndex(
      'user_languages',
      new TableIndex({
        name: 'IDX_USER_LANGUAGES_UNIQUE',
        columnNames: ['user_id', 'language_id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_languages');
    await queryRunner.dropTable('user_privacy_settings');
    await queryRunner.dropTable('professional_categories');
    await queryRunner.dropTable('cultural_backgrounds');
    await queryRunner.dropTable('nigerian_languages');
    await queryRunner.dropTable('nigerian_states');
  }
}
```

**Run migration:**
```bash
npm run migration:run
```

**Verification:**
- [ ] Migration runs successfully
- [ ] All 6 tables created
- [ ] Foreign keys working
- [ ] Indexes created

---

#### 4.1.2: Create Entity Classes

**File:** `backend/libs/database/src/entities/nigerian-state.entity.ts`

```typescript
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('nigerian_states')
@Index(['region'])
export class NigerianState {
  @ApiProperty({ description: 'State ID (lowercase slug)' })
  @PrimaryColumn({ length: 50 })
  id: string;

  @ApiProperty({ description: 'State name' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: 'Geopolitical region' })
  @Column({ length: 50 })
  region: string;

  @ApiProperty({ description: 'State capital' })
  @Column({ length: 100 })
  capital: string;

  @ApiProperty({ description: 'Local Government Areas' })
  @Column({ type: 'jsonb' })
  lgas: string[];

  @ApiProperty({ description: 'Population' })
  @Column({ type: 'int', nullable: true })
  population?: number;

  @ApiProperty({ description: 'Area in square kilometers' })
  @Column({ name: 'area_sqkm', type: 'decimal', precision: 10, scale: 2, nullable: true })
  areaSqKm?: number;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**File:** `backend/libs/database/src/entities/nigerian-language.entity.ts`

```typescript
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('nigerian_languages')
@Index(['isMajor'])
export class NigerianLanguage {
  @ApiProperty({ description: 'Language ID (lowercase slug)' })
  @PrimaryColumn({ length: 50 })
  id: string;

  @ApiProperty({ description: 'Language name (English)' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: 'Native name' })
  @Column({ name: 'native_name', length: 100 })
  nativeName: string;

  @ApiProperty({ description: 'Common greeting' })
  @Column({ length: 100 })
  greeting: string;

  @ApiProperty({ description: 'Language description' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ description: 'Number of speakers' })
  @Column({ name: 'speakers_count', type: 'int', nullable: true })
  speakersCount?: number;

  @ApiProperty({ description: 'Regions where spoken' })
  @Column({ type: 'jsonb' })
  regions: string[];

  @ApiProperty({ description: 'Is major language' })
  @Column({ name: 'is_major', type: 'boolean', default: false })
  isMajor: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToMany(() => User, (user) => user.languages)
  users: User[];
}
```

**File:** `backend/libs/database/src/entities/cultural-background.entity.ts`

```typescript
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cultural_backgrounds')
@Index(['region'])
export class CulturalBackground {
  @ApiProperty({ description: 'Culture ID (lowercase slug)' })
  @PrimaryColumn({ length: 50 })
  id: string;

  @ApiProperty({ description: 'Culture name' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: 'Primary region' })
  @Column({ length: 50, nullable: true })
  region?: string;

  @ApiProperty({ description: 'Cultural description' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Cultural traditions' })
  @Column({ type: 'jsonb', nullable: true })
  traditions?: any;

  @ApiProperty({ description: 'Population estimate' })
  @Column({ name: 'population_estimate', type: 'int', nullable: true })
  populationEstimate?: number;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**File:** `backend/libs/database/src/entities/professional-category.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('professional_categories')
@Index(['displayOrder'])
export class ProfessionalCategory {
  @ApiProperty({ description: 'Category ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Category name' })
  @Column({ length: 100 })
  category: string;

  @ApiProperty({ description: 'Professional titles in this category' })
  @Column({ type: 'jsonb' })
  titles: string[];

  @ApiProperty({ description: 'Icon name' })
  @Column({ length: 100, nullable: true })
  icon?: string;

  @ApiProperty({ description: 'Display order' })
  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**File:** `backend/libs/database/src/entities/user-privacy-settings.entity.ts`

```typescript
import {
  Entity,
  Column,
  PrimaryColumn,
  UpdateDateColumn,
  ManyToOne,
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
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
```

**File:** `backend/libs/database/src/entities/user-language.entity.ts`

```typescript
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
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => NigerianLanguage)
  @JoinColumn({ name: 'language_id' })
  language: NigerianLanguage;
}
```

**Update User Entity to include language relations:**

**File:** `backend/libs/database/src/entities/user.entity.ts`

Add to User entity:

```typescript
import { UserLanguage } from './user-language.entity';
import { UserPrivacySettings } from './user-privacy-settings.entity';
import { NigerianLanguage } from './nigerian-language.entity';

// Add to User class:
@OneToMany(() => UserLanguage, (ul) => ul.user)
userLanguages: UserLanguage[];

@ManyToMany(() => NigerianLanguage, (language) => language.users)
@JoinTable({
  name: 'user_languages',
  joinColumn: { name: 'user_id', referencedColumnName: 'id' },
  inverseJoinColumn: { name: 'language_id', referencedColumnName: 'id' },
})
languages: NigerianLanguage[];

@OneToOne(() => UserPrivacySettings, (settings) => settings.user)
privacySettings: UserPrivacySettings;
```

**Export all entities:**

**File:** `backend/libs/database/src/entities/index.ts`

```typescript
export * from './nigerian-state.entity';
export * from './nigerian-language.entity';
export * from './cultural-background.entity';
export * from './professional-category.entity';
export * from './user-privacy-settings.entity';
export * from './user-language.entity';
// ... other exports
```

**Verification:**
- [ ] All entities compile without errors
- [ ] Relations are properly defined
- [ ] Entities are exported

---

## TASK 4.2: Seed Reference Data (Day 3)

### Create Comprehensive Seed Data

**File:** `backend/libs/database/src/seeds/cultural-data.seed.ts`

```typescript
import {
  NigerianState,
  NigerianLanguage,
  CulturalBackground,
  ProfessionalCategory,
} from '../entities';

export const NIGERIAN_STATES_SEED: Partial<NigerianState>[] = [
  {
    id: 'lagos',
    name: 'Lagos',
    region: 'South West',
    capital: 'Ikeja',
    lgas: [
      'Ikeja', 'Surulere', 'Alimosho', 'Lagos Island', 'Lagos Mainland',
      'Eti-Osa', 'Ikorodu', 'Epe', 'Badagry', 'Ibeju-Lekki',
      // ... all 20 LGAs
    ],
    population: 14862000,
    areaSqKm: 3577,
  },
  {
    id: 'kano',
    name: 'Kano',
    region: 'North West',
    capital: 'Kano',
    lgas: [
      'Kano Municipal', 'Dala', 'Gwale', 'Fagge', 'Nassarawa',
      // ... all LGAs
    ],
    population: 13076892,
    areaSqKm: 20131,
  },
  // Add all 36 states + FCT
];

export const NIGERIAN_LANGUAGES_SEED: Partial<NigerianLanguage>[] = [
  {
    id: 'english',
    name: 'English',
    nativeName: 'English',
    greeting: 'Hello',
    description: 'Official language of Nigeria',
    speakersCount: 180000000,
    regions: ['All regions'],
    isMajor: true,
  },
  {
    id: 'hausa',
    name: 'Hausa',
    nativeName: 'Hausa',
    greeting: 'Sannu',
    description: 'Widely spoken in Northern Nigeria',
    speakersCount: 80000000,
    regions: ['North West', 'North East', 'North Central'],
    isMajor: true,
  },
  {
    id: 'yoruba',
    name: 'Yoruba',
    nativeName: 'Yorùbá',
    greeting: 'Ẹ káàsán',
    description: 'Spoken in South Western Nigeria',
    speakersCount: 45000000,
    regions: ['South West'],
    isMajor: true,
  },
  {
    id: 'igbo',
    name: 'Igbo',
    nativeName: 'Igbo',
    greeting: 'Nnọọ',
    description: 'Spoken in South Eastern Nigeria',
    speakersCount: 30000000,
    regions: ['South East'],
    isMajor: true,
  },
  {
    id: 'pidgin',
    name: 'Nigerian Pidgin',
    nativeName: 'Naija',
    greeting: 'How far?',
    description: 'Widely spoken informal language across Nigeria',
    speakersCount: 100000000,
    regions: ['All regions'],
    isMajor: false,
  },
  // Add more languages: Fulfulde, Kanuri, Ibibio, Tiv, Ijaw, Edo, etc.
];

export const CULTURAL_BACKGROUNDS_SEED: Partial<CulturalBackground>[] = [
  {
    id: 'yoruba',
    name: 'Yoruba',
    region: 'South West',
    description: 'One of the largest ethnic groups in West Africa',
    traditions: {
      festivals: ['Olojo Festival', 'Eyo Festival', 'Osun-Osogbo'],
      cuisine: ['Amala', 'Ewedu', 'Egusi', 'Jollof Rice'],
      music: ['Juju', 'Fuji', 'Afrobeat'],
    },
    populationEstimate: 45000000,
  },
  {
    id: 'igbo',
    name: 'Igbo',
    region: 'South East',
    description: 'Indigenous people of southeastern Nigeria',
    traditions: {
      festivals: ['New Yam Festival', 'Iwa Akwa', 'Mmanwu Festival'],
      cuisine: ['Abacha', 'Ofe Nsala', 'Nkwobi'],
      music: ['Highlife', 'Igbo Traditional'],
    },
    populationEstimate: 40000000,
  },
  {
    id: 'hausa',
    name: 'Hausa',
    region: 'North West',
    description: 'Largest ethnic group in West Africa',
    traditions: {
      festivals: ['Durbar', 'Sallah'],
      cuisine: ['Suya', 'Tuwo Shinkafa', 'Miyan Kuka'],
      music: ['Hausa traditional music'],
    },
    populationEstimate: 80000000,
  },
  // Add more: Fulani, Ijaw, Kanuri, Ibibio, Tiv, Edo, Nupe, etc.
];

export const PROFESSIONAL_CATEGORIES_SEED: Partial<ProfessionalCategory>[] = [
  {
    category: 'Technology & Engineering',
    titles: [
      'Software Engineer',
      'Data Scientist',
      'Network Engineer',
      'IT Support Specialist',
      'Web Developer',
      'Mobile Developer',
      'DevOps Engineer',
      'Cybersecurity Specialist',
      'Product Manager',
      'UI/UX Designer',
    ],
    icon: 'laptop-code',
    displayOrder: 1,
  },
  {
    category: 'Healthcare',
    titles: [
      'Medical Doctor',
      'Nurse',
      'Pharmacist',
      'Dentist',
      'Physiotherapist',
      'Lab Technician',
      'Radiographer',
      'Optometrist',
      'Health Administrator',
    ],
    icon: 'hospital',
    displayOrder: 2,
  },
  {
    category: 'Education',
    titles: [
      'Teacher',
      'Lecturer',
      'Principal',
      'Education Administrator',
      'Tutor',
      'Librarian',
      'Educational Consultant',
      'Curriculum Developer',
    ],
    icon: 'graduation-cap',
    displayOrder: 3,
  },
  // Add more: Business & Finance, Legal, Creative Arts, Trades & Services, etc.
];
```

**Create seed command:**

**File:** `backend/libs/database/src/seeds/index.ts`

```typescript
import { DataSource } from 'typeorm';
import {
  NIGERIAN_STATES_SEED,
  NIGERIAN_LANGUAGES_SEED,
  CULTURAL_BACKGROUNDS_SEED,
  PROFESSIONAL_CATEGORIES_SEED,
} from './cultural-data.seed';

export async function seedCulturalData(dataSource: DataSource) {
  console.log('🌱 Seeding cultural data...');

  // Seed states
  const statesRepo = dataSource.getRepository('NigerianState');
  for (const state of NIGERIAN_STATES_SEED) {
    await statesRepo.upsert(state, ['id']);
  }
  console.log(`✅ Seeded ${NIGERIAN_STATES_SEED.length} states`);

  // Seed languages
  const languagesRepo = dataSource.getRepository('NigerianLanguage');
  for (const language of NIGERIAN_LANGUAGES_SEED) {
    await languagesRepo.upsert(language, ['id']);
  }
  console.log(`✅ Seeded ${NIGERIAN_LANGUAGES_SEED.length} languages`);

  // Seed cultural backgrounds
  const culturesRepo = dataSource.getRepository('CulturalBackground');
  for (const culture of CULTURAL_BACKGROUNDS_SEED) {
    await culturesRepo.upsert(culture, ['id']);
  }
  console.log(`✅ Seeded ${CULTURAL_BACKGROUNDS_SEED.length} cultural backgrounds`);

  // Seed professional categories
  const professionsRepo = dataSource.getRepository('ProfessionalCategory');
  for (const profession of PROFESSIONAL_CATEGORIES_SEED) {
    await professionsRepo.save(profession);
  }
  console.log(`✅ Seeded ${PROFESSIONAL_CATEGORIES_SEED.length} professional categories`);

  console.log('🎉 Cultural data seeding complete!');
}
```

**Run seed:**
```bash
npm run db:seed
```

**Verification:**
- [ ] All reference data seeded
- [ ] 37 states + FCT
- [ ] 20+ languages
- [ ] 15+ cultural backgrounds
- [ ] 15+ professional categories

---

## Summary

This guide provides the complete foundation for Gap 4. The full implementation includes:

### ✅ Completed Above:
- Complete database schema (6 tables)
- All entity classes with relations
- Comprehensive seed data for Nigerian context

### 📝 Remaining Tasks (Days 4-10):

**Day 4-5: Cultural Profile Service**
- CRUD operations for user cultural profile
- Language assignment and management
- Cultural background selection
- Professional title management

**Day 6-7: Privacy Settings Service**
- Privacy settings CRUD
- Default settings initialization
- Privacy-aware profile responses

**Day 8-9: Cultural Matching Service**
- Find users by language
- Find users by cultural background
- Find users by profession
- Cultural event recommendations

**Day 10: API Controllers & Documentation**
- REST endpoints
- Swagger documentation
- Integration with User Service

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reference/states` | Get all Nigerian states |
| GET | `/reference/states/:id/lgas` | Get LGAs for a state |
| GET | `/reference/languages` | Get all languages |
| GET | `/reference/cultures` | Get all cultural backgrounds |
| GET | `/reference/professions` | Get professional categories |
| GET | `/users/:id/cultural-profile` | Get user cultural profile |
| PUT | `/users/:id/cultural-profile` | Update cultural profile |
| POST | `/users/:id/languages` | Add language to user |
| DELETE | `/users/:id/languages/:langId` | Remove language |
| GET | `/users/:id/privacy-settings` | Get privacy settings |
| PUT | `/users/:id/privacy-settings` | Update privacy settings |
| GET | `/cultural-matching/by-language/:langId` | Find users by language |
| GET | `/cultural-matching/by-culture/:cultureId` | Find users by culture |
| GET | `/cultural-matching/by-profession/:profession` | Find users by profession |

---

**END OF GAP 4 IMPLEMENTATION GUIDE**

*This provides the complete database foundation and seed data for the Cultural Profile System. The remaining service and controller implementations follow standard NestJS patterns demonstrated in previous guides.*
