import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConnectionType, ConnectionStatus } from '@app/database';

export class NeighborProfileDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'First name' })
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  lastName: string;

  @ApiPropertyOptional({ description: 'Display name' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'Profile picture URL' })
  profilePicture?: string;

  @ApiProperty({ description: 'Estate name' })
  estate?: string;

  @ApiPropertyOptional({ description: 'Building name' })
  building?: string;

  @ApiPropertyOptional({ description: 'Apartment number' })
  apartment?: string;

  @ApiProperty({ description: 'Is verified' })
  isVerified: boolean;

  @ApiProperty({ description: 'Verification level' })
  verificationLevel: string;

  @ApiProperty({ description: 'Trust score' })
  trustScore: number;

  @ApiProperty({ description: 'Connection stats' })
  connectionStats: {
    totalConnections: number;
    trustedConnections: number;
    mutualConnections: number;
    followerCount: number;
    followingCount: number;
  };

  @ApiProperty({ description: 'Badges', type: [String] })
  badges: string[];

  @ApiProperty({ description: 'Interests', type: [String] })
  interests: string[];

  @ApiPropertyOptional({ description: 'Bio' })
  bio?: string;

  @ApiPropertyOptional({ description: 'Last seen' })
  lastSeen?: string;
}

export class ConnectionResponseDto {
  @ApiProperty({ description: 'Connection ID' })
  id: string;

  @ApiProperty({ description: 'From user ID' })
  fromUserId: string;

  @ApiProperty({ description: 'To user ID' })
  toUserId: string;

  @ApiProperty({
    description: 'Connection type',
    enum: ConnectionType,
  })
  connectionType: ConnectionType;

  @ApiProperty({
    description: 'Connection status',
    enum: ConnectionStatus,
  })
  status: ConnectionStatus;

  @ApiProperty({ description: 'User who initiated the connection' })
  initiatedBy: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Acceptance timestamp' })
  acceptedAt?: Date;

  @ApiPropertyOptional({ description: 'Connection metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Neighbor profile information' })
  neighbor: NeighborProfileDto;

  @ApiPropertyOptional({ description: 'Mutual connections count' })
  mutualConnections?: number;
}

export class ConnectionRequestResponseDto {
  @ApiProperty({ description: 'Incoming requests', type: [ConnectionResponseDto] })
  incoming: ConnectionResponseDto[];

  @ApiProperty({ description: 'Outgoing requests', type: [ConnectionResponseDto] })
  outgoing: ConnectionResponseDto[];
}

export class ConnectionRecommendationDto {
  @ApiProperty({ description: 'Recommendation ID' })
  id: string;

  @ApiProperty({ description: 'Neighbor profile' })
  neighbor: NeighborProfileDto;

  @ApiProperty({ description: 'Recommendation score' })
  recommendationScore: number;

  @ApiProperty({ description: 'Recommendation reasons', type: [Object] })
  reasons: Array<{
    type: string;
    description: string;
    strength: number;
  }>;

  @ApiPropertyOptional({ description: 'Mutual connections', type: [NeighborProfileDto] })
  mutualConnections?: NeighborProfileDto[];

  @ApiProperty({ description: 'Shared interests', type: [String] })
  sharedInterests: string[];

  @ApiProperty({ description: 'Proximity information' })
  proximityInfo: {
    distance: number;
    location: string;
    sameBuilding: boolean;
    sameEstate: boolean;
  };
}

export class PaginatedConnectionsDto {
  @ApiProperty({ description: 'Array of connections', type: [ConnectionResponseDto] })
  data: ConnectionResponseDto[];

  @ApiProperty({ description: 'Total number of connections' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}





