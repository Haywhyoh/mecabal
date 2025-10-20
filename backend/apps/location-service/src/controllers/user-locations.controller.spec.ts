import { Test, TestingModule } from '@nestjs/testing';
import { UserLocationsController } from './user-locations.controller';
import { UserLocationRepository } from '../repositories/user-location.repository';
import { UserLocation } from '@app/database/entities';

describe('UserLocationsController', () => {
  let controller: UserLocationsController;
  let repository: UserLocationRepository;

  const mockUserLocationRepository = {
    getUserLocations: jest.fn(),
    getPrimaryLocation: jest.fn(),
    createUserLocation: jest.fn(),
    updateUserLocation: jest.fn(),
    deleteUserLocation: jest.fn(),
    setPrimaryLocation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserLocationsController],
      providers: [
        {
          provide: UserLocationRepository,
          useValue: mockUserLocationRepository,
        },
      ],
    }).compile();

    controller = module.get<UserLocationsController>(UserLocationsController);
    repository = module.get<UserLocationRepository>(UserLocationRepository);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserLocations', () => {
    it('should return user locations successfully', async () => {
      const mockLocations = [
        {
          id: '1',
          userId: 'user1',
          stateId: 'state1',
          lgaId: 'lga1',
          isPrimary: true,
        },
      ] as UserLocation[];

      const mockRequest = { user: { id: 'user1' } };
      mockUserLocationRepository.getUserLocations.mockResolvedValue(mockLocations);

      const result = await controller.getUserLocations(mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLocations);
      expect(result.count).toBe(1);
      expect(mockUserLocationRepository.getUserLocations).toHaveBeenCalledWith('user1');
    });

    it('should return error when user not authenticated', async () => {
      const mockRequest = { user: null };

      const result = await controller.getUserLocations(mockRequest);

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.message).toBe('User not authenticated');
    });

    it('should handle repository errors gracefully', async () => {
      const mockRequest = { user: { id: 'user1' } };
      mockUserLocationRepository.getUserLocations.mockRejectedValue(new Error('Database error'));

      const result = await controller.getUserLocations(mockRequest);

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.message).toBe('Failed to fetch user locations');
    });
  });

  describe('getPrimaryLocation', () => {
    it('should return primary location successfully', async () => {
      const mockLocation = {
        id: '1',
        userId: 'user1',
        isPrimary: true,
      } as UserLocation;

      const mockRequest = { user: { id: 'user1' } };
      mockUserLocationRepository.getPrimaryLocation.mockResolvedValue(mockLocation);

      const result = await controller.getPrimaryLocation(mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLocation);
      expect(mockUserLocationRepository.getPrimaryLocation).toHaveBeenCalledWith('user1');
    });

    it('should return null when no primary location found', async () => {
      const mockRequest = { user: { id: 'user1' } };
      mockUserLocationRepository.getPrimaryLocation.mockResolvedValue(null);

      const result = await controller.getPrimaryLocation(mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.message).toBe('No primary location found');
    });
  });

  describe('createUserLocation', () => {
    it('should create user location successfully', async () => {
      const mockLocationData = {
        stateId: 'state1',
        lgaId: 'lga1',
        neighborhoodId: 'neighborhood1',
      };

      const mockCreatedLocation = {
        id: '1',
        userId: 'user1',
        ...mockLocationData,
      } as UserLocation;

      const mockRequest = { user: { id: 'user1' } };
      mockUserLocationRepository.createUserLocation.mockResolvedValue(mockCreatedLocation);

      const result = await controller.createUserLocation(mockLocationData, mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedLocation);
      expect(mockUserLocationRepository.createUserLocation).toHaveBeenCalledWith({
        ...mockLocationData,
        userId: 'user1',
      });
    });
  });

  describe('updateUserLocation', () => {
    it('should update user location successfully', async () => {
      const locationId = '1';
      const updateData = { cityTown: 'Updated City' };
      const mockUpdatedLocation = {
        id: locationId,
        userId: 'user1',
        cityTown: 'Updated City',
      } as UserLocation;

      const mockRequest = { user: { id: 'user1' } };
      mockUserLocationRepository.updateUserLocation.mockResolvedValue(mockUpdatedLocation);

      const result = await controller.updateUserLocation(locationId, updateData, mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedLocation);
      expect(mockUserLocationRepository.updateUserLocation).toHaveBeenCalledWith(
        locationId,
        updateData,
        'user1'
      );
    });
  });

  describe('deleteUserLocation', () => {
    it('should delete user location successfully', async () => {
      const locationId = '1';
      const mockRequest = { user: { id: 'user1' } };
      mockUserLocationRepository.deleteUserLocation.mockResolvedValue(undefined);

      const result = await controller.deleteUserLocation(locationId, mockRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe('User location deleted successfully');
      expect(mockUserLocationRepository.deleteUserLocation).toHaveBeenCalledWith(locationId, 'user1');
    });
  });

  describe('setPrimaryLocation', () => {
    it('should set location as primary successfully', async () => {
      const locationId = '1';
      const mockUpdatedLocation = {
        id: locationId,
        userId: 'user1',
        isPrimary: true,
      } as UserLocation;

      const mockRequest = { user: { id: 'user1' } };
      mockUserLocationRepository.setPrimaryLocation.mockResolvedValue(mockUpdatedLocation);

      const result = await controller.setPrimaryLocation(locationId, mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedLocation);
      expect(mockUserLocationRepository.setPrimaryLocation).toHaveBeenCalledWith(locationId, 'user1');
    });
  });
});
