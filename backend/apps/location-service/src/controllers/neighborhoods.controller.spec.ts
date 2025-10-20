import { Test, TestingModule } from '@nestjs/testing';
import { NeighborhoodsController } from './neighborhoods.controller';
import { NeighborhoodsService } from '../services/neighborhoods.service';
import { GoogleMapsService } from '@app/common/services/google-maps.service';

describe('NeighborhoodsController', () => {
  let controller: NeighborhoodsController;
  let service: NeighborhoodsService;

  const mockNeighborhoodsService = {
    getNeighborhoodsByWard: jest.fn(),
    searchNeighborhoods: jest.fn(),
    recommendNeighborhoods: jest.fn(),
    getNeighborhoodById: jest.fn(),
    createNeighborhood: jest.fn(),
    updateNeighborhood: jest.fn(),
    deleteNeighborhood: jest.fn(),
  };

  const mockGoogleMapsService = {
    getAdministrativeArea: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NeighborhoodsController],
      providers: [
        {
          provide: NeighborhoodsService,
          useValue: mockNeighborhoodsService,
        },
        {
          provide: GoogleMapsService,
          useValue: mockGoogleMapsService,
        },
      ],
    }).compile();

    controller = module.get<NeighborhoodsController>(NeighborhoodsController);
    service = module.get<NeighborhoodsService>(NeighborhoodsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('recommendNeighborhoods', () => {
    it('should return recommendations successfully', async () => {
      const mockRecommendations = {
        detectedLocation: {
          state: 'Lagos',
          lga: 'Eti-Osa',
          city: 'Lagos',
        },
        recommendations: [
          {
            neighborhood: {
              id: '1',
              name: 'Victoria Island',
              type: 'AREA',
            },
            distance: 1000,
            landmarks: [],
            memberCount: 0,
          },
        ],
      };

      mockNeighborhoodsService.recommendNeighborhoods.mockResolvedValue(mockRecommendations);

      const result = await controller.recommendNeighborhoods({
        latitude: 6.4281,
        longitude: 3.4219,
        radius: 5000,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRecommendations);
      expect(mockNeighborhoodsService.recommendNeighborhoods).toHaveBeenCalledWith(
        6.4281,
        3.4219,
        5000,
        10
      );
    });

    it('should handle service errors gracefully', async () => {
      mockNeighborhoodsService.recommendNeighborhoods.mockRejectedValue(new Error('Database error'));

      const result = await controller.recommendNeighborhoods({
        latitude: 6.4281,
        longitude: 3.4219,
        radius: 5000,
        limit: 10,
      });

      expect(result.success).toBe(false);
      expect(result.data).toEqual({
        detectedLocation: {
          state: 'Unknown',
          lga: 'Unknown',
          city: 'Unknown',
        },
        recommendations: [],
      });
      expect(result.message).toBe('Failed to generate recommendations');
    });
  });

  describe('getNeighborhoods', () => {
    it('should return neighborhoods by ward successfully', async () => {
      const mockNeighborhoods = [
        {
          id: '1',
          name: 'Victoria Island',
          type: 'AREA',
          wardId: 'ward1',
        },
      ];

      mockNeighborhoodsService.getNeighborhoodsByWard.mockResolvedValue(mockNeighborhoods);

      const result = await controller.getNeighborhoods('ward1', 'AREA', false, false);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockNeighborhoods);
      expect(result.count).toBe(1);
      expect(mockNeighborhoodsService.getNeighborhoodsByWard).toHaveBeenCalledWith(
        'ward1',
        { type: 'AREA', isGated: false, includeSubNeighborhoods: false }
      );
    });

    it('should return empty array when no ward specified', async () => {
      const result = await controller.getNeighborhoods();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
      expect(result.message).toBe('No ward specified');
    });

    it('should handle service errors gracefully', async () => {
      mockNeighborhoodsService.getNeighborhoodsByWard.mockRejectedValue(new Error('Database error'));

      const result = await controller.getNeighborhoods('ward1');

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.message).toBe('Failed to fetch neighborhoods');
    });
  });
});
