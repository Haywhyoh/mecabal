import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SocialAuthGuard } from '../guards/social-auth.guard';
import { ConnectionsService } from './connections.service';
import {
  CreateConnectionDto,
  ConnectionFilterDto,
  ConnectionResponseDto,
  ConnectionRequestResponseDto,
  ConnectionRecommendationDto,
  PaginatedConnectionsDto,
} from './dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    userNeighborhoods?: Array<{
      isPrimary: boolean;
      neighborhoodId: string;
    }>;
  };
}

@ApiTags('Connections')
@Controller('connections')
@UseGuards(SocialAuthGuard)
@ApiBearerAuth()
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post('request')
  @ApiOperation({ summary: 'Send a connection request' })
  @ApiResponse({
    status: 201,
    description: 'Connection request sent successfully',
    type: ConnectionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createConnectionRequest(
    @Body() createConnectionDto: CreateConnectionDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ConnectionResponseDto> {
    console.log('🔵 [ConnectionsController] createConnectionRequest called');
    console.log('🔵 [ConnectionsController] Request body:', JSON.stringify(createConnectionDto, null, 2));
    console.log('🔵 [ConnectionsController] User ID:', req.user?.id);
    console.log('🔵 [ConnectionsController] DTO type:', typeof createConnectionDto);
    console.log('🔵 [ConnectionsController] connectionType value:', createConnectionDto.connectionType);
    console.log('🔵 [ConnectionsController] connectionType type:', typeof createConnectionDto.connectionType);
    
    try {
      const result = await this.connectionsService.createConnectionRequest(
        createConnectionDto,
        req.user.id,
      );
      console.log('✅ [ConnectionsController] Connection request created successfully');
      return result;
    } catch (error) {
      console.error('❌ [ConnectionsController] Error creating connection request:', error);
      console.error('❌ [ConnectionsController] Error message:', error?.message);
      console.error('❌ [ConnectionsController] Error stack:', error?.stack);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get user connections' })
  @ApiResponse({
    status: 200,
    description: 'List of connections',
    type: PaginatedConnectionsDto,
  })
  async getConnections(
    @Query() filterDto: ConnectionFilterDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<PaginatedConnectionsDto> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2b86e3fe-f024-4873-83ef-99098887c58e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'connections.controller.ts:77',message:'getConnections endpoint hit',data:{userId:req.user?.id,url:req.url,method:req.method,filterDto},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    try {
      const result = await this.connectionsService.getConnections(filterDto, req.user.id);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2b86e3fe-f024-4873-83ef-99098887c58e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'connections.controller.ts:85',message:'getConnections success',data:{resultCount:result.data.length,total:result.total},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return result;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2b86e3fe-f024-4873-83ef-99098887c58e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'connections.controller.ts:90',message:'getConnections error',data:{errorMessage:error instanceof Error ? error.message : 'Unknown',errorType:error?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      throw error;
    }
  }

  @Get('requests')
  @ApiOperation({ summary: 'Get connection requests (incoming and outgoing)' })
  @ApiResponse({
    status: 200,
    description: 'Connection requests',
    type: ConnectionRequestResponseDto,
  })
  async getConnectionRequests(
    @Request() req: AuthenticatedRequest,
  ): Promise<ConnectionRequestResponseDto> {
    return this.connectionsService.getConnectionRequests(req.user.id);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get connection recommendations' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of recommendations to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection recommendations',
    type: [ConnectionRecommendationDto],
  })
  async getRecommendations(
    @Query('limit') limit: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ConnectionRecommendationDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.connectionsService.getRecommendations(req.user.id, limitNum);
  }

  @Get('discover')
  @ApiOperation({ summary: 'Discover neighbors by location' })
  @ApiResponse({
    status: 200,
    description: 'Discoverable neighbors',
    type: PaginatedConnectionsDto,
  })
  async discoverNeighbors(
    @Query() filterDto: ConnectionFilterDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<PaginatedConnectionsDto> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2b86e3fe-f024-4873-83ef-99098887c58e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'connections.controller.ts:118',message:'discoverNeighbors endpoint hit',data:{userId:req.user?.id,url:req.url,method:req.method},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return this.connectionsService.discoverNeighbors(filterDto, req.user.id);
  }

  @Get('mutual/:userId')
  @ApiOperation({ summary: 'Get mutual connections with a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Mutual connections',
    type: [ConnectionResponseDto],
  })
  async getMutualConnections(
    @Param('userId') targetUserId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ConnectionResponseDto[]> {
    const mutual = await this.connectionsService.getMutualConnections(
      req.user.id,
      targetUserId,
    );
    // Format as connections for consistency
    return mutual.map((neighbor) => ({
      id: `mutual_${neighbor.id}`,
      fromUserId: req.user.id,
      toUserId: neighbor.id,
      connectionType: 'connect' as any,
      status: 'accepted' as any,
      initiatedBy: req.user.id,
      createdAt: new Date(),
      neighbor,
      mutualConnections: 0,
    }));
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a connection request' })
  @ApiParam({ name: 'id', description: 'Connection ID' })
  @ApiResponse({
    status: 200,
    description: 'Connection request accepted',
    type: ConnectionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async acceptConnection(
    @Param('id') connectionId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ConnectionResponseDto> {
    return this.connectionsService.acceptConnection(
      connectionId,
      req.user.id,
    );
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reject a connection request' })
  @ApiParam({ name: 'id', description: 'Connection ID' })
  @ApiResponse({
    status: 204,
    description: 'Connection request rejected',
  })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async rejectConnection(
    @Param('id') connectionId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.connectionsService.rejectConnection(connectionId, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove or block a connection' })
  @ApiParam({ name: 'id', description: 'Connection ID' })
  @ApiResponse({
    status: 204,
    description: 'Connection removed',
  })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async removeConnection(
    @Param('id') connectionId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.connectionsService.removeConnection(connectionId, req.user.id);
  }
}




