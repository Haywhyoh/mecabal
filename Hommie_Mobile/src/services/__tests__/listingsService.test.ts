import { ListingsService } from '../listingsService';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ListingsService', () => {
  let listingsService: ListingsService;

  beforeEach(() => {
    listingsService = ListingsService.getInstance();
    jest.clearAllMocks();
  });

  describe('getListings', () => {
    it('should fetch listings successfully', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            title: 'Test Listing',
            price: 100,
            listingType: 'item' as const,
            category: { id: 1, name: 'Electronics' },
            author: { id: '1', firstName: 'John', lastName: 'Doe', isVerified: true },
            location: { latitude: 0, longitude: 0, address: 'Test Address' },
            media: [],
            status: 'active' as const,
            viewsCount: 0,
            savesCount: 0,
            isSaved: false,
            createdAt: '2023-01-01T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await listingsService.getListings();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/listings'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle network errors with retry', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [], total: 0, page: 1, limit: 20, totalPages: 0, hasNext: false, hasPrev: false }),
        });

      const result = await listingsService.getListings();

      expect(result).toBeDefined();
      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial call + 2 retries
    });

    it('should handle offline state', async () => {
      // Mock NetInfo to return offline
      const { fetch: mockNetInfoFetch } = require('@react-native-community/netinfo');
      mockNetInfoFetch.mockResolvedValueOnce({ isConnected: false });

      await expect(listingsService.getListings()).rejects.toThrow(
        'No internet connection. Please check your network and try again.'
      );
    });

    it('should handle 4xx errors without retry', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Listing not found' }),
      });

      await expect(listingsService.getListings()).rejects.toThrow('Listing not found');
      expect(global.fetch).toHaveBeenCalledTimes(1); // No retry for 4xx errors
    });
  });

  describe('createListing', () => {
    it('should create listing successfully', async () => {
      const mockListing = {
        id: '1',
        title: 'Test Listing',
        price: 100,
        listingType: 'item' as const,
        category: { id: 1, name: 'Electronics' },
        author: { id: '1', firstName: 'John', lastName: 'Doe', isVerified: true },
        location: { latitude: 0, longitude: 0, address: 'Test Address' },
        media: [],
        status: 'active' as const,
        viewsCount: 0,
        savesCount: 0,
        isSaved: false,
        createdAt: '2023-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
      });

      const createData = {
        listingType: 'item' as const,
        categoryId: 1,
        title: 'Test Listing',
        description: 'Test Description',
        price: 100,
        priceType: 'fixed' as const,
        location: { latitude: 0, longitude: 0, address: 'Test Address' },
      };

      const result = await listingsService.createListing(createData);

      expect(result).toEqual(mockListing);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/listings'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(createData),
        })
      );
    });
  });

  describe('searchListings', () => {
    it('should search listings with query', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await listingsService.searchListings('test query');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test%20query'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });
});
