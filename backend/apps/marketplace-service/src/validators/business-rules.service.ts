import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing, ListingCategory, User } from '@app/database';
import { CreateListingDto } from '../listings/dto/create-listing.dto';

@Injectable()
export class BusinessRulesService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(ListingCategory)
    private readonly categoryRepository: Repository<ListingCategory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Validate business rules for listing creation
   */
  async validateListingCreation(
    userId: string,
    createListingDto: CreateListingDto,
  ): Promise<void> {
    // Validate user exists and is active
    await this.validateUserExists(userId);

    // Validate category exists and matches listing type
    await this.validateCategory(createListingDto.categoryId, createListingDto.listingType);

    // Validate listing type specific rules
    await this.validateListingTypeRules(createListingDto);

    // Validate price rules
    this.validatePriceRules(createListingDto);

    // Validate location rules
    this.validateLocationRules(createListingDto);

    // Validate business rules
    await this.validateBusinessRules(userId, createListingDto);
  }

  /**
   * Validate user exists and is active
   */
  private async validateUserExists(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.isActive) {
      throw new BadRequestException('User account is not active');
    }
  }

  /**
   * Validate category exists and matches listing type
   */
  private async validateCategory(categoryId: number, listingType: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    if (category.listingType !== listingType) {
      throw new BadRequestException(
        `Category type '${category.listingType}' does not match listing type '${listingType}'`,
      );
    }
  }

  /**
   * Validate listing type specific rules
   */
  private async validateListingTypeRules(createListingDto: CreateListingDto): Promise<void> {
    switch (createListingDto.listingType) {
      case 'property':
        this.validatePropertyRules(createListingDto);
        break;
      case 'item':
        this.validateItemRules(createListingDto);
        break;
      case 'service':
        this.validateServiceRules(createListingDto);
        break;
      case 'job':
        this.validateJobRules(createListingDto);
        break;
    }
  }

  /**
   * Validate property-specific rules
   */
  private validatePropertyRules(createListingDto: CreateListingDto): void {
    if (!createListingDto.propertyType) {
      throw new BadRequestException('Property type is required for property listings');
    }

    if (createListingDto.bedrooms !== undefined && createListingDto.bedrooms < 0) {
      throw new BadRequestException('Number of bedrooms cannot be negative');
    }

    if (createListingDto.bathrooms !== undefined && createListingDto.bathrooms < 0) {
      throw new BadRequestException('Number of bathrooms cannot be negative');
    }

    if (createListingDto.propertySize !== undefined && createListingDto.propertySize <= 0) {
      throw new BadRequestException('Property size must be positive');
    }

    if (createListingDto.landSize !== undefined && createListingDto.landSize <= 0) {
      throw new BadRequestException('Land size must be positive');
    }

    // Validate property size is not larger than land size
    if (
      createListingDto.propertySize &&
      createListingDto.landSize &&
      createListingDto.propertySize > createListingDto.landSize
    ) {
      throw new BadRequestException('Property size cannot be larger than land size');
    }
  }

  /**
   * Validate item-specific rules
   */
  private validateItemRules(createListingDto: CreateListingDto): void {
    if (!createListingDto.condition) {
      throw new BadRequestException('Item condition is required for item listings');
    }

    if (createListingDto.brand && createListingDto.brand.length < 2) {
      throw new BadRequestException('Brand name must be at least 2 characters long');
    }
  }

  /**
   * Validate service-specific rules
   */
  private validateServiceRules(createListingDto: CreateListingDto): void {
    if (!createListingDto.serviceType) {
      throw new BadRequestException('Service type is required for service listings');
    }

    if (!createListingDto.pricingModel) {
      throw new BadRequestException('Pricing model is required for service listings');
    }

    if (createListingDto.serviceRadius !== undefined && createListingDto.serviceRadius <= 0) {
      throw new BadRequestException('Service radius must be positive');
    }

    if (createListingDto.responseTime !== undefined && createListingDto.responseTime <= 0) {
      throw new BadRequestException('Response time must be positive');
    }

    // Validate availability schedule if provided
    if (createListingDto.availabilitySchedule) {
      this.validateAvailabilitySchedule(createListingDto.availabilitySchedule);
    }
  }

  /**
   * Validate job-specific rules
   */
  private validateJobRules(createListingDto: CreateListingDto): void {
    if (!createListingDto.employmentType) {
      throw new BadRequestException('Employment type is required for job listings');
    }

    if (!createListingDto.workLocation) {
      throw new BadRequestException('Work location is required for job listings');
    }

    if (createListingDto.salaryMin !== undefined && createListingDto.salaryMax !== undefined) {
      if (createListingDto.salaryMin > createListingDto.salaryMax) {
        throw new BadRequestException('Minimum salary cannot be greater than maximum salary');
      }
    }

    if (createListingDto.applicationDeadline) {
      const deadline = new Date(createListingDto.applicationDeadline);
      const now = new Date();
      if (deadline <= now) {
        throw new BadRequestException('Application deadline must be in the future');
      }
    }

    if (createListingDto.requiredSkills && createListingDto.requiredSkills.length === 0) {
      throw new BadRequestException('At least one skill is required for job listings');
    }
  }

  /**
   * Validate price rules
   */
  private validatePriceRules(createListingDto: CreateListingDto): void {
    if (createListingDto.price <= 0) {
      throw new BadRequestException('Price must be positive');
    }

    // Validate maximum price limits based on listing type
    const maxPrices = {
      property: 1000000000, // 1 billion NGN
      item: 50000000, // 50 million NGN
      service: 10000000, // 10 million NGN
      job: 0, // Jobs don't have prices
    };

    if (createListingDto.listingType !== 'job' && createListingDto.price > maxPrices[createListingDto.listingType]) {
      throw new BadRequestException(
        `Price exceeds maximum allowed for ${createListingDto.listingType} listings`,
      );
    }
  }

  /**
   * Validate location rules
   */
  private validateLocationRules(createListingDto: CreateListingDto): void {
    const { latitude, longitude } = createListingDto.location;

    // Validate coordinates are within Nigeria bounds
    const nigeriaBounds = {
      minLat: 4.0,
      maxLat: 14.0,
      minLng: 2.5,
      maxLng: 15.0,
    };

    if (
      latitude < nigeriaBounds.minLat ||
      latitude > nigeriaBounds.maxLat ||
      longitude < nigeriaBounds.minLng ||
      longitude > nigeriaBounds.maxLng
    ) {
      throw new BadRequestException(
        'Location must be within Nigeria boundaries',
      );
    }
  }

  /**
   * Validate business rules
   */
  private async validateBusinessRules(createListingDto: CreateListingDto): Promise<void> {
    // Check for duplicate listings (same user, similar title, same location)
    const existingListing = await this.listingRepository.findOne({
      where: {
        userId: createListingDto.userId,
        title: createListingDto.title,
        latitude: createListingDto.location.latitude,
        longitude: createListingDto.location.longitude,
      },
    });

    if (existingListing) {
      throw new BadRequestException(
        'A listing with the same title and location already exists',
      );
    }

    // Validate user hasn't exceeded listing limits
    const userListingCount = await this.listingRepository.count({
      where: { userId: createListingDto.userId },
    });

    const maxListingsPerUser = 50; // Business rule
    if (userListingCount >= maxListingsPerUser) {
      throw new BadRequestException(
        'Maximum number of listings per user exceeded',
      );
    }
  }

  /**
   * Validate availability schedule
   */
  private validateAvailabilitySchedule(schedule: any): void {
    if (!schedule.days || !Array.isArray(schedule.days) || schedule.days.length === 0) {
      throw new BadRequestException('Availability days are required');
    }

    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const invalidDays = schedule.days.filter((day: string) => !validDays.includes(day));
    
    if (invalidDays.length > 0) {
      throw new BadRequestException(`Invalid days: ${invalidDays.join(', ')}`);
    }

    if (!schedule.startTime || !schedule.endTime) {
      throw new BadRequestException('Start time and end time are required');
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(schedule.startTime) || !timeRegex.test(schedule.endTime)) {
      throw new BadRequestException('Time must be in HH:MM format');
    }

    // Validate start time is before end time
    const startTime = new Date(`2000-01-01T${schedule.startTime}:00`);
    const endTime = new Date(`2000-01-01T${schedule.endTime}:00`);
    
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }
  }

  /**
   * Validate listing update rules
   */
  async validateListingUpdate(
    listingId: string,
    userId: string,
    updateData: Partial<CreateListingDto>,
  ): Promise<void> {
    // Validate listing exists and belongs to user
    const listing = await this.listingRepository.findOne({
      where: { id: listingId, userId },
    });

    if (!listing) {
      throw new BadRequestException('Listing not found or access denied');
    }

    // Validate listing is not expired
    if (listing.expiresAt && listing.expiresAt < new Date()) {
      throw new BadRequestException('Cannot update expired listing');
    }

    // Validate category if being updated
    if (updateData.categoryId) {
      await this.validateCategory(updateData.categoryId, updateData.listingType || listing.listingType);
    }

    // Validate price if being updated
    if (updateData.price !== undefined) {
      this.validatePriceRules({ ...createListingDto, price: updateData.price } as CreateListingDto);
    }
  }
}
