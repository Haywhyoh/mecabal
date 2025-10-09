import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { EventsServiceService } from './events-service.service';
import { Event, EventCategory, EventMedia, EventAttendee, User, Neighborhood } from '@app/database/entities';
import { CreateEventDto, UpdateEventDto, EventFilterDto, RsvpDto, AttendeeFilterDto } from './dto';

describe('EventsServiceService', () => {
  let service: EventsServiceService;
  let eventRepo: Repository<Event>;
  let categoryRepo: Repository<EventCategory>;
  let mediaRepo: Repository<EventMedia>;
  let attendeeRepo: Repository<EventAttendee>;
  let userRepo: Repository<User>;
  let neighborhoodRepo: Repository<Neighborhood>;

  const mockEvent = {
    id: 'event-1',
    userId: 'user-1',
    neighborhoodId: 'neighborhood-1',
    categoryId: 'category-1',
    title: 'Test Event',
    description: 'Test Description',
    eventDate: new Date('2024-12-31'),
    startTime: '18:00',
    endTime: '22:00',
    timezone: 'Africa/Lagos',
    locationName: 'Test Location',
    locationAddress: 'Test Address',
    latitude: 6.4281,
    longitude: 3.4219,
    landmark: 'Test Landmark',
    isFree: true,
    price: null,
    currency: 'NGN',
    maxAttendees: 50,
    allowGuests: true,
    requireVerification: false,
    ageRestriction: null,
    languages: ['English'],
    isPrivate: false,
    coverImageUrl: null,
    specialRequirements: null,
    status: 'published',
    viewsCount: 0,
    attendeesCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    getFormattedPrice: jest.fn().mockReturnValue('Free'),
    hasSpotsAvailable: jest.fn().mockReturnValue(true),
    isAtCapacity: jest.fn().mockReturnValue(false),
    isUpcoming: jest.fn().mockReturnValue(true),
    isToday: jest.fn().mockReturnValue(false),
    getDurationString: jest.fn().mockReturnValue('4 hours'),
  };

  const mockCategory = {
    id: 'category-1',
    name: 'Community',
    icon: 'users',
    colorCode: '#3B82F6',
    description: 'Community events',
  };

  const mockNeighborhood = {
    id: 'neighborhood-1',
    name: 'Victoria Island',
    city: 'Lagos',
    state: 'Lagos',
  };

  const mockUser = {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    profilePictureUrl: null,
    trustScore: 85,
    isVerified: true,
  };

  const mockAttendee = {
    id: 'attendee-1',
    eventId: 'event-1',
    userId: 'user-1',
    rsvpStatus: 'going',
    guestsCount: 0,
    rsvpAt: new Date(),
    checkedIn: false,
    checkedInAt: null,
    paymentStatus: 'pending',
    paymentReference: null,
    amountPaid: null,
    user: mockUser,
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      increment: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        getManyAndCount: jest.fn(),
      })),
    };

    // Clear all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsServiceService,
        {
          provide: getRepositoryToken(Event),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(EventCategory),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(EventMedia),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(EventAttendee),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Neighborhood),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EventsServiceService>(EventsServiceService);
    eventRepo = module.get<Repository<Event>>(getRepositoryToken(Event));
    categoryRepo = module.get<Repository<EventCategory>>(getRepositoryToken(EventCategory));
    mediaRepo = module.get<Repository<EventMedia>>(getRepositoryToken(EventMedia));
    attendeeRepo = module.get<Repository<EventAttendee>>(getRepositoryToken(EventAttendee));
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    neighborhoodRepo = module.get<Repository<Neighborhood>>(getRepositoryToken(Neighborhood));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createEventDto: CreateEventDto = {
      categoryId: 'category-1',
      title: 'Test Event',
      description: 'Test Description',
      eventDate: '2024-12-31',
      startTime: '18:00',
      endTime: '22:00',
      location: {
        name: 'Test Location',
        address: 'Test Address',
        latitude: 6.4281,
        longitude: 3.4219,
        landmark: 'Test Landmark',
      },
      isFree: true,
      maxAttendees: 50,
      allowGuests: true,
      requireVerification: false,
      languages: ['English'],
      isPrivate: false,
      media: [],
    };

    it('should create event successfully', async () => {
      // Mock repository responses
      jest.spyOn(categoryRepo, 'findOne').mockResolvedValue(mockCategory as any);
      jest.spyOn(neighborhoodRepo, 'findOne').mockResolvedValue(mockNeighborhood as any);
      jest.spyOn(eventRepo, 'create').mockReturnValue(mockEvent as any);
      jest.spyOn(eventRepo, 'save').mockResolvedValue(mockEvent as any);
      jest.spyOn(service, 'formatEventResponse').mockResolvedValue({
        id: 'event-1',
        title: 'Test Event',
        description: 'Test Description',
        eventDate: '2024-12-31',
        startTime: '18:00',
        endTime: '22:00',
        timezone: 'Africa/Lagos',
        location: {
          name: 'Test Location',
          address: 'Test Address',
          latitude: 6.4281,
          longitude: 3.4219,
          landmark: 'Test Landmark',
        },
        isFree: true,
        price: null,
        currency: 'NGN',
        maxAttendees: 50,
        allowGuests: true,
        requireVerification: false,
        ageRestriction: null,
        languages: ['English'],
        isPrivate: false,
        coverImageUrl: null,
        status: 'published',
        viewsCount: 0,
        attendeesCount: 0,
        specialRequirements: null,
        createdAt: mockEvent.createdAt.toISOString(),
        updatedAt: mockEvent.updatedAt.toISOString(),
        category: mockCategory,
        organizer: mockUser,
        media: [],
        userRsvpStatus: undefined,
        canRsvp: true,
        isAtCapacity: false,
        isUpcoming: true,
        isToday: false,
        durationString: '4 hours',
      } as any);

      const result = await service.create('user-1', 'neighborhood-1', createEventDto);

      expect(categoryRepo.findOne).toHaveBeenCalledWith({ where: { id: 'category-1' } });
      expect(neighborhoodRepo.findOne).toHaveBeenCalledWith({ where: { id: 'neighborhood-1' } });
      expect(eventRepo.create).toHaveBeenCalled();
      expect(eventRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.title).toBe('Test Event');
    });

    it('should throw NotFoundException if category not found', async () => {
      jest.spyOn(categoryRepo, 'findOne').mockResolvedValue(null);

      await expect(service.create('user-1', 'neighborhood-1', createEventDto))
        .rejects.toThrow(NotFoundException);
      expect(categoryRepo.findOne).toHaveBeenCalledWith({ where: { id: 'category-1' } });
    });

    it('should throw NotFoundException if neighborhood not found', async () => {
      jest.spyOn(categoryRepo, 'findOne').mockResolvedValue(mockCategory as any);
      jest.spyOn(neighborhoodRepo, 'findOne').mockResolvedValue(null);

      await expect(service.create('user-1', 'neighborhood-1', createEventDto))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if location is missing', async () => {
      const invalidDto = { ...createEventDto, location: undefined };
      jest.spyOn(categoryRepo, 'findOne').mockResolvedValue(mockCategory as any);
      jest.spyOn(neighborhoodRepo, 'findOne').mockResolvedValue(mockNeighborhood as any);

      await expect(service.create('user-1', 'neighborhood-1', invalidDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if location data is incomplete', async () => {
      const invalidDto = {
        ...createEventDto,
        location: {
          name: 'Test Location',
          address: 'Test Address',
          latitude: 6.4281,
          longitude: undefined,
          landmark: 'Test Landmark',
        },
      };
      jest.spyOn(categoryRepo, 'findOne').mockResolvedValue(mockCategory as any);
      jest.spyOn(neighborhoodRepo, 'findOne').mockResolvedValue(mockNeighborhood as any);

      await expect(service.create('user-1', 'neighborhood-1', invalidDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should create event with media', async () => {
      const dtoWithMedia = {
        ...createEventDto,
        media: [
          {
            url: 'https://example.com/image1.jpg',
            type: 'image',
            caption: 'Test Image 1',
            displayOrder: 0,
          },
          {
            url: 'https://example.com/image2.jpg',
            type: 'image',
            caption: 'Test Image 2',
            displayOrder: 1,
          },
        ],
      };

      jest.spyOn(categoryRepo, 'findOne').mockResolvedValue(mockCategory as any);
      jest.spyOn(neighborhoodRepo, 'findOne').mockResolvedValue(mockNeighborhood as any);
      jest.spyOn(eventRepo, 'create').mockReturnValue(mockEvent as any);
      jest.spyOn(eventRepo, 'save').mockResolvedValue(mockEvent as any);
      jest.spyOn(mediaRepo, 'create').mockReturnValue({} as any);
      jest.spyOn(mediaRepo, 'save').mockResolvedValue([]);
      jest.spyOn(service, 'formatEventResponse').mockResolvedValue({} as any);

      await service.create('user-1', 'neighborhood-1', dtoWithMedia);

      // Check that create was called with the correct parameters for each media item
      expect(mediaRepo.create).toHaveBeenCalledWith({
        eventId: 'event-1',
        url: 'https://example.com/image1.jpg',
        type: 'image',
        caption: 'Test Image 1',
        displayOrder: 0,
      });
      expect(mediaRepo.create).toHaveBeenCalledWith({
        eventId: 'event-1',
        url: 'https://example.com/image2.jpg',
        type: 'image',
        caption: 'Test Image 2',
        displayOrder: 1,
      });
      expect(mediaRepo.save).toHaveBeenCalled();
    });

    it('should default to published status', async () => {
      jest.spyOn(categoryRepo, 'findOne').mockResolvedValue(mockCategory as any);
      jest.spyOn(neighborhoodRepo, 'findOne').mockResolvedValue(mockNeighborhood as any);
      jest.spyOn(eventRepo, 'create').mockReturnValue(mockEvent as any);
      jest.spyOn(eventRepo, 'save').mockResolvedValue(mockEvent as any);
      jest.spyOn(service, 'formatEventResponse').mockResolvedValue({} as any);

      await service.create('user-1', 'neighborhood-1', createEventDto);

      expect(eventRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published',
        })
      );
    });
  });

  describe('rsvp', () => {
    const rsvpDto: RsvpDto = {
      rsvpStatus: 'going',
      guestsCount: 2,
    };

    it('should create new RSVP', async () => {
      // Mock the first findOne call for event lookup
      jest.spyOn(eventRepo, 'findOne').mockResolvedValueOnce(mockEvent as any);
      // Mock the second findOne call for existing attendee (returns null)
      jest.spyOn(attendeeRepo, 'findOne').mockResolvedValueOnce(null);
      // Mock count for capacity check
      jest.spyOn(attendeeRepo, 'count').mockResolvedValue(10);
      // Mock create and save
      jest.spyOn(attendeeRepo, 'create').mockReturnValue(mockAttendee as any);
      jest.spyOn(attendeeRepo, 'save').mockResolvedValue(mockAttendee as any);
      // Mock the final findOne call to return the created attendee
      jest.spyOn(attendeeRepo, 'findOne').mockResolvedValueOnce(mockAttendee as any);
      jest.spyOn(service as any, 'updateEventAttendeesCount').mockResolvedValue();

      const result = await service.rsvp('event-1', 'user-1', rsvpDto);

      expect(attendeeRepo.create).toHaveBeenCalledWith({
        eventId: 'event-1',
        userId: 'user-1',
        rsvpStatus: 'going',
        guestsCount: 2,
      });
      expect(attendeeRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.rsvpStatus).toBe('going');
    });

    it('should update existing RSVP', async () => {
      jest.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);
      jest.spyOn(attendeeRepo, 'findOne').mockResolvedValue(mockAttendee as any);
      jest.spyOn(attendeeRepo, 'count').mockResolvedValue(10);
      jest.spyOn(attendeeRepo, 'update').mockResolvedValue({} as any);
      jest.spyOn(attendeeRepo, 'findOne').mockResolvedValue(mockAttendee as any);
      jest.spyOn(service as any, 'updateEventAttendeesCount').mockResolvedValue();

      const result = await service.rsvp('event-1', 'user-1', rsvpDto);

      expect(attendeeRepo.update).toHaveBeenCalledWith('attendee-1', {
        rsvpStatus: 'going',
        guestsCount: 2,
      });
      expect(result).toBeDefined();
    });

    it('should throw ConflictException when event is at capacity', async () => {
      const eventAtCapacity = { ...mockEvent, maxAttendees: 10 };
      jest.spyOn(eventRepo, 'findOne').mockResolvedValueOnce(eventAtCapacity as any);
      jest.spyOn(attendeeRepo, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(attendeeRepo, 'count').mockResolvedValue(10);

      await expect(service.rsvp('event-1', 'user-1', rsvpDto))
        .rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when not enough spots for user and guests', async () => {
      const eventWithLimitedCapacity = { ...mockEvent, maxAttendees: 10 };
      jest.spyOn(eventRepo, 'findOne').mockResolvedValueOnce(eventWithLimitedCapacity as any);
      jest.spyOn(attendeeRepo, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(attendeeRepo, 'count').mockResolvedValue(9); // 9 + 3 (user + 2 guests) > 10

      await expect(service.rsvp('event-1', 'user-1', rsvpDto))
        .rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if event not found', async () => {
      jest.spyOn(eventRepo, 'findOne').mockResolvedValue(null);

      await expect(service.rsvp('event-1', 'user-1', rsvpDto))
        .rejects.toThrow(NotFoundException);
    });

    it('should increment attendee count', async () => {
      jest.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);
      jest.spyOn(attendeeRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(attendeeRepo, 'count').mockResolvedValue(10);
      jest.spyOn(attendeeRepo, 'create').mockReturnValue(mockAttendee as any);
      jest.spyOn(attendeeRepo, 'save').mockResolvedValue(mockAttendee as any);
      jest.spyOn(attendeeRepo, 'findOne').mockResolvedValue(mockAttendee as any);
      jest.spyOn(service as any, 'updateEventAttendeesCount').mockResolvedValue();

      await service.rsvp('event-1', 'user-1', rsvpDto);

      expect(service.updateEventAttendeesCount).toHaveBeenCalledWith('event-1');
    });
  });

  describe('findAll', () => {
    const filters: EventFilterDto = {
      page: 1,
      limit: 20,
      categoryId: 'category-1',
      search: 'test',
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
      isFree: true,
    };

    it('should filter by category', async () => {
      const mockQuery = {
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      jest.spyOn(service, 'buildEventQuery').mockReturnValue(mockQuery as any);
      jest.spyOn(service, 'formatEventResponse').mockResolvedValue({} as any);

      await service.findAll(filters);

      expect(service.buildEventQuery).toHaveBeenCalledWith(filters, undefined);
    });

    it('should search by text', async () => {
      const mockQuery = {
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      jest.spyOn(service, 'buildEventQuery').mockReturnValue(mockQuery as any);
      jest.spyOn(service, 'formatEventResponse').mockResolvedValue({} as any);

      await service.findAll(filters);

      expect(service.buildEventQuery).toHaveBeenCalledWith(filters, undefined);
    });

    it('should filter by date range', async () => {
      const mockQuery = {
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      jest.spyOn(service, 'buildEventQuery').mockReturnValue(mockQuery as any);
      jest.spyOn(service, 'formatEventResponse').mockResolvedValue({} as any);

      await service.findAll(filters);

      expect(service.buildEventQuery).toHaveBeenCalledWith(filters, undefined);
    });

    it('should paginate correctly', async () => {
      const mockQuery = {
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      jest.spyOn(service, 'buildEventQuery').mockReturnValue(mockQuery as any);
      jest.spyOn(service, 'formatEventResponse').mockResolvedValue({} as any);

      const result = await service.findAll(filters);

      expect(mockQuery.skip).toHaveBeenCalledWith(0); // (page - 1) * limit
      expect(mockQuery.take).toHaveBeenCalledWith(20);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });
  });

  describe('findOne', () => {
    it('should return event if found', async () => {
      jest.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);
      jest.spyOn(service, 'formatEventResponse').mockResolvedValue({} as any);
      jest.spyOn(service, 'incrementViews').mockResolvedValue();

      const result = await service.findOne('event-1');

      expect(eventRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        relations: ['user', 'category', 'neighborhood', 'media'],
      });
      expect(service.formatEventResponse).toHaveBeenCalledWith('event-1', undefined);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if event not found', async () => {
      jest.spyOn(eventRepo, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('event-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should increment view count', async () => {
      jest.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);
      jest.spyOn(service, 'formatEventResponse').mockResolvedValue({} as any);
      jest.spyOn(service, 'incrementViews').mockResolvedValue();

      await service.findOne('event-1');

      expect(service.incrementViews).toHaveBeenCalledWith('event-1');
    });
  });

  describe('update', () => {
    const updateDto: UpdateEventDto = {
      title: 'Updated Event Title',
      description: 'Updated Description',
    };

    it('should update event successfully', async () => {
      jest.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);
      jest.spyOn(eventRepo, 'update').mockResolvedValue({} as any);
      jest.spyOn(service, 'formatEventResponse').mockResolvedValue({} as any);

      const result = await service.update('event-1', 'user-1', updateDto);

      expect(eventRepo.update).toHaveBeenCalledWith('event-1', {
        title: 'Updated Event Title',
        description: 'Updated Description',
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if event not found', async () => {
      jest.spyOn(eventRepo, 'findOne').mockResolvedValue(null);

      await expect(service.update('event-1', 'user-1', updateDto))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      jest.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);

      await expect(service.update('event-1', 'user-2', updateDto))
        .rejects.toThrow(ForbiddenException);
    });

    it('should validate category if categoryId provided', async () => {
      const updateWithCategory = { ...updateDto, categoryId: 'category-2' };
      jest.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);
      jest.spyOn(categoryRepo, 'findOne').mockResolvedValue(null);

      await expect(service.update('event-1', 'user-1', updateWithCategory))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete event successfully', async () => {
      jest.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);
      jest.spyOn(eventRepo, 'update').mockResolvedValue({} as any);

      await service.remove('event-1', 'user-1');

      expect(eventRepo.update).toHaveBeenCalledWith('event-1', { status: 'cancelled' });
    });

    it('should throw NotFoundException if event not found', async () => {
      jest.spyOn(eventRepo, 'findOne').mockResolvedValue(null);

      await expect(service.remove('event-1', 'user-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      jest.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);

      await expect(service.remove('event-1', 'user-2'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancelRsvp', () => {
    it('should cancel RSVP successfully', async () => {
      jest.spyOn(attendeeRepo, 'findOne').mockResolvedValue(mockAttendee as any);
      jest.spyOn(attendeeRepo, 'delete').mockResolvedValue({} as any);
      jest.spyOn(service, 'updateEventAttendeesCount').mockResolvedValue();

      await service.cancelRsvp('event-1', 'user-1');

      expect(attendeeRepo.delete).toHaveBeenCalledWith('attendee-1');
      expect(service.updateEventAttendeesCount).toHaveBeenCalledWith('event-1');
    });

    it('should throw NotFoundException if RSVP not found', async () => {
      jest.spyOn(attendeeRepo, 'findOne').mockResolvedValue(null);

      await expect(service.cancelRsvp('event-1', 'user-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getAttendees', () => {
    const attendeeFilters: AttendeeFilterDto = {
      page: 1,
      limit: 20,
      rsvpStatus: 'going',
      search: 'john',
    };

    it('should return attendees with filters', async () => {
      const mockQuery = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockAttendee], 1]),
      };
      jest.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);
      jest.spyOn(attendeeRepo, 'createQueryBuilder').mockReturnValue(mockQuery as any);

      const result = await service.getAttendees('event-1', attendeeFilters);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.data[0].rsvpStatus).toBe('going');
    });

    it('should throw NotFoundException if event not found', async () => {
      jest.spyOn(eventRepo, 'findOne').mockResolvedValue(null);

      await expect(service.getAttendees('event-1', attendeeFilters))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getFeaturedEvents', () => {
    it('should return featured events', async () => {
      const mockQuery = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEvent]),
      };
      jest.spyOn(eventRepo, 'createQueryBuilder').mockReturnValue(mockQuery as any);
      jest.spyOn(service, 'formatEventResponse').mockResolvedValue({} as any);

      const result = await service.getFeaturedEvents(5);

      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(result).toHaveLength(1);
    });
  });

  describe('searchNearby', () => {
    const filters: EventFilterDto = {
      page: 1,
      limit: 20,
    };

    it('should search for nearby events', async () => {
      const mockQuery = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      jest.spyOn(eventRepo, 'createQueryBuilder').mockReturnValue(mockQuery as any);
      jest.spyOn(service, 'formatEventResponse').mockResolvedValue({} as any);

      const result = await service.searchNearby(6.4281, 3.4219, 10, filters);

      expect(result.data).toBeDefined();
      expect(result.meta).toBeDefined();
    });
  });

  describe('getMyEvents', () => {
    const filters: EventFilterDto = {
      page: 1,
      limit: 20,
    };

    it('should return organizing events', async () => {
      const mockQuery = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      jest.spyOn(eventRepo, 'createQueryBuilder').mockReturnValue(mockQuery as any);
      jest.spyOn(service, 'formatEventResponse').mockResolvedValue({} as any);

      const result = await service.getMyEvents('user-1', 'organizing', filters);

      expect(result.data).toBeDefined();
      expect(result.meta).toBeDefined();
    });

    it('should return attending events', async () => {
      const mockQuery = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      jest.spyOn(eventRepo, 'createQueryBuilder').mockReturnValue(mockQuery as any);
      jest.spyOn(service, 'formatEventResponse').mockResolvedValue({} as any);

      const result = await service.getMyEvents('user-1', 'attending', filters);

      expect(result.data).toBeDefined();
      expect(result.meta).toBeDefined();
    });
  });

  describe('incrementViews', () => {
    it('should increment view count', async () => {
      jest.spyOn(eventRepo, 'increment').mockResolvedValue({} as any);

      await service.incrementViews('event-1');

      expect(eventRepo.increment).toHaveBeenCalledWith({ id: 'event-1' }, 'viewsCount', 1);
    });

    it('should handle errors silently', async () => {
      jest.spyOn(eventRepo, 'increment').mockRejectedValue(new Error('Database error'));
      jest.spyOn(console, 'error').mockImplementation();

      await service.incrementViews('event-1');

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('updateAttendeePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      jest.spyOn(attendeeRepo, 'findOne').mockResolvedValue(mockAttendee as any);
      jest.spyOn(attendeeRepo, 'update').mockResolvedValue({} as any);
      jest.spyOn(attendeeRepo, 'findOne').mockResolvedValue({
        ...mockAttendee,
        paymentStatus: 'completed',
        paymentReference: 'ref-123',
        amountPaid: 1000,
      } as any);

      const result = await service.updateAttendeePaymentStatus(
        'event-1',
        'user-1',
        'completed',
        'ref-123',
        1000
      );

      expect(attendeeRepo.update).toHaveBeenCalledWith('attendee-1', {
        paymentStatus: 'completed',
        paymentReference: 'ref-123',
        amountPaid: 1000,
      });
      expect(result.paymentStatus).toBe('completed');
    });

    it('should throw NotFoundException if attendee not found', async () => {
      jest.spyOn(attendeeRepo, 'findOne').mockResolvedValue(null);

      await expect(service.updateAttendeePaymentStatus('event-1', 'user-1', 'completed'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
