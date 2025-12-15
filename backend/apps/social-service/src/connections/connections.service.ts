import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In, Not } from 'typeorm';
import {
  Connection,
  ConnectionType,
  ConnectionStatus,
  User,
  UserNeighborhood,
  Neighborhood,
} from '@app/database';
import {
  CreateConnectionDto,
  ConnectionFilterDto,
  ConnectionResponseDto,
  ConnectionRequestResponseDto,
  ConnectionRecommendationDto,
  PaginatedConnectionsDto,
  NeighborProfileDto,
} from './dto';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserNeighborhood)
    private readonly userNeighborhoodRepository: Repository<UserNeighborhood>,
    @InjectRepository(Neighborhood)
    private readonly neighborhoodRepository: Repository<Neighborhood>,
  ) {}

  async createConnectionRequest(
    createConnectionDto: CreateConnectionDto,
    userId: string,
  ): Promise<ConnectionResponseDto> {
    console.log('🟢 [ConnectionsService] createConnectionRequest called');
    console.log('🟢 [ConnectionsService] DTO:', JSON.stringify(createConnectionDto, null, 2));
    console.log('🟢 [ConnectionsService] userId:', userId);
    
    const { toUserId, connectionType, metadata } = createConnectionDto;
    console.log('🟢 [ConnectionsService] Extracted values - toUserId:', toUserId, 'connectionType:', connectionType, 'metadata:', metadata);

    // Prevent self-connection
    if (userId === toUserId) {
      console.log('❌ [ConnectionsService] Self-connection attempt blocked');
      throw new BadRequestException('Cannot connect with yourself');
    }

    // Check if target user exists
    console.log('🟢 [ConnectionsService] Checking if target user exists:', toUserId);
    const targetUser = await this.userRepository.findOne({
      where: { id: toUserId },
    });
    if (!targetUser) {
      console.log('❌ [ConnectionsService] Target user not found:', toUserId);
      throw new NotFoundException('User not found');
    }
    console.log('✅ [ConnectionsService] Target user found:', targetUser.id);

    // Check if connection already exists
    console.log('🟢 [ConnectionsService] Checking for existing connection');
    const existingConnection = await this.connectionRepository.findOne({
      where: [
        { fromUserId: userId, toUserId },
        { fromUserId: toUserId, toUserId: userId },
      ],
    });

    if (existingConnection) {
      console.log('🟢 [ConnectionsService] Existing connection found:', existingConnection.id, 'status:', existingConnection.status);
      if (existingConnection.status === ConnectionStatus.BLOCKED) {
        throw new ForbiddenException('Connection is blocked');
      }
      if (existingConnection.status === ConnectionStatus.ACCEPTED) {
        throw new BadRequestException('Connection already exists');
      }
      if (existingConnection.status === ConnectionStatus.PENDING) {
        console.log('🟡 [ConnectionsService] Returning existing pending connection');
        // Reload with relations to format response
        const connectionWithRelations = await this.connectionRepository.findOne({
          where: { id: existingConnection.id },
          relations: ['fromUser', 'toUser'],
        });
        if (!connectionWithRelations) {
          throw new NotFoundException('Connection not found');
        }
        return this.formatConnectionResponse(connectionWithRelations, userId);
      }
    } else {
      console.log('✅ [ConnectionsService] No existing connection found');
    }

    // Create connection request
    console.log('🟢 [ConnectionsService] Creating connection request');
    const connection = this.connectionRepository.create({
      fromUserId: userId,
      toUserId,
      connectionType,
      status: ConnectionStatus.PENDING,
      initiatedBy: userId,
      metadata,
    });
    console.log('🟢 [ConnectionsService] Connection entity created:', connection.id);

    const savedConnection = await this.connectionRepository.save(connection);
    console.log('✅ [ConnectionsService] Connection saved:', savedConnection.id);
    
    // Reload connection with relations for formatting
    console.log('🟢 [ConnectionsService] Reloading connection with relations');
    const connectionWithRelations = await this.connectionRepository.findOne({
      where: { id: savedConnection.id },
      relations: ['fromUser', 'toUser'],
    });

    if (!connectionWithRelations) {
      console.log('❌ [ConnectionsService] Connection not found after creation');
      throw new NotFoundException('Connection not found after creation');
    }
    console.log('✅ [ConnectionsService] Connection reloaded with relations');
    console.log('🟢 [ConnectionsService] fromUser loaded:', !!connectionWithRelations.fromUser);
    console.log('🟢 [ConnectionsService] toUser loaded:', !!connectionWithRelations.toUser);

    console.log('🟢 [ConnectionsService] Formatting connection response');
    const result = await this.formatConnectionResponse(connectionWithRelations, userId);
    console.log('✅ [ConnectionsService] Connection response formatted successfully');
    return result;
  }

  async getConnections(
    filterDto: ConnectionFilterDto,
    userId: string,
  ): Promise<PaginatedConnectionsDto> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2b86e3fe-f024-4873-83ef-99098887c58e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'connections.service.ts:93',message:'getConnections service entry',data:{userId,filterDto},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    const queryBuilder = this.connectionRepository
      .createQueryBuilder('connection')
      .leftJoinAndSelect('connection.fromUser', 'fromUser')
      .leftJoinAndSelect('connection.toUser', 'toUser')
      .where(
        '(connection.fromUserId = :userId OR connection.toUserId = :userId)',
        { userId },
      )
      .andWhere('connection.status = :status', {
        status: ConnectionStatus.ACCEPTED,
      });

    // Apply filters
    if (filterDto.connectionType) {
      queryBuilder.andWhere('connection.connectionType = :connectionType', {
        connectionType: filterDto.connectionType,
      });
    }

    // Apply location filters
    if (filterDto.neighborhoodId || filterDto.estateId || filterDto.lgaId) {
      const userNeighborhoods = await this.userNeighborhoodRepository.find({
        where: { userId: Not(userId) },
        relations: ['neighborhood'],
      });

      let filteredUserIds: string[] = [];

      if (filterDto.neighborhoodId) {
        filteredUserIds = userNeighborhoods
          .filter((un) => un.neighborhoodId === filterDto.neighborhoodId)
          .map((un) => un.userId);
      } else if (filterDto.estateId) {
        // Filter by estate (estates are neighborhoods, so filter by neighborhood id or parent)
        filteredUserIds = userNeighborhoods
          .filter(
            (un) =>
              un.neighborhood?.id === filterDto.estateId ||
              un.neighborhood?.parentNeighborhoodId === filterDto.estateId,
          )
          .map((un) => un.userId);
      } else if (filterDto.lgaId) {
        filteredUserIds = userNeighborhoods
          .filter((un) => un.neighborhood?.lgaId === filterDto.lgaId)
          .map((un) => un.userId);
      }

      if (filteredUserIds.length > 0) {
        queryBuilder.andWhere(
          '(connection.fromUserId IN (:...userIds) OR connection.toUserId IN (:...userIds))',
          { userIds: filteredUserIds },
        );
      } else {
        // No users match the filter, return empty result
        return {
          data: [],
          total: 0,
          page: filterDto.page || 1,
          limit: filterDto.limit || 20,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        };
      }
    }

    // Apply search
    if (filterDto.search) {
      queryBuilder.andWhere(
        '(fromUser.firstName ILIKE :search OR fromUser.lastName ILIKE :search OR toUser.firstName ILIKE :search OR toUser.lastName ILIKE :search)',
        { search: `%${filterDto.search}%` },
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 20;
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by creation date
    queryBuilder.orderBy('connection.createdAt', 'DESC');

    const connections = await queryBuilder.getMany();

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2b86e3fe-f024-4873-83ef-99098887c58e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'connections.service.ts:186',message:'Before formatting connections',data:{connectionsCount:connections.length,total},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    const formattedConnections = await Promise.all(
      connections.map((conn) => this.formatConnectionResponse(conn, userId)),
    );
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2b86e3fe-f024-4873-83ef-99098887c58e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'connections.service.ts:191',message:'Before return',data:{formattedCount:formattedConnections.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return {
      data: formattedConnections,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  async getConnectionRequests(
    userId: string,
  ): Promise<ConnectionRequestResponseDto> {
    const incoming = await this.connectionRepository.find({
      where: {
        toUserId: userId,
        status: ConnectionStatus.PENDING,
      },
      relations: ['fromUser', 'toUser'],
      order: { createdAt: 'DESC' },
    });

    const outgoing = await this.connectionRepository.find({
      where: {
        fromUserId: userId,
        status: ConnectionStatus.PENDING,
      },
      relations: ['fromUser', 'toUser'],
      order: { createdAt: 'DESC' },
    });

    return {
      incoming: await Promise.all(
        incoming.map((conn) => this.formatConnectionResponse(conn, userId)),
      ),
      outgoing: await Promise.all(
        outgoing.map((conn) => this.formatConnectionResponse(conn, userId)),
      ),
    };
  }

  async acceptConnection(
    connectionId: string,
    userId: string,
  ): Promise<ConnectionResponseDto> {
    const connection = await this.connectionRepository.findOne({
      where: { id: connectionId },
      relations: ['fromUser', 'toUser'],
    });

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    if (connection.toUserId !== userId) {
      throw new ForbiddenException(
        'You can only accept connection requests sent to you',
      );
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      throw new BadRequestException('Connection request is not pending');
    }

    connection.status = ConnectionStatus.ACCEPTED;
    connection.acceptedAt = new Date();
    const updatedConnection = await this.connectionRepository.save(connection);

    return this.formatConnectionResponse(updatedConnection, userId);
  }

  async rejectConnection(
    connectionId: string,
    userId: string,
  ): Promise<void> {
    const connection = await this.connectionRepository.findOne({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    if (connection.toUserId !== userId) {
      throw new ForbiddenException(
        'You can only reject connection requests sent to you',
      );
    }

    connection.status = ConnectionStatus.REJECTED;
    await this.connectionRepository.save(connection);
  }

  async removeConnection(
    connectionId: string,
    userId: string,
  ): Promise<void> {
    const connection = await this.connectionRepository.findOne({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    if (
      connection.fromUserId !== userId &&
      connection.toUserId !== userId
    ) {
      throw new ForbiddenException('You can only remove your own connections');
    }

    await this.connectionRepository.remove(connection);
  }

  async getRecommendations(
    userId: string,
    limit: number = 10,
  ): Promise<ConnectionRecommendationDto[]> {
    // Get user's neighborhood
    const userNeighborhood = await this.userNeighborhoodRepository.findOne({
      where: { userId, isPrimary: true },
      relations: ['neighborhood'],
    });

    if (!userNeighborhood) {
      return [];
    }

    // Get existing connections
    const existingConnections = await this.connectionRepository.find({
      where: [
        { fromUserId: userId, status: ConnectionStatus.ACCEPTED },
        { toUserId: userId, status: ConnectionStatus.ACCEPTED },
      ],
    });

    const connectedUserIds = new Set<string>();
    existingConnections.forEach((conn) => {
      if (conn.fromUserId === userId) {
        connectedUserIds.add(conn.toUserId);
      } else {
        connectedUserIds.add(conn.fromUserId);
      }
    });
    connectedUserIds.add(userId);

    // Find users in same neighborhood/estate/LGA
    const neighbors = await this.userNeighborhoodRepository.find({
      where: {
        neighborhoodId: userNeighborhood.neighborhoodId,
        userId: Not(In(Array.from(connectedUserIds))),
      },
      relations: ['user', 'neighborhood'],
      take: limit * 2, // Get more to filter and score
    });

    // Calculate recommendations
    const recommendations = await Promise.all(
      neighbors.map(async (neighbor) => {
        const neighborUser = neighbor.user;
        const mutualCount = await this.getMutualConnectionsCount(
          userId,
          neighborUser.id,
        );

        // Calculate recommendation score
        let score = 50; // Base score
        if (neighbor.neighborhoodId === userNeighborhood.neighborhoodId) {
          score += 30; // Same neighborhood
        }
        score += Math.min(mutualCount * 5, 20); // Mutual connections

        return {
          id: `rec_${neighborUser.id}`,
          neighbor: await this.formatNeighborProfile(neighborUser),
          recommendationScore: Math.min(score, 100),
          reasons: this.generateRecommendationReasons(
            neighbor,
            userNeighborhood,
            mutualCount,
          ),
          mutualConnections: await this.getMutualConnections(
            userId,
            neighborUser.id,
          ),
          sharedInterests: [], // TODO: Implement shared interests
          proximityInfo: {
            distance: 0, // TODO: Calculate actual distance
            location: neighbor.neighborhood?.name || 'Unknown',
            sameBuilding: false, // TODO: Check if same building
            sameEstate: neighbor.neighborhoodId === userNeighborhood.neighborhoodId,
          },
        };
      }),
    );

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);
  }

  async getMutualConnections(
    userId: string,
    targetUserId: string,
  ): Promise<NeighborProfileDto[]> {
    // Get connections for both users
    const userConnections = await this.connectionRepository.find({
      where: [
        { fromUserId: userId, status: ConnectionStatus.ACCEPTED },
        { toUserId: userId, status: ConnectionStatus.ACCEPTED },
      ],
    });

    const targetConnections = await this.connectionRepository.find({
      where: [
        { fromUserId: targetUserId, status: ConnectionStatus.ACCEPTED },
        { toUserId: targetUserId, status: ConnectionStatus.ACCEPTED },
      ],
    });

    // Find mutual connections
    const userConnectedIds = new Set<string>();
    userConnections.forEach((conn) => {
      if (conn.fromUserId === userId) {
        userConnectedIds.add(conn.toUserId);
      } else {
        userConnectedIds.add(conn.fromUserId);
      }
    });

    const targetConnectedIds = new Set<string>();
    targetConnections.forEach((conn) => {
      if (conn.fromUserId === targetUserId) {
        targetConnectedIds.add(conn.toUserId);
      } else {
        targetConnectedIds.add(conn.fromUserId);
      }
    });

    const mutualIds = Array.from(userConnectedIds).filter((id) =>
      targetConnectedIds.has(id),
    );

    if (mutualIds.length === 0) {
      return [];
    }

    const mutualUsers = await this.userRepository.find({
      where: { id: In(mutualIds) },
      take: 10, // Limit to 10 mutual connections
    });

    return Promise.all(
      mutualUsers.map((user) => this.formatNeighborProfile(user)),
    );
  }

  async getMutualConnectionsCount(
    userId: string,
    targetUserId: string,
  ): Promise<number> {
    const mutual = await this.getMutualConnections(userId, targetUserId);
    return mutual.length;
  }

  async discoverNeighbors(
    filterDto: ConnectionFilterDto,
    userId: string,
  ): Promise<PaginatedConnectionsDto> {
    // Get users in the specified location
    let userNeighborhoods = await this.userNeighborhoodRepository.find({
      where: { userId: Not(userId) },
      relations: ['user', 'neighborhood'],
    });

    // Apply location filters
    if (filterDto.neighborhoodId) {
      userNeighborhoods = userNeighborhoods.filter(
        (un) => un.neighborhoodId === filterDto.neighborhoodId,
      );
    } else if (filterDto.estateId) {
      // Filter by estate (estates are neighborhoods, so filter by neighborhood id or parent)
      userNeighborhoods = userNeighborhoods.filter(
        (un) =>
          un.neighborhood?.id === filterDto.estateId ||
          un.neighborhood?.parentNeighborhoodId === filterDto.estateId,
      );
    } else if (filterDto.lgaId) {
      userNeighborhoods = userNeighborhoods.filter(
        (un) => un.neighborhood?.lgaId === filterDto.lgaId,
      );
    }

    const userIds = userNeighborhoods.map((un) => un.userId);

    if (userIds.length === 0) {
      return {
        data: [],
        total: 0,
        page: filterDto.page || 1,
        limit: filterDto.limit || 20,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };
    }

    // Get existing connections to exclude
    const existingConnections = await this.connectionRepository.find({
      where: [
        { fromUserId: userId, toUserId: In(userIds) },
        { toUserId: userId, fromUserId: In(userIds) },
      ],
    });

    const connectedUserIds = new Set<string>();
    existingConnections.forEach((conn) => {
      if (conn.fromUserId === userId) {
        connectedUserIds.add(conn.toUserId);
      } else {
        connectedUserIds.add(conn.fromUserId);
      }
    });

    const discoverableUserIds = userIds.filter(
      (id) => !connectedUserIds.has(id),
    );

    if (discoverableUserIds.length === 0) {
      return {
        data: [],
        total: 0,
        page: filterDto.page || 1,
        limit: filterDto.limit || 20,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };
    }

    // Get users
    const users = await this.userRepository.find({
      where: { id: In(discoverableUserIds) },
    });

    // Apply search if provided
    let filteredUsers = users;
    if (filterDto.search) {
      const searchLower = filterDto.search.toLowerCase();
      filteredUsers = users.filter(
        (user) =>
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower),
      );
    }

    // Paginate
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 20;
    const skip = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(skip, skip + limit);

    // Format as connections (even though they're not connected yet)
    const formattedConnections = await Promise.all(
      paginatedUsers.map(async (user) => {
        const neighbor = await this.formatNeighborProfile(user);
        return {
          id: `discover_${user.id}`,
          fromUserId: userId,
          toUserId: user.id,
          connectionType: ConnectionType.CONNECT,
          status: ConnectionStatus.PENDING,
          initiatedBy: userId,
          createdAt: new Date(),
          neighbor,
          mutualConnections: await this.getMutualConnectionsCount(
            userId,
            user.id,
          ),
        } as ConnectionResponseDto;
      }),
    );

    return {
      data: formattedConnections,
      total: filteredUsers.length,
      page,
      limit,
      totalPages: Math.ceil(filteredUsers.length / limit),
      hasNext: page < Math.ceil(filteredUsers.length / limit),
      hasPrev: page > 1,
    };
  }

  private async formatConnectionResponse(
    connection: Connection,
    currentUserId: string,
  ): Promise<ConnectionResponseDto> {
    console.log('🟡 [formatConnectionResponse] Called with connection:', connection.id);
    console.log('🟡 [formatConnectionResponse] currentUserId:', currentUserId);
    console.log('🟡 [formatConnectionResponse] fromUserId:', connection.fromUserId);
    console.log('🟡 [formatConnectionResponse] toUserId:', connection.toUserId);
    console.log('🟡 [formatConnectionResponse] fromUser loaded:', !!connection.fromUser);
    console.log('🟡 [formatConnectionResponse] toUser loaded:', !!connection.toUser);
    
    let neighbor: User | null =
      connection.fromUserId === currentUserId
        ? connection.toUser || null
        : connection.fromUser || null;

    console.log('🟡 [formatConnectionResponse] Initial neighbor:', neighbor ? neighbor.id : 'null');

    // If relations weren't loaded, fetch the user
    if (!neighbor) {
      console.log('🟡 [formatConnectionResponse] Neighbor not loaded, fetching from DB');
      const neighborId =
        connection.fromUserId === currentUserId
          ? connection.toUserId
          : connection.fromUserId;
      console.log('🟡 [formatConnectionResponse] Fetching neighbor with ID:', neighborId);
      neighbor = await this.userRepository.findOne({
        where: { id: neighborId },
      });
      if (!neighbor) {
        console.log('❌ [formatConnectionResponse] Neighbor user not found in DB:', neighborId);
        throw new NotFoundException('Neighbor user not found');
      }
      console.log('✅ [formatConnectionResponse] Neighbor fetched from DB:', neighbor.id);
    }

    // At this point, neighbor is guaranteed to be non-null
    console.log('🟡 [formatConnectionResponse] Formatting neighbor profile for:', neighbor.id);
    const neighborProfile = await this.formatNeighborProfile(neighbor);
    console.log('✅ [formatConnectionResponse] Neighbor profile formatted');
    
    console.log('🟡 [formatConnectionResponse] Getting mutual connections count');
    const mutualCount = await this.getMutualConnectionsCount(
      currentUserId,
      neighbor.id,
    );
    console.log('✅ [formatConnectionResponse] Mutual connections count:', mutualCount);

    return {
      id: connection.id,
      fromUserId: connection.fromUserId,
      toUserId: connection.toUserId,
      connectionType: connection.connectionType,
      status: connection.status,
      initiatedBy: connection.initiatedBy,
      createdAt: connection.createdAt,
      acceptedAt: connection.acceptedAt,
      metadata: connection.metadata,
      neighbor: neighborProfile,
      mutualConnections: mutualCount,
    };
  }

  private async formatNeighborProfile(user: User): Promise<NeighborProfileDto> {
    // Get user's neighborhood
    const userNeighborhood = await this.userNeighborhoodRepository.findOne({
      where: { userId: user.id, isPrimary: true },
      relations: ['neighborhood'],
    });

    // Get connection stats
    const connections = await this.connectionRepository.find({
      where: [
        { fromUserId: user.id, status: ConnectionStatus.ACCEPTED },
        { toUserId: user.id, status: ConnectionStatus.ACCEPTED },
      ],
    });

    const totalConnections = connections.length;
    const trustedConnections = connections.filter(
      (c) => c.connectionType === ConnectionType.TRUSTED,
    ).length;

    return {
      id: user.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      profilePicture: user.profilePictureUrl || undefined,
      estate: userNeighborhood?.neighborhood?.name || undefined,
      building: undefined, // TODO: Add building info if available
      apartment: undefined, // TODO: Add apartment info if available
      isVerified: user.isEmailVerified || user.phoneVerified || false,
      verificationLevel: user.isEmailVerified
        ? 'enhanced'
        : user.phoneVerified
          ? 'basic'
          : 'none',
      trustScore: user.trustScore || 0,
      connectionStats: {
        totalConnections,
        trustedConnections,
        mutualConnections: 0, // Will be calculated per connection
        followerCount: 0, // TODO: Implement follower count
        followingCount: 0, // TODO: Implement following count
      },
      badges: [], // TODO: Get user badges
      interests: [], // TODO: Get user interests
      bio: user.bio || undefined,
      lastSeen: undefined, // TODO: Get last seen from user session
    };
  }

  private generateRecommendationReasons(
    neighbor: UserNeighborhood,
    userNeighborhood: UserNeighborhood,
    mutualCount: number,
  ): Array<{ type: string; description: string; strength: number }> {
    const reasons: Array<{ type: string; description: string; strength: number }> =
      [];

    if (neighbor.neighborhoodId === userNeighborhood.neighborhoodId) {
      reasons.push({
        type: 'proximity',
        description: 'Lives in the same neighborhood',
        strength: 30,
      });
    }

    if (mutualCount > 0) {
      reasons.push({
        type: 'mutual_connections',
        description: `You have ${mutualCount} mutual connection${mutualCount > 1 ? 's' : ''}`,
        strength: Math.min(mutualCount * 5, 25),
      });
    }

    return reasons;
  }
}


