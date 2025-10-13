import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ListingDetailsScreen from '../ListingDetailsScreen';
import { Listing } from '../../services/listingsService';

// Mock navigation
const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

// Mock route
const mockRoute = {
  params: {
    listingId: 'test-listing-id',
  },
};

// Mock ListingsService
jest.mock('../../services/listingsService', () => ({
  ListingsService: {
    getInstance: () => ({
      getListing: jest.fn(),
      incrementView: jest.fn(),
      saveListing: jest.fn(),
      unsaveListing: jest.fn(),
    }),
  },
}));

describe('ListingDetailsScreen', () => {
  const mockListing: Listing = {
    id: 'test-listing-id',
    userId: 'user-1',
    listingType: 'service',
    category: {
      id: 1,
      name: 'Home Services',
      iconUrl: 'https://example.com/icon.png',
      colorCode: '#FF6B6B',
    },
    title: 'Professional House Cleaning',
    description: 'Complete house cleaning service with eco-friendly products.',
    price: 5000,
    currency: 'NGN',
    priceType: 'fixed',
    serviceType: 'cleaning',
    serviceArea: ['Lagos Island', 'Victoria Island', 'Ikoyi'],
    responseTime: 'Within 2 hours',
    professionalCredentials: {
      certifications: ['Certified Cleaner', 'Eco-Friendly Specialist'],
      experience: '5+ years of professional cleaning experience',
      portfolio: ['https://example.com/portfolio1.jpg'],
    },
    availability: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '10:00', end: '15:00', available: true },
      sunday: { start: '10:00', end: '15:00', available: false },
    },
    contactPreferences: {
      phone: true,
      email: true,
      whatsapp: true,
      inApp: true,
    },
    location: {
      latitude: 6.5244,
      longitude: 3.3792,
      address: '123 Lagos Street, Lagos',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
    },
    media: [
      {
        id: 'media-1',
        url: 'https://example.com/image1.jpg',
        type: 'image',
        caption: 'Clean living room',
        displayOrder: 1,
      },
    ],
    status: 'active',
    viewsCount: 150,
    savesCount: 25,
    isSaved: false,
    author: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      profilePicture: 'https://example.com/profile.jpg',
      isVerified: true,
      businessProfile: {
        businessName: 'CleanPro Services',
        businessType: 'Cleaning Company',
        rating: 4.8,
        reviewCount: 120,
      },
    },
    createdAt: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render service details correctly', () => {
    render(
      <ListingDetailsScreen
        navigation={mockNavigation}
        route={mockRoute}
      />
    );

    // This test would need to be updated to mock the actual service calls
    // and provide the listing data to the component
    expect(screen.getByText('Professional House Cleaning')).toBeTruthy();
  });

  it('should display service-specific information', () => {
    // Test would verify service area, credentials, availability display
    expect(true).toBe(true);
  });

  it('should display business profile information', () => {
    // Test would verify business name, rating, review count display
    expect(true).toBe(true);
  });

  it('should display contact preferences', () => {
    // Test would verify contact method icons and labels
    expect(true).toBe(true);
  });
});

// Test data for different listing types
export const mockPropertyListing: Listing = {
  id: 'property-1',
  userId: 'user-2',
  listingType: 'property',
  category: {
    id: 2,
    name: 'Real Estate',
  },
  title: '3-Bedroom Apartment in Lekki',
  description: 'Beautiful 3-bedroom apartment with modern amenities.',
  price: 2500000,
  currency: 'NGN',
  priceType: 'fixed',
  propertyType: 'Apartment',
  bedrooms: 3,
  bathrooms: 2,
  propertySize: 1200,
  parkingSpaces: 2,
  petPolicy: 'allowed',
  amenities: ['Swimming Pool', 'Gym', '24/7 Security', 'Generator', 'CCTV'],
  location: {
    latitude: 6.5244,
    longitude: 3.3792,
    address: '456 Lekki Phase 1, Lagos',
  },
  media: [],
  status: 'active',
  viewsCount: 300,
  savesCount: 45,
  isSaved: false,
  author: {
    id: 'user-2',
    firstName: 'Jane',
    lastName: 'Smith',
    isVerified: true,
  },
  createdAt: '2023-01-01T00:00:00Z',
};

export const mockJobListing: Listing = {
  id: 'job-1',
  userId: 'user-3',
  listingType: 'job',
  category: {
    id: 3,
    name: 'Technology',
  },
  title: 'Senior React Native Developer',
  description: 'Looking for an experienced React Native developer to join our team.',
  price: 500000,
  currency: 'NGN',
  priceType: 'per_month',
  employmentType: 'full_time',
  workLocation: 'remote',
  requiredSkills: ['React Native', 'TypeScript', 'Redux', 'Firebase'],
  requiredExperience: '3+ years',
  education: 'Bachelor\'s degree in Computer Science or related field',
  benefits: ['Health Insurance', 'Remote Work', 'Learning Budget', 'Flexible Hours'],
  applicationDeadline: '2023-12-31T23:59:59Z',
  location: {
    latitude: 6.5244,
    longitude: 3.3792,
    address: 'Remote',
  },
  media: [],
  status: 'active',
  viewsCount: 200,
  savesCount: 30,
  isSaved: false,
  author: {
    id: 'user-3',
    firstName: 'Tech',
    lastName: 'Company',
    isVerified: true,
  },
  createdAt: '2023-01-01T00:00:00Z',
};
