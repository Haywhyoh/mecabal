import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  State, 
  LocalGovernmentArea, 
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

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(State)
    private stateRepository: Repository<State>,
    @InjectRepository(LocalGovernmentArea)
    private lgaRepository: Repository<LocalGovernmentArea>,
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

      this.logger.log('Database seeding completed successfully');
    } catch (error) {
      this.logger.error('Database seeding failed', error);
      throw error;
    }
  }

  private async seedStates(): Promise<void> {
    this.logger.log('Seeding Nigerian states...');

    const existingStates = await this.stateRepository.count();
    if (existingStates > 0) {
      this.logger.log('States already exist, skipping...');
      return;
    }

    const nigerianStates = [
      { name: 'Abia', code: 'AB' },
      { name: 'Adamawa', code: 'AD' },
      { name: 'Akwa Ibom', code: 'AK' },
      { name: 'Anambra', code: 'AN' },
      { name: 'Bauchi', code: 'BA' },
      { name: 'Bayelsa', code: 'BY' },
      { name: 'Benue', code: 'BE' },
      { name: 'Borno', code: 'BO' },
      { name: 'Cross River', code: 'CR' },
      { name: 'Delta', code: 'DE' },
      { name: 'Ebonyi', code: 'EB' },
      { name: 'Edo', code: 'ED' },
      { name: 'Ekiti', code: 'EK' },
      { name: 'Enugu', code: 'EN' },
      { name: 'FCT', code: 'FC' },
      { name: 'Gombe', code: 'GO' },
      { name: 'Imo', code: 'IM' },
      { name: 'Jigawa', code: 'JI' },
      { name: 'Kaduna', code: 'KD' },
      { name: 'Kano', code: 'KN' },
      { name: 'Katsina', code: 'KT' },
      { name: 'Kebbi', code: 'KE' },
      { name: 'Kogi', code: 'KO' },
      { name: 'Kwara', code: 'KW' },
      { name: 'Lagos', code: 'LA' },
      { name: 'Nasarawa', code: 'NA' },
      { name: 'Niger', code: 'NI' },
      { name: 'Ogun', code: 'OG' },
      { name: 'Ondo', code: 'ON' },
      { name: 'Osun', code: 'OS' },
      { name: 'Oyo', code: 'OY' },
      { name: 'Plateau', code: 'PL' },
      { name: 'Rivers', code: 'RI' },
      { name: 'Sokoto', code: 'SO' },
      { name: 'Taraba', code: 'TA' },
      { name: 'Yobe', code: 'YO' },
      { name: 'Zamfara', code: 'ZA' },
    ];

    await this.stateRepository.save(nigerianStates);
    this.logger.log(`Seeded ${nigerianStates.length} Nigerian states`);
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

    const lagosLgas = [
      'Agege',
      'Ajeromi-Ifelodun',
      'Alimosho',
      'Amuwo-Odofin',
      'Apapa',
      'Badagry',
      'Epe',
      'Eti-Osa',
      'Ibeju-Lekki',
      'Ifako-Ijaiye',
      'Ikeja',
      'Ikorodu',
      'Kosofe',
      'Lagos Island',
      'Lagos Mainland',
      'Mushin',
      'Ojo',
      'Oshodi-Isolo',
      'Shomolu',
      'Surulere',
    ].map((name) => ({ name, stateId: lagosState.id }));

    await this.lgaRepository.save(lagosLgas);
    this.logger.log(`Seeded ${lagosLgas.length} Lagos LGAs`);
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
}
