import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { EventsServiceService } from './events-service.service';
import {
  CreateEventDto,
  UpdateEventDto,
  EventFilterDto,
  RsvpDto,
  AttendeeFilterDto,
  EventResponseDto,
  PaginatedResponseDto,
} from './dto';
import { JwtAuthGuard, CurrentUser } from '@app/auth';
import { User } from '@app/database/entities';

@ApiTags('Events')
@Controller()
export class EventsServiceController {
  constructor(private readonly eventsService: EventsServiceService) {}

  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({
    status: 200,
    description: 'List of events with pagination',
    type: PaginatedResponseDto<EventResponseDto>,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number, description: 'Filter by category' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Filter from date' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'Filter to date' })
  @ApiQuery({ name: 'neighborhoodId', required: false, type: String, description: 'Filter by neighborhood' })
  @ApiQuery({ name: 'isFree', required: false, type: Boolean, description: 'Filter free events' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'eventDate', 'attendeesCount'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  async findAll(
    @Query() filters: EventFilterDto,
    @CurrentUser() user?: User,
  ): Promise<PaginatedResponseDto<EventResponseDto>> {
    return this.eventsService.findAll(filters, user?.id);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby events' })
  @ApiResponse({
    status: 200,
    description: 'List of nearby events with pagination',
    type: PaginatedResponseDto<EventResponseDto>,
  })
  @ApiQuery({ name: 'latitude', required: true, type: Number, description: 'Latitude coordinate' })
  @ApiQuery({ name: 'longitude', required: true, type: Number, description: 'Longitude coordinate' })
  @ApiQuery({ name: 'radiusKm', required: false, type: Number, description: 'Search radius in kilometers', default: 5 })
  async findNearby(
    @Query('latitude') lat: number,
    @Query('longitude') lng: number,
    @Query('radiusKm') radius: number = 5,
    @Query() filters: EventFilterDto,
  ): Promise<PaginatedResponseDto<EventResponseDto>> {
    return this.eventsService.searchNearby(lat, lng, radius, filters);
  }

  @Get('my-events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user events' })
  @ApiResponse({
    status: 200,
    description: 'List of user events with pagination',
    type: PaginatedResponseDto<EventResponseDto>,
  })
  @ApiQuery({ name: 'type', required: false, enum: ['organizing', 'attending', 'all'], default: 'all' })
  async getMyEvents(
    @CurrentUser() user: User,
    @Query('type') type: 'organizing' | 'attending' | 'all' = 'all',
    @Query() filters: EventFilterDto,
  ): Promise<PaginatedResponseDto<EventResponseDto>> {
    return this.eventsService.getMyEvents(user.id, type, filters);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured events' })
  @ApiResponse({
    status: 200,
    description: 'List of featured events',
    type: [EventResponseDto],
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of events to return', default: 5 })
  async getFeaturedEvents(
    @Query('limit') limit: number = 5,
  ): Promise<EventResponseDto[]> {
    return this.eventsService.getFeaturedEvents(limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({
    status: 200,
    description: 'Event details',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: User,
  ): Promise<EventResponseDto> {
    return this.eventsService.findOne(id, user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create event' })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateEventDto,
  ): Promise<EventResponseDto> {
    return this.eventsService.create(user.id, user.primaryNeighborhood?.id || '', dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update event' })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not event owner' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    return this.eventsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete event' })
  @ApiResponse({ status: 204, description: 'Event deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not event owner' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async remove(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
    return this.eventsService.remove(id, user.id);
  }

  @Post(':id/rsvp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'RSVP to event' })
  @ApiResponse({
    status: 201,
    description: 'RSVP successful',
  })
  @ApiResponse({ status: 400, description: 'Invalid RSVP data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 409, description: 'Event at capacity' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async rsvp(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: RsvpDto,
  ): Promise<any> {
    return this.eventsService.rsvp(id, user.id, dto);
  }

  @Delete(':id/rsvp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel RSVP' })
  @ApiResponse({ status: 204, description: 'RSVP cancelled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'RSVP not found' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async cancelRsvp(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
    return this.eventsService.cancelRsvp(id, user.id);
  }

  @Get(':id/attendees')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get event attendees' })
  @ApiResponse({
    status: 200,
    description: 'List of event attendees with pagination',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'rsvpStatus', required: false, enum: ['going', 'maybe', 'not_going'] })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search attendees by name' })
  async getAttendees(
    @Param('id') id: string,
    @Query() filters: AttendeeFilterDto,
  ): Promise<PaginatedResponseDto<any>> {
    return this.eventsService.getAttendees(id, filters);
  }

  @Post(':id/increment-views')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Increment view count' })
  @ApiResponse({ status: 204, description: 'View count incremented' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async incrementViews(@Param('id') id: string): Promise<void> {
    return this.eventsService.incrementViews(id);
  }
}
