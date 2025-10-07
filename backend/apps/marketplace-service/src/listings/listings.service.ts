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
  ) {}

  async create(
    userId: string,
    neighborhoodId: string,
    createListingDto: CreateListingDto,
  ): Promise<ListingResponseDto> {
    // Validate category
    const category = await this.categoryRepository.findOne({
      where: { id: createListingDto.categoryId, isActive: true },
    });

    if (!category) {
      throw new BadRequestException('Invalid category ID');
    }

    // Validate listing type matches category type
    if (category.listingType !== createListingDto.listingType) {
      throw new BadRequestException(
        `Category does not match listing type ${createListingDto.listingType}`,
      );
    }

    // Create listing
    const listing = this.listingRepository.create({
      ...createListingDto,
      userId,
      neighborhoodId,
      latitude: createListingDto.location.latitude,
      longitude: createListingDto.location.longitude,
      address: createListingDto.location.address,
      expiresAt: createListingDto.expiresAt
        ? new Date(createListingDto.expiresAt)
        : undefined,
    });

    const savedListing = await this.listingRepository.save(listing);

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
    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: ['user', 'category', 'media'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return this.formatListingResponse(listing, userId);
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
