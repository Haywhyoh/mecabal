import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserProfileService } from './user-profile.service';
import { User } from '@app/database';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FileUploadService } from '@app/storage';

describe('UserProfileService', () => {
  let service: UserProfileService;
  let userRepository: Repository<User>;
  let fileUploadService: FileUploadService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+1234567890',
    isActive: true,
    isVerified: false,
    trustScore: 0,
    profilePictureUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockFileUploadService = {
    uploadAvatar: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProfileService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: FileUploadService,
          useValue: mockFileUploadService,
        },
      ],
    }).compile();

    service = module.get<UserProfileService>(UserProfileService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    fileUploadService = module.get<FileUploadService>(FileUploadService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserById('user-1');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when found by email', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should throw NotFoundException when user not found by email', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserByEmail('nonexistent@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        occupation: 'Developer',
      };

      const updatedUser = { ...mockUser, ...updateData };
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-1', updateData);

      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(result.occupation).toBe('Developer');
      expect(mockRepository.save).toHaveBeenCalledWith(updatedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile('nonexistent', { firstName: 'Jane' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when email already exists', async () => {
      const updateData = { email: 'existing@example.com' };
      mockRepository.findOne
        .mockResolvedValueOnce(mockUser) // First call for user lookup
        .mockResolvedValueOnce({ id: 'other-user' }); // Second call for email check

      await expect(
        service.updateProfile('user-1', updateData),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateAvatar', () => {
    it('should update user avatar successfully', async () => {
      const avatarUrl = 'https://example.com/avatar.jpg';
      const updatedUser = { ...mockUser, profilePictureUrl: avatarUrl };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateAvatar('user-1', avatarUrl);

      expect(result.profilePictureUrl).toBe(avatarUrl);
      expect(mockRepository.save).toHaveBeenCalledWith(updatedUser);
    });

    it('should handle null avatar URL', async () => {
      const updatedUser = { ...mockUser, profilePictureUrl: undefined };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateAvatar('user-1', null);

      expect(result.profilePictureUrl).toBeUndefined();
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateAvatar('nonexistent', 'https://example.com/avatar.jpg'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivateAccount', () => {
    it('should deactivate user account successfully', async () => {
      const deactivatedUser = { ...mockUser, isActive: false };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(deactivatedUser);

      const result = await service.deactivateAccount('user-1');

      expect(result.message).toBe('Account deactivated successfully');
      expect(mockRepository.save).toHaveBeenCalledWith(deactivatedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.deactivateAccount('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getProfileCompletion', () => {
    it('should calculate profile completion correctly', async () => {
      const completeUser = {
        ...mockUser,
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        occupation: 'Developer',
        state: 'Lagos',
        city: 'Lagos',
        estate: 'Victoria Island',
        culturalBackground: 'Yoruba',
        profilePictureUrl: 'https://example.com/avatar.jpg',
      };

      mockRepository.findOne.mockResolvedValue(completeUser);

      const result = await service.getProfileCompletion('user-1');

      expect(result.percentage).toBe(100);
      expect(result.missingFields).toEqual([]);
    });

    it('should identify missing fields correctly', async () => {
      const incompleteUser = {
        ...mockUser,
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        occupation: null,
        state: null,
        city: null,
        estate: null,
        culturalBackground: null,
        profilePictureUrl: null,
      };

      mockRepository.findOne.mockResolvedValue(incompleteUser);

      const result = await service.getProfileCompletion('user-1');

      expect(result.percentage).toBeLessThan(100);
      expect(result.missingFields).toContain('occupation');
      expect(result.missingFields).toContain('state');
      expect(result.missingFields).toContain('city');
    });
  });
});
