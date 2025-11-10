import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  State, 
  LocalGovernmentArea, 
  Ward,
  Neighborhood,
  Landmark,
  PostCategory, 
  Achievement, 
  Badge, 
  BusinessCategory,
  NigerianState,
  NigerianLanguage,
  CulturalBackground,
  ProfessionalCategory
} from '../entities';
import { ACHIEVEMENT_SEEDS, BADGE_SEEDS } from './gamification.seed';
import { businessCategoriesData } from './business-categories.seed';
import {
  NIGERIAN_STATES_SEED,
  NIGERIAN_LANGUAGES_SEED,
  CULTURAL_BACKGROUNDS_SEED,
  PROFESSIONAL_CATEGORIES_SEED
} from './cultural-data.seed';
import { LocationSeeder, NIGERIAN_STATES_DATA } from './location.seed';
// import { MessagingSeeder } from './messaging.seed';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(State)
    private stateRepository: Repository<State>,
    @InjectRepository(LocalGovernmentArea)
    private lgaRepository: Repository<LocalGovernmentArea>,
    @InjectRepository(Ward)
    private wardRepository: Repository<Ward>,
    @InjectRepository(Neighborhood)
    private neighborhoodRepository: Repository<Neighborhood>,
    @InjectRepository(Landmark)
    private landmarkRepository: Repository<Landmark>,
    @InjectRepository(PostCategory)
    private postCategoryRepository: Repository<PostCategory>,
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
    @InjectRepository(Badge)
    private badgeRepository: Repository<Badge>,
    @InjectRepository(BusinessCategory)
    private businessCategoryRepository: Repository<BusinessCategory>,
    @InjectRepository(NigerianState)
    private nigerianStateRepository: Repository<NigerianState>,
    @InjectRepository(NigerianLanguage)
    private nigerianLanguageRepository: Repository<NigerianLanguage>,
    @InjectRepository(CulturalBackground)
    private culturalBackgroundRepository: Repository<CulturalBackground>,
    @InjectRepository(ProfessionalCategory)
    private professionalCategoryRepository: Repository<ProfessionalCategory>,
  ) {}

  async seedAll(): Promise<void> {
    this.logger.log('Starting database seeding...');

    try {
      await this.seedStates();
      await this.seedLgas();
      await this.seedPostCategories();
      await this.seedAchievements();
      await this.seedBadges();
      await this.seedBusinessCategories();
      await this.seedNigerianStates();
      await this.seedNigerianLanguages();
      await this.seedCulturalBackgrounds();
      await this.seedProfessionalCategories();
      
      // Seed new location system
      await this.seedNewLocationSystem();

      this.logger.log('Database seeding completed successfully');
    } catch (error) {
      this.logger.error('Database seeding failed', error);
      throw error;
    }
  }

  private async seedStates(): Promise<void> {
    this.logger.log('Seeding Nigerian states with complete data...');

    const existingStates = await this.stateRepository.count();
    if (existingStates > 0) {
      this.logger.log('States already exist, updating with additional data if needed...');

      // Update existing states with new data
      for (const stateData of NIGERIAN_STATES_DATA) {
        const existingState = await this.stateRepository.findOne({
          where: { code: stateData.code }
        });

        if (existingState) {
          let updated = false;
          if (!existingState.region && stateData.region) {
            existingState.region = stateData.region;
            updated = true;
          }
          if (!existingState.capital && stateData.capital) {
            existingState.capital = stateData.capital;
            updated = true;
          }
          if (!existingState.population && stateData.population) {
            existingState.population = stateData.population;
            updated = true;
          }
          if (!existingState.areaSqKm && stateData.areaSqKm) {
            existingState.areaSqKm = stateData.areaSqKm;
            updated = true;
          }

          if (updated) {
            await this.stateRepository.save(existingState);
            this.logger.log(`Updated state: ${stateData.name} with additional data`);
          }
        }
      }
      return;
    }

    // Create new states with complete data
    const nigerianStates = NIGERIAN_STATES_DATA.map(stateData => ({
      name: stateData.name,
      code: stateData.code,
      country: 'Nigeria',
      region: stateData.region,
      capital: stateData.capital,
      population: stateData.population,
      areaSqKm: stateData.areaSqKm,
    }));

    await this.stateRepository.save(nigerianStates);
    this.logger.log(`Seeded ${nigerianStates.length} Nigerian states with complete data`);
  }

  private async seedLgas(): Promise<void> {
    this.logger.log('Seeding Lagos LGAs...');

    const existingLgas = await this.lgaRepository.count();
    if (existingLgas > 0) {
      this.logger.log('LGAs already exist, skipping...');
      return;
    }

    // Get Lagos state
    const lagosState = await this.stateRepository.findOne({
      where: { code: 'LA' },
    });
    if (!lagosState) {
      this.logger.error('Lagos state not found');
      return;
    }

    const lagosLgasData = [
      { name: 'Agege', code: 'AGE' },
      { name: 'Ajeromi-Ifelodun', code: 'AJI' },
      { name: 'Alimosho', code: 'ALI' },
      { name: 'Amuwo-Odofin', code: 'AMU' },
      { name: 'Apapa', code: 'APA' },
      { name: 'Badagry', code: 'BAD' },
      { name: 'Epe', code: 'EPE' },
      { name: 'Eti-Osa', code: 'ETI' },
      { name: 'Ibeju-Lekki', code: 'IBE' },
      { name: 'Ifako-Ijaiye', code: 'IFA' },
      { name: 'Ikeja', code: 'IKE' },
      { name: 'Ikorodu', code: 'IKO' },
      { name: 'Kosofe', code: 'KOS' },
      { name: 'Lagos Island', code: 'LIS' },
      { name: 'Lagos Mainland', code: 'LMA' },
      { name: 'Mushin', code: 'MUS' },
      { name: 'Ojo', code: 'OJO' },
      { name: 'Oshodi-Isolo', code: 'OSH' },
      { name: 'Shomolu', code: 'SHO' },
      { name: 'Surulere', code: 'SUR' },
    ].map((lga) => ({ 
      name: lga.name, 
      code: lga.code,
      stateId: lagosState.id 
    }));

    await this.lgaRepository.save(lagosLgasData);
    this.logger.log(`Seeded ${lagosLgasData.length} Lagos LGAs`);
  }

  private async seedPostCategories(): Promise<void> {
    this.logger.log('Seeding post categories...');

    const existingCategories = await this.postCategoryRepository.count();
    if (existingCategories > 0) {
      this.logger.log('Post categories already exist, skipping...');
      return;
    }

    const categories = [
      {
        name: 'General',
        description: 'General community discussions',
        colorCode: '#6B7280',
      },
      {
        name: 'Safety & Security',
        description: 'Safety alerts and security discussions',
        colorCode: '#EF4444',
      },
      {
        name: 'Events',
        description: 'Community events and gatherings',
        colorCode: '#8B5CF6',
      },
      {
        name: 'Marketplace',
        description: 'Buy, sell, and trade items',
        colorCode: '#10B981',
      },
      {
        name: 'Lost & Found',
        description: 'Lost and found items',
        colorCode: '#F59E0B',
      },
      {
        name: 'Services',
        description: 'Local services and recommendations',
        colorCode: '#3B82F6',
      },
      {
        name: 'News & Updates',
        description: 'Local news and community updates',
        colorCode: '#06B6D4',
      },
      {
        name: 'Help & Support',
        description: 'Community help and support requests',
        colorCode: '#EC4899',
      },
    ];

    await this.postCategoryRepository.save(categories);
    this.logger.log(`Seeded ${categories.length} post categories`);
  }

  private async seedAchievements(): Promise<void> {
    this.logger.log('Seeding achievements...');

    const existingAchievements = await this.achievementRepository.count();
    if (existingAchievements > 0) {
      this.logger.log('Achievements already exist, skipping...');
      return;
    }

    await this.achievementRepository.save(ACHIEVEMENT_SEEDS);
    this.logger.log(`Seeded ${ACHIEVEMENT_SEEDS.length} achievements`);
  }

  private async seedBadges(): Promise<void> {
    this.logger.log('Seeding badges...');

    const existingBadges = await this.badgeRepository.count();
    if (existingBadges > 0) {
      this.logger.log('Badges already exist, skipping...');
      return;
    }

    await this.badgeRepository.save(BADGE_SEEDS);
    this.logger.log(`Seeded ${BADGE_SEEDS.length} badges`);
  }

  private async seedBusinessCategories(): Promise<void> {
    this.logger.log('Seeding business categories...');

    const existingCategories = await this.businessCategoryRepository.count();
    if (existingCategories > 0) {
      this.logger.log('Business categories already exist, skipping...');
      return;
    }

    await this.businessCategoryRepository.save(businessCategoriesData);
    this.logger.log(`Seeded ${businessCategoriesData.length} business categories`);
  }

  private async seedNigerianStates(): Promise<void> {
    this.logger.log('Seeding Nigerian states...');

    // Clear existing data and re-seed
    await this.nigerianStateRepository.clear();
    this.logger.log('Cleared existing Nigerian states data');

    for (const state of NIGERIAN_STATES_SEED) {
      await this.nigerianStateRepository.save(state);
    }
    this.logger.log(`Seeded ${NIGERIAN_STATES_SEED.length} Nigerian states`);
  }

  private async seedNigerianLanguages(): Promise<void> {
    this.logger.log('Seeding Nigerian languages...');

    // Clear existing data and re-seed using query builder
    await this.nigerianLanguageRepository.createQueryBuilder().delete().execute();
    this.logger.log('Cleared existing Nigerian languages data');

    for (const language of NIGERIAN_LANGUAGES_SEED) {
      await this.nigerianLanguageRepository.save(language);
    }
    this.logger.log(`Seeded ${NIGERIAN_LANGUAGES_SEED.length} Nigerian languages`);
  }

  private async seedCulturalBackgrounds(): Promise<void> {
    this.logger.log('Seeding cultural backgrounds...');

    // Clear existing data and re-seed using query builder
    await this.culturalBackgroundRepository.createQueryBuilder().delete().execute();
    this.logger.log('Cleared existing cultural backgrounds data');

    for (const culture of CULTURAL_BACKGROUNDS_SEED) {
      await this.culturalBackgroundRepository.save(culture);
    }
    this.logger.log(`Seeded ${CULTURAL_BACKGROUNDS_SEED.length} cultural backgrounds`);
  }

  private async seedProfessionalCategories(): Promise<void> {
    this.logger.log('Seeding professional categories...');

    // Clear existing data and re-seed using query builder
    await this.professionalCategoryRepository.createQueryBuilder().delete().execute();
    this.logger.log('Cleared existing professional categories data');

    await this.professionalCategoryRepository.save(PROFESSIONAL_CATEGORIES_SEED);
    this.logger.log(`Seeded ${PROFESSIONAL_CATEGORIES_SEED.length} professional categories`);
  }

  private async seedNewLocationSystem(): Promise<void> {
    this.logger.log('Seeding new location system...');

    const locationSeeder = new LocationSeeder(
      this.stateRepository,
      this.lgaRepository,
      this.wardRepository,
      this.neighborhoodRepository,
      this.landmarkRepository
    );

    await locationSeeder.seedAll();
  }
}
