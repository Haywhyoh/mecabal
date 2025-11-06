import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GoogleMapsService } from '@app/common/services/google-maps.service';

@ApiTags('Geocoding')
@Controller('geocoding')
export class GeocodingController {
  constructor(private readonly googleMapsService: GoogleMapsService) {}

  @Get('reverse')
  @ApiOperation({ summary: 'Reverse geocode coordinates to location information' })
  @ApiQuery({ name: 'latitude', description: 'Latitude coordinate', type: Number })
  @ApiQuery({ name: 'longitude', description: 'Longitude coordinate', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Location information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            state: { type: 'string', example: 'Lagos' },
            lga: { type: 'string', example: 'Alimosho' },
            ward: { type: 'string', nullable: true },
            city: { type: 'string', example: 'Ikeja' },
            coordinates: {
              type: 'object',
              properties: {
                latitude: { type: 'number' },
                longitude: { type: 'number' }
              }
            },
            formattedAddress: { type: 'string', example: 'Alimosho, Lagos, Nigeria' }
          }
        },
        message: { type: 'string' },
        timestamp: { type: 'string' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid coordinates provided'
  })
  @ApiResponse({
    status: 503,
    description: 'Google Maps service not configured'
  })
  async reverseGeocode(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string
  ) {
    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return {
        success: false,
        error: 'Invalid coordinates provided',
        message: 'Latitude and longitude must be valid numbers',
        timestamp: new Date().toISOString()
      };
    }

    // Check if within Nigeria bounds (approximate)
    if (lat < 4.0 || lat > 14.0 || lng < 2.5 || lng > 15.0) {
      return {
        success: false,
        error: 'Location outside Nigeria',
        message: 'The provided coordinates are outside Nigeria bounds',
        timestamp: new Date().toISOString()
      };
    }

    // Check if Google Maps service is configured
    if (!this.googleMapsService.isConfigured()) {
      return {
        success: false,
        error: 'Geocoding service not available',
        message: 'Google Maps API is not configured',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const locationInfo = await this.googleMapsService.reverseGeocode(lat, lng);

      if (!locationInfo) {
        return {
          success: false,
          error: 'Location not found',
          message: 'Unable to reverse geocode the provided coordinates',
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: true,
        data: locationInfo,
        message: 'Location information retrieved successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: 'Geocoding failed',
        message: error.message || 'An error occurred during reverse geocoding',
        timestamp: new Date().toISOString()
      };
    }
  }
}
