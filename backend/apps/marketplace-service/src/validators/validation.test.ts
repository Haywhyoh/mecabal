import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ValidationPipe } from './validation.pipe';
import { CreateListingDto } from '../listings/dto/create-listing.dto';

describe('ValidationPipe', () => {
  let pipe: ValidationPipe;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidationPipe],
    }).compile();

    pipe = module.get<ValidationPipe>(ValidationPipe);
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should validate a valid CreateListingDto', async () => {
    const validDto = {
      listingType: 'property',
      categoryId: 1,
      title: 'Beautiful 3-Bedroom Apartment in Lekki',
      description: 'Spacious 3-bedroom apartment with modern amenities, located in the heart of Lekki Phase 1.',
      price: 2500000,
      currency: 'NGN',
      priceType: 'fixed',
      propertyType: 'apartment',
      bedrooms: 3,
      bathrooms: 2,
      location: {
        latitude: 6.4654,
        longitude: 3.5656,
        address: 'Lekki Phase 1, Lagos',
      },
    };

    const result = await pipe.transform(validDto, { metatype: CreateListingDto, type: 'body' });
    expect(result).toBeDefined();
    expect(result.listingType).toBe('property');
  });

  it('should reject invalid price', async () => {
    const invalidDto = {
      listingType: 'property',
      categoryId: 1,
      title: 'Beautiful 3-Bedroom Apartment in Lekki',
      description: 'Spacious 3-bedroom apartment with modern amenities.',
      price: -1000, // Invalid negative price
      currency: 'NGN',
      priceType: 'fixed',
      location: {
        latitude: 6.4654,
        longitude: 3.5656,
        address: 'Lekki Phase 1, Lagos',
      },
    };

    await expect(
      pipe.transform(invalidDto, { metatype: CreateListingDto, type: 'body' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject invalid coordinates', async () => {
    const invalidDto = {
      listingType: 'property',
      categoryId: 1,
      title: 'Beautiful 3-Bedroom Apartment in Lekki',
      description: 'Spacious 3-bedroom apartment with modern amenities.',
      price: 2500000,
      currency: 'NGN',
      priceType: 'fixed',
      location: {
        latitude: 200, // Invalid latitude
        longitude: 3.5656,
        address: 'Lekki Phase 1, Lagos',
      },
    };

    await expect(
      pipe.transform(invalidDto, { metatype: CreateListingDto, type: 'body' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject invalid salary range', async () => {
    const invalidDto = {
      listingType: 'job',
      categoryId: 1,
      title: 'Senior React Developer',
      description: 'We are looking for an experienced React developer.',
      price: 0,
      currency: 'NGN',
      priceType: 'fixed',
      employmentType: 'full_time',
      workLocation: 'remote',
      salaryMin: 1000000, // Min greater than max
      salaryMax: 500000,
      requiredSkills: ['React', 'JavaScript'],
      location: {
        latitude: 6.4654,
        longitude: 3.5656,
        address: 'Lagos',
      },
    };

    await expect(
      pipe.transform(invalidDto, { metatype: CreateListingDto, type: 'body' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject invalid property size', async () => {
    const invalidDto = {
      listingType: 'property',
      categoryId: 1,
      title: 'Beautiful 3-Bedroom Apartment in Lekki',
      description: 'Spacious 3-bedroom apartment with modern amenities.',
      price: 2500000,
      currency: 'NGN',
      priceType: 'fixed',
      propertyType: 'apartment',
      propertySize: 50000, // Invalid size (too large)
      location: {
        latitude: 6.4654,
        longitude: 3.5656,
        address: 'Lekki Phase 1, Lagos',
      },
    };

    await expect(
      pipe.transform(invalidDto, { metatype: CreateListingDto, type: 'body' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject invalid service radius', async () => {
    const invalidDto = {
      listingType: 'service',
      categoryId: 1,
      title: 'Professional Home Cleaning Services',
      description: 'Experienced cleaning team offering comprehensive home cleaning services.',
      price: 15000,
      currency: 'NGN',
      priceType: 'starting_from',
      serviceType: 'offering',
      serviceRadius: 500, // Invalid radius (too large)
      pricingModel: 'project',
      location: {
        latitude: 6.4654,
        longitude: 3.5656,
        address: 'Lagos',
      },
    };

    await expect(
      pipe.transform(invalidDto, { metatype: CreateListingDto, type: 'body' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject invalid response time', async () => {
    const invalidDto = {
      listingType: 'service',
      categoryId: 1,
      title: 'Professional Home Cleaning Services',
      description: 'Experienced cleaning team offering comprehensive home cleaning services.',
      price: 15000,
      currency: 'NGN',
      priceType: 'starting_from',
      serviceType: 'offering',
      responseTime: 200, // Invalid response time (too large)
      pricingModel: 'project',
      location: {
        latitude: 6.4654,
        longitude: 3.5656,
        address: 'Lagos',
      },
    };

    await expect(
      pipe.transform(invalidDto, { metatype: CreateListingDto, type: 'body' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject invalid skills array', async () => {
    const invalidDto = {
      listingType: 'job',
      categoryId: 1,
      title: 'Senior React Developer',
      description: 'We are looking for an experienced React developer.',
      price: 0,
      currency: 'NGN',
      priceType: 'fixed',
      employmentType: 'full_time',
      workLocation: 'remote',
      requiredSkills: ['', '   ', null], // Invalid skills
      location: {
        latitude: 6.4654,
        longitude: 3.5656,
        address: 'Lagos',
      },
    };

    await expect(
      pipe.transform(invalidDto, { metatype: CreateListingDto, type: 'body' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject past application deadline', async () => {
    const invalidDto = {
      listingType: 'job',
      categoryId: 1,
      title: 'Senior React Developer',
      description: 'We are looking for an experienced React developer.',
      price: 0,
      currency: 'NGN',
      priceType: 'fixed',
      employmentType: 'full_time',
      workLocation: 'remote',
      applicationDeadline: '2020-01-01T00:00:00Z', // Past date
      requiredSkills: ['React', 'JavaScript'],
      location: {
        latitude: 6.4654,
        longitude: 3.5656,
        address: 'Lagos',
      },
    };

    await expect(
      pipe.transform(invalidDto, { metatype: CreateListingDto, type: 'body' }),
    ).rejects.toThrow(BadRequestException);
  });
});
