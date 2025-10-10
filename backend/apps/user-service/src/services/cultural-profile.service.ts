import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  User,
  NigerianState,
  NigerianLanguage,
  CulturalBackground,
  ProfessionalCategory,
  UserLanguage,
  UserPrivacySettings,
  LanguageProficiency,
} from '@app/database';
import {
  CreateCulturalProfileDto,
  UpdateCulturalProfileDto,
  AddLanguageDto,
  UpdateLanguageDto,
  CulturalProfileResponseDto,
  ReferenceDataResponseDto,
  UserPrivacySettingsDto,
} from '../dto/cultural-profile.dto';

@Injectable()
export class CulturalProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(NigerianState)
    private readonly nigerianStateRepository: Repository<NigerianState>,
    @InjectRepository(NigerianLanguage)
    private readonly nigerianLanguageRepository: Repository<NigerianLanguage>,
    @InjectRepository(CulturalBackground)
    private readonly culturalBackgroundRepository: Repository<CulturalBackground>,
    @InjectRepository(ProfessionalCategory)
    private readonly professionalCategoryRepository: Repository<ProfessionalCategory>,
    @InjectRepository(UserLanguage)
    private readonly userLanguageRepository: Repository<UserLanguage>,
    @InjectRepository(UserPrivacySettings)
    private readonly userPrivacySettingsRepository: Repository<UserPrivacySettings>,
  ) {}

  /**
   * Get user's cultural profile
   */
  async getCulturalProfile(userId: string): Promise<CulturalProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'stateOfOrigin',
        'culturalBackground',
        'professionalCategory',
        'userLanguages',
        'userLanguages.language',
        'privacySettings',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.transformToCulturalProfileResponse(user);
  }

  /**
   * Create or update user's cultural profile
   */
  async createOrUpdateCulturalProfile(
    userId: string,
    createDto: CreateCulturalProfileDto,
  ): Promise<CulturalProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['stateOfOrigin', 'culturalBackground', 'professionalCategory', 'privacySettings'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Validate references exist
    await this.validateReferences(createDto);

    // Update user's basic cultural info
    user.stateOfOriginId = createDto.stateOfOriginId;
    user.culturalBackgroundId = createDto.culturalBackgroundId;
    user.professionalCategoryId = createDto.professionalCategoryId;
    user.professionalTitle = createDto.professionalTitle;

    await this.userRepository.save(user);

    // Handle languages
    await this.updateUserLanguages(userId, createDto.languages);

    // Handle privacy settings
    await this.updatePrivacySettings(userId, createDto.privacySettings);

    return this.getCulturalProfile(userId);
  }

  /**
   * Update user's cultural profile
   */
  async updateCulturalProfile(
    userId: string,
    updateDto: UpdateCulturalProfileDto,
  ): Promise<CulturalProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Validate references if provided
    if (updateDto.stateOfOriginId || updateDto.culturalBackgroundId || updateDto.professionalCategoryId) {
      await this.validateReferences(updateDto as CreateCulturalProfileDto);
    }

    // Update user's basic cultural info
    if (updateDto.stateOfOriginId) user.stateOfOriginId = updateDto.stateOfOriginId;
    if (updateDto.culturalBackgroundId) user.culturalBackgroundId = updateDto.culturalBackgroundId;
    if (updateDto.professionalCategoryId) user.professionalCategoryId = updateDto.professionalCategoryId;
    if (updateDto.professionalTitle) user.professionalTitle = updateDto.professionalTitle;

    await this.userRepository.save(user);

    // Handle languages if provided
    if (updateDto.languages) {
      await this.updateUserLanguages(userId, updateDto.languages);
    }

    // Handle privacy settings if provided
    if (updateDto.privacySettings) {
      await this.updatePrivacySettings(userId, updateDto.privacySettings);
    }

    return this.getCulturalProfile(userId);
  }

  /**
   * Add a language to user's profile
   */
  async addLanguage(userId: string, addLanguageDto: AddLanguageDto): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if language exists
    const language = await this.nigerianLanguageRepository.findOne({
      where: { id: addLanguageDto.languageId },
    });
    if (!language) {
      throw new NotFoundException(`Language with ID ${addLanguageDto.languageId} not found`);
    }

    // Check if user already has this language
    const existingUserLanguage = await this.userLanguageRepository.findOne({
      where: {
        userId,
        languageId: addLanguageDto.languageId,
      },
    });

    if (existingUserLanguage) {
      throw new ConflictException('User already has this language');
    }

    // Add the language
    const userLanguage = this.userLanguageRepository.create({
      userId,
      languageId: addLanguageDto.languageId,
      proficiency: addLanguageDto.proficiency as any,
    });

    await this.userLanguageRepository.save(userLanguage);
  }

  /**
   * Update user's language proficiency
   */
  async updateLanguageProficiency(
    userId: string,
    languageId: string,
    updateLanguageDto: UpdateLanguageDto,
  ): Promise<void> {
    const userLanguage = await this.userLanguageRepository.findOne({
      where: { userId, languageId },
    });

    if (!userLanguage) {
      throw new NotFoundException('User language not found');
    }

    userLanguage.proficiency = updateLanguageDto.proficiency as any;
    await this.userLanguageRepository.save(userLanguage);
  }

  /**
   * Remove a language from user's profile
   */
  async removeLanguage(userId: string, languageId: string): Promise<void> {
    const userLanguage = await this.userLanguageRepository.findOne({
      where: { userId, languageId },
    });

    if (!userLanguage) {
      throw new NotFoundException('User language not found');
    }

    await this.userLanguageRepository.remove(userLanguage);
  }

  /**
   * Get all reference data for cultural profiles
   */
  async getReferenceData(): Promise<ReferenceDataResponseDto> {
    const [states, languages, culturalBackgrounds, professionalCategories] = await Promise.all([
      this.nigerianStateRepository.find({ order: { name: 'ASC' } }),
      this.nigerianLanguageRepository.find({ order: { name: 'ASC' } }),
      this.culturalBackgroundRepository.find({ order: { name: 'ASC' } }),
      this.professionalCategoryRepository.find({ order: { displayOrder: 'ASC' } }),
    ]);

    return {
      states: states.map(state => ({
        id: state.id,
        name: state.name,
        region: state.region,
        capital: state.capital,
        lgas: state.lgas,
        population: state.population || 0,
        areaSqKm: state.areaSqKm || 0,
      })),
      languages: languages.map(language => ({
        id: language.id,
        name: language.name,
        nativeName: language.nativeName,
        greeting: language.greeting,
        description: language.description,
        speakersCount: language.speakersCount || 0,
        regions: language.regions,
        isMajor: language.isMajor,
      })),
      culturalBackgrounds: culturalBackgrounds.map(background => ({
        id: background.id,
        name: background.name,
        region: background.region || '',
        description: background.description || '',
        traditions: background.traditions,
        populationEstimate: background.populationEstimate || 0,
      })),
      professionalCategories: professionalCategories.map(category => ({
        id: category.id,
        category: category.category,
        titles: category.titles,
        icon: category.icon || '',
        displayOrder: category.displayOrder,
      })),
    };
  }

  /**
   * Find users by cultural criteria
   */
  async findUsersByCulturalCriteria(criteria: {
    languageId?: string;
    culturalBackgroundId?: string;
    professionalCategoryId?: string;
    stateId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ users: CulturalProfileResponseDto[]; total: number }> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.stateOfOrigin', 'state')
      .leftJoinAndSelect('user.culturalBackground', 'cultural')
      .leftJoinAndSelect('user.professionalCategory', 'professional')
      .leftJoinAndSelect('user.userLanguages', 'userLanguages')
      .leftJoinAndSelect('userLanguages.language', 'language')
      .leftJoinAndSelect('user.privacySettings', 'privacy');

    if (criteria.languageId) {
      query.andWhere('userLanguages.languageId = :languageId', { languageId: criteria.languageId });
    }

    if (criteria.culturalBackgroundId) {
      query.andWhere('user.culturalBackgroundId = :culturalBackgroundId', {
        culturalBackgroundId: criteria.culturalBackgroundId,
      });
    }

    if (criteria.professionalCategoryId) {
      query.andWhere('user.professionalCategoryId = :professionalCategoryId', {
        professionalCategoryId: criteria.professionalCategoryId,
      });
    }

    if (criteria.stateId) {
      query.andWhere('user.stateOfOriginId = :stateId', { stateId: criteria.stateId });
    }

    const total = await query.getCount();

    if (criteria.limit) {
      query.limit(criteria.limit);
    }
    if (criteria.offset) {
      query.offset(criteria.offset);
    }

    const users = await query.getMany();

    return {
      users: users.map(user => this.transformToCulturalProfileResponse(user)),
      total,
    };
  }

  /**
   * Private helper methods
   */
  private async validateReferences(dto: CreateCulturalProfileDto): Promise<void> {
    const [state, culturalBackground, professionalCategory] = await Promise.all([
      this.nigerianStateRepository.findOne({ where: { id: dto.stateOfOriginId } }),
      this.culturalBackgroundRepository.findOne({ where: { id: dto.culturalBackgroundId } }),
      this.professionalCategoryRepository.findOne({ where: { id: dto.professionalCategoryId } }),
    ]);

    if (!state) {
      throw new BadRequestException(`State with ID ${dto.stateOfOriginId} not found`);
    }
    if (!culturalBackground) {
      throw new BadRequestException(`Cultural background with ID ${dto.culturalBackgroundId} not found`);
    }
    if (!professionalCategory) {
      throw new BadRequestException(`Professional category with ID ${dto.professionalCategoryId} not found`);
    }

    // Validate languages
    if (dto.languages && dto.languages.length > 0) {
      const languageIds = dto.languages.map(lang => lang.languageId);
      const languages = await this.nigerianLanguageRepository.find({
        where: { id: In(languageIds) },
      });

      if (languages.length !== languageIds.length) {
        const foundIds = languages.map(lang => lang.id);
        const missingIds = languageIds.filter(id => !foundIds.includes(id));
        throw new BadRequestException(`Languages with IDs ${missingIds.join(', ')} not found`);
      }
    }
  }

  private async updateUserLanguages(userId: string, languages: any[]): Promise<void> {
    // Remove existing languages
    await this.userLanguageRepository.delete({ userId });

    // Add new languages
    if (languages && languages.length > 0) {
      const userLanguages = languages.map(lang =>
        this.userLanguageRepository.create({
          userId,
          languageId: lang.languageId,
          proficiency: lang.proficiency,
        }),
      );

      await this.userLanguageRepository.save(userLanguages);
    }
  }

  private async updatePrivacySettings(userId: string, privacySettings: UserPrivacySettingsDto): Promise<void> {
    let userPrivacySettings = await this.userPrivacySettingsRepository.findOne({
      where: { userId },
    });

    if (!userPrivacySettings) {
      userPrivacySettings = this.userPrivacySettingsRepository.create({
        userId,
        ...privacySettings,
      });
    } else {
      Object.assign(userPrivacySettings, privacySettings);
    }

    await this.userPrivacySettingsRepository.save(userPrivacySettings);
  }

  private transformToCulturalProfileResponse(user: User): CulturalProfileResponseDto {
    return {
      id: user.id,
      stateOfOrigin: user.stateOfOrigin ? {
        id: user.stateOfOrigin.id,
        name: user.stateOfOrigin.name,
        region: user.stateOfOrigin.region,
      } : null as any,
      culturalBackground: user.culturalBackground ? {
        id: user.culturalBackground.id,
        name: user.culturalBackground.name,
        region: user.culturalBackground.region || '',
      } : null as any,
      professional: user.professionalCategory ? {
        categoryId: user.professionalCategory.id,
        category: user.professionalCategory.category,
        title: user.professionalTitle || '',
      } : null as any,
      languages: user.userLanguages?.map(ul => ({
        id: ul.language.id,
        name: ul.language.name,
        nativeName: ul.language.nativeName,
        proficiency: ul.proficiency as any,
      })) || [],
      privacySettings: user.privacySettings ? {
        showCulturalBackground: user.privacySettings.showCultureOnProfile,
        showLanguages: user.privacySettings.showLanguagesOnProfile,
        showProfessionalCategory: user.privacySettings.showProfessionOnProfile,
        showStateOfOrigin: user.privacySettings.showStateOnProfile,
        allowCulturalMatching: user.privacySettings.allowCulturalMatching,
      } : {
        showCulturalBackground: true,
        showLanguages: true,
        showProfessionalCategory: true,
        showStateOfOrigin: true,
        allowCulturalMatching: true,
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

