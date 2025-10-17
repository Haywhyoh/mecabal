import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LocationServiceService } from './location-service.service';

@ApiTags('Location Service')
@Controller()
export class LocationServiceController {
  constructor(private readonly locationServiceService: LocationServiceService) {}

  @Get()
  @ApiOperation({ summary: 'Get location service health status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service health information',
    schema: {
      type: 'object',
      properties: {
        service: { type: 'string' },
        status: { type: 'string' },
        version: { type: 'string' },
        timestamp: { type: 'string' },
        features: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  })
  getHealth() {
    return {
      service: 'Location Service',
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      features: [
        'States Management',
        'LGAs Management', 
        'Wards Management',
        'Neighborhoods Management',
        'Landmarks Management',
        'Estate Management',
        'Location Search',
        'Neighborhood Recommendations',
        'Google Maps Integration'
      ]
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get location service statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service statistics',
    schema: {
      type: 'object',
      properties: {
        states: { type: 'number' },
        lgas: { type: 'number' },
        wards: { type: 'number' },
        neighborhoods: { type: 'number' },
        landmarks: { type: 'number' },
        timestamp: { type: 'string' }
      }
    }
  })
  async getStats() {
    return this.locationServiceService.getStats();
  }
}
