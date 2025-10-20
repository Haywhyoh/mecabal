import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { LandmarksService } from '../services/landmarks.service';
import { CreateLandmarkDto, UpdateLandmarkDto } from '../dto/landmark.dto';

@ApiTags('Landmarks')
@Controller('landmarks')
export class LandmarksController {
  constructor(private readonly landmarksService: LandmarksService) {}

  @Get('nearby/:neighborhoodId')
  @ApiOperation({ summary: 'Get landmarks near a neighborhood' })
  @ApiParam({ name: 'neighborhoodId', description: 'Neighborhood ID' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by landmark type' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit results' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of nearby landmarks',
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
              neighborhoodId: { type: 'string' },
              location: {
                type: 'object',
                properties: {
                  latitude: { type: 'number' },
                  longitude: { type: 'number' }
                }
              },
              address: { type: 'string' },
              description: { type: 'string' },
              verificationStatus: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' }
            }
          }
        }
      }
    }
  })
  async getNearbyLandmarks(
    @Param('neighborhoodId') neighborhoodId: string,
    @Query('type') type?: string,
    @Query('limit') limit?: number
  ) {
    const landmarks = await this.landmarksService.getNearbyLandmarks(
      neighborhoodId, 
      { type, limit }
    );
    return {
      success: true,
      data: landmarks,
      message: 'Landmarks retrieved successfully',
      timestamp: new Date().toISOString()
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search landmarks' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by type' })
  @ApiQuery({ name: 'neighborhoodId', required: false, description: 'Filter by neighborhood' })
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
              neighborhoodId: { type: 'string' },
              location: { type: 'object' },
              address: { type: 'string' },
              verificationStatus: { type: 'string' }
            }
          }
        },
        count: { type: 'number' },
        total: { type: 'number' }
      }
    }
  })
  async searchLandmarks(
    @Query('q') query: string,
    @Query('type') type?: string,
    @Query('neighborhoodId') neighborhoodId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    const results = await this.landmarksService.searchLandmarks({
      query,
      type,
      neighborhoodId,
      limit: limit || 20,
      offset: offset || 0
    });
    
    return {
      success: true,
      data: results.data,
      count: results.data.length,
      total: results.total,
      message: 'Search completed successfully',
      timestamp: new Date().toISOString()
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get landmark by ID' })
  @ApiParam({ name: 'id', description: 'Landmark ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Landmark details',
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
            neighborhoodId: { type: 'string' },
            location: { type: 'object' },
            address: { type: 'string' },
            description: { type: 'string' },
            verificationStatus: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    }
  })
  async getLandmarkById(@Param('id') id: string) {
    const landmark = await this.landmarksService.getLandmarkById(id);
    return {
      success: true,
      data: landmark,
      message: 'Landmark retrieved successfully',
      timestamp: new Date().toISOString()
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new landmark' })
  @ApiBody({ type: CreateLandmarkDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Landmark created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
        message: { type: 'string' }
      }
    }
  })
  async createLandmark(@Body() createLandmarkDto: CreateLandmarkDto) {
    const landmark = await this.landmarksService.createLandmark(createLandmarkDto);
    return {
      success: true,
      data: landmark,
      message: 'Landmark submitted for verification',
      timestamp: new Date().toISOString()
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update landmark' })
  @ApiParam({ name: 'id', description: 'Landmark ID' })
  @ApiBody({ type: UpdateLandmarkDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Landmark updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
        message: { type: 'string' }
      }
    }
  })
  async updateLandmark(
    @Param('id') id: string,
    @Body() updateLandmarkDto: UpdateLandmarkDto
  ) {
    const landmark = await this.landmarksService.updateLandmark(id, updateLandmarkDto);
    return {
      success: true,
      data: landmark,
      message: 'Landmark updated successfully',
      timestamp: new Date().toISOString()
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete landmark' })
  @ApiParam({ name: 'id', description: 'Landmark ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Landmark deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  async deleteLandmark(@Param('id') id: string) {
    await this.landmarksService.deleteLandmark(id);
    return {
      success: true,
      message: 'Landmark deleted successfully',
      timestamp: new Date().toISOString()
    };
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verify landmark (Admin only)' })
  @ApiParam({ name: 'id', description: 'Landmark ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        approved: { type: 'boolean' },
        reason: { type: 'string' }
      },
      required: ['approved']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Landmark verification updated',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  async verifyLandmark(
    @Param('id') id: string,
    @Body() body: { approved: boolean; reason?: string }
  ) {
    await this.landmarksService.verifyLandmark(id);
    return {
      success: true,
      message: 'Landmark verification updated',
      timestamp: new Date().toISOString()
    };
  }
}
