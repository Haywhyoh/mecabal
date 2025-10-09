import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessProfileService } from './business-profile.service';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';
import { CreateBusinessProfileDto } from '../dto/create-business-profile.dto';
import { UpdateBusinessProfileDto } from '../dto/update-business-profile.dto';

describe('BusinessProfileService', () => {
  let service: BusinessProfileService;
  let repository: Repository<BusinessProfile>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockBusinessProfile = {
    id: 'business-123',
    userId: 'user-123',
    businessName: 'Test Business',
    category: 'household-services',
    subcategory: 'Plumbing',
    serviceArea: 'neighborhood',
    pricingModel: 'hourly',
    availability: 'business-hours',
    yearsOfExperience: 5,
    isActive: true,
    isVerified: false,
    verificationLevel: 'basic',
    rating: 0,
    reviewCount: 0,
    completedJobs: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessProfileService,
        {
          provide: getRepositoryToken(BusinessProfile),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<BusinessProfileService>(BusinessProfileService);
    repository = module.get<Repository<BusinessProfile>>(
      getRepositoryToken(BusinessProfile),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new business profile', async () => {
      const userId = 'user-123';
      const createDto: CreateBusinessProfileDto = {
        businessName: 'Test Business',
        category: 'household-services',
        subcategory: 'Plumbing',
        serviceArea: 'neighborhood',
        pricingModel: 'hourly',
        availability: 'business-hours',
        yearsOfExperience: 5,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ ...createDto, userId });
      mockRepository.save.mockResolvedValue({
        id: 'business-123',
        ...createDto,
        userId,
      });

      const result = await service.create(userId, createDto);

      expect(result).toHaveProperty('id');
      expect(result.businessName).toBe(createDto.businessName);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        userId,
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw error if user already has a business', async () => {
      const userId = 'user-123';
      const createDto = { businessName: 'Test' } as CreateBusinessProfileDto;

      mockRepository.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.create(userId, createDto)).rejects.toThrow(
        'User already has a business profile',
      );
    });
  });

  describe('findById', () => {
    it('should return business profile by id', async () => {
      const businessId = 'business-123';
      mockRepository.findOne.mockResolvedValue(mockBusinessProfile);

      const result = await service.findById(businessId);

      expect(result).toEqual(mockBusinessProfile);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: businessId },
        relations: ['user', 'licenses', 'services', 'reviews', 'inquiries'],
      });
    });

    it('should throw NotFoundException if business not found', async () => {
      const businessId = 'non-existent';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(businessId)).rejects.toThrow(
        'Business profile not found',
      );
    });
  });

  describe('findByUserId', () => {
    it('should return business profile by user id', async () => {
      const userId = 'user-123';
      mockRepository.findOne.mockResolvedValue(mockBusinessProfile);

      const result = await service.findByUserId(userId);

      expect(result).toEqual(mockBusinessProfile);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
        relations: ['user', 'licenses', 'services', 'reviews', 'inquiries'],
      });
    });

    it('should throw NotFoundException if business not found', async () => {
      const userId = 'non-existent';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByUserId(userId)).rejects.toThrow(
        'Business profile not found',
      );
    });
  });

  describe('update', () => {
    it('should update business profile', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const updateDto: UpdateBusinessProfileDto = {
        businessName: 'Updated Business',
        description: 'Updated description',
      };

      mockRepository.findOne.mockResolvedValue(mockBusinessProfile);
      mockRepository.save.mockResolvedValue({
        ...mockBusinessProfile,
        ...updateDto,
      });

      const result = await service.update(businessId, userId, updateDto);

      expect(result.businessName).toBe(updateDto.businessName);
      expect(result.description).toBe(updateDto.description);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not own business', async () => {
      const businessId = 'business-123';
      const userId = 'different-user';
      const updateDto = { businessName: 'Updated' } as UpdateBusinessProfileDto;

      mockRepository.findOne.mockResolvedValue(mockBusinessProfile);

      await expect(service.update(businessId, userId, updateDto)).rejects.toThrow(
        'You do not own this business',
      );
    });
  });

  describe('updateStatus', () => {
    it('should update business status', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const isActive = false;

      mockRepository.findOne.mockResolvedValue(mockBusinessProfile);
      mockRepository.save.mockResolvedValue({
        ...mockBusinessProfile,
        isActive,
      });

      const result = await service.updateStatus(businessId, userId, isActive);

      expect(result.isActive).toBe(isActive);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete business profile', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';

      mockRepository.findOne.mockResolvedValue(mockBusinessProfile);
      mockRepository.remove.mockResolvedValue(mockBusinessProfile);

      await service.delete(businessId, userId);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockBusinessProfile);
    });
  });

  describe('incrementCompletedJobs', () => {
    it('should increment completed jobs count', async () => {
      const businessId = 'business-123';
      const currentJobs = 5;

      mockRepository.findOne.mockResolvedValue({
        ...mockBusinessProfile,
        completedJobs: currentJobs,
      });
      mockRepository.save.mockResolvedValue({
        ...mockBusinessProfile,
        completedJobs: currentJobs + 1,
      });

      const result = await service.incrementCompletedJobs(businessId);

      expect(result.completedJobs).toBe(currentJobs + 1);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});
