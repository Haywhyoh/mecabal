import { ApiProperty } from '@nestjs/swagger';

export class EventLocationResponseDto {
  @ApiProperty({ description: 'Location name' })
  name: string;

  @ApiProperty({ description: 'Full address' })
  address: string;

  @ApiProperty({ description: 'Latitude coordinate' })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  longitude: number;

  @ApiProperty({ description: 'Landmark', required: false })
  landmark?: string;
}

export class EventMediaResponseDto {
  @ApiProperty({ description: 'Media ID' })
  id: string;

  @ApiProperty({ description: 'Media URL' })
  url: string;

  @ApiProperty({ description: 'Media type', enum: ['image', 'video'] })
  type: 'image' | 'video';

  @ApiProperty({ description: 'Media caption', required: false })
  caption?: string;

  @ApiProperty({ description: 'Display order' })
  displayOrder: number;
}

export class EventCategoryResponseDto {
  @ApiProperty({ description: 'Category ID' })
  id: number;

  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({ description: 'Category icon' })
  icon: string;

  @ApiProperty({ description: 'Category color code' })
  colorCode: string;

  @ApiProperty({ description: 'Category description', required: false })
  description?: string;
}

export class EventOrganizerResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User first name' })
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  lastName: string;

  @ApiProperty({ description: 'User full name' })
  fullName: string;

  @ApiProperty({ description: 'Profile picture URL', required: false })
  profilePictureUrl?: string;

  @ApiProperty({ description: 'User trust score' })
  trustScore: number;

  @ApiProperty({ description: 'Whether user is verified' })
  isVerified: boolean;

  @ApiProperty({ description: 'Phone number', required: false })
  phoneNumber?: string;
}

export class EventResponseDto {
  @ApiProperty({ description: 'Event ID' })
  id: string;

  @ApiProperty({ description: 'Event title' })
  title: string;

  @ApiProperty({ description: 'Event description' })
  description: string;

  @ApiProperty({ description: 'Event date' })
  eventDate: string;

  @ApiProperty({ description: 'Event start time' })
  startTime: string;

  @ApiProperty({ description: 'Event end time', required: false })
  endTime?: string;

  @ApiProperty({ description: 'Event timezone' })
  timezone: string;

  @ApiProperty({ description: 'Event location', type: EventLocationResponseDto })
  location: EventLocationResponseDto;

  @ApiProperty({ description: 'Whether event is free' })
  isFree: boolean;

  @ApiProperty({ description: 'Event price', required: false })
  price?: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Formatted price string' })
  formattedPrice: string;

  @ApiProperty({ description: 'Maximum attendees', required: false })
  maxAttendees?: number;

  @ApiProperty({ description: 'Whether guests are allowed' })
  allowGuests: boolean;

  @ApiProperty({ description: 'Whether verification is required' })
  requireVerification: boolean;

  @ApiProperty({ description: 'Age restriction', required: false })
  ageRestriction?: string;

  @ApiProperty({ description: 'Languages spoken' })
  languages: string[];

  @ApiProperty({ description: 'Whether event is private' })
  isPrivate: boolean;

  @ApiProperty({ description: 'Cover image URL', required: false })
  coverImageUrl?: string;

  @ApiProperty({ description: 'Event status' })
  status: string;

  @ApiProperty({ description: 'Number of views' })
  viewsCount: number;

  @ApiProperty({ description: 'Number of attendees' })
  attendeesCount: number;

  @ApiProperty({ description: 'Special requirements', required: false })
  specialRequirements?: string;

  @ApiProperty({ description: 'Event creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Event update timestamp' })
  updatedAt: string;

  @ApiProperty({ description: 'Event category', type: EventCategoryResponseDto })
  category: EventCategoryResponseDto;

  @ApiProperty({ description: 'Event organizer', type: EventOrganizerResponseDto })
  organizer: EventOrganizerResponseDto;

  @ApiProperty({ description: 'Event media', type: [EventMediaResponseDto] })
  media: EventMediaResponseDto[];

  @ApiProperty({ description: 'User RSVP status', required: false })
  userRsvpStatus?: 'going' | 'maybe' | 'not_going';

  @ApiProperty({ description: 'Whether user can RSVP' })
  canRsvp: boolean;

  @ApiProperty({ description: 'Whether event is at capacity' })
  isAtCapacity: boolean;

  @ApiProperty({ description: 'Whether event is upcoming' })
  isUpcoming: boolean;

  @ApiProperty({ description: 'Whether event is today' })
  isToday: boolean;

  @ApiProperty({ description: 'Event duration string', required: false })
  durationString?: string;
}
