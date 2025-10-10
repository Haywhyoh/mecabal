import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CulturalProfileService } from './cultural-profile.service';
import {
  User,
  NigerianState,
  NigerianLanguage,
  CulturalBackground,
  ProfessionalCategory,
  UserLanguage,
  UserPrivacySettings,
} from '@app/database';
import { CreateCulturalProfileDto, AddLanguageDto, UpdateLanguageDto } from '../dto/cultural-profile.dto';

describe('CulturalProfileService', () => {
  let service: CulturalProfileService;
  let userRepository: Repository<User>;
  let nigerianStateRepository: Repository<NigerianState>;
  let nigerianLanguageRepository: Repository<NigerianLanguage>;
  let culturalBackgroundRepository: Repository<CulturalBackground>;
  let professionalCategoryRepository: Repository<ProfessionalCategory>;
  let userLanguageRepository: Repository<UserLanguage>;
  let userPrivacySettingsRepository: Repository<UserPrivacySettings>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    stateOfOrigin: null,
    culturalBackground: null,
    professionalCategory: null,
    userLanguages: [],
    privacySettings: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockState = {
    id: 'lagos',
    name: 'Lagos',
    region: 'South West',
  };

  const mockCulturalBackground = {
    id: 'yoruba',
    name: 'Yoruba',
    region: 'South West',
  };

  const mockProfessionalCategory = {
    id: 'tech',
    category: 'Technology & Engineering',
    titles: ['Software Engineer', 'Data Scientist'],
  };

  const mockLanguage = {
    id: 'english',
    name: 'English',
    nativeName: 'English',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CulturalProfileService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              offset: jest.fn().mockReturnThis(),
              getCount: jest.fn().mockResolvedValue(1),
              getMany: jest.fn().mockResolvedValue([mockUser]),
            })),
          },
        },
        {
          provide: getRepositoryToken(NigerianState),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(NigerianLanguage),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CulturalBackground),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProfessionalCategory),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserLanguage),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserPrivacySettings),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CulturalProfileService>(CulturalProfileService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    nigerianStateRepository = module.get<Repository<NigerianState>>(getRepositoryToken(NigerianState));
    nigerianLanguageRepository = module.get<Repository<NigerianLanguage>>(getRepositoryToken(NigerianLanguage));
    culturalBackgroundRepository = module.get<Repository<CulturalBackground>>(getRepositoryToken(CulturalBackground));
    professionalCategoryRepository = module.get<Repository<ProfessionalCategory>>(getRepositoryToken(ProfessionalCategory));
    userLanguageRepository = module.get<Repository<UserLanguage>>(getRepositoryToken(UserLanguage));
    userPrivacySettingsRepository = module.get<Repository<UserPrivacySettings>>(getRepositoryToken(UserPrivacySettings));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCulturalProfile', () => {
    it('should return user cultural profile', async () => {
      const userWithRelations = {
        ...mockUser,
        stateOfOrigin: mockState,
        culturalBackground: mockCulturalBackground,
        professionalCategory: mockProfessionalCategory,
        userLanguages: [],
        privacySettings: {
          showCulturalBackground: true,
          showLanguages: true,
          showProfessionalCategory: true,
          showStateOfOrigin: true,
          allowCulturalMatching: true,
        },
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithRelations as any);

      const result = await service.getCulturalProfile('user-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('user-1');
      expect(result.stateOfOrigin).toEqual({
        id: mockState.id,
        name: mockState.name,
        region: mockState.region,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getCulturalProfile('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createOrUpdateCulturalProfile', () => {
    const createDto: CreateCulturalProfileDto = {
      stateOfOriginId: 'lagos',
      culturalBackgroundId: 'yoruba',
      professionalCategoryId: 'tech',
      professionalTitle: 'Software Engineer',
      languages: [
        {
          languageId: 'english',
          proficiency: 'native' as any,
        },
      ],
      privacySettings: {
        showCulturalBackground: true,
        showLanguages: true,
        showProfessionalCategory: true,
        showStateOfOrigin: true,
        allowCulturalMatching: true,
      },
    };

    it('should create cultural profile successfully', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(nigerianStateRepository, 'findOne').mockResolvedValue(mockState as any);
      jest.spyOn(culturalBackgroundRepository, 'findOne').mockResolvedValue(mockCulturalBackground as any);
      jest.spyOn(professionalCategoryRepository, 'findOne').mockResolvedValue(mockProfessionalCategory as any);
      jest.spyOn(nigerianLanguageRepository, 'find').mockResolvedValue([mockLanguage] as any);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser as any);
      jest.spyOn(userLanguageRepository, 'delete').mockResolvedValue(undefined);
      jest.spyOn(userLanguageRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(userLanguageRepository, 'save').mockResolvedValue(undefined);
      jest.spyOn(userPrivacySettingsRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userPrivacySettingsRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(userPrivacySettingsRepository, 'save').mockResolvedValue(undefined);

      const result = await service.createOrUpdateCulturalProfile('user-1', createDto);

      expect(result).toBeDefined();
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createOrUpdateCulturalProfile('non-existent', createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when state not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(nigerianStateRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createOrUpdateCulturalProfile('user-1', createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('addLanguage', () => {
    const addLanguageDto: AddLanguageDto = {
      languageId: 'english',
      proficiency: 'native' as any,
    };

    it('should add language successfully', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(nigerianLanguageRepository, 'findOne').mockResolvedValue(mockLanguage as any);
      jest.spyOn(userLanguageRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userLanguageRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(userLanguageRepository, 'save').mockResolvedValue(undefined);

      await service.addLanguage('user-1', addLanguageDto);

      expect(userLanguageRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        languageId: 'english',
        proficiency: 'native',
      });
      expect(userLanguageRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when user already has language', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(nigerianLanguageRepository, 'findOne').mockResolvedValue(mockLanguage as any);
      jest.spyOn(userLanguageRepository, 'findOne').mockResolvedValue({} as any);

      await expect(service.addLanguage('user-1', addLanguageDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateLanguageProficiency', () => {
    const updateLanguageDto: UpdateLanguageDto = {
      proficiency: 'advanced' as any,
    };

    it('should update language proficiency successfully', async () => {
      const mockUserLanguage = {
        userId: 'user-1',
        languageId: 'english',
        proficiency: 'intermediate' as any,
      };

      jest.spyOn(userLanguageRepository, 'findOne').mockResolvedValue(mockUserLanguage as any);
      jest.spyOn(userLanguageRepository, 'save').mockResolvedValue(undefined);

      await service.updateLanguageProficiency('user-1', 'english', updateLanguageDto);

      expect(mockUserLanguage.proficiency).toBe('advanced');
      expect(userLanguageRepository.save).toHaveBeenCalledWith(mockUserLanguage);
    });

    it('should throw NotFoundException when user language not found', async () => {
      jest.spyOn(userLanguageRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateLanguageProficiency('user-1', 'english', updateLanguageDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeLanguage', () => {
    it('should remove language successfully', async () => {
      const mockUserLanguage = {
        userId: 'user-1',
        languageId: 'english',
        proficiency: 'native' as any,
      };

      jest.spyOn(userLanguageRepository, 'findOne').mockResolvedValue(mockUserLanguage as any);
      jest.spyOn(userLanguageRepository, 'remove').mockResolvedValue(undefined);

      await service.removeLanguage('user-1', 'english');

      expect(userLanguageRepository.remove).toHaveBeenCalledWith(mockUserLanguage);
    });

    it('should throw NotFoundException when user language not found', async () => {
      jest.spyOn(userLanguageRepository, 'findOne').mockResolvedValue(null);

      await expect(service.removeLanguage('user-1', 'english')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getReferenceData', () => {
    it('should return all reference data', async () => {
      const mockStates = [mockState];
      const mockLanguages = [mockLanguage];
      const mockCulturalBackgrounds = [mockCulturalBackground];
      const mockProfessionalCategories = [mockProfessionalCategory];

      jest.spyOn(nigerianStateRepository, 'find').mockResolvedValue(mockStates as any);
      jest.spyOn(nigerianLanguageRepository, 'find').mockResolvedValue(mockLanguages as any);
      jest.spyOn(culturalBackgroundRepository, 'find').mockResolvedValue(mockCulturalBackgrounds as any);
      jest.spyOn(professionalCategoryRepository, 'find').mockResolvedValue(mockProfessionalCategories as any);

      const result = await service.getReferenceData();

      expect(result).toBeDefined();
      expect(result.states).toHaveLength(1);
      expect(result.languages).toHaveLength(1);
      expect(result.culturalBackgrounds).toHaveLength(1);
      expect(result.professionalCategories).toHaveLength(1);
    });
  });
});
