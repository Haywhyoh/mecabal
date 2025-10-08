# MeCabal Events System - Developer Task Breakdown

**Project:** Events System MVP Implementation
**Estimated Timeline:** 10-13 days
**Last Updated:** October 2025

---

## 📋 Task Overview

This document breaks down the Events System implementation into small, manageable tasks that can be completed independently. Each task includes acceptance criteria and estimated time.

---

## 🎯 PHASE 1: Backend Foundation (Days 1-4)

### Task 1.1: Create Event Category Entity
**File:** `backend/libs/database/src/entities/event-category.entity.ts`
**Estimated Time:** 30 minutes
**Dependencies:** None

**Steps:**
1. Create new file `event-category.entity.ts`
2. Define entity with fields:
   - `id` (serial primary key)
   - `name` (varchar 100, unique, not null)
   - `icon` (varchar 50, not null)
   - `colorCode` (varchar 7, not null)
   - `description` (text)
   - `isActive` (boolean, default true)
   - `displayOrder` (integer, default 0)
   - `createdAt` (timestamp)
   - `updatedAt` (timestamp)
3. Add TypeORM decorators
4. Export entity in `backend/libs/database/src/entities/index.ts`

**Acceptance Criteria:**
- [ ] Entity compiles without errors
- [ ] All fields have proper TypeORM decorators
- [ ] Entity is exported from index file

---

### Task 1.2: Create Event Entity
**File:** `backend/libs/database/src/entities/event.entity.ts`
**Estimated Time:** 1 hour
**Dependencies:** Task 1.1

**Steps:**
1. Create new file `event.entity.ts`
2. Define entity with fields:
   - `id` (uuid primary key)
   - `userId` (uuid, foreign key to users)
   - `neighborhoodId` (uuid, foreign key to neighborhoods)
   - `categoryId` (integer, foreign key to event_categories)
   - `title` (varchar 200)
   - `description` (text)
   - `eventDate` (date)
   - `startTime` (time)
   - `endTime` (time, nullable)
   - `timezone` (varchar 50, default 'Africa/Lagos')
   - `locationName` (varchar 200)
   - `locationAddress` (text)
   - `latitude` (decimal 10,8)
   - `longitude` (decimal 11,8)
   - `landmark` (varchar 200, nullable)
   - `isFree` (boolean, default true)
   - `price` (decimal 10,2, nullable)
   - `currency` (varchar 3, default 'NGN')
   - `maxAttendees` (integer, nullable)
   - `allowGuests` (boolean, default true)
   - `requireVerification` (boolean, default false)
   - `ageRestriction` (varchar 50, nullable)
   - `languages` (jsonb, default '["English"]')
   - `isPrivate` (boolean, default false)
   - `coverImageUrl` (text, nullable)
   - `status` (varchar 20, default 'draft')
   - `viewsCount` (integer, default 0)
   - `attendeesCount` (integer, default 0)
   - `specialRequirements` (text, nullable)
   - `createdAt`, `updatedAt` (timestamps)
3. Add relations:
   - ManyToOne: user, neighborhood, category
   - OneToMany: media, attendees
4. Add indexes:
   - neighborhoodId, categoryId, userId
   - eventDate, status
5. Export entity

**Acceptance Criteria:**
- [ ] Entity compiles without errors
- [ ] All relations are properly defined
- [ ] Indexes are added for performance
- [ ] Entity is exported from index file

---

### Task 1.3: Create Event Media Entity
**File:** `backend/libs/database/src/entities/event-media.entity.ts`
**Estimated Time:** 20 minutes
**Dependencies:** Task 1.2

**Steps:**
1. Create new file `event-media.entity.ts`
2. Define entity with fields:
   - `id` (uuid primary key)
   - `eventId` (uuid, foreign key to events)
   - `url` (text)
   - `type` (varchar 20, enum: 'image' | 'video')
   - `caption` (text, nullable)
   - `displayOrder` (integer, default 0)
   - `createdAt` (timestamp)
3. Add ManyToOne relation to Event
4. Add index on eventId
5. Export entity

**Acceptance Criteria:**
- [ ] Entity compiles without errors
- [ ] Relation to Event is properly defined
- [ ] Entity is exported from index file

---

### Task 1.4: Create Event Attendee Entity
**File:** `backend/libs/database/src/entities/event-attendee.entity.ts`
**Estimated Time:** 30 minutes
**Dependencies:** Task 1.2

**Steps:**
1. Create new file `event-attendee.entity.ts`
2. Define entity with fields:
   - `id` (uuid primary key)
   - `eventId` (uuid, foreign key to events)
   - `userId` (uuid, foreign key to users)
   - `rsvpStatus` (varchar 20, enum: 'going' | 'maybe' | 'not_going')
   - `guestsCount` (integer, default 0)
   - `paymentStatus` (varchar 20, nullable, enum: 'pending' | 'completed' | 'failed' | 'refunded')
   - `paymentReference` (varchar 100, nullable)
   - `amountPaid` (decimal 10,2, nullable)
   - `checkedIn` (boolean, default false)
   - `checkedInAt` (timestamp, nullable)
   - `rsvpAt`, `updatedAt` (timestamps)
3. Add unique constraint on (eventId, userId)
4. Add relations to Event and User
5. Add indexes on eventId, userId, rsvpStatus
6. Export entity

**Acceptance Criteria:**
- [ ] Entity compiles without errors
- [ ] Unique constraint prevents duplicate RSVPs
- [ ] Relations are properly defined
- [ ] Entity is exported from index file

---

### Task 1.5: Create DTOs - Create Event
**File:** `backend/apps/events-service/src/dto/create-event.dto.ts`
**Estimated Time:** 45 minutes
**Dependencies:** None

**Steps:**
1. Create `dto` folder in events-service
2. Create `create-event.dto.ts`
3. Define DTO with validation:
   ```typescript
   export class CreateEventDto {
     @IsInt() @Min(1) categoryId: number;
     @IsNotEmpty() @MaxLength(200) title: string;
     @IsNotEmpty() description: string;
     @IsDateString() eventDate: string;
     @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/) startTime: string;
     @IsOptional() @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/) endTime?: string;
     @ValidateNested() @Type(() => LocationDto) location: LocationDto;
     @IsBoolean() isFree: boolean;
     @ValidateIf(o => !o.isFree) @IsNumber() @Min(0) price?: number;
     @IsOptional() @IsInt() @Min(1) maxAttendees?: number;
     @IsOptional() @IsBoolean() allowGuests?: boolean;
     @IsOptional() @IsBoolean() requireVerification?: boolean;
     @IsOptional() @IsString() ageRestriction?: string;
     @IsOptional() @IsArray() @IsString({ each: true }) languages?: string[];
     @IsOptional() @IsBoolean() isPrivate?: boolean;
     @IsOptional() @IsUrl() coverImageUrl?: string;
     @IsOptional() @IsArray() @ValidateNested({ each: true }) media?: MediaDto[];
     @IsOptional() @IsString() specialRequirements?: string;
   }

   export class LocationDto {
     @IsNotEmpty() name: string;
     @IsNotEmpty() address: string;
     @IsNumber() @Min(-90) @Max(90) latitude: number;
     @IsNumber() @Min(-180) @Max(180) longitude: number;
     @IsOptional() @IsString() landmark?: string;
   }

   export class MediaDto {
     @IsUrl() url: string;
     @IsEnum(['image', 'video']) type: 'image' | 'video';
     @IsOptional() @IsString() caption?: string;
     @IsOptional() @IsInt() displayOrder?: number;
   }
   ```
4. Export from `dto/index.ts`

**Acceptance Criteria:**
- [ ] All fields have proper validation decorators
- [ ] Conditional validation works (price required when not free)
- [ ] Nested objects are validated
- [ ] DTO exports properly

---

### Task 1.6: Create DTOs - Update, Filter, Response
**File:** `backend/apps/events-service/src/dto/`
**Estimated Time:** 1 hour
**Dependencies:** Task 1.5

**Steps:**
1. Create `update-event.dto.ts`:
   ```typescript
   export class UpdateEventDto extends PartialType(CreateEventDto) {}
   ```

2. Create `event-filter.dto.ts`:
   ```typescript
   export class EventFilterDto {
     @IsOptional() @IsInt() @Min(1) page?: number;
     @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number;
     @IsOptional() @IsInt() categoryId?: number;
     @IsOptional() @IsEnum(['draft', 'published', 'cancelled', 'completed']) status?: string;
     @IsOptional() @IsString() search?: string;
     @IsOptional() @IsDateString() dateFrom?: string;
     @IsOptional() @IsDateString() dateTo?: string;
     @IsOptional() @IsUUID() neighborhoodId?: string;
     @IsOptional() @IsBoolean() isFree?: boolean;
     @IsOptional() @IsEnum(['createdAt', 'eventDate', 'attendeesCount']) sortBy?: string;
     @IsOptional() @IsEnum(['ASC', 'DESC']) sortOrder?: 'ASC' | 'DESC';
   }
   ```

3. Create `rsvp.dto.ts`:
   ```typescript
   export class RsvpDto {
     @IsEnum(['going', 'maybe', 'not_going']) rsvpStatus: 'going' | 'maybe' | 'not_going';
     @IsOptional() @IsInt() @Min(0) guestsCount?: number;
   }
   ```

4. Create `event-response.dto.ts` with full response structure
5. Create `paginated-response.dto.ts` for list responses
6. Export all from `dto/index.ts`

**Acceptance Criteria:**
- [ ] All DTOs compile without errors
- [ ] Validation decorators are properly applied
- [ ] Response DTOs match API specification
- [ ] All exports work properly

---

### Task 1.7: Implement Events Service - CRUD Operations
**File:** `backend/apps/events-service/src/events-service.service.ts`
**Estimated Time:** 2 hours
**Dependencies:** Tasks 1.1-1.6

**Steps:**
1. Inject repositories:
   ```typescript
   constructor(
     @InjectRepository(Event) private eventRepo: Repository<Event>,
     @InjectRepository(EventCategory) private categoryRepo: Repository<EventCategory>,
     @InjectRepository(EventMedia) private mediaRepo: Repository<EventMedia>,
     @InjectRepository(EventAttendee) private attendeeRepo: Repository<EventAttendee>,
     @InjectRepository(User) private userRepo: Repository<User>,
   ) {}
   ```

2. Implement `create` method:
   - Validate category exists
   - Create event with raw SQL for geography field
   - Handle media attachments
   - Return formatted response

3. Implement `findAll` method:
   - Build query with filters
   - Apply pagination
   - Apply sorting
   - Join relations (user, category, media)
   - Return paginated response

4. Implement `findOne` method:
   - Find event by ID with relations
   - Increment view count (async, no await)
   - Check user's RSVP status
   - Return formatted response

5. Implement `update` method:
   - Validate ownership
   - Update event fields
   - Update media if provided
   - Return updated event

6. Implement `remove` method:
   - Validate ownership
   - Soft delete (set status to 'cancelled')
   - Return void

7. Add helper method `formatEventResponse`:
   - Format dates
   - Add organizer info
   - Add user RSVP status
   - Format location

**Acceptance Criteria:**
- [ ] All CRUD methods work correctly
- [ ] Validation throws appropriate errors
- [ ] Responses match DTO structure
- [ ] Owner-only operations are protected
- [ ] Geography fields are properly handled

---

### Task 1.8: Implement Events Service - RSVP Management
**File:** `backend/apps/events-service/src/events-service.service.ts`
**Estimated Time:** 1.5 hours
**Dependencies:** Task 1.7

**Steps:**
1. Implement `rsvp` method:
   - Check if event exists
   - Check if already RSVP'd
   - Check capacity if max attendees set
   - Create or update attendee record
   - Update event attendees count
   - Return attendee info

2. Implement `cancelRsvp` method:
   - Find attendee record
   - Delete record
   - Decrement event attendees count
   - Return void

3. Implement `getAttendees` method:
   - Query attendees with filters
   - Apply pagination
   - Join user profiles
   - Return paginated list

4. Implement `updateAttendeePaymentStatus` method:
   - Find attendee
   - Update payment fields
   - Handle payment completed logic
   - Return updated attendee

**Acceptance Criteria:**
- [ ] RSVP prevents duplicates
- [ ] Capacity limits are enforced
- [ ] Attendee count is accurate
- [ ] Payment status updates work
- [ ] Pagination works for attendees

---

### Task 1.9: Implement Events Service - Search & Geographic
**File:** `backend/apps/events-service/src/events-service.service.ts`
**Estimated Time:** 1.5 hours
**Dependencies:** Task 1.7

**Steps:**
1. Implement `searchNearby` method:
   ```typescript
   async searchNearby(
     latitude: number,
     longitude: number,
     radiusKm: number,
     filters: EventFilterDto,
   ) {
     const radiusMeters = radiusKm * 1000;

     const query = this.eventRepo
       .createQueryBuilder('event')
       .leftJoinAndSelect('event.user', 'user')
       .leftJoinAndSelect('event.category', 'category')
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
     // Order by distance
     // Return results
   }
   ```

2. Implement `getMyEvents` method:
   - Get events user is organizing
   - Get events user is attending
   - Merge and deduplicate
   - Apply pagination
   - Return results

3. Implement `getFeaturedEvents` method:
   - Query popular events (high attendee count or views)
   - Limit to 5-10 events
   - Cache results
   - Return formatted events

4. Implement `incrementViews` method:
   - Async increment without blocking
   - Use repository.increment()
   - Return void

**Acceptance Criteria:**
- [ ] Geographic search returns nearby events
- [ ] Distance is calculated correctly
- [ ] My events includes both organized and attending
- [ ] Featured events logic works
- [ ] View counting doesn't block requests

---

### Task 1.10: Create Events Controller
**File:** `backend/apps/events-service/src/events-service.controller.ts`
**Estimated Time:** 2 hours
**Dependencies:** Tasks 1.7-1.9

**Steps:**
1. Remove default getHello method
2. Add all endpoints:

```typescript
@Controller()
export class EventsServiceController {
  constructor(private readonly eventsService: EventsServiceService) {}

  @Get()
  @ApiOperation({ summary: 'Get all events' })
  async findAll(@Query() filters: EventFilterDto, @CurrentUser() user?: User) {
    return this.eventsService.findAll(filters, user?.id);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby events' })
  async findNearby(
    @Query('latitude') lat: number,
    @Query('longitude') lng: number,
    @Query('radiusKm') radius: number = 5,
    @Query() filters: EventFilterDto,
  ) {
    return this.eventsService.searchNearby(lat, lng, radius, filters);
  }

  @Get('my-events')
  @UseGuards(MarketplaceAuthGuard)
  @ApiOperation({ summary: 'Get user events' })
  async getMyEvents(
    @CurrentUser() user: User,
    @Query('type') type: 'organizing' | 'attending' | 'all' = 'all',
    @Query() filters: EventFilterDto,
  ) {
    return this.eventsService.getMyEvents(user.id, type, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user?: User) {
    return this.eventsService.findOne(id, user?.id);
  }

  @Post()
  @UseGuards(MarketplaceAuthGuard)
  @ApiOperation({ summary: 'Create event' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateEventDto,
  ) {
    return this.eventsService.create(user.id, user.neighborhoodId, dto);
  }

  @Patch(':id')
  @UseGuards(MarketplaceAuthGuard)
  @ApiOperation({ summary: 'Update event' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(MarketplaceAuthGuard)
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete event' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.eventsService.remove(id, user.id);
  }

  @Post(':id/rsvp')
  @UseGuards(MarketplaceAuthGuard)
  @ApiOperation({ summary: 'RSVP to event' })
  async rsvp(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: RsvpDto,
  ) {
    return this.eventsService.rsvp(id, user.id, dto);
  }

  @Delete(':id/rsvp')
  @UseGuards(MarketplaceAuthGuard)
  @HttpCode(204)
  @ApiOperation({ summary: 'Cancel RSVP' })
  async cancelRsvp(@Param('id') id: string, @CurrentUser() user: User) {
    return this.eventsService.cancelRsvp(id, user.id);
  }

  @Get(':id/attendees')
  @UseGuards(MarketplaceAuthGuard)
  @ApiOperation({ summary: 'Get event attendees' })
  async getAttendees(
    @Param('id') id: string,
    @Query() filters: AttendeeFilterDto,
  ) {
    return this.eventsService.getAttendees(id, filters);
  }

  @Post(':id/increment-views')
  @HttpCode(204)
  @ApiOperation({ summary: 'Increment view count' })
  async incrementViews(@Param('id') id: string) {
    return this.eventsService.incrementViews(id);
  }
}
```

3. Add Swagger decorators
4. Add validation pipes

**Acceptance Criteria:**
- [ ] All endpoints are defined
- [ ] Guards are properly applied
- [ ] Swagger documentation is complete
- [ ] Validation works on all inputs

---

### Task 1.11: Update Events Module
**File:** `backend/apps/events-service/src/events-service.module.ts`
**Estimated Time:** 20 minutes
**Dependencies:** Task 1.10

**Steps:**
1. Import TypeOrmModule with all entities:
   ```typescript
   @Module({
     imports: [
       TypeOrmModule.forFeature([
         Event,
         EventCategory,
         EventMedia,
         EventAttendee,
         User,
         Neighborhood,
       ]),
       AuthModule,
       DatabaseModule,
     ],
     controllers: [EventsServiceController],
     providers: [EventsServiceService],
     exports: [EventsServiceService],
   })
   export class EventsServiceModule {}
   ```
2. Import necessary modules (AuthModule, DatabaseModule)
3. Export service for use in other modules

**Acceptance Criteria:**
- [ ] Module compiles without errors
- [ ] All entities are registered
- [ ] Dependencies are properly imported
- [ ] Service is exported

---

### Task 1.12: Generate Database Migration
**File:** `backend/libs/database/src/migrations/`
**Estimated Time:** 30 minutes
**Dependencies:** Tasks 1.1-1.4

**Steps:**
1. Run migration generation:
   ```bash
   cd backend
   npm run migration:generate -- -n CreateEventsTables
   ```
2. Review generated migration file
3. Add any manual adjustments needed:
   - PostGIS geography column
   - Check constraints
   - Custom indexes
4. Test migration up:
   ```bash
   npm run migration:run
   ```
5. Test migration down:
   ```bash
   npm run migration:revert
   ```
6. Run migration up again for clean state

**Acceptance Criteria:**
- [ ] Migration file is generated
- [ ] Migration runs without errors
- [ ] All tables are created correctly
- [ ] Revert works properly
- [ ] PostGIS columns are functional

---

### Task 1.13: Create Event Categories Seed Script
**File:** `backend/seed-event-categories.ts`
**Estimated Time:** 30 minutes
**Dependencies:** Task 1.12

**Steps:**
1. Create seed script file in backend root:
   ```typescript
   import { DataSource } from 'typeorm';
   import { EventCategory } from './libs/database/src/entities/event-category.entity';

   const categories = [
     { name: 'Religious Services', icon: 'church', colorCode: '#7B68EE', description: '...', displayOrder: 1 },
     { name: 'Cultural Festivals', icon: 'festival', colorCode: '#FF6B35', description: '...', displayOrder: 2 },
     // ... all 10 categories
   ];

   async function seed() {
     const dataSource = new DataSource({
       type: 'postgres',
       url: process.env.DATABASE_URL,
       entities: [EventCategory],
     });

     await dataSource.initialize();
     const repo = dataSource.getRepository(EventCategory);

     for (const cat of categories) {
       const exists = await repo.findOne({ where: { name: cat.name } });
       if (!exists) {
         await repo.save(cat);
         console.log(`✓ Created category: ${cat.name}`);
       }
     }

     await dataSource.destroy();
     console.log('✓ Seed completed');
   }

   seed().catch(console.error);
   ```

2. Add script to package.json:
   ```json
   "scripts": {
     "seed:event-categories": "ts-node seed-event-categories.ts"
   }
   ```

3. Run seed script:
   ```bash
   npm run seed:event-categories
   ```

**Acceptance Criteria:**
- [ ] Script runs without errors
- [ ] All 10 categories are inserted
- [ ] Running twice doesn't create duplicates
- [ ] Categories are visible in database

---

### Task 1.14: Integrate with API Gateway
**File:** `backend/apps/gateway/src/`
**Estimated Time:** 30 minutes
**Dependencies:** Task 1.11

**Steps:**
1. Add events service to gateway configuration
2. Update gateway module to proxy requests
3. Add rate limiting if needed
4. Test all endpoints through gateway:
   ```bash
   # Test from gateway
   curl http://localhost:3000/events
   curl http://localhost:3000/events/nearby?latitude=6.5&longitude=3.3&radiusKm=5
   ```
5. Update API documentation

**Acceptance Criteria:**
- [ ] Events endpoints accessible through gateway
- [ ] Authentication works through gateway
- [ ] All CRUD operations work
- [ ] Response format is consistent

---

## 🎯 PHASE 2: Mobile Integration (Days 5-8)

### Task 2.1: Create Events API Service
**File:** `Hommie_Mobile/src/services/EventsApi.ts`
**Estimated Time:** 1.5 hours
**Dependencies:** Phase 1 complete

**Steps:**
1. Create EventsApi service file
2. Configure axios instance with base URL
3. Add auth token interceptor
4. Implement all API methods:
   - `getEvents(filters)`
   - `getEvent(id)`
   - `createEvent(data)`
   - `updateEvent(id, data)`
   - `deleteEvent(id)`
   - `rsvpEvent(id, data)`
   - `cancelRsvp(id)`
   - `getAttendees(id, filters)`
   - `getNearbyEvents(params)`
   - `getMyEvents(type)`
   - `incrementViews(id)`
   - `uploadImage(file)`
5. Add error handling wrapper
6. Export service and types

**Acceptance Criteria:**
- [ ] All API methods are implemented
- [ ] TypeScript types match backend DTOs
- [ ] Error handling works correctly
- [ ] Auth token is automatically added
- [ ] Network errors are handled gracefully

---

### Task 2.2: Update EventsScreen - API Integration
**File:** `Hommie_Mobile/src/screens/EventsScreen.tsx`
**Estimated Time:** 2 hours
**Dependencies:** Task 2.1

**Steps:**
1. Remove import of `demoEvents` from eventsData.ts
2. Add state management:
   ```typescript
   const [events, setEvents] = useState<Event[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   ```
3. Create `fetchEvents` function:
   ```typescript
   const fetchEvents = async () => {
     try {
       setLoading(true);
       setError(null);
       const response = await EventsApi.getEvents({
         page,
         limit: 20,
         categoryId: selectedCategories.length > 0 ? selectedCategories[0] : undefined,
         search: searchQuery || undefined,
       });
       setEvents(response.data);
     } catch (err) {
       setError(handleApiError(err));
     } finally {
       setLoading(false);
     }
   };
   ```
4. Add useEffect to fetch on mount and filter changes
5. Implement pull-to-refresh
6. Add loading skeleton/spinner
7. Add error state with retry button
8. Update search to debounce API calls (300ms)

**Acceptance Criteria:**
- [ ] Events load from API on mount
- [ ] Filters trigger new API calls
- [ ] Search is debounced
- [ ] Pull-to-refresh works
- [ ] Loading states are shown
- [ ] Errors are displayed with retry option
- [ ] No console errors

---

### Task 2.3: Update EventDetailsScreen - API Integration
**File:** `Hommie_Mobile/src/screens/EventDetailsScreen.tsx`
**Estimated Time:** 1.5 hours
**Dependencies:** Task 2.1

**Steps:**
1. Replace static event lookup with API call
2. Fetch event on mount:
   ```typescript
   useEffect(() => {
     const fetchEvent = async () => {
       try {
         setLoading(true);
         const data = await EventsApi.getEvent(eventId);
         setEvent(data);

         // Increment views (fire and forget)
         EventsApi.incrementViews(eventId).catch(() => {});
       } catch (err) {
         setError(handleApiError(err));
       } finally {
         setLoading(false);
       }
     };

     fetchEvent();
   }, [eventId]);
   ```
3. Implement real RSVP with optimistic updates:
   ```typescript
   const handleRSVP = async (status: RsvpStatus) => {
     // Optimistic update
     const prevStatus = event.userRsvpStatus;
     const prevCount = event.attendeesCount;

     setEvent({
       ...event,
       userRsvpStatus: status,
       attendeesCount: prevStatus ? prevCount : prevCount + 1,
     });

     try {
       await EventsApi.rsvpEvent(eventId, { rsvpStatus: status });
       Alert.alert('Success', `You are now marked as ${status}`);
     } catch (err) {
       // Rollback
       setEvent({ ...event, userRsvpStatus: prevStatus, attendeesCount: prevCount });
       Alert.alert('Error', handleApiError(err));
     }
   };
   ```
4. Add loading and error states
5. Handle navigation from deep links

**Acceptance Criteria:**
- [ ] Event loads from API
- [ ] RSVP updates work
- [ ] Optimistic UI updates work
- [ ] Rollback on error works
- [ ] View count increments
- [ ] Loading and error states shown

---

### Task 2.4: Fix Date/Time Picker Bug in CreateEventScreen
**File:** `Hommie_Mobile/src/screens/CreateEventScreen.tsx`
**Estimated Time:** 45 minutes
**Dependencies:** None
**Priority:** HIGH - Blocking event creation

**Known Issue:** Date and time pickers are showing blank/white screen instead of the picker interface.

**Root Cause:** DateTimePicker component needs proper styling and the modal presentation needs adjustment for iOS.

**Steps:**
1. Update DateTimePicker styling for iOS modal:
   ```typescript
   // Add/update in styles section
   const styles = StyleSheet.create({
     // ... existing styles
     pickerContainer: {
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
       backgroundColor: colors.white,
       paddingVertical: spacing.xl,
     },
   });
   ```

2. Fix iOS DateTimePicker by adding explicit background colors:
   ```typescript
   {showDatePicker && Platform.OS === 'ios' && (
     <Modal
       visible={showDatePicker}
       animationType="slide"
       presentationStyle="pageSheet"
       transparent={false}
     >
       <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.white }]}>
         <View style={styles.modalHeader}>
           <TouchableOpacity onPress={() => setShowDatePicker(false)}>
             <Text style={styles.modalCancel}>Cancel</Text>
           </TouchableOpacity>
           <Text style={styles.modalTitle}>Select Date</Text>
           <TouchableOpacity onPress={() => setShowDatePicker(false)}>
             <Text style={styles.modalSend}>Done</Text>
           </TouchableOpacity>
         </View>
         <View style={[styles.pickerContainer, { backgroundColor: colors.white }]}>
           <DateTimePicker
             value={formData.date || new Date()}
             mode="date"
             display="spinner"
             onChange={handleDateChange}
             minimumDate={new Date()}
             textColor={colors.text.dark}
             style={{ backgroundColor: colors.white, height: 200 }}
           />
         </View>
       </SafeAreaView>
     </Modal>
   )}
   ```

3. Apply same fix to time pickers (startTime and endTime):
   ```typescript
   {showTimePicker && Platform.OS === 'ios' && (
     <Modal
       visible={showTimePicker}
       animationType="slide"
       presentationStyle="pageSheet"
       transparent={false}
     >
       <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.white }]}>
         <View style={styles.modalHeader}>
           <TouchableOpacity onPress={() => setShowTimePicker(false)}>
             <Text style={styles.modalCancel}>Cancel</Text>
           </TouchableOpacity>
           <Text style={styles.modalTitle}>Select Start Time</Text>
           <TouchableOpacity onPress={() => setShowTimePicker(false)}>
             <Text style={styles.modalSend}>Done</Text>
           </TouchableOpacity>
         </View>
         <View style={[styles.pickerContainer, { backgroundColor: colors.white }]}>
           <DateTimePicker
             value={formData.time || new Date()}
             mode="time"
             display="spinner"
             onChange={handleTimeChange}
             textColor={colors.text.dark}
             style={{ backgroundColor: colors.white, height: 200 }}
           />
         </View>
       </SafeAreaView>
     </Modal>
   )}
   ```

4. **Alternative Solution (Recommended):** Use a third-party picker with better styling:
   ```bash
   npm install react-native-modal-datetime-picker @react-native-community/datetimepicker
   ```

   Replace DateTimePicker implementation:
   ```typescript
   import DateTimePickerModal from 'react-native-modal-datetime-picker';

   // For date picker
   <DateTimePickerModal
     isVisible={showDatePicker}
     mode="date"
     date={formData.date || new Date()}
     minimumDate={new Date()}
     onConfirm={(date) => {
       updateFormData('date', date);
       setShowDatePicker(false);
     }}
     onCancel={() => setShowDatePicker(false)}
   />

   // For time picker
   <DateTimePickerModal
     isVisible={showTimePicker}
     mode="time"
     date={formData.time || new Date()}
     onConfirm={(time) => {
       updateFormData('time', time);
       setShowTimePicker(false);
     }}
     onCancel={() => setShowTimePicker(false)}
   />
   ```

5. Test on both iOS and Android physical devices (pickers don't work well in simulators)

6. Verify date/time formatting displays correctly after selection

**Acceptance Criteria:**
- [ ] Date picker shows spinner/calendar interface (not blank screen)
- [ ] Time pickers show time selection interface (not blank screen)
- [ ] Selected date/time displays correctly in the input field
- [ ] Works on both iOS (spinner) and Android (native picker)
- [ ] Modal can be dismissed with Cancel and Done buttons
- [ ] Minimum date validation works (can't select past dates)
- [ ] Date format shows as "Day, DD Mon YYYY" (e.g., "Fri, 15 Nov 2025")
- [ ] Time format shows as "HH:mm" 24-hour format (e.g., "14:30")

**Testing Checklist:**
- [ ] Test on iOS physical device or simulator with iOS 14+
- [ ] Test on Android physical device
- [ ] Test date selection and verify display format
- [ ] Test start time selection
- [ ] Test end time selection (optional field)
- [ ] Test canceling picker without selection
- [ ] Test form validation with selected dates/times
- [ ] Test selecting today's date
- [ ] Test that past dates cannot be selected

**Known iOS Issues:**
- Picker may show blank on iOS 14+ due to presentation style
- Solution: Use `presentationStyle="pageSheet"` and explicit background colors
- Or use `react-native-modal-datetime-picker` which handles this automatically

---

### Task 2.5: Update CreateEventScreen - API Integration
**File:** `Hommie_Mobile/src/screens/CreateEventScreen.tsx`
**Estimated Time:** 2.5 hours
**Dependencies:** Task 2.1, Task 2.4 (date picker must work first)

**Steps:**
1. Add image picker functionality:
   ```typescript
   import * as ImagePicker from 'expo-image-picker';

   const pickImage = async () => {
     const result = await ImagePicker.launchImageLibraryAsync({
       mediaTypes: ImagePicker.MediaTypeOptions.Images,
       allowsEditing: true,
       aspect: [16, 9],
       quality: 0.8,
     });

     if (!result.canceled) {
       setUploading(true);
       try {
         const url = await uploadImage(result.assets[0]);
         updateFormData('coverImageUrl', url);
       } catch (err) {
         Alert.alert('Upload Failed', handleApiError(err));
       } finally {
         setUploading(false);
       }
     }
   };
   ```

2. Implement image upload:
   ```typescript
   const uploadImage = async (asset: ImagePickerAsset) => {
     const formData = new FormData();
     formData.append('file', {
       uri: asset.uri,
       type: 'image/jpeg',
       name: 'event-image.jpg',
     } as any);

     return await EventsApi.uploadImage(formData);
   };
   ```

3. Update handleSubmit to call API:
   ```typescript
   const handleSubmit = async () => {
     if (!validateStep(currentStep)) {
       Alert.alert('Error', 'Please complete all required fields');
       return;
     }

     setSubmitting(true);
     try {
       const dto = formatFormDataForApi(formData);
       await EventsApi.createEvent(dto);

       Alert.alert(
         'Success!',
         'Your event has been created and is now live.',
         [{ text: 'OK', onPress: () => navigation.navigate('Events') }]
       );
     } catch (err) {
       Alert.alert('Error', handleApiError(err));
     } finally {
       setSubmitting(false);
     }
   };
   ```

4. Add form validation helper
5. Add progress indicator during submission
6. Handle validation errors from API

**Acceptance Criteria:**
- [ ] Image picker works on iOS and Android
- [ ] Images upload successfully
- [ ] Form submits to API
- [ ] Validation errors are shown
- [ ] Success redirects to events list
- [ ] Loading states during upload/submit

---

### Task 2.6: Update EventAttendeesScreen - API Integration
**File:** `Hommie_Mobile/src/screens/EventAttendeesScreen.tsx`
**Estimated Time:** 1 hour
**Dependencies:** Task 2.1

**Steps:**
1. Replace demo attendees with API call:
   ```typescript
   useEffect(() => {
     const fetchAttendees = async () => {
       try {
         setLoading(true);
         const response = await EventsApi.getAttendees(eventId, {
           rsvpStatus: selectedFilter !== 'all' ? selectedFilter : undefined,
           page: 1,
           limit: 50,
         });
         setAttendees(response.data);
       } catch (err) {
         setError(handleApiError(err));
       } finally {
         setLoading(false);
       }
     };

     fetchAttendees();
   }, [eventId, selectedFilter]);
   ```
2. Update filter to refetch from API
3. Add pagination for large attendee lists
4. Implement search with API call
5. Add loading and error states

**Acceptance Criteria:**
- [ ] Attendees load from API
- [ ] Filtering works correctly
- [ ] Search queries API
- [ ] Pagination works
- [ ] Loading and error states shown

---

### Task 2.7: Add Loading Skeletons
**Files:** Various screens
**Estimated Time:** 1.5 hours
**Dependencies:** Tasks 2.2-2.6

**Steps:**
1. Install skeleton library:
   ```bash
   npm install react-native-skeleton-placeholder
   ```
2. Create EventCardSkeleton component
3. Create EventDetailsSkeleton component
4. Add to EventsScreen while loading
5. Add to EventDetailsScreen while loading
6. Use native ActivityIndicator for simple loading

**Acceptance Criteria:**
- [ ] Skeletons match actual component layout
- [ ] Smooth transition from skeleton to content
- [ ] Works on both iOS and Android

---

### Task 2.8: Implement Proper Error Handling
**Files:** All event screens
**Estimated Time:** 1 hour
**Dependencies:** Tasks 2.2-2.6

**Steps:**
1. Create ErrorView component:
   ```typescript
   const ErrorView = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
     <View style={styles.errorContainer}>
       <MaterialCommunityIcons name="alert-circle" size={64} color={colors.danger} />
       <Text style={styles.errorTitle}>Oops!</Text>
       <Text style={styles.errorText}>{error}</Text>
       <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
         <Text style={styles.retryText}>Retry</Text>
       </TouchableOpacity>
     </View>
   );
   ```
2. Add to all screens with API calls
3. Handle network errors specifically
4. Show offline indicator when no connection

**Acceptance Criteria:**
- [ ] All API errors show user-friendly messages
- [ ] Retry button works correctly
- [ ] Network errors are handled differently
- [ ] UI remains responsive during errors

---

### Task 2.9: Fix Navigation Stack
**File:** `Hommie_Mobile/App.tsx`
**Estimated Time:** 30 minutes
**Dependencies:** None

**Steps:**
1. Ensure CreateEvent screen is in navigation stack
2. Add EventDetails, EventAttendees, EventPayment to stack
3. Configure proper screen options
4. Test navigation flow:
   - Events → Create Event → Events
   - Events → Event Details → Attendees
   - Event Details → RSVP → Payment
5. Add deep linking config for event sharing:
   ```typescript
   const linking = {
     prefixes: ['mecabal://', 'https://mecabal.com'],
     config: {
       screens: {
         EventDetails: 'events/:id',
       },
     },
   };
   ```

**Acceptance Criteria:**
- [ ] All event screens navigate correctly
- [ ] Back button works as expected
- [ ] Deep links open correct screen
- [ ] Screen transitions are smooth

---

### Task 2.9: Add Pull-to-Refresh Everywhere
**Files:** EventsScreen, EventDetailsScreen, EventAttendeesScreen
**Estimated Time:** 45 minutes
**Dependencies:** Tasks 2.2, 2.3, 2.5

**Steps:**
1. Add RefreshControl to ScrollView/FlatList:
   ```typescript
   <ScrollView
     refreshControl={
       <RefreshControl
         refreshing={refreshing}
         onRefresh={onRefresh}
         tintColor={colors.primary}
       />
     }
   >
   ```
2. Implement onRefresh function to refetch data
3. Ensure refreshing state is properly managed
4. Test on both iOS and Android

**Acceptance Criteria:**
- [ ] Pull down to refresh works
- [ ] Loading indicator shows
- [ ] Data updates after refresh
- [ ] Works on both platforms

---

## 🎯 PHASE 3: Polish & Apple HIG (Days 9-10)

### Task 3.1: Visual Design - Typography
**Files:** All event screens
**Estimated Time:** 1 hour
**Dependencies:** Phase 2 complete

**Steps:**
1. Audit all text elements
2. Apply proper iOS typography scale:
   - Large Title (34pt, bold) for screen titles
   - Title 1 (28pt, regular) for section headers
   - Headline (17pt, semibold) for cards
   - Body (17pt, regular) for descriptions
   - Callout (16pt) for secondary text
   - Footnote (13pt) for metadata
   - Caption (12pt) for labels
3. Ensure proper line heights
4. Test with Dynamic Type (accessibility)

**Acceptance Criteria:**
- [ ] Typography hierarchy is clear
- [ ] Text is readable at all sizes
- [ ] Dynamic Type works (bonus)
- [ ] Consistent across all screens

---

### Task 3.2: Visual Design - Colors & Contrast
**Files:** All event screens
**Estimated Time:** 1 hour
**Dependencies:** Task 3.1

**Steps:**
1. Audit color usage for contrast
2. Ensure WCAG AA compliance (4.5:1 for normal text)
3. Test all interactive elements
4. Add dark mode support:
   ```typescript
   import { useColorScheme } from 'react-native';

   const scheme = useColorScheme();
   const colors = scheme === 'dark' ? darkColors : lightColors;
   ```
5. Test in both light and dark modes

**Acceptance Criteria:**
- [ ] All text meets contrast requirements
- [ ] Dark mode looks good
- [ ] Interactive elements are clearly visible
- [ ] Brand colors are preserved

---

### Task 3.3: Interaction - Touch Targets
**Files:** All event screens
**Estimated Time:** 45 minutes
**Dependencies:** Task 3.2

**Steps:**
1. Audit all touchable elements
2. Ensure minimum 44x44pt touch targets
3. Add hitSlop to small elements:
   ```typescript
   <TouchableOpacity
     hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
   >
   ```
4. Increase button padding where needed
5. Test tapping accuracy on device

**Acceptance Criteria:**
- [ ] All buttons are easy to tap
- [ ] No accidental taps on nearby elements
- [ ] Works well with larger fingers
- [ ] Passes accessibility guidelines

---

### Task 3.4: Interaction - Haptic Feedback
**Files:** All interactive event screens
**Estimated Time:** 30 minutes
**Dependencies:** Task 3.3

**Steps:**
1. Install haptics:
   ```bash
   expo install expo-haptics
   ```
2. Add haptics to key actions:
   ```typescript
   import * as Haptics from 'expo-haptics';

   const handleRSVP = async () => {
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
     // ... RSVP logic
   };
   ```
3. Use appropriate feedback styles:
   - Light: Filter selection
   - Medium: RSVP, Save event
   - Heavy: Event created, Payment success
   - Success: Confirmation actions
   - Error: Validation failures
4. Test on physical device (haptics don't work in simulator)

**Acceptance Criteria:**
- [ ] RSVP actions have feedback
- [ ] Button taps feel responsive
- [ ] Success/error actions have appropriate feedback
- [ ] Not overused (only key actions)

---

### Task 3.5: Accessibility - VoiceOver
**Files:** All event screens
**Estimated Time:** 2 hours
**Dependencies:** Task 3.4

**Steps:**
1. Add accessibility labels to all touchable elements:
   ```typescript
   <TouchableOpacity
     accessible={true}
     accessibilityLabel="RSVP as Going"
     accessibilityHint="Mark yourself as attending this event"
     accessibilityRole="button"
   >
   ```
2. Add accessibility hints where helpful
3. Group related elements:
   ```typescript
   <View accessible={true} accessibilityLabel="Event Details">
     <Text>Title</Text>
     <Text>Date</Text>
   </View>
   ```
4. Mark decorative images as not accessible:
   ```typescript
   <Image accessible={false} />
   ```
5. Test with VoiceOver enabled on iOS
6. Test with TalkBack on Android

**Acceptance Criteria:**
- [ ] All interactive elements have labels
- [ ] VoiceOver navigation is logical
- [ ] Hints provide useful context
- [ ] Can complete all tasks with VoiceOver
- [ ] No unnecessary announcements

---

### Task 3.6: Accessibility - Dynamic Type
**Files:** All event screens
**Estimated Time:** 1.5 hours
**Dependencies:** Task 3.5

**Steps:**
1. Use `allowFontScaling={true}` for all text
2. Test with largest accessibility size
3. Fix any layout breaks at large sizes
4. Truncate long text appropriately
5. Ensure minimum 17pt for body text

**Acceptance Criteria:**
- [ ] Text scales with system settings
- [ ] Layout remains usable at all sizes
- [ ] No text cutoff
- [ ] Maintains readability

---

### Task 3.7: Animation - Spring Physics
**Files:** EventCard, modal transitions
**Estimated Time:** 1 hour
**Dependencies:** Task 3.6

**Steps:**
1. Use React Native Reanimated for smooth animations
2. Add spring animations to card press:
   ```typescript
   import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

   const scale = useSharedValue(1);

   const animatedStyle = useAnimatedStyle(() => ({
     transform: [{ scale: scale.value }],
   }));

   const onPressIn = () => {
     scale.value = withSpring(0.95);
   };

   const onPressOut = () => {
     scale.value = withSpring(1);
   };
   ```
3. Add slide-in animations for modals
4. Smooth RSVP button state transitions
5. Test on device (60fps)

**Acceptance Criteria:**
- [ ] Animations are smooth (60fps)
- [ ] Spring physics feel natural
- [ ] No janky transitions
- [ ] Works on both platforms

---

### Task 3.8: Platform-Specific - Date/Time Pickers
**File:** `Hommie_Mobile/src/screens/CreateEventScreen.tsx`
**Estimated Time:** 45 minutes
**Dependencies:** None

**Steps:**
1. Use native pickers properly:
   - iOS: Modal picker
   - Android: Inline picker
2. Ensure proper formatting
3. Handle timezone correctly
4. Test on both platforms

**Acceptance Criteria:**
- [ ] Pickers look native on both platforms
- [ ] Date/time selection works correctly
- [ ] Timezone is handled properly
- [ ] Format matches user locale

---

### Task 3.9: Share Sheet Integration
**File:** `Hommie_Mobile/src/screens/EventDetailsScreen.tsx`
**Estimated Time:** 30 minutes
**Dependencies:** Task 2.8 (deep linking)

**Steps:**
1. Update share functionality:
   ```typescript
   const handleShare = async () => {
     try {
       await Share.share({
         message: `Check out this event: ${event.title}`,
         url: `https://mecabal.com/events/${event.id}`,
         title: event.title,
       }, {
         subject: event.title,
         dialogTitle: 'Share Event',
       });
     } catch (error) {
       console.error(error);
     }
   };
   ```
2. Include event image if available
3. Test share to various apps (WhatsApp, Twitter, etc.)

**Acceptance Criteria:**
- [ ] Share sheet opens correctly
- [ ] URL and text are included
- [ ] Works with common apps
- [ ] Image is included (bonus)

---

### Task 3.10: Calendar Integration
**File:** `Hommie_Mobile/src/screens/EventDetailsScreen.tsx`
**Estimated Time:** 1 hour
**Dependencies:** None

**Steps:**
1. Install calendar library:
   ```bash
   expo install expo-calendar
   ```
2. Request calendar permissions
3. Add "Add to Calendar" button:
   ```typescript
   import * as Calendar from 'expo-calendar';

   const addToCalendar = async () => {
     const { status } = await Calendar.requestCalendarPermissionsAsync();
     if (status !== 'granted') return;

     const calendars = await Calendar.getCalendarsAsync();
     const defaultCalendar = calendars.find(cal => cal.allowsModifications);

     await Calendar.createEventAsync(defaultCalendar.id, {
       title: event.title,
       startDate: new Date(`${event.eventDate} ${event.startTime}`),
       endDate: event.endTime ? new Date(`${event.eventDate} ${event.endTime}`) : undefined,
       location: event.location.address,
       notes: event.description,
     });

     Alert.alert('Success', 'Event added to your calendar');
   };
   ```
4. Handle permission denied gracefully
5. Test on both iOS and Android

**Acceptance Criteria:**
- [ ] Permission request works
- [ ] Event is added to calendar
- [ ] All event details are included
- [ ] Works on both platforms
- [ ] Handles errors gracefully

---

## 🎯 PHASE 4: Testing & Deployment (Days 11-13)

### Task 4.1: Backend Unit Tests - Service Layer
**File:** `backend/apps/events-service/src/events-service.service.spec.ts`
**Estimated Time:** 3 hours
**Dependencies:** Phase 1 complete

**Steps:**
1. Create test file with setup:
   ```typescript
   describe('EventsServiceService', () => {
     let service: EventsServiceService;
     let eventRepo: Repository<Event>;
     // ... other repos

     beforeEach(async () => {
       const module = await Test.createTestingModule({
         providers: [
           EventsServiceService,
           { provide: getRepositoryToken(Event), useClass: Repository },
           // ... other providers
         ],
       }).compile();

       service = module.get<EventsServiceService>(EventsServiceService);
       eventRepo = module.get(getRepositoryToken(Event));
     });
   });
   ```

2. Write tests for create:
   - Should create event successfully
   - Should throw if category not found
   - Should create with media
   - Should default to published status

3. Write tests for RSVP:
   - Should create new RSVP
   - Should update existing RSVP
   - Should throw ConflictException for duplicate
   - Should enforce capacity limits
   - Should increment attendee count

4. Write tests for search:
   - Should filter by category
   - Should search by text
   - Should filter by date range
   - Should paginate correctly

5. Run tests:
   ```bash
   npm run test events-service.service.spec
   ```

**Acceptance Criteria:**
- [ ] All critical paths are tested
- [ ] Tests pass consistently
- [ ] Code coverage > 80%
- [ ] Edge cases are handled

---

### Task 4.2: Backend Integration Tests - API Endpoints
**File:** `backend/apps/events-service/test/events.e2e-spec.ts`
**Estimated Time:** 2.5 hours
**Dependencies:** Task 4.1

**Steps:**
1. Create E2E test file with test database
2. Test authentication:
   - Should reject unauthorized requests
   - Should accept valid JWT
   - Should validate ownership

3. Test CRUD endpoints:
   ```typescript
   describe('POST /events', () => {
     it('should create event', async () => {
       const response = await request(app.getHttpServer())
         .post('/events')
         .set('Authorization', `Bearer ${token}`)
         .send(createEventDto)
         .expect(201);

       expect(response.body.title).toBe(createEventDto.title);
     });

     it('should reject invalid data', async () => {
       await request(app.getHttpServer())
         .post('/events')
         .set('Authorization', `Bearer ${token}`)
         .send({ title: '' })
         .expect(400);
     });
   });
   ```

4. Test RSVP flow
5. Test nearby search
6. Run E2E tests:
   ```bash
   npm run test:e2e
   ```

**Acceptance Criteria:**
- [ ] All endpoints return correct status codes
- [ ] Authentication works correctly
- [ ] Validation errors are returned
- [ ] Response format matches spec
- [ ] Tests can run repeatedly

---

### Task 4.3: Mobile Component Tests
**Files:** Various test files
**Estimated Time:** 2 hours
**Dependencies:** Phase 2 complete

**Steps:**
1. Install testing libraries:
   ```bash
   npm install --save-dev @testing-library/react-native @testing-library/jest-native
   ```

2. Test EventCard component:
   ```typescript
   import { render, fireEvent } from '@testing-library/react-native';
   import EventCard from '../EventCard';

   describe('EventCard', () => {
     const mockEvent = { /* ... */ };

     it('should render event details', () => {
       const { getByText } = render(<EventCard event={mockEvent} />);
       expect(getByText(mockEvent.title)).toBeTruthy();
     });

     it('should call onPress when tapped', () => {
       const onPress = jest.fn();
       const { getByTestId } = render(<EventCard event={mockEvent} onPress={onPress} />);

       fireEvent.press(getByTestId('event-card'));
       expect(onPress).toHaveBeenCalled();
     });
   });
   ```

3. Test EventsScreen filters
4. Test RSVP functionality
5. Run tests:
   ```bash
   npm test
   ```

**Acceptance Criteria:**
- [ ] Key components have tests
- [ ] User interactions are tested
- [ ] Tests pass consistently
- [ ] Coverage > 60%

---

### Task 4.4: Mobile E2E Tests (Optional)
**Files:** Detox test files
**Estimated Time:** 3 hours
**Dependencies:** Phase 2 complete

**Steps:**
1. Set up Detox
2. Write critical flow tests:
   - Browse and view event
   - Create new event
   - RSVP to event
   - Cancel RSVP
3. Run on simulator/emulator

**Acceptance Criteria:**
- [ ] Critical user flows work end-to-end
- [ ] Tests are stable
- [ ] Can run in CI/CD

---

### Task 4.5: Performance Testing
**Tools:** Artillery, k6
**Estimated Time:** 2 hours
**Dependencies:** Backend complete

**Steps:**
1. Create load test script:
   ```yaml
   config:
     target: 'http://localhost:3000'
     phases:
       - duration: 60
         arrivalRate: 10
   scenarios:
     - name: 'Browse events'
       flow:
         - get:
             url: '/events?page=1&limit=20'
         - think: 2
         - get:
             url: '/events/{{ eventId }}'
   ```

2. Run load tests
3. Monitor database performance
4. Identify bottlenecks
5. Add indexes if needed
6. Document findings

**Acceptance Criteria:**
- [ ] System handles 100 concurrent users
- [ ] Response times < 200ms (p95)
- [ ] No memory leaks
- [ ] Database queries are optimized

---

### Task 4.6: Security Audit
**Tools:** Manual review, npm audit
**Estimated Time:** 1.5 hours
**Dependencies:** Backend complete

**Steps:**
1. Run security scanners:
   ```bash
   npm audit
   npm audit fix
   ```
2. Review authentication implementation
3. Check SQL injection prevention (TypeORM handles this)
4. Verify input validation on all endpoints
5. Check for sensitive data exposure
6. Review CORS configuration
7. Test rate limiting
8. Document security measures

**Acceptance Criteria:**
- [ ] No critical vulnerabilities
- [ ] Authentication is secure
- [ ] Input validation is comprehensive
- [ ] No sensitive data in responses
- [ ] Rate limiting works

---

### Task 4.7: Database Backup Strategy
**File:** Documentation
**Estimated Time:** 1 hour
**Dependencies:** None

**Steps:**
1. Document backup procedures:
   - Daily automated backups
   - Retention policy (30 days)
   - Point-in-time recovery
2. Create backup script:
   ```bash
   #!/bin/bash
   pg_dump -U postgres mecabal > backup_$(date +%Y%m%d_%H%M%S).sql
   ```
3. Test restore procedure
4. Set up automated backups (cron job)
5. Document recovery procedures

**Acceptance Criteria:**
- [ ] Backup script works
- [ ] Restore procedure is documented
- [ ] Automated backups are scheduled
- [ ] Can recover from backup

---

### Task 4.8: Deploy Backend to Staging
**Environment:** Staging server
**Estimated Time:** 2 hours
**Dependencies:** All backend tasks complete

**Steps:**
1. Set up staging environment variables
2. Run database migrations on staging:
   ```bash
   DATABASE_URL=<staging-url> npm run migration:run
   ```
3. Seed categories on staging
4. Build and deploy services:
   ```bash
   npm run build
   npm run start:prod
   ```
5. Configure reverse proxy (nginx)
6. Set up SSL certificates
7. Test all endpoints on staging
8. Monitor logs for errors

**Acceptance Criteria:**
- [ ] All services are running
- [ ] Database is migrated
- [ ] SSL is working
- [ ] All endpoints return correct responses
- [ ] No errors in logs

---

### Task 4.9: Mobile TestFlight/Beta Deployment
**Platforms:** iOS, Android
**Estimated Time:** 2 hours
**Dependencies:** All mobile tasks complete

**Steps:**
1. Update app version and build number
2. Configure for production:
   - Set API_URL to staging/production
   - Disable debug logs
   - Enable crash reporting
3. Build iOS:
   ```bash
   eas build --platform ios --profile preview
   ```
4. Build Android:
   ```bash
   eas build --platform android --profile preview
   ```
5. Submit to TestFlight:
   ```bash
   eas submit --platform ios
   ```
6. Upload to Play Store Internal Testing
7. Test on physical devices
8. Collect feedback from beta testers

**Acceptance Criteria:**
- [ ] Builds complete successfully
- [ ] App works on staging environment
- [ ] No crashes on startup
- [ ] Core flows work correctly
- [ ] Beta testers can install app

---

### Task 4.10: Documentation Updates
**Files:** Various markdown files
**Estimated Time:** 2 hours
**Dependencies:** All implementation complete

**Steps:**
1. Update API documentation with actual endpoints
2. Document deployment procedures
3. Create troubleshooting guide
4. Update environment variable documentation
5. Document known issues and workarounds
6. Create user guide for event creation
7. Update project README

**Acceptance Criteria:**
- [ ] All documentation is accurate
- [ ] Deployment steps are clear
- [ ] API docs match implementation
- [ ] Troubleshooting guide is helpful

---

### Task 4.11: Monitoring Setup
**Tools:** Sentry, DataDog, CloudWatch
**Estimated Time:** 1.5 hours
**Dependencies:** Backend deployed

**Steps:**
1. Set up error tracking (Sentry):
   ```typescript
   import * as Sentry from '@sentry/node';

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
   });
   ```
2. Add performance monitoring
3. Set up log aggregation
4. Create alerting rules:
   - Error rate > 5%
   - Response time > 1s
   - Service down
5. Create dashboard for key metrics
6. Document monitoring setup

**Acceptance Criteria:**
- [ ] Errors are tracked
- [ ] Performance metrics are visible
- [ ] Alerts trigger correctly
- [ ] Team has access to dashboards

---

### Task 4.12: Final QA & Bug Fixes
**Environment:** All environments
**Estimated Time:** 4 hours
**Dependencies:** All tasks complete

**Steps:**
1. Complete QA checklist:
   - [ ] Create event (free)
   - [ ] Create event (paid)
   - [ ] RSVP to event
   - [ ] Cancel RSVP
   - [ ] View attendees
   - [ ] Search events
   - [ ] Filter by category
   - [ ] Nearby events
   - [ ] Share event
   - [ ] Add to calendar
   - [ ] Delete event
   - [ ] Update event
   - [ ] Payment flow
   - [ ] Upload event image
   - [ ] View event details

2. Test edge cases:
   - No network connection
   - Event at capacity
   - Past events
   - Invalid data
   - Very long descriptions
   - Special characters

3. Test on multiple devices:
   - iPhone (latest)
   - Android (latest)
   - Older devices

4. Fix critical bugs
5. Document known issues

**Acceptance Criteria:**
- [ ] All core flows work
- [ ] No critical bugs
- [ ] App is stable
- [ ] Performance is acceptable
- [ ] Ready for production

---

## 📊 Progress Tracking

Use this checklist to track overall progress:

### Backend Progress
- [ ] Task 1.1: Event Category Entity
- [ ] Task 1.2: Event Entity
- [ ] Task 1.3: Event Media Entity
- [ ] Task 1.4: Event Attendee Entity
- [ ] Task 1.5: Create Event DTO
- [ ] Task 1.6: Other DTOs
- [ ] Task 1.7: Service CRUD
- [ ] Task 1.8: Service RSVP
- [ ] Task 1.9: Service Search
- [ ] Task 1.10: Controller
- [ ] Task 1.11: Module
- [ ] Task 1.12: Migration
- [ ] Task 1.13: Seed Script
- [ ] Task 1.14: Gateway Integration

### Mobile Progress
- [ ] Task 2.1: API Service
- [ ] Task 2.2: EventsScreen
- [ ] Task 2.3: EventDetailsScreen
- [ ] Task 2.4: CreateEventScreen
- [ ] Task 2.5: EventAttendeesScreen
- [ ] Task 2.6: Loading Skeletons
- [ ] Task 2.7: Error Handling
- [ ] Task 2.8: Navigation
- [ ] Task 2.9: Pull-to-Refresh

### Polish Progress
- [ ] Task 3.1: Typography
- [ ] Task 3.2: Colors & Contrast
- [ ] Task 3.3: Touch Targets
- [ ] Task 3.4: Haptic Feedback
- [ ] Task 3.5: VoiceOver
- [ ] Task 3.6: Dynamic Type
- [ ] Task 3.7: Animations
- [ ] Task 3.8: Date Pickers
- [ ] Task 3.9: Share Sheet
- [ ] Task 3.10: Calendar

### Testing Progress
- [ ] Task 4.1: Backend Unit Tests
- [ ] Task 4.2: Backend E2E Tests
- [ ] Task 4.3: Mobile Component Tests
- [ ] Task 4.4: Mobile E2E Tests (Optional)
- [ ] Task 4.5: Performance Testing
- [ ] Task 4.6: Security Audit
- [ ] Task 4.7: Backup Strategy
- [ ] Task 4.8: Backend Deployment
- [ ] Task 4.9: Mobile Beta Deployment
- [ ] Task 4.10: Documentation
- [ ] Task 4.11: Monitoring
- [ ] Task 4.12: Final QA

---

## 🚀 Quick Start Guide for Developers

### To Start Working on Backend:
1. Pick a task from Phase 1
2. Create a feature branch: `git checkout -b feature/task-1.X`
3. Complete the task following the steps
4. Write tests if applicable
5. Create pull request
6. Mark task as complete in checklist

### To Start Working on Mobile:
1. Ensure backend Phase 1 is complete (or use mock API)
2. Pick a task from Phase 2
3. Create a feature branch
4. Test on both iOS and Android
5. Create pull request
6. Mark task as complete

### For Questions:
- Backend questions → Refer to EVENT_SYSTEM_IMPLEMENTATION.md
- Mobile questions → Check existing screens for patterns
- API questions → See API specification in implementation doc

---

**End of Task Breakdown**

*This document should be updated as tasks are completed and new information is discovered.*
