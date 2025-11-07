import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpException, HttpStatus, BadRequestException, Request, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { NeighborhoodsService } from '../services/neighborhoods.service';
import { CreateNeighborhoodDto, UpdateNeighborhoodDto, NeighborhoodSearchDto } from '../dto/neighborhood.dto';

@ApiTags('Neighborhoods')
@Controller('neighborhoods')
export class NeighborhoodsController {
  constructor(private readonly neighborhoodsService: NeighborhoodsService) {}

  @Get()
  @ApiOperation({ summary: 'Get neighborhoods by ward ID, LGA ID, or other filters' })
  @ApiQuery({ name: 'wardId', required: false, description: 'Ward ID' })
  @ApiQuery({ name: 'lgaId', required: false, description: 'LGA ID' })
  @ApiQuery({ name: 'stateId', required: false, description: 'State ID' })
  @ApiQuery({ name: 'type', required: false, description: 'Neighborhood type', enum: ['AREA', 'ESTATE', 'COMMUNITY'] })
  @ApiQuery({ name: 'isGated', required: false, description: 'Filter by gated status' })
  @ApiQuery({ name: 'includeSubNeighborhoods', required: false, description: 'Include sub-neighborhoods' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset results' })
  @ApiResponse({
    status: 200,
    description: 'List of neighborhoods',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              wardId: { type: 'string' },
              isGated: { type: 'boolean' },
              requiresVerification: { type: 'boolean' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' }
            }
          }
        },
        count: { type: 'number' }
      }
    }
  })
  async getNeighborhoods(
    @Query('wardId') wardId?: string,
    @Query('lgaId') lgaId?: string,
    @Query('stateId') stateId?: string,
    @Query('type') type?: string,
    @Query('isGated') isGated?: boolean,
    @Query('includeSubNeighborhoods') includeSubNeighborhoods?: boolean,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    try {
      // If wardId is provided, use the specific ward method
      if (wardId) {
        const neighborhoods = await this.neighborhoodsService.getNeighborhoodsByWard(
          wardId,
          { type: type as any, isGated, includeSubNeighborhoods }
        );
        return {
          success: true,
          data: neighborhoods,
          count: neighborhoods.length,
          message: 'Neighborhoods retrieved successfully',
          timestamp: new Date().toISOString()
        };
      }

      // If lgaId or stateId is provided, use search functionality
      if (lgaId || stateId || type !== undefined || isGated !== undefined) {
        const results = await this.neighborhoodsService.searchNeighborhoods({
          query: '', // Empty query to get all
          lgaId,
          stateId,
          type,
          isGated,
          limit: limit || 100,
          offset: offset || 0
        });
        return {
          success: true,
          data: results.data,
          count: results.data.length,
          total: results.total,
          message: 'Neighborhoods retrieved successfully',
          timestamp: new Date().toISOString()
        };
      }

      // If no filters, return empty
      return {
        success: true,
        data: [],
        count: 0,
        message: 'No filters specified. Please provide wardId, lgaId, or stateId.',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
      return {
        success: false,
        data: [],
        count: 0,
        message: 'Failed to fetch neighborhoods',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Search neighborhoods' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiQuery({ name: 'stateId', required: false, description: 'State ID filter' })
  @ApiQuery({ name: 'lgaId', required: false, description: 'LGA ID filter' })
  @ApiQuery({ name: 'type', required: false, description: 'Type filter' })
  @ApiQuery({ name: 'isGated', required: false, description: 'Gated filter' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset results' })
  @ApiResponse({ 
    status: 200, 
    description: 'Search results',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              isGated: { type: 'boolean' },
              distance: { type: 'number' }
            }
          }
        },
        count: { type: 'number' },
        total: { type: 'number' }
      }
    }
  })
  async searchNeighborhoods(
    @Query('q') q?: string,
    @Query('query') query?: string,
    @Query('stateId') stateId?: string,
    @Query('lgaId') lgaId?: string,
    @Query('type') type?: string,
    @Query('isGated') isGated?: boolean,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    // Accept both 'q' and 'query' parameter names for backwards compatibility
    const searchQuery = q || query || '';

    const searchDto: NeighborhoodSearchDto = {
      query: searchQuery,
      stateId,
      lgaId,
      type,
      isGated,
      limit: limit || 20,
      offset: offset || 0
    };

    const results = await this.neighborhoodsService.searchNeighborhoods(searchDto);
    return {
      success: true,
      data: results.data,
      count: results.data.length,
      total: results.total,
      message: 'Search completed successfully',
      timestamp: new Date().toISOString()
    };
  }

  @Post('recommend')
  @ApiOperation({ summary: 'Get neighborhood recommendations based on coordinates' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        radius: { type: 'number' },
        limit: { type: 'number' }
      },
      required: ['latitude', 'longitude']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Neighborhood recommendations',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            detectedLocation: {
              type: 'object',
              properties: {
                state: { type: 'object' },
                lga: { type: 'object' },
                ward: { type: 'object' }
              }
            },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  neighborhood: { type: 'object' },
                  distance: { type: 'number' },
                  landmarks: { type: 'array' },
                  memberCount: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  })
  async recommendNeighborhoods(@Body() body: {
    latitude: number;
    longitude: number;
    radius?: number;
    limit?: number;
  }) {
    try {
      const recommendations = await this.neighborhoodsService.recommendNeighborhoods(
        body.latitude,
        body.longitude,
        body.radius,
        body.limit
      );
      
      return {
        success: true,
        data: recommendations,
        message: 'Recommendations generated successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating neighborhood recommendations:', error);
      return {
        success: false,
        data: {
          detectedLocation: {
            state: 'Unknown',
            lga: 'Unknown',
            city: 'Unknown',
          },
          recommendations: [],
        },
        message: 'Failed to generate recommendations',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get neighborhood by ID' })
  @ApiParam({ name: 'id', description: 'Neighborhood ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Neighborhood details',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            wardId: { type: 'string' },
            isGated: { type: 'boolean' },
            requiresVerification: { type: 'boolean' },
            landmarks: { type: 'array' },
            subNeighborhoods: { type: 'array' }
          }
        }
      }
    }
  })
  async getNeighborhoodById(@Param('id') id: string) {
    const neighborhood = await this.neighborhoodsService.getNeighborhoodById(id);
    return {
      success: true,
      data: neighborhood,
      message: 'Neighborhood retrieved successfully',
      timestamp: new Date().toISOString()
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new neighborhood' })
  @ApiBody({ type: CreateNeighborhoodDto })
  @ApiResponse({
    status: 201,
    description: 'Neighborhood created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
        message: { type: 'string' }
      }
    }
  })
  async createNeighborhood(
    @Body() createNeighborhoodDto: CreateNeighborhoodDto,
    @Headers('x-user-id') userId?: string,
    @Request() req?: any
  ) {
    try {
      // Extract user ID from multiple sources:
      // 1. X-User-Id header (set by API Gateway)
      // 2. JWT token (if auth middleware is enabled)
      const authenticatedUserId = userId || req?.user?.id || req?.user?.userId;

      // Set createdBy from authenticated user if not provided
      if (!createNeighborhoodDto.createdBy && authenticatedUserId) {
        createNeighborhoodDto.createdBy = authenticatedUserId;
      }

      const neighborhood = await this.neighborhoodsService.createNeighborhood(createNeighborhoodDto);
      return {
        success: true,
        data: neighborhood,
        message: 'Neighborhood created successfully',
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      console.error('=== Error creating neighborhood ===');
      console.error('Error type:', typeof err);
      console.error('Error constructor:', err?.constructor?.name);
      console.error('Error message:', err?.message);
      console.error('Error stack:', err?.stack);
      console.error('Error keys:', Object.keys(err || {}));
      console.error('Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      console.error('DTO received:', JSON.stringify(createNeighborhoodDto, null, 2));

      // Return detailed error information
      if (err instanceof HttpException) {
        throw err;
      }

      // Extract error message from various possible sources
      let errorMsg = 'Unknown error occurred';
      let errorDetails: any = undefined;

      if (err?.message) {
        errorMsg = err.message;
      } else if (typeof err === 'string') {
        errorMsg = err;
      } else if (err && typeof err === 'object') {
        // Safely check for error property
        const errObj = err as Record<string, any>;
        if ('detail' in errObj && errObj.detail) {
          errorMsg = errObj.detail;
          errorDetails = { databaseDetail: errObj.detail };
        } else if ('error' in errObj && errObj.error) {
          errorMsg = String(errObj.error);
        }
      }

      // Include more context in error details
      errorDetails = errorDetails || {
        stackTrace: err?.stack,
        errorType: err?.constructor?.name || typeof err,
        receivedData: {
          name: createNeighborhoodDto.name,
          type: createNeighborhoodDto.type,
          lgaId: createNeighborhoodDto.lgaId,
          hasBoundaries: !!createNeighborhoodDto.boundaries
        }
      };

      throw new BadRequestException({
        success: false,
        errorMessage: errorMsg,
        errorDetails: errorDetails,
        message: 'Failed to create neighborhood',
        timestamp: new Date().toISOString()
      });
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update neighborhood' })
  @ApiParam({ name: 'id', description: 'Neighborhood ID' })
  @ApiBody({ type: UpdateNeighborhoodDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Neighborhood updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
        message: { type: 'string' }
      }
    }
  })
  async updateNeighborhood(
    @Param('id') id: string,
    @Body() updateNeighborhoodDto: UpdateNeighborhoodDto
  ) {
    const neighborhood = await this.neighborhoodsService.updateNeighborhood(id, updateNeighborhoodDto);
    return {
      success: true,
      data: neighborhood,
      message: 'Neighborhood updated successfully',
      timestamp: new Date().toISOString()
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete neighborhood' })
  @ApiParam({ name: 'id', description: 'Neighborhood ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Neighborhood deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  async deleteNeighborhood(@Param('id') id: string) {
    await this.neighborhoodsService.deleteNeighborhood(id);
    return {
      success: true,
      message: 'Neighborhood deleted successfully',
      timestamp: new Date().toISOString()
    };
  }
}
