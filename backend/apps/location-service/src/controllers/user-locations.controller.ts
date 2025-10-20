import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserLocationRepository } from '../repositories/user-location.repository';
import { UserLocation } from '@app/database/entities';

@ApiTags('User Locations')
@Controller('user')
export class UserLocationsController {
  constructor(
    private readonly userLocationRepository: UserLocationRepository,
  ) {}

  @Get('locations')
  @ApiOperation({ summary: 'Get all user locations' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of user locations',
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
              userId: { type: 'string' },
              stateId: { type: 'string' },
              lgaId: { type: 'string' },
              wardId: { type: 'string' },
              neighborhoodId: { type: 'string' },
              cityTown: { type: 'string' },
              address: { type: 'string' },
              isPrimary: { type: 'boolean' },
              verificationStatus: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' }
            }
          }
        },
        count: { type: 'number' }
      }
    }
  })
  async getUserLocations(@Request() req: any) {
    try {
      // Extract user ID from request (assuming it's set by auth middleware)
      const userId = req.user?.id || req.user?.userId;
      
      if (!userId) {
        return {
          success: false,
          data: [],
          count: 0,
          message: 'User not authenticated',
          timestamp: new Date().toISOString()
        };
      }

      const locations = await this.userLocationRepository.getUserLocations(userId);
      
      return {
        success: true,
        data: locations,
        count: locations.length,
        message: 'User locations retrieved successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching user locations:', error);
      return {
        success: false,
        data: [],
        count: 0,
        message: 'Failed to fetch user locations',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('locations/primary')
  @ApiOperation({ summary: 'Get user primary location' })
  @ApiResponse({ 
    status: 200, 
    description: 'User primary location',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            stateId: { type: 'string' },
            lgaId: { type: 'string' },
            wardId: { type: 'string' },
            neighborhoodId: { type: 'string' },
            cityTown: { type: 'string' },
            address: { type: 'string' },
            isPrimary: { type: 'boolean' },
            verificationStatus: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    }
  })
  async getPrimaryLocation(@Request() req: any) {
    try {
      const userId = req.user?.id || req.user?.userId;
      
      if (!userId) {
        return {
          success: false,
          data: null,
          message: 'User not authenticated',
          timestamp: new Date().toISOString()
        };
      }

      const primaryLocation = await this.userLocationRepository.getPrimaryLocation(userId);
      
      return {
        success: true,
        data: primaryLocation,
        message: primaryLocation ? 'Primary location retrieved successfully' : 'No primary location found',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching primary location:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to fetch primary location',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('locations')
  @ApiOperation({ summary: 'Create new user location' })
  @ApiResponse({ 
    status: 201, 
    description: 'User location created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            stateId: { type: 'string' },
            lgaId: { type: 'string' },
            wardId: { type: 'string' },
            neighborhoodId: { type: 'string' },
            cityTown: { type: 'string' },
            address: { type: 'string' },
            isPrimary: { type: 'boolean' },
            verificationStatus: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        },
        message: { type: 'string' }
      }
    }
  })
  async createUserLocation(@Body() createData: Partial<UserLocation>, @Request() req: any) {
    try {
      const userId = req.user?.id || req.user?.userId;
      
      if (!userId) {
        return {
          success: false,
          data: null,
          message: 'User not authenticated',
          timestamp: new Date().toISOString()
        };
      }

      // Add user ID to the location data
      const locationData = {
        ...createData,
        userId,
      };

      const newLocation = await this.userLocationRepository.createUserLocation(locationData);
      
      return {
        success: true,
        data: newLocation,
        message: 'User location created successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating user location:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to create user location',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Put('locations/:id')
  @ApiOperation({ summary: 'Update user location' })
  @ApiResponse({ 
    status: 200, 
    description: 'User location updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            stateId: { type: 'string' },
            lgaId: { type: 'string' },
            wardId: { type: 'string' },
            neighborhoodId: { type: 'string' },
            cityTown: { type: 'string' },
            address: { type: 'string' },
            isPrimary: { type: 'boolean' },
            verificationStatus: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        },
        message: { type: 'string' }
      }
    }
  })
  async updateUserLocation(
    @Param('id') locationId: string,
    @Body() updateData: Partial<UserLocation>,
    @Request() req: any
  ) {
    try {
      const userId = req.user?.id || req.user?.userId;
      
      if (!userId) {
        return {
          success: false,
          data: null,
          message: 'User not authenticated',
          timestamp: new Date().toISOString()
        };
      }

      const updatedLocation = await this.userLocationRepository.updateUserLocation(
        locationId,
        updateData,
        userId
      );
      
      return {
        success: true,
        data: updatedLocation,
        message: 'User location updated successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error updating user location:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to update user location',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Delete('locations/:id')
  @ApiOperation({ summary: 'Delete user location' })
  @ApiResponse({ 
    status: 200, 
    description: 'User location deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  async deleteUserLocation(@Param('id') locationId: string, @Request() req: any) {
    try {
      const userId = req.user?.id || req.user?.userId;
      
      if (!userId) {
        return {
          success: false,
          message: 'User not authenticated',
          timestamp: new Date().toISOString()
        };
      }

      await this.userLocationRepository.deleteUserLocation(locationId, userId);
      
      return {
        success: true,
        message: 'User location deleted successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error deleting user location:', error);
      return {
        success: false,
        message: 'Failed to delete user location',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('locations/:id/set-primary')
  @ApiOperation({ summary: 'Set location as primary' })
  @ApiResponse({ 
    status: 200, 
    description: 'Location set as primary successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            stateId: { type: 'string' },
            lgaId: { type: 'string' },
            wardId: { type: 'string' },
            neighborhoodId: { type: 'string' },
            cityTown: { type: 'string' },
            address: { type: 'string' },
            isPrimary: { type: 'boolean' },
            verificationStatus: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        },
        message: { type: 'string' }
      }
    }
  })
  async setPrimaryLocation(@Param('id') locationId: string, @Request() req: any) {
    try {
      const userId = req.user?.id || req.user?.userId;
      
      if (!userId) {
        return {
          success: false,
          data: null,
          message: 'User not authenticated',
          timestamp: new Date().toISOString()
        };
      }

      const updatedLocation = await this.userLocationRepository.setPrimaryLocation(
        locationId,
        userId
      );
      
      return {
        success: true,
        data: updatedLocation,
        message: 'Location set as primary successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error setting primary location:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to set primary location',
        timestamp: new Date().toISOString()
      };
    }
  }
}
