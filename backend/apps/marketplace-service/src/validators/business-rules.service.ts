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
    console.log('🔍 BusinessRulesService - Starting validation with data:', {
      userId,
      categoryId: createListingDto.categoryId,
      listingType: createListingDto.listingType,
      propertyType: createListingDto.propertyType,
      location: createListingDto.location
    });

    // Validate user exists and is active, get user with neighborhood data
    console.log('🔍 BusinessRulesService - Validating user exists...');
    const user = await this.validateUserExists(userId);
    console.log('✅ BusinessRulesService - User validation passed');

    // Auto-fill location from user's primary neighborhood if coordinates are (0,0)
    if (createListingDto.location.latitude === 0 && createListingDto.location.longitude === 0) {
      console.log('🔍 BusinessRulesService - Location is (0,0), attempting to use primary neighborhood...');
      const primaryNeighborhood = user.userNeighborhoods?.find((un: any) => un.isPrimary)?.neighborhood;

      if (primaryNeighborhood) {
        createListingDto.location.latitude = Number(primaryNeighborhood.centerLatitude);
        createListingDto.location.longitude = Number(primaryNeighborhood.centerLongitude);
        console.log('✅ BusinessRulesService - Using primary neighborhood coordinates:', {
          neighborhood: primaryNeighborhood.name,
          latitude: createListingDto.location.latitude,
          longitude: createListingDto.location.longitude
        });
      } else {
        console.log('⚠️ BusinessRulesService - No primary neighborhood found for user');
      }
    }

    // Validate category exists and matches listing type
    console.log('🔍 BusinessRulesService - Validating category...');
    await this.validateCategory(createListingDto.categoryId, createListingDto.listingType);
    console.log('✅ BusinessRulesService - Category validation passed');

    // Validate listing type specific rules
    console.log('🔍 BusinessRulesService - Validating listing type rules...');
    await this.validateListingTypeRules(createListingDto);
    console.log('✅ BusinessRulesService - Listing type rules validation passed');

    // Validate price rules
    console.log('🔍 BusinessRulesService - Validating price rules...');
    this.validatePriceRules(createListingDto);
    console.log('✅ BusinessRulesService - Price rules validation passed');

    // Validate location rules (after potentially updating from neighborhood)
    console.log('🔍 BusinessRulesService - Validating location rules...');
    this.validateLocationRules(createListingDto, user);
    console.log('✅ BusinessRulesService - Location rules validation passed');

    // Validate business rules
    console.log('🔍 BusinessRulesService - Validating business rules...');
    await this.validateBusinessRules(userId, createListingDto);
    console.log('✅ BusinessRulesService - Business rules validation passed');

    console.log('✅ BusinessRulesService - All validations passed');
  }

  /**
   * Validate user exists and is active, and return user with neighborhood data
   */
  private async validateUserExists(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userNeighborhoods', 'userNeighborhoods.neighborhood'],
    });

    if (!user) {
      throw new BadRequestException({
        message: 'User not found',
        error: 'USER_NOT_FOUND',
        details: `The user with ID '${userId}' does not exist in the system. Please ensure you are logged in with a valid account.`,
        suggestion: 'Please log out and log back in, or contact support if the issue persists.',
        receivedUserId: userId,
      });
    }

    if (!user.isActive) {
      throw new BadRequestException({
        message: 'User account is not active',
        error: 'USER_INACTIVE',
        details: `Your account (${user.firstName} ${user.lastName}) has been deactivated. This may be due to policy violations or administrative action.`,
        suggestion: 'Please contact our support team at support@mecabal.com to reactivate your account.',
        userInfo: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      });
    }

    return user;
  }

  /**
   * Validate category exists and matches listing type
   */
  private async validateCategory(categoryId: number, listingType: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new BadRequestException({
        message: 'Category not found',
        error: 'CATEGORY_NOT_FOUND',
        details: `The category with ID '${categoryId}' does not exist in the system. Please select a valid category from the available options.`,
        suggestion: 'Refresh the page to get the latest category list, or contact support if the issue persists.',
        receivedCategoryId: categoryId,
      });
    }

    if (category.listingType !== listingType) {
      throw new BadRequestException({
        message: 'Category type mismatch',
        error: 'CATEGORY_TYPE_MISMATCH',
        details: `The selected category '${category.name}' is for '${category.listingType}' listings, but you're trying to create a '${listingType}' listing.`,
        suggestion: `Please select a category that matches your listing type (${listingType}) or change your listing type to match the selected category.`,
        receivedData: {
          categoryId,
          categoryName: category.name,
          categoryType: category.listingType,
          listingType,
        },
      });
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
    }
  }

  /**
   * Validate property-specific rules
   */
  private validatePropertyRules(createListingDto: CreateListingDto): void {
    if (!createListingDto.propertyType) {
      throw new BadRequestException({
        message: 'Property type is required',
        error: 'MISSING_PROPERTY_TYPE',
        details: 'Property type must be specified for property listings. Choose from: apartment, house, land, commercial, or other.',
        suggestion: 'Please select the appropriate property type from the dropdown menu.',
        receivedData: {
          listingType: createListingDto.listingType,
          propertyType: createListingDto.propertyType,
        },
      });
    }

    if (createListingDto.bedrooms !== undefined && createListingDto.bedrooms < 0) {
      throw new BadRequestException({
        message: 'Invalid bedroom count',
        error: 'INVALID_BEDROOM_COUNT',
        details: `Number of bedrooms cannot be negative. You provided: ${createListingDto.bedrooms}`,
        suggestion: 'Please enter a valid number of bedrooms (0 or more).',
        receivedValue: createListingDto.bedrooms,
      });
    }

    if (createListingDto.bathrooms !== undefined && createListingDto.bathrooms < 0) {
      throw new BadRequestException({
        message: 'Invalid bathroom count',
        error: 'INVALID_BATHROOM_COUNT',
        details: `Number of bathrooms cannot be negative. You provided: ${createListingDto.bathrooms}`,
        suggestion: 'Please enter a valid number of bathrooms (0 or more).',
        receivedValue: createListingDto.bathrooms,
      });
    }

    if (createListingDto.propertySize !== undefined && createListingDto.propertySize <= 0) {
      throw new BadRequestException({
        message: 'Invalid property size',
        error: 'INVALID_PROPERTY_SIZE',
        details: `Property size must be positive. You provided: ${createListingDto.propertySize} square meters`,
        suggestion: 'Please enter a valid property size in square meters.',
        receivedValue: createListingDto.propertySize,
      });
    }

    if (createListingDto.landSize !== undefined && createListingDto.landSize <= 0) {
      throw new BadRequestException({
        message: 'Invalid land size',
        error: 'INVALID_LAND_SIZE',
        details: `Land size must be positive. You provided: ${createListingDto.landSize} square meters`,
        suggestion: 'Please enter a valid land size in square meters.',
        receivedValue: createListingDto.landSize,
      });
    }

    // Validate property size is not larger than land size
    if (
      createListingDto.propertySize &&
      createListingDto.landSize &&
      createListingDto.propertySize > createListingDto.landSize
    ) {
      throw new BadRequestException({
        message: 'Property size exceeds land size',
        error: 'PROPERTY_SIZE_EXCEEDS_LAND',
        details: `Property size (${createListingDto.propertySize} sqm) cannot be larger than land size (${createListingDto.landSize} sqm).`,
        suggestion: 'Please ensure the property size is not larger than the total land size.',
        receivedData: {
          propertySize: createListingDto.propertySize,
          landSize: createListingDto.landSize,
        },
      });
    }
  }

  /**
   * Validate item-specific rules
   */
  private validateItemRules(createListingDto: CreateListingDto): void {
    if (!createListingDto.condition) {
      throw new BadRequestException({
        message: 'Item condition is required',
        error: 'MISSING_ITEM_CONDITION',
        details: 'Item condition must be specified for item listings. Choose from: new, like-new, good, fair, or poor.',
        suggestion: 'Please select the appropriate condition for your item from the dropdown menu.',
        receivedData: {
          listingType: createListingDto.listingType,
          condition: createListingDto.condition,
        },
      });
    }

    if (createListingDto.brand && createListingDto.brand.length < 2) {
      throw new BadRequestException({
        message: 'Brand name too short',
        error: 'INVALID_BRAND_LENGTH',
        details: `Brand name must be at least 2 characters long. You provided: '${createListingDto.brand}' (${createListingDto.brand.length} characters)`,
        suggestion: 'Please enter a valid brand name with at least 2 characters, or leave it empty if not applicable.',
        receivedValue: createListingDto.brand,
        minLength: 2,
      });
    }
  }

  /**
   * Validate service-specific rules
   */
  private validateServiceRules(createListingDto: CreateListingDto): void {
    if (!createListingDto.serviceType) {
      throw new BadRequestException({
        message: 'Service type is required',
        error: 'MISSING_SERVICE_TYPE',
        details: 'Service type must be specified for service listings. Choose from: cleaning, maintenance, consulting, delivery, or other.',
        suggestion: 'Please select the appropriate service type from the dropdown menu.',
        receivedData: {
          listingType: createListingDto.listingType,
          serviceType: createListingDto.serviceType,
        },
      });
    }

    if (!createListingDto.pricingModel) {
      throw new BadRequestException({
        message: 'Pricing model is required',
        error: 'MISSING_PRICING_MODEL',
        details: 'Pricing model must be specified for service listings. Choose from: hourly, fixed, per-project, or negotiable.',
        suggestion: 'Please select how you want to price your service from the dropdown menu.',
        receivedData: {
          listingType: createListingDto.listingType,
          pricingModel: createListingDto.pricingModel,
        },
      });
    }

    if (createListingDto.serviceRadius !== undefined && createListingDto.serviceRadius <= 0) {
      throw new BadRequestException({
        message: 'Invalid service radius',
        error: 'INVALID_SERVICE_RADIUS',
        details: `Service radius must be positive. You provided: ${createListingDto.serviceRadius} km`,
        suggestion: 'Please enter a valid service radius in kilometers (e.g., 5 for 5km radius).',
        receivedValue: createListingDto.serviceRadius,
      });
    }

    if (createListingDto.responseTime !== undefined && createListingDto.responseTime <= 0) {
      throw new BadRequestException({
        message: 'Invalid response time',
        error: 'INVALID_RESPONSE_TIME',
        details: `Response time must be positive. You provided: ${createListingDto.responseTime} hours`,
        suggestion: 'Please enter a valid response time in hours (e.g., 24 for 24 hours).',
        receivedValue: createListingDto.responseTime,
      });
    }

    // Validate availability schedule if provided
    if (createListingDto.availabilitySchedule) {
      this.validateAvailabilitySchedule(createListingDto.availabilitySchedule);
    }
  }


  /**
   * Validate price rules
   */
  private validatePriceRules(createListingDto: CreateListingDto): void {
    if (createListingDto.price <= 0) {
      throw new BadRequestException({
        message: 'Price must be positive',
        error: 'INVALID_PRICE',
        details: `Price must be greater than 0. You provided: ₦${createListingDto.price.toLocaleString()}`,
        suggestion: 'Please enter a valid price for your listing.',
        receivedValue: createListingDto.price,
      });
    }

    // Validate maximum price limits based on listing type
    const maxPrices = {
      property: 1000000000, // 1 billion NGN
      item: 50000000, // 50 million NGN
      service: 10000000, // 10 million NGN
    };

    if (createListingDto.price > maxPrices[createListingDto.listingType]) {
      throw new BadRequestException({
        message: 'Price exceeds maximum allowed',
        error: 'PRICE_EXCEEDS_MAXIMUM',
        details: `Price (₦${createListingDto.price.toLocaleString()}) exceeds the maximum allowed for ${createListingDto.listingType} listings (₦${maxPrices[createListingDto.listingType].toLocaleString()}).`,
        suggestion: `Please reduce the price to be within the maximum limit of ₦${maxPrices[createListingDto.listingType].toLocaleString()} for ${createListingDto.listingType} listings.`,
        receivedData: {
          listingType: createListingDto.listingType,
          price: createListingDto.price,
          maxPrice: maxPrices[createListingDto.listingType],
        },
      });
    }
  }

  /**
   * Validate location rules
   */
  private validateLocationRules(createListingDto: CreateListingDto, user?: any): void {
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
      // Provide detailed error message
      const primaryNeighborhood = user?.userNeighborhoods?.find((un: any) => un.isPrimary)?.neighborhood;
      const neighborhoodInfo = primaryNeighborhood
        ? ` Your primary neighborhood is ${primaryNeighborhood.name} (${primaryNeighborhood.centerLatitude}, ${primaryNeighborhood.centerLongitude}).`
        : ' Please ensure you have set up your primary neighborhood in your profile.';

      throw new BadRequestException({
        message: 'Location must be within Nigeria boundaries',
        error: 'INVALID_LOCATION',
        details: `The provided coordinates (${latitude}, ${longitude}) are outside Nigeria's geographic boundaries. Valid coordinates must be within: Latitude ${nigeriaBounds.minLat} to ${nigeriaBounds.maxLat}, Longitude ${nigeriaBounds.minLng} to ${nigeriaBounds.maxLng}.${neighborhoodInfo}`,
        suggestion: 'Enable location services on your device or manually select your location from the map.',
        receivedCoordinates: { latitude, longitude },
        validBounds: nigeriaBounds,
      });
    }
  }

  /**
   * Validate business rules
   */
  private async validateBusinessRules(userId: string, createListingDto: CreateListingDto): Promise<void> {
    // Check for duplicate listings (same user, similar title, same location)
    const existingListing = await this.listingRepository.findOne({
      where: {
        userId: userId,
        title: createListingDto.title,
        latitude: createListingDto.location.latitude,
        longitude: createListingDto.location.longitude,
      },
    });

    if (existingListing) {
      throw new BadRequestException({
        message: 'Duplicate listing found',
        error: 'DUPLICATE_LISTING',
        details: `A listing with the same title '${createListingDto.title}' and location (${createListingDto.location.latitude}, ${createListingDto.location.longitude}) already exists.`,
        suggestion: 'Please modify the title or location to make this listing unique, or update your existing listing instead.',
        receivedData: {
          title: createListingDto.title,
          location: createListingDto.location,
          existingListingId: existingListing.id,
        },
      });
    }

    // Validate user hasn't exceeded listing limits
    const userListingCount = await this.listingRepository.count({
      where: { userId: userId },
    });

    const maxListingsPerUser = 50; // Business rule
    if (userListingCount >= maxListingsPerUser) {
      throw new BadRequestException({
        message: 'Maximum number of listings exceeded',
        error: 'LISTING_LIMIT_EXCEEDED',
        details: `You have reached the maximum limit of ${maxListingsPerUser} listings per user. You currently have ${userListingCount} listings.`,
        suggestion: 'Please delete some of your existing listings before creating new ones, or contact support to request a limit increase.',
        receivedData: {
          currentCount: userListingCount,
          maxAllowed: maxListingsPerUser,
        },
      });
    }
  }

  /**
   * Validate availability schedule
   */
  private validateAvailabilitySchedule(schedule: any): void {
    if (!schedule.days || !Array.isArray(schedule.days) || schedule.days.length === 0) {
      throw new BadRequestException({
        message: 'Availability days are required',
        error: 'MISSING_AVAILABILITY_DAYS',
        details: 'At least one day must be specified for availability schedule.',
        suggestion: 'Please select the days when you are available to provide the service.',
        receivedData: {
          days: schedule.days,
        },
      });
    }

    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const invalidDays = schedule.days.filter((day: string) => !validDays.includes(day));
    
    if (invalidDays.length > 0) {
      throw new BadRequestException({
        message: 'Invalid availability days',
        error: 'INVALID_AVAILABILITY_DAYS',
        details: `Invalid days provided: ${invalidDays.join(', ')}. Valid days are: ${validDays.join(', ')}.`,
        suggestion: 'Please select only valid days of the week for your availability.',
        receivedData: {
          invalidDays,
          validDays,
        },
      });
    }

    if (!schedule.startTime || !schedule.endTime) {
      throw new BadRequestException({
        message: 'Start time and end time are required',
        error: 'MISSING_TIME_RANGE',
        details: 'Both start time and end time must be specified for availability schedule.',
        suggestion: 'Please provide both start and end times for your availability.',
        receivedData: {
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        },
      });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(schedule.startTime) || !timeRegex.test(schedule.endTime)) {
      throw new BadRequestException({
        message: 'Invalid time format',
        error: 'INVALID_TIME_FORMAT',
        details: `Time must be in HH:MM format (24-hour). You provided: startTime='${schedule.startTime}', endTime='${schedule.endTime}'`,
        suggestion: 'Please use 24-hour format for times (e.g., 09:00, 17:30).',
        receivedData: {
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          expectedFormat: 'HH:MM (24-hour)',
        },
      });
    }

    // Validate start time is before end time
    const startTime = new Date(`2000-01-01T${schedule.startTime}:00`);
    const endTime = new Date(`2000-01-01T${schedule.endTime}:00`);
    
    if (startTime >= endTime) {
      throw new BadRequestException({
        message: 'Start time must be before end time',
        error: 'INVALID_TIME_RANGE',
        details: `Start time (${schedule.startTime}) must be before end time (${schedule.endTime}).`,
        suggestion: 'Please ensure the start time is earlier than the end time.',
        receivedData: {
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        },
      });
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
      throw new BadRequestException({
        message: 'Listing not found or access denied',
        error: 'LISTING_NOT_FOUND_OR_ACCESS_DENIED',
        details: `The listing with ID '${listingId}' either does not exist or you don't have permission to update it.`,
        suggestion: 'Please ensure the listing ID is correct and that you are the owner of this listing.',
        receivedData: {
          listingId,
          userId,
        },
      });
    }

    // Validate listing is not expired
    if (listing.expiresAt && listing.expiresAt < new Date()) {
      throw new BadRequestException({
        message: 'Cannot update expired listing',
        error: 'CANNOT_UPDATE_EXPIRED_LISTING',
        details: `This listing expired on ${listing.expiresAt.toLocaleDateString()}. Expired listings cannot be updated.`,
        suggestion: 'If you want to continue offering this item/service, please create a new listing.',
        receivedData: {
          listingId,
          expiresAt: listing.expiresAt,
          currentDate: new Date(),
        },
      });
    }

    // Validate category if being updated
    if (updateData.categoryId) {
      await this.validateCategory(updateData.categoryId, updateData.listingType || listing.listingType);
    }

    // Validate price if being updated
    if (updateData.price !== undefined) {
      const priceData = { ...updateData, listingType: listing.listingType } as CreateListingDto;
      this.validatePriceRules(priceData);
    }
  }
}
