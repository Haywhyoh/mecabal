import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  Listing,
  ListingCategory,
  ListingMedia,
  ListingSave,
  User,
} from '@app/database';
import {
  CreateListingDto,
  UpdateListingDto,
  ListingFilterDto,
  ListingResponseDto,
  PaginatedListingsResponseDto,
  ListingStatus,
} from './dto';
import { BusinessRulesService } from '../validators/business-rules.service';
import { DataIntegrityService } from '../validators/data-integrity.service';
import { ListingCacheStrategy } from '../cache/strategies/listing-cache.strategy';
import { CacheInvalidationService } from '../cache/services/cache-invalidation.service';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(ListingCategory)
    private readonly categoryRepository: Repository<ListingCategory>,
    @InjectRepository(ListingMedia)
    private readonly mediaRepository: Repository<ListingMedia>,
    @InjectRepository(ListingSave)
    private readonly saveRepository: Repository<ListingSave>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly businessRulesService: BusinessRulesService,
    private readonly dataIntegrityService: DataIntegrityService,
    private readonly listingCacheStrategy: ListingCacheStrategy,
    private readonly cacheInvalidationService: CacheInvalidationService,
  ) {}

  async create(
    userId: string,
    neighborhoodId: string,
    createListingDto: CreateListingDto,
  ): Promise<ListingResponseDto> {
    // Add user ID to DTO for validation
    const listingData = { ...createListingDto, userId, neighborhoodId };

    // Comprehensive validation
    await this.businessRulesService.validateListingCreation(userId, createListingDto);
    await this.dataIntegrityService.validateListingIntegrity(listingData);

    // Reject job listings
    if (createListingDto.listingType === 'job' as any) {
      throw new BadRequestException({
        message: 'Job listings are no longer supported in Marketplace',
        error: 'JOB_LISTINGS_DEPRECATED',
        details: 'Job listings have been moved to Community Help "Tasks" feature.',
        suggestion: 'Please use the Community Help section to post job opportunities or tasks.',
        receivedData: {
          listingType: createListingDto.listingType,
          alternative: 'Use Community Help "Tasks" category instead'
        },
      });
    }

    // Validate category
    const category = await this.categoryRepository.findOne({
      where: { id: createListingDto.categoryId, isActive: true },
    });

    if (!category) {
      throw new BadRequestException({
        message: 'Invalid category ID',
        error: 'INVALID_CATEGORY_ID',
        details: `The category with ID '${createListingDto.categoryId}' does not exist or is not active.`,
        suggestion: 'Please select a valid category from the available options.',
        receivedCategoryId: createListingDto.categoryId,
      });
    }

    // Validate listing type matches category type
    if (category.listingType !== createListingDto.listingType) {
      throw new BadRequestException({
        message: 'Category type mismatch',
        error: 'CATEGORY_TYPE_MISMATCH',
        details: `The selected category '${category.name}' is for '${category.listingType}' listings, but you're trying to create a '${createListingDto.listingType}' listing.`,
        suggestion: `Please select a category that matches your listing type (${createListingDto.listingType}) or change your listing type to match the selected category.`,
        receivedData: {
          categoryId: createListingDto.categoryId,
          categoryName: category.name,
          categoryType: category.listingType,
          listingType: createListingDto.listingType,
        },
      });
    }

    // Validate property-specific requirements
    if (createListingDto.listingType === 'property') {
      const { propertyType, bedrooms, bathrooms, transactionType, rentalPeriod } = createListingDto;

      // Apartments and houses require bedrooms and bathrooms
      if ((propertyType === 'apartment' || propertyType === 'house')) {
        if (!bedrooms || bedrooms < 1) {
          throw new BadRequestException({
            message: `${propertyType} listings must specify number of bedrooms`,
            error: 'MISSING_BEDROOMS',
            details: `${propertyType} listings require at least 1 bedroom to be specified.`,
            suggestion: 'Please specify the number of bedrooms for this property.',
            receivedData: {
              propertyType,
              bedrooms,
            },
          });
        }
        if (!bathrooms || bathrooms < 1) {
          throw new BadRequestException({
            message: `${propertyType} listings must specify number of bathrooms`,
            error: 'MISSING_BATHROOMS',
            details: `${propertyType} listings require at least 1 bathroom to be specified.`,
            suggestion: 'Please specify the number of bathrooms for this property.',
            receivedData: {
              propertyType,
              bathrooms,
            },
          });
        }
      }

      // Rental period only required for rent transactions
      if (transactionType === 'rent' && !rentalPeriod) {
        throw new BadRequestException({
          message: 'Rental period is required for rent transactions',
          error: 'MISSING_RENTAL_PERIOD',
          details: 'When listing a property for rent, you must specify the rental period (e.g., monthly, yearly).',
          suggestion: 'Please select the appropriate rental period for this property.',
          receivedData: {
            transactionType,
            rentalPeriod,
          },
        });
      }

      // Rental period should not be provided for sales/leases
      if (transactionType !== 'rent' && rentalPeriod) {
        throw new BadRequestException({
          message: 'Rental period should only be specified for rent transactions',
          error: 'INVALID_RENTAL_PERIOD_USAGE',
          details: `Rental period is only applicable for rent transactions, but you selected '${transactionType}' transaction type.`,
          suggestion: 'Please remove the rental period or change the transaction type to rent.',
          receivedData: {
            transactionType,
            rentalPeriod,
          },
        });
      }
    }

    // Create listing using raw SQL with all new fields
    // Note: Location coordinates may have been updated by business rules service 
    // if they were originally (0,0) and user has a primary neighborhood
    const { latitude, longitude, address } = createListingDto.location;

    const result = await this.listingRepository.query(
      `
      INSERT INTO listings (
        user_id, neighborhood_id, listing_type, category_id, title, description,
        price, currency, price_type, property_type, transaction_type, bedrooms, bathrooms, rental_period,
        condition, brand, model, year, warranty, latitude, longitude, address, status, expires_at,
        service_type, availability_schedule, service_radius, professional_credentials,
        pricing_model, response_time, employment_type, salary_min, salary_max,
        application_deadline, required_skills, work_location, company_info,
        property_amenities, utilities_included, pet_policy, parking_spaces,
        security_features, property_size, land_size, estate_id, city, state,
        featured, boosted, verification_status, contact_preferences
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
        $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51
      ) RETURNING *
      `,
      [
        userId,
        neighborhoodId,
        createListingDto.listingType,
        createListingDto.categoryId,
        createListingDto.title,
        createListingDto.description,
        createListingDto.price,
        'NGN',
        createListingDto.priceType,
        createListingDto.propertyType || null,
        createListingDto.transactionType || null,
        createListingDto.bedrooms || null,
        createListingDto.bathrooms || null,
        createListingDto.rentalPeriod || null,
        createListingDto.condition || null,
        createListingDto.brand || null,
        createListingDto.model || null,
        createListingDto.year || null,
        createListingDto.warranty || null,
        latitude,
        longitude,
        address,
        'active',
        createListingDto.expiresAt || null,
        // Service-specific fields
        createListingDto.serviceType || null,
        createListingDto.availabilitySchedule ? JSON.stringify(createListingDto.availabilitySchedule) : null,
        createListingDto.serviceRadius || null,
        createListingDto.professionalCredentials ? JSON.stringify(createListingDto.professionalCredentials) : null,
        createListingDto.pricingModel || null,
        createListingDto.responseTime || null,
        // Job-specific fields
        createListingDto.employmentType || null,
        createListingDto.salaryMin || null,
        createListingDto.salaryMax || null,
        createListingDto.applicationDeadline || null,
        createListingDto.requiredSkills ? JSON.stringify(createListingDto.requiredSkills) : null,
        createListingDto.workLocation || null,
        createListingDto.companyInfo ? JSON.stringify(createListingDto.companyInfo) : null,
        // Enhanced property fields
        createListingDto.propertyAmenities ? JSON.stringify(createListingDto.propertyAmenities) : null,
        createListingDto.utilitiesIncluded ? JSON.stringify(createListingDto.utilitiesIncluded) : null,
        createListingDto.petPolicy || null,
        createListingDto.parkingSpaces || null,
        createListingDto.securityFeatures ? JSON.stringify(createListingDto.securityFeatures) : null,
        createListingDto.propertySize || null,
        createListingDto.landSize || null,
        // Enhanced location fields
        createListingDto.estateId || null,
        createListingDto.city || null,
        createListingDto.state || null,
        // Enhanced status and metadata
        createListingDto.featured || false,
        createListingDto.boosted || false,
        'pending',
        createListingDto.contactPreferences ? JSON.stringify(createListingDto.contactPreferences) : null,
      ],
    );

    const savedListing = result[0];

    // Create media attachments if provided
    if (createListingDto.media && createListingDto.media.length > 0) {
      const mediaEntities = createListingDto.media.map((media: any, index: number) =>
        this.mediaRepository.create({
          listingId: savedListing.id,
          url: media.url,
          type: media.type,
          caption: media.caption,
          displayOrder: media.displayOrder !== undefined ? media.displayOrder : index,
        }),
      );
      await this.mediaRepository.save(mediaEntities);
    }

    // Invalidate cache after creating listing
    await this.cacheInvalidationService.onListingCreated({
      id: savedListing.id,
      userId,
      categoryId: createListingDto.categoryId,
    });

    return this.findOne(savedListing.id, userId);
  }

  async findAll(
    filter: ListingFilterDto,
    userId?: string,
  ): Promise<PaginatedListingsResponseDto> {
    const queryBuilder = this.createListingsQueryBuilder();

    // Apply filters
    this.applyFilters(queryBuilder, filter);

    // Apply pagination
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Apply sorting
    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder || 'DESC';
    queryBuilder.orderBy(`listing.${sortBy}`, sortOrder);

    // Execute query
    const [listings, total] = await queryBuilder.getManyAndCount();

    // Format response
    const formattedListings = await Promise.all(
      listings.map((listing) => this.formatListingResponse(listing, userId)),
    );

    return {
      data: formattedListings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId?: string): Promise<ListingResponseDto> {
    // Try to get from cache first
    const cachedListing = await this.listingCacheStrategy.getCachedListingDetail(id);
    if (cachedListing) {
      return cachedListing;
    }

    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: ['user', 'category', 'media'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const formattedListing = await this.formatListingResponse(listing, userId);
    
    // Cache the result
    await this.listingCacheStrategy.cacheListingDetail(id, formattedListing);
    
    return formattedListing;
  }

  async update(
    id: string,
    userId: string,
    updateListingDto: UpdateListingDto,
  ): Promise<ListingResponseDto> {
    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: ['media'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.userId !== userId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    // Update location if provided
    if (updateListingDto.location) {
      listing.latitude = updateListingDto.location.latitude;
      listing.longitude = updateListingDto.location.longitude;
      listing.address = updateListingDto.location.address;
      delete updateListingDto.location;
    }

    // Update listing
    Object.assign(listing, updateListingDto);

    if (updateListingDto.expiresAt) {
      listing.expiresAt = new Date(updateListingDto.expiresAt);
    }

    const updatedListing = await this.listingRepository.save(listing);

    // Update media if provided
    if (updateListingDto.media) {
      await this.mediaRepository.delete({ listingId: id });

      if (updateListingDto.media.length > 0) {
        const mediaEntities = updateListingDto.media.map((media: any, index: number) =>
          this.mediaRepository.create({
            listingId: id,
            url: media.url,
            type: media.type,
            caption: media.caption,
            displayOrder: media.displayOrder !== undefined ? media.displayOrder : index,
          }),
        );
        await this.mediaRepository.save(mediaEntities);
      }
    }

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const listing = await this.listingRepository.findOne({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.userId !== userId) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    await this.listingRepository.remove(listing);
  }

  async incrementViews(id: string): Promise<void> {
    await this.listingRepository.increment({ id }, 'viewsCount', 1);
  }

  async saveListing(listingId: string, userId: string): Promise<void> {
    // Check if already saved
    const existingSave = await this.saveRepository.findOne({
      where: { listingId, userId },
    });

    if (existingSave) {
      return; // Already saved
    }

    const save = this.saveRepository.create({ listingId, userId });
    await this.saveRepository.save(save);

    // Increment saves count
    await this.listingRepository.increment({ id: listingId }, 'savesCount', 1);
  }

  async unsaveListing(listingId: string, userId: string): Promise<void> {
    const save = await this.saveRepository.findOne({
      where: { listingId, userId },
    });

    if (save) {
      await this.saveRepository.remove(save);
      // Decrement saves count
      await this.listingRepository.decrement(
        { id: listingId },
        'savesCount',
        1,
      );
    }
  }

  async getSavedListings(
    userId: string,
    filter: ListingFilterDto,
  ): Promise<PaginatedListingsResponseDto> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    // Get user's saved listing IDs
    const saves = await this.saveRepository.find({
      where: { userId },
      relations: ['listing'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const listings = saves.map((save) => save.listing);
    const total = await this.saveRepository.count({ where: { userId } });

    const formattedListings = await Promise.all(
      listings.map((listing) => this.formatListingResponse(listing, userId)),
    );

    return {
      data: formattedListings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    };
  }

  async getUserListings(
    userId: string,
    filter: ListingFilterDto,
  ): Promise<PaginatedListingsResponseDto> {
    const queryBuilder = this.createListingsQueryBuilder();

    queryBuilder.where('listing.userId = :userId', { userId });

    // Apply other filters
    this.applyFilters(queryBuilder, filter);

    // Apply pagination
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Apply sorting
    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder || 'DESC';
    queryBuilder.orderBy(`listing.${sortBy}`, sortOrder);

    const [listings, total] = await queryBuilder.getManyAndCount();

    const formattedListings = await Promise.all(
      listings.map((listing) => this.formatListingResponse(listing, userId)),
    );

    return {
      data: formattedListings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    };
  }

  async searchNearby(
    latitude: number,
    longitude: number,
    radius: number,
    filter: ListingFilterDto,
  ): Promise<ListingResponseDto[]> {
    // Convert radius from km to meters for PostGIS
    const radiusMeters = radius * 1000;

    const query = this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.user', 'user')
      .leftJoinAndSelect('listing.category', 'category')
      .leftJoinAndSelect('listing.media', 'media')
      .where(
        `ST_DWithin(
          listing.location::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius
        )`,
        {
          latitude,
          longitude,
          radius: radiusMeters,
        },
      )
      .andWhere('listing.status = :status', { status: filter.status || 'active' });

    this.applyFilters(query, filter);

    const listings = await query
      .orderBy(
        `ST_Distance(
        listing.location::geography,
        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
      )`,
      )
      .setParameters({ latitude, longitude })
      .limit(filter.limit || 50)
      .getMany();

    return Promise.all(
      listings.map((listing) => this.formatListingResponse(listing)),
    );
  }

  async markAsSold(id: string, userId: string): Promise<ListingResponseDto> {
    const listing = await this.listingRepository.findOne({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.userId !== userId) {
      throw new ForbiddenException('You can only mark your own listings as sold');
    }

    listing.status = 'sold';
    await this.listingRepository.save(listing);

    return this.findOne(id, userId);
  }

  async expireOldListings(): Promise<void> {
    await this.listingRepository
      .createQueryBuilder()
      .update(Listing)
      .set({ status: 'expired' })
      .where('expiresAt < :now', { now: new Date() })
      .andWhere('status = :status', { status: 'active' })
      .execute();
  }

  private createListingsQueryBuilder(): SelectQueryBuilder<Listing> {
    return this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.user', 'user')
      .leftJoinAndSelect('listing.category', 'category')
      .leftJoinAndSelect('listing.media', 'media');
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Listing>,
    filter: ListingFilterDto,
  ): void {
    if (filter.listingType) {
      queryBuilder.andWhere('listing.listingType = :listingType', {
        listingType: filter.listingType,
      });
    }

    if (filter.categoryId) {
      queryBuilder.andWhere('listing.categoryId = :categoryId', {
        categoryId: filter.categoryId,
      });
    }

    if (filter.minPrice !== undefined) {
      queryBuilder.andWhere('listing.price >= :minPrice', {
        minPrice: filter.minPrice,
      });
    }

    if (filter.maxPrice !== undefined) {
      queryBuilder.andWhere('listing.price <= :maxPrice', {
        maxPrice: filter.maxPrice,
      });
    }

    if (filter.search) {
      queryBuilder.andWhere(
        '(listing.title ILIKE :search OR listing.description ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    if (filter.status) {
      queryBuilder.andWhere('listing.status = :status', {
        status: filter.status,
      });
    }

    // Property-specific filters
    if (filter.propertyType) {
      queryBuilder.andWhere('listing.propertyType = :propertyType', {
        propertyType: filter.propertyType,
      });
    }

    if (filter.minBedrooms !== undefined) {
      queryBuilder.andWhere('listing.bedrooms >= :minBedrooms', {
        minBedrooms: filter.minBedrooms,
      });
    }

    if (filter.minBathrooms !== undefined) {
      queryBuilder.andWhere('listing.bathrooms >= :minBathrooms', {
        minBathrooms: filter.minBathrooms,
      });
    }

    // Item-specific filters
    if (filter.condition) {
      queryBuilder.andWhere('listing.condition = :condition', {
        condition: filter.condition,
      });
    }

    if (filter.brand) {
      queryBuilder.andWhere('listing.brand ILIKE :brand', {
        brand: `%${filter.brand}%`,
      });
    }

    // Service-specific filters
    if (filter.serviceType) {
      queryBuilder.andWhere('listing.serviceType = :serviceType', {
        serviceType: filter.serviceType,
      });
    }

    if (filter.pricingModel) {
      queryBuilder.andWhere('listing.pricingModel = :pricingModel', {
        pricingModel: filter.pricingModel,
      });
    }

    if (filter.minServiceRadius !== undefined) {
      queryBuilder.andWhere('listing.serviceRadius >= :minServiceRadius', {
        minServiceRadius: filter.minServiceRadius,
      });
    }

    if (filter.maxResponseTime !== undefined) {
      queryBuilder.andWhere('listing.responseTime <= :maxResponseTime', {
        maxResponseTime: filter.maxResponseTime,
      });
    }

    // Job-specific filters
    if (filter.employmentType) {
      queryBuilder.andWhere('listing.employmentType = :employmentType', {
        employmentType: filter.employmentType,
      });
    }

    if (filter.workLocation) {
      queryBuilder.andWhere('listing.workLocation = :workLocation', {
        workLocation: filter.workLocation,
      });
    }

    if (filter.minSalary !== undefined) {
      queryBuilder.andWhere('listing.salaryMin >= :minSalary', {
        minSalary: filter.minSalary,
      });
    }

    if (filter.maxSalary !== undefined) {
      queryBuilder.andWhere('listing.salaryMax <= :maxSalary', {
        maxSalary: filter.maxSalary,
      });
    }

    if (filter.requiredSkills && filter.requiredSkills.length > 0) {
      queryBuilder.andWhere(
        'listing.requiredSkills && :requiredSkills',
        { requiredSkills: filter.requiredSkills },
      );
    }

    if (filter.applicationDeadlineBefore) {
      queryBuilder.andWhere('listing.applicationDeadline <= :deadline', {
        deadline: new Date(filter.applicationDeadlineBefore),
      });
    }

    // Enhanced property filters
    if (filter.propertyAmenities && filter.propertyAmenities.length > 0) {
      queryBuilder.andWhere(
        'listing.propertyAmenities && :propertyAmenities',
        { propertyAmenities: filter.propertyAmenities },
      );
    }

    if (filter.utilitiesIncluded && filter.utilitiesIncluded.length > 0) {
      queryBuilder.andWhere(
        'listing.utilitiesIncluded && :utilitiesIncluded',
        { utilitiesIncluded: filter.utilitiesIncluded },
      );
    }

    if (filter.petPolicy) {
      queryBuilder.andWhere('listing.petPolicy = :petPolicy', {
        petPolicy: filter.petPolicy,
      });
    }

    if (filter.minParkingSpaces !== undefined) {
      queryBuilder.andWhere('listing.parkingSpaces >= :minParkingSpaces', {
        minParkingSpaces: filter.minParkingSpaces,
      });
    }

    if (filter.securityFeatures && filter.securityFeatures.length > 0) {
      queryBuilder.andWhere(
        'listing.securityFeatures && :securityFeatures',
        { securityFeatures: filter.securityFeatures },
      );
    }

    if (filter.minPropertySize !== undefined) {
      queryBuilder.andWhere('listing.propertySize >= :minPropertySize', {
        minPropertySize: filter.minPropertySize,
      });
    }

    if (filter.maxPropertySize !== undefined) {
      queryBuilder.andWhere('listing.propertySize <= :maxPropertySize', {
        maxPropertySize: filter.maxPropertySize,
      });
    }

    if (filter.minLandSize !== undefined) {
      queryBuilder.andWhere('listing.landSize >= :minLandSize', {
        minLandSize: filter.minLandSize,
      });
    }

    if (filter.maxLandSize !== undefined) {
      queryBuilder.andWhere('listing.landSize <= :maxLandSize', {
        maxLandSize: filter.maxLandSize,
      });
    }

    // Enhanced location filters
    if (filter.estateId) {
      queryBuilder.andWhere('listing.estateId = :estateId', {
        estateId: filter.estateId,
      });
    }

    if (filter.city) {
      queryBuilder.andWhere('listing.city ILIKE :city', {
        city: `%${filter.city}%`,
      });
    }

    if (filter.state) {
      queryBuilder.andWhere('listing.state ILIKE :state', {
        state: `%${filter.state}%`,
      });
    }

    // Enhanced status filters
    if (filter.featured !== undefined) {
      queryBuilder.andWhere('listing.featured = :featured', {
        featured: filter.featured,
      });
    }

    if (filter.boosted !== undefined) {
      queryBuilder.andWhere('listing.boosted = :boosted', {
        boosted: filter.boosted,
      });
    }

    if (filter.verificationStatus) {
      queryBuilder.andWhere('listing.verificationStatus = :verificationStatus', {
        verificationStatus: filter.verificationStatus,
      });
    }

    // Advanced search
    if (filter.query) {
      queryBuilder.andWhere(
        `(
          listing.title ILIKE :query OR 
          listing.description ILIKE :query OR
          listing.brand ILIKE :query OR
          listing.city ILIKE :query OR
          listing.state ILIKE :query
        )`,
        { query: `%${filter.query}%` },
      );
    }
  }

  private async formatListingResponse(
    listing: Listing,
    userId?: string,
  ): Promise<ListingResponseDto> {
    // Check if user has saved this listing
    let isSaved = false;
    if (userId) {
      const save = await this.saveRepository.findOne({
        where: { listingId: listing.id, userId },
      });
      isSaved = !!save;
    }

    // Use latitude and longitude directly
    const latitude = listing.latitude;
    const longitude = listing.longitude;

    return {
      id: listing.id,
      userId: listing.userId,
      listingType: listing.listingType as any,
      category: {
        id: listing.category.id,
        listingType: listing.category.listingType as any,
        name: listing.category.name,
        description: listing.category.description,
        iconUrl: listing.category.iconUrl,
        colorCode: listing.category.colorCode,
      },
      title: listing.title,
      description: listing.description,
      price: Number(listing.price),
      currency: listing.currency,
      priceType: listing.priceType as any,
      propertyType: listing.propertyType as any,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      rentalPeriod: listing.rentalPeriod as any,
      condition: listing.condition as any,
      brand: listing.brand,
      model: listing.model,
      year: listing.year,
      warranty: listing.warranty,
      location: {
        latitude,
        longitude,
        address: listing.address,
      },
      media: listing.media.map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type as 'image' | 'video',
        caption: m.caption,
        displayOrder: m.displayOrder,
        createdAt: m.createdAt,
      })),
      status: listing.status as ListingStatus,
      viewsCount: listing.viewsCount,
      savesCount: listing.savesCount,
      isSaved,
      author: {
        id: listing.user.id,
        firstName: listing.user.firstName,
        lastName: listing.user.lastName,
        profilePicture: listing.user.profilePictureUrl,
        isVerified: listing.user.isVerified || false,
        createdAt: listing.user.createdAt,
      },
      createdAt: listing.createdAt,
      expiresAt: listing.expiresAt,
      updatedAt: listing.updatedAt,
    };
  }
}
