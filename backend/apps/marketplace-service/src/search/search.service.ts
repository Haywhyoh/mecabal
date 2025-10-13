import {
  Injectable,
  NotFoundException,
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
import { SearchListingsDto, PaginatedListingsResponseDto, ListingResponseDto } from '../listings/dto';

@Injectable()
export class SearchService {
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
  ) {}

  async searchListings(
    searchDto: SearchListingsDto,
    userId?: string,
  ): Promise<PaginatedListingsResponseDto> {
    const queryBuilder = this.createSearchQueryBuilder();

    // Apply search filters
    this.applySearchFilters(queryBuilder, searchDto);

    // Apply pagination
    const page = searchDto.page || 1;
    const limit = searchDto.limit || 20;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Apply sorting
    this.applySorting(queryBuilder, searchDto);

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

  async searchNearby(
    latitude: number,
    longitude: number,
    radius: number,
    searchDto: SearchListingsDto,
    userId?: string,
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
          ST_SetSRID(ST_MakePoint(listing.longitude, listing.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius
        )`,
        {
          latitude,
          longitude,
          radius: radiusMeters,
        },
      )
      .andWhere('listing.status = :status', { status: 'active' });

    // Apply search filters
    this.applySearchFilters(query, searchDto);

    // Apply sorting
    this.applySorting(query, searchDto);

    const listings = await query
      .orderBy(
        `ST_Distance(
          ST_SetSRID(ST_MakePoint(listing.longitude, listing.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
        )`,
      )
      .setParameters({ latitude, longitude })
      .limit(searchDto.limit || 50)
      .getMany();

    return Promise.all(
      listings.map((listing) => this.formatListingResponse(listing, userId)),
    );
  }

  async getSearchSuggestions(query: string, limit: number = 10): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    // Get suggestions from listing titles and descriptions
    const titleSuggestions = await this.listingRepository
      .createQueryBuilder('listing')
      .select('DISTINCT listing.title', 'title')
      .where('listing.title ILIKE :query', { query: `%${query}%` })
      .andWhere('listing.status = :status', { status: 'active' })
      .limit(limit)
      .getRawMany();

    const categorySuggestions = await this.categoryRepository
      .createQueryBuilder('category')
      .select('DISTINCT category.name', 'name')
      .where('category.name ILIKE :query', { query: `%${query}%` })
      .andWhere('category.isActive = :active', { active: true })
      .limit(limit)
      .getRawMany();

    const suggestions = [
      ...titleSuggestions.map(item => item.title),
      ...categorySuggestions.map(item => item.name),
    ];

    // Remove duplicates and limit results
    return [...new Set(suggestions)].slice(0, limit);
  }

  async getPopularSearches(limit: number = 10): Promise<string[]> {
    // This would typically come from a search analytics table
    // For now, return popular categories
    const popularCategories = await this.categoryRepository
      .createQueryBuilder('category')
      .select('category.name', 'name')
      .where('category.isActive = :active', { active: true })
      .orderBy('category.displayOrder', 'ASC')
      .limit(limit)
      .getRawMany();

    return popularCategories.map(item => item.name);
  }

  private createSearchQueryBuilder(): SelectQueryBuilder<Listing> {
    return this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.user', 'user')
      .leftJoinAndSelect('listing.category', 'category')
      .leftJoinAndSelect('listing.media', 'media');
  }

  private applySearchFilters(
    queryBuilder: SelectQueryBuilder<Listing>,
    searchDto: SearchListingsDto,
  ): void {
    // Full-text search
    if (searchDto.query) {
      queryBuilder.andWhere(
        `(
          listing.title ILIKE :query OR 
          listing.description ILIKE :query OR
          listing.brand ILIKE :query OR
          listing.city ILIKE :query OR
          listing.state ILIKE :query
        )`,
        { query: `%${searchDto.query}%` },
      );
    }

    // Listing type filter
    if (searchDto.listingType) {
      queryBuilder.andWhere('listing.listingType = :listingType', {
        listingType: searchDto.listingType,
      });
    }

    // Category filter
    if (searchDto.categoryId) {
      queryBuilder.andWhere('listing.categoryId = :categoryId', {
        categoryId: searchDto.categoryId,
      });
    }

    // Price range filters
    if (searchDto.minPrice !== undefined) {
      queryBuilder.andWhere('listing.price >= :minPrice', {
        minPrice: searchDto.minPrice,
      });
    }

    if (searchDto.maxPrice !== undefined) {
      queryBuilder.andWhere('listing.price <= :maxPrice', {
        maxPrice: searchDto.maxPrice,
      });
    }

    // Location-based search
    if (searchDto.latitude && searchDto.longitude && searchDto.radius) {
      const radiusMeters = searchDto.radius * 1000;
      queryBuilder.andWhere(
        `ST_DWithin(
          ST_SetSRID(ST_MakePoint(listing.longitude, listing.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius
        )`,
        {
          latitude: searchDto.latitude,
          longitude: searchDto.longitude,
          radius: radiusMeters,
        },
      );
    }

    // Service-specific filters
    if (searchDto.serviceType) {
      queryBuilder.andWhere('listing.serviceType = :serviceType', {
        serviceType: searchDto.serviceType,
      });
    }

    if (searchDto.pricingModel) {
      queryBuilder.andWhere('listing.pricingModel = :pricingModel', {
        pricingModel: searchDto.pricingModel,
      });
    }

    if (searchDto.minServiceRadius !== undefined) {
      queryBuilder.andWhere('listing.serviceRadius >= :minServiceRadius', {
        minServiceRadius: searchDto.minServiceRadius,
      });
    }

    if (searchDto.maxResponseTime !== undefined) {
      queryBuilder.andWhere('listing.responseTime <= :maxResponseTime', {
        maxResponseTime: searchDto.maxResponseTime,
      });
    }

    // Job-specific filters
    if (searchDto.employmentType) {
      queryBuilder.andWhere('listing.employmentType = :employmentType', {
        employmentType: searchDto.employmentType,
      });
    }

    if (searchDto.workLocation) {
      queryBuilder.andWhere('listing.workLocation = :workLocation', {
        workLocation: searchDto.workLocation,
      });
    }

    if (searchDto.minSalary !== undefined) {
      queryBuilder.andWhere('listing.salaryMin >= :minSalary', {
        minSalary: searchDto.minSalary,
      });
    }

    if (searchDto.maxSalary !== undefined) {
      queryBuilder.andWhere('listing.salaryMax <= :maxSalary', {
        maxSalary: searchDto.maxSalary,
      });
    }

    if (searchDto.requiredSkills && searchDto.requiredSkills.length > 0) {
      queryBuilder.andWhere(
        'listing.requiredSkills && :requiredSkills',
        { requiredSkills: searchDto.requiredSkills },
      );
    }

    if (searchDto.applicationDeadlineBefore) {
      queryBuilder.andWhere('listing.applicationDeadline <= :deadline', {
        deadline: new Date(searchDto.applicationDeadlineBefore),
      });
    }

    // Property-specific filters
    if (searchDto.propertyType) {
      queryBuilder.andWhere('listing.propertyType = :propertyType', {
        propertyType: searchDto.propertyType,
      });
    }

    if (searchDto.minBedrooms !== undefined) {
      queryBuilder.andWhere('listing.bedrooms >= :minBedrooms', {
        minBedrooms: searchDto.minBedrooms,
      });
    }

    if (searchDto.minBathrooms !== undefined) {
      queryBuilder.andWhere('listing.bathrooms >= :minBathrooms', {
        minBathrooms: searchDto.minBathrooms,
      });
    }

    if (searchDto.propertyAmenities && searchDto.propertyAmenities.length > 0) {
      queryBuilder.andWhere(
        'listing.propertyAmenities && :propertyAmenities',
        { propertyAmenities: searchDto.propertyAmenities },
      );
    }

    if (searchDto.utilitiesIncluded && searchDto.utilitiesIncluded.length > 0) {
      queryBuilder.andWhere(
        'listing.utilitiesIncluded && :utilitiesIncluded',
        { utilitiesIncluded: searchDto.utilitiesIncluded },
      );
    }

    if (searchDto.petPolicy) {
      queryBuilder.andWhere('listing.petPolicy = :petPolicy', {
        petPolicy: searchDto.petPolicy,
      });
    }

    if (searchDto.minParkingSpaces !== undefined) {
      queryBuilder.andWhere('listing.parkingSpaces >= :minParkingSpaces', {
        minParkingSpaces: searchDto.minParkingSpaces,
      });
    }

    if (searchDto.securityFeatures && searchDto.securityFeatures.length > 0) {
      queryBuilder.andWhere(
        'listing.securityFeatures && :securityFeatures',
        { securityFeatures: searchDto.securityFeatures },
      );
    }

    if (searchDto.minPropertySize !== undefined) {
      queryBuilder.andWhere('listing.propertySize >= :minPropertySize', {
        minPropertySize: searchDto.minPropertySize,
      });
    }

    if (searchDto.maxPropertySize !== undefined) {
      queryBuilder.andWhere('listing.propertySize <= :maxPropertySize', {
        maxPropertySize: searchDto.maxPropertySize,
      });
    }

    // Item-specific filters
    if (searchDto.condition) {
      queryBuilder.andWhere('listing.condition = :condition', {
        condition: searchDto.condition,
      });
    }

    if (searchDto.brand) {
      queryBuilder.andWhere('listing.brand ILIKE :brand', {
        brand: `%${searchDto.brand}%`,
      });
    }

    // Location filters
    if (searchDto.estateId) {
      queryBuilder.andWhere('listing.estateId = :estateId', {
        estateId: searchDto.estateId,
      });
    }

    if (searchDto.city) {
      queryBuilder.andWhere('listing.city ILIKE :city', {
        city: `%${searchDto.city}%`,
      });
    }

    if (searchDto.state) {
      queryBuilder.andWhere('listing.state ILIKE :state', {
        state: `%${searchDto.state}%`,
      });
    }

    // Status filters
    if (searchDto.featured !== undefined) {
      queryBuilder.andWhere('listing.featured = :featured', {
        featured: searchDto.featured,
      });
    }

    if (searchDto.boosted !== undefined) {
      queryBuilder.andWhere('listing.boosted = :boosted', {
        boosted: searchDto.boosted,
      });
    }

    if (searchDto.verificationStatus) {
      queryBuilder.andWhere('listing.verificationStatus = :verificationStatus', {
        verificationStatus: searchDto.verificationStatus,
      });
    }

    // Only show active listings by default
    queryBuilder.andWhere('listing.status = :status', { status: 'active' });
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<Listing>,
    searchDto: SearchListingsDto,
  ): void {
    const sortBy = searchDto.sortBy || 'createdAt';
    const sortOrder = searchDto.sortOrder || 'DESC';

    switch (sortBy) {
      case 'relevance':
        // For relevance, we'll use a combination of views and saves
        queryBuilder.orderBy('listing.viewsCount', 'DESC');
        queryBuilder.addOrderBy('listing.savesCount', 'DESC');
        queryBuilder.addOrderBy('listing.createdAt', 'DESC');
        break;
      case 'price':
        queryBuilder.orderBy('listing.price', sortOrder);
        break;
      case 'viewsCount':
        queryBuilder.orderBy('listing.viewsCount', sortOrder);
        break;
      case 'savesCount':
        queryBuilder.orderBy('listing.savesCount', sortOrder);
        break;
      case 'createdAt':
      default:
        queryBuilder.orderBy('listing.createdAt', sortOrder);
        break;
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
      location: {
        latitude: listing.latitude,
        longitude: listing.longitude,
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
      status: listing.status as any,
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
