import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { StatesService } from '../services/states.service';
// Import not used directly; types come from service responses

@ApiTags('States')
@Controller('states')
export class StatesController {
  constructor(private readonly statesService: StatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all states' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all states',
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
              code: { type: 'string' },
              country: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' }
            }
          }
        },
        count: { type: 'number' }
      }
    }
  })
  async getAllStates() {
    const states = await this.statesService.getAllStates();
    return {
      success: true,
      data: states,
      count: states.length,
      message: 'States retrieved successfully',
      timestamp: new Date().toISOString()
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get state by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'State details',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            code: { type: 'string' },
            country: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    }
  })
  async getStateById(@Query('id') id: string) {
    const state = await this.statesService.getStateById(id);
    return {
      success: true,
      data: state,
      message: 'State retrieved successfully',
      timestamp: new Date().toISOString()
    };
  }
}
