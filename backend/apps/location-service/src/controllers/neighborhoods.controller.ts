import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { NeighborhoodsService } from '../services/neighborhoods.service';
import { CreateNeighborhoodDto, UpdateNeighborhoodDto, NeighborhoodSearchDto } from '../dto/neighborhood.dto';

@ApiTags('Neighborhoods')
@Controller('neighborhoods')
export class NeighborhoodsController {
  constructor(private readonly neighborhoodsService: NeighborhoodsService) {}

  @Get()
  @ApiOperation({ summary: 'Get neighborhoods by ward ID or search' })
  @ApiQuery({ name: 'wardId', required: false, description: 'Ward ID' })
  @ApiQuery({ name: 'type', required: false, description: 'Neighborhood type', enum: ['AREA', 'ESTATE', 'COMMUNITY'] })
  @ApiQuery({ name: 'isGated', required: false, description: 'Filter by gated status' })
  @ApiQuery({ name: 'includeSubNeighborhoods', required: false, description: 'Include sub-neighborhoods' })
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
    @Query('type') type?: string,
    @Query('isGated') isGated?: boolean,
    @Query('includeSubNeighborhoods') includeSubNeighborhoods?: boolean
  ) {
    try {
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
      
      // If no wardId, return empty for now (search functionality would go here)
      return {
        success: true,
        data: [],
        count: 0,
        message: 'No ward specified',
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
    @Query('q') query: string,
    @Query('stateId') stateId?: string,
    @Query('lgaId') lgaId?: string,
    @Query('type') type?: string,
    @Query('isGated') isGated?: boolean,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    const searchDto: NeighborhoodSearchDto = {
      query,
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
  async createNeighborhood(@Body() createNeighborhoodDto: CreateNeighborhoodDto) {
    try {
      const neighborhood = await this.neighborhoodsService.createNeighborhood(createNeighborhoodDto);
      return {
        success: true,
        data: neighborhood,
        message: 'Neighborhood created successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error creating neighborhood:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', Object.keys(error || {}));
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      // Return detailed error information
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Extract error message from various possible sources
      let errorMessage = 'Unknown error';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (error?.detail) {
        errorMessage = error.detail;
      }
      
      const errorDetails = error?.stack || error?.details || undefined;
      
      throw new BadRequestException({
        success: false,
        error: errorMessage,
        details: errorDetails,
        message: 'Failed to create neighborhood',
        originalError: error?.toString ? error.toString() : String(error),
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
