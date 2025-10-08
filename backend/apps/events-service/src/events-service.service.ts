import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Event, EventCategory, EventMedia, EventAttendee, User, Neighborhood } from '@app/database/entities';
import {
  CreateEventDto,
  UpdateEventDto,
  EventFilterDto,
  RsvpDto,
  AttendeeFilterDto,
  EventResponseDto,
  PaginatedResponseDto,
  PaginationMetaDto,
} from './dto';

@Injectable()
export class EventsServiceService {
  constructor(
    @InjectRepository(Event)
    private eventRepo: Repository<Event>,
    @InjectRepository(EventCategory)
    private categoryRepo: Repository<EventCategory>,
    @InjectRepository(EventMedia)
    private mediaRepo: Repository<EventMedia>,
    @InjectRepository(EventAttendee)
    private attendeeRepo: Repository<EventAttendee>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Neighborhood)
    private neighborhoodRepo: Repository<Neighborhood>,
  ) {}

  /**
   * Create a new event
   */
  async create(userId: string, neighborhoodId: string, dto: CreateEventDto): Promise<EventResponseDto> {
    // Validate category exists
    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    if (!category) {
      throw new NotFoundException('Event category not found');
    }

    // Validate neighborhood exists
    const neighborhood = await this.neighborhoodRepo.findOne({ where: { id: neighborhoodId } });
    if (!neighborhood) {
      throw new NotFoundException('Neighborhood not found');
    }

    // Create event with raw SQL for geography field
    const eventData: Partial<Event> = {
      userId,
      neighborhoodId,
      categoryId: dto.categoryId,
      title: dto.title,
      description: dto.description,
      eventDate: new Date(dto.eventDate),
      startTime: dto.startTime,
      endTime: dto.endTime,
      timezone: 'Africa/Lagos',
      locationName: dto.location.name,
      locationAddress: dto.location.address,
      latitude: dto.location.latitude,
      longitude: dto.location.longitude,
      landmark: dto.location.landmark,
      isFree: dto.isFree,
      price: dto.isFree ? undefined : dto.price,
      currency: 'NGN',
      maxAttendees: dto.maxAttendees,
      allowGuests: dto.allowGuests ?? true,
      requireVerification: dto.requireVerification ?? false,
      ageRestriction: dto.ageRestriction,
      languages: dto.languages || ['English'],
      isPrivate: dto.isPrivate ?? false,
      coverImageUrl: dto.coverImageUrl,
      specialRequirements: dto.specialRequirements,
      status: 'published', // Default to published
    };

    const event = this.eventRepo.create(eventData);
    const savedEvent = await this.eventRepo.save(event);

    // Handle media attachments
    if (dto.media && dto.media.length > 0) {
      const mediaEntities = dto.media.map((media, index) =>
        this.mediaRepo.create({
          eventId: savedEvent.id,
          url: media.url,
          type: media.type,
          caption: media.caption,
          displayOrder: media.displayOrder ?? index,
        }),
      );
      await this.mediaRepo.save(mediaEntities);
    }

    return this.formatEventResponse(savedEvent.id);
  }

  /**
   * Get all events with filtering and pagination
   */
  async findAll(filters: EventFilterDto, userId?: string): Promise<PaginatedResponseDto<EventResponseDto>> {
    const query = this.buildEventQuery(filters, userId);

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit);

    // Execute query
    const [events, total] = await query.getManyAndCount();

    // Format responses
    const formattedEvents = await Promise.all(
      events.map(event => this.formatEventResponse(event.id, userId)),
    );

    // Build pagination metadata
    const totalPages = Math.ceil(total / limit);
    const meta: PaginationMetaDto = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return {
      data: formattedEvents,
      meta,
    };
  }

  /**
   * Get a single event by ID
   */
  async findOne(id: string, userId?: string): Promise<EventResponseDto> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['user', 'category', 'neighborhood', 'media'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Increment view count (async, no await)
    this.incrementViews(id).catch(() => {});

    return this.formatEventResponse(id, userId);
  }

  /**
   * Update an event
   */
  async update(id: string, userId: string, dto: UpdateEventDto): Promise<EventResponseDto> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate ownership
    if (event.userId !== userId) {
      throw new ForbiddenException('You can only update your own events');
    }

    // Update event fields
    const updateData: Partial<Event> = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.eventDate !== undefined) updateData.eventDate = new Date(dto.eventDate);
    if (dto.startTime !== undefined) updateData.startTime = dto.startTime;
    if (dto.endTime !== undefined) updateData.endTime = dto.endTime;
    if (dto.isFree !== undefined) updateData.isFree = dto.isFree;
    if (dto.price !== undefined) updateData.price = dto.isFree ? undefined : dto.price;
    if (dto.maxAttendees !== undefined) updateData.maxAttendees = dto.maxAttendees;
    if (dto.allowGuests !== undefined) updateData.allowGuests = dto.allowGuests;
    if (dto.requireVerification !== undefined) updateData.requireVerification = dto.requireVerification;
    if (dto.ageRestriction !== undefined) updateData.ageRestriction = dto.ageRestriction;
    if (dto.languages !== undefined) updateData.languages = dto.languages;
    if (dto.isPrivate !== undefined) updateData.isPrivate = dto.isPrivate;
    if (dto.coverImageUrl !== undefined) updateData.coverImageUrl = dto.coverImageUrl;
    if (dto.specialRequirements !== undefined) updateData.specialRequirements = dto.specialRequirements;

    if (dto.location) {
      updateData.locationName = dto.location.name;
      updateData.locationAddress = dto.location.address;
      updateData.latitude = dto.location.latitude;
      updateData.longitude = dto.location.longitude;
      updateData.landmark = dto.location.landmark;
    }

    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) {
        throw new NotFoundException('Event category not found');
      }
      updateData.categoryId = dto.categoryId;
    }

    await this.eventRepo.update(id, updateData);

    // Update media if provided
    if (dto.media !== undefined) {
      // Remove existing media
      await this.mediaRepo.delete({ eventId: id });

      // Add new media
      if (dto.media.length > 0) {
        const mediaEntities = dto.media.map((media, index) =>
          this.mediaRepo.create({
            eventId: id,
            url: media.url,
            type: media.type,
            caption: media.caption,
            displayOrder: media.displayOrder ?? index,
          }),
        );
        await this.mediaRepo.save(mediaEntities);
      }
    }

    return this.formatEventResponse(id, userId);
  }

  /**
   * Delete an event (soft delete by setting status to cancelled)
   */
  async remove(id: string, userId: string): Promise<void> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate ownership
    if (event.userId !== userId) {
      throw new ForbiddenException('You can only delete your own events');
    }

    // Soft delete by setting status to cancelled
    await this.eventRepo.update(id, { status: 'cancelled' });
  }

  /**
   * Build query for events with filters
   */
  private buildEventQuery(filters: EventFilterDto, userId?: string): SelectQueryBuilder<Event> {
    const query = this.eventRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.user', 'user')
      .leftJoinAndSelect('event.category', 'category')
      .leftJoinAndSelect('event.neighborhood', 'neighborhood')
      .leftJoinAndSelect('event.media', 'media')
      .where('event.status = :status', { status: 'published' });

    // Apply filters
    if (filters.categoryId) {
      query.andWhere('event.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.search) {
      query.andWhere(
        '(event.title ILIKE :search OR event.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.dateFrom) {
      query.andWhere('event.eventDate >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      query.andWhere('event.eventDate <= :dateTo', { dateTo: filters.dateTo });
    }

    if (filters.neighborhoodId) {
      query.andWhere('event.neighborhoodId = :neighborhoodId', { neighborhoodId: filters.neighborhoodId });
    }

    if (filters.isFree !== undefined) {
      query.andWhere('event.isFree = :isFree', { isFree: filters.isFree });
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'eventDate';
    const sortOrder = filters.sortOrder || 'ASC';
    query.orderBy(`event.${sortBy}`, sortOrder);

    return query;
  }

  /**
   * RSVP to an event
   */
  async rsvp(eventId: string, userId: string, dto: RsvpDto): Promise<any> {
    // Check if event exists
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if already RSVP'd
    const existingAttendee = await this.attendeeRepo.findOne({
      where: { eventId, userId },
    });

    // Check capacity if max attendees set
    if (event.maxAttendees && dto.rsvpStatus === 'going') {
      const currentAttendees = await this.attendeeRepo.count({
        where: { eventId, rsvpStatus: 'going' },
      });
      
      if (currentAttendees >= event.maxAttendees) {
        throw new ConflictException('Event is at capacity');
      }
    }

    const guestsCount = dto.guestsCount || 0;
    const totalAttendees = 1 + guestsCount; // User + guests

    if (event.maxAttendees && dto.rsvpStatus === 'going') {
      const currentAttendees = await this.attendeeRepo.count({
        where: { eventId, rsvpStatus: 'going' },
      });
      
      if (currentAttendees + totalAttendees > event.maxAttendees) {
        throw new ConflictException('Not enough spots available for you and your guests');
      }
    }

    if (existingAttendee) {
      // Update existing RSVP
      await this.attendeeRepo.update(existingAttendee.id, {
        rsvpStatus: dto.rsvpStatus,
        guestsCount,
      });
    } else {
      // Create new RSVP
      const attendee = this.attendeeRepo.create({
        eventId,
        userId,
        rsvpStatus: dto.rsvpStatus,
        guestsCount,
      });
      await this.attendeeRepo.save(attendee);
    }

    // Update event attendees count
    await this.updateEventAttendeesCount(eventId);

    // Return attendee info
    const attendee = await this.attendeeRepo.findOne({
      where: { eventId, userId },
      relations: ['user'],
    });

    if (!attendee) {
      throw new NotFoundException('Attendee not found');
    }

    return {
      id: attendee.id,
      rsvpStatus: attendee.rsvpStatus,
      guestsCount: attendee.guestsCount,
      rsvpAt: attendee.rsvpAt,
      user: {
        id: attendee.user.id,
        firstName: attendee.user.firstName,
        lastName: attendee.user.lastName,
        fullName: attendee.user.fullName,
        profilePictureUrl: attendee.user.profilePictureUrl,
      },
    };
  }

  /**
   * Cancel RSVP to an event
   */
  async cancelRsvp(eventId: string, userId: string): Promise<void> {
    const attendee = await this.attendeeRepo.findOne({
      where: { eventId, userId },
    });

    if (!attendee) {
      throw new NotFoundException('RSVP not found');
    }

    // Delete attendee record
    await this.attendeeRepo.delete(attendee.id);

    // Update event attendees count
    await this.updateEventAttendeesCount(eventId);
  }

  /**
   * Get event attendees with filtering and pagination
   */
  async getAttendees(eventId: string, filters: AttendeeFilterDto): Promise<PaginatedResponseDto<any>> {
    // Check if event exists
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const query = this.attendeeRepo
      .createQueryBuilder('attendee')
      .leftJoinAndSelect('attendee.user', 'user')
      .where('attendee.eventId = :eventId', { eventId });

    // Apply filters
    if (filters.rsvpStatus) {
      query.andWhere('attendee.rsvpStatus = :rsvpStatus', { rsvpStatus: filters.rsvpStatus });
    }

    if (filters.search) {
      query.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit);
    query.orderBy('attendee.rsvpAt', 'DESC');

    // Execute query
    const [attendees, total] = await query.getManyAndCount();

    // Format responses
    const formattedAttendees = attendees.map(attendee => ({
      id: attendee.id,
      rsvpStatus: attendee.rsvpStatus,
      guestsCount: attendee.guestsCount,
      rsvpAt: attendee.rsvpAt,
      checkedIn: attendee.checkedIn,
      checkedInAt: attendee.checkedInAt,
      user: {
        id: attendee.user.id,
        firstName: attendee.user.firstName,
        lastName: attendee.user.lastName,
        fullName: attendee.user.fullName,
        profilePictureUrl: attendee.user.profilePictureUrl,
        trustScore: attendee.user.trustScore,
        isVerified: attendee.user.isVerified,
      },
    }));

    // Build pagination metadata
    const totalPages = Math.ceil(total / limit);
    const meta: PaginationMetaDto = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return {
      data: formattedAttendees,
      meta,
    };
  }

  /**
   * Update attendee payment status
   */
  async updateAttendeePaymentStatus(
    eventId: string,
    userId: string,
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded',
    paymentReference?: string,
    amountPaid?: number,
  ): Promise<any> {
    const attendee = await this.attendeeRepo.findOne({
      where: { eventId, userId },
      relations: ['user'],
    });

    if (!attendee) {
      throw new NotFoundException('Attendee not found');
    }

    const updateData: Partial<EventAttendee> = {
      paymentStatus,
    };

    if (paymentReference) {
      updateData.paymentReference = paymentReference;
    }

    if (amountPaid !== undefined) {
      updateData.amountPaid = amountPaid;
    }

    await this.attendeeRepo.update(attendee.id, updateData);

    // Return updated attendee
    const updatedAttendee = await this.attendeeRepo.findOne({
      where: { id: attendee.id },
      relations: ['user'],
    });

    if (!updatedAttendee) {
      throw new NotFoundException('Updated attendee not found');
    }

    return {
      id: updatedAttendee.id,
      rsvpStatus: updatedAttendee.rsvpStatus,
      guestsCount: updatedAttendee.guestsCount,
      paymentStatus: updatedAttendee.paymentStatus,
      paymentReference: updatedAttendee.paymentReference,
      amountPaid: updatedAttendee.amountPaid,
      user: {
        id: updatedAttendee.user.id,
        firstName: updatedAttendee.user.firstName,
        lastName: updatedAttendee.user.lastName,
        fullName: updatedAttendee.user.fullName,
      },
    };
  }

  /**
   * Search for nearby events using geographic coordinates
   */
  async searchNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
    filters: EventFilterDto,
  ): Promise<PaginatedResponseDto<EventResponseDto>> {
    const radiusMeters = radiusKm * 1000;

    const query = this.eventRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.user', 'user')
      .leftJoinAndSelect('event.category', 'category')
      .leftJoinAndSelect('event.neighborhood', 'neighborhood')
      .leftJoinAndSelect('event.media', 'media')
      .where(
        `ST_DWithin(
          ST_SetSRID(ST_MakePoint(event.longitude, event.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius
        )`,
        { latitude, longitude, radius: radiusMeters }
      )
      .andWhere('event.status = :status', { status: 'published' });

    // Apply additional filters
    if (filters.categoryId) {
      query.andWhere('event.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.search) {
      query.andWhere(
        '(event.title ILIKE :search OR event.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.dateFrom) {
      query.andWhere('event.eventDate >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      query.andWhere('event.eventDate <= :dateTo', { dateTo: filters.dateTo });
    }

    if (filters.isFree !== undefined) {
      query.andWhere('event.isFree = :isFree', { isFree: filters.isFree });
    }

    // Order by distance (closest first)
    query.orderBy(
      `ST_Distance(
        ST_SetSRID(ST_MakePoint(event.longitude, event.latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
      )`,
      'ASC'
    );

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit);

    // Execute query
    const [events, total] = await query.getManyAndCount();

    // Format responses
    const formattedEvents = await Promise.all(
      events.map(event => this.formatEventResponse(event.id)),
    );

    // Build pagination metadata
    const totalPages = Math.ceil(total / limit);
    const meta: PaginationMetaDto = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return {
      data: formattedEvents,
      meta,
    };
  }

  /**
   * Get user's events (organizing and attending)
   */
  async getMyEvents(
    userId: string,
    type: 'organizing' | 'attending' | 'all' = 'all',
    filters: EventFilterDto,
  ): Promise<PaginatedResponseDto<EventResponseDto>> {
    let query: SelectQueryBuilder<Event>;

    if (type === 'organizing') {
      // Events user is organizing
      query = this.eventRepo
        .createQueryBuilder('event')
        .leftJoinAndSelect('event.user', 'user')
        .leftJoinAndSelect('event.category', 'category')
        .leftJoinAndSelect('event.neighborhood', 'neighborhood')
        .leftJoinAndSelect('event.media', 'media')
        .where('event.userId = :userId', { userId });
    } else if (type === 'attending') {
      // Events user is attending
      query = this.eventRepo
        .createQueryBuilder('event')
        .leftJoinAndSelect('event.user', 'user')
        .leftJoinAndSelect('event.category', 'category')
        .leftJoinAndSelect('event.neighborhood', 'neighborhood')
        .leftJoinAndSelect('event.media', 'media')
        .leftJoin('event.attendees', 'attendee')
        .where('attendee.userId = :userId', { userId })
        .andWhere('attendee.rsvpStatus IN (:...statuses)', { statuses: ['going', 'maybe'] });
    } else {
      // All events (organizing + attending)
      query = this.eventRepo
        .createQueryBuilder('event')
        .leftJoinAndSelect('event.user', 'user')
        .leftJoinAndSelect('event.category', 'category')
        .leftJoinAndSelect('event.neighborhood', 'neighborhood')
        .leftJoinAndSelect('event.media', 'media')
        .leftJoin('event.attendees', 'attendee')
        .where(
          '(event.userId = :userId OR (attendee.userId = :userId AND attendee.rsvpStatus IN (:...statuses)))',
          { userId, statuses: ['going', 'maybe'] }
        );
    }

    // Apply additional filters
    if (filters.categoryId) {
      query.andWhere('event.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.search) {
      query.andWhere(
        '(event.title ILIKE :search OR event.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.dateFrom) {
      query.andWhere('event.eventDate >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      query.andWhere('event.eventDate <= :dateTo', { dateTo: filters.dateTo });
    }

    if (filters.status) {
      query.andWhere('event.status = :status', { status: filters.status });
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'eventDate';
    const sortOrder = filters.sortOrder || 'ASC';
    query.orderBy(`event.${sortBy}`, sortOrder);

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit);

    // Execute query
    const [events, total] = await query.getManyAndCount();

    // Format responses
    const formattedEvents = await Promise.all(
      events.map(event => this.formatEventResponse(event.id, userId)),
    );

    // Build pagination metadata
    const totalPages = Math.ceil(total / limit);
    const meta: PaginationMetaDto = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return {
      data: formattedEvents,
      meta,
    };
  }

  /**
   * Get featured events (popular events with high engagement)
   */
  async getFeaturedEvents(limit: number = 5): Promise<EventResponseDto[]> {
    const query = this.eventRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.user', 'user')
      .leftJoinAndSelect('event.category', 'category')
      .leftJoinAndSelect('event.neighborhood', 'neighborhood')
      .leftJoinAndSelect('event.media', 'media')
      .where('event.status = :status', { status: 'published' })
      .andWhere('event.eventDate >= :today', { today: new Date().toISOString().split('T')[0] })
      .orderBy('event.attendeesCount', 'DESC')
      .addOrderBy('event.viewsCount', 'DESC')
      .limit(limit);

    const events = await query.getMany();

    // Format responses
    return Promise.all(
      events.map(event => this.formatEventResponse(event.id)),
    );
  }

  /**
   * Increment event view count (async, non-blocking)
   */
  async incrementViews(eventId: string): Promise<void> {
    try {
      await this.eventRepo.increment({ id: eventId }, 'viewsCount', 1);
    } catch (error) {
      // Silently fail - view counting is not critical
      console.error('Failed to increment view count:', error);
    }
  }

  /**
   * Update event attendees count
   */
  private async updateEventAttendeesCount(eventId: string): Promise<void> {
    const attendeesCount = await this.attendeeRepo.count({
      where: { eventId, rsvpStatus: 'going' },
    });

    await this.eventRepo.update(eventId, { attendeesCount });
  }

  /**
   * Format event response with all related data
   */
  private async formatEventResponse(eventId: string, userId?: string): Promise<EventResponseDto> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ['user', 'category', 'neighborhood', 'media'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Get user RSVP status if userId provided
    let userRsvpStatus: 'going' | 'maybe' | 'not_going' | undefined;
    if (userId) {
      const attendee = await this.attendeeRepo.findOne({
        where: { eventId, userId },
      });
      userRsvpStatus = attendee?.rsvpStatus;
    }

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      eventDate: event.eventDate.toISOString().split('T')[0],
      startTime: event.startTime,
      endTime: event.endTime,
      timezone: event.timezone,
      location: {
        name: event.locationName,
        address: event.locationAddress,
        latitude: event.latitude,
        longitude: event.longitude,
        landmark: event.landmark,
      },
      isFree: event.isFree,
      price: event.price,
      currency: event.currency,
      formattedPrice: event.getFormattedPrice(),
      maxAttendees: event.maxAttendees,
      allowGuests: event.allowGuests,
      requireVerification: event.requireVerification,
      ageRestriction: event.ageRestriction,
      languages: event.languages,
      isPrivate: event.isPrivate,
      coverImageUrl: event.coverImageUrl,
      status: event.status,
      viewsCount: event.viewsCount,
      attendeesCount: event.attendeesCount,
      specialRequirements: event.specialRequirements,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      category: {
        id: event.category.id,
        name: event.category.name,
        icon: event.category.icon,
        colorCode: event.category.colorCode,
        description: event.category.description,
      },
      organizer: {
        id: event.user.id,
        firstName: event.user.firstName,
        lastName: event.user.lastName,
        fullName: event.user.fullName,
        profilePictureUrl: event.user.profilePictureUrl,
        trustScore: event.user.trustScore,
        isVerified: event.user.isVerified,
      },
      media: event.media.map((media: any) => ({
        id: media.id,
        url: media.url,
        type: media.type,
        caption: media.caption,
        displayOrder: media.displayOrder,
      })),
      userRsvpStatus,
      canRsvp: !userRsvpStatus && event.hasSpotsAvailable(),
      isAtCapacity: event.isAtCapacity(),
      isUpcoming: event.isUpcoming(),
      isToday: event.isToday(),
      durationString: event.getDurationString(),
    };
  }
}
