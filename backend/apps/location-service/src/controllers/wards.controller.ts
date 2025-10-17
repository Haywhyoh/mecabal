import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { WardsService } from '../services/wards.service';

@ApiTags('Wards')
@Controller('lgas/:lgaId/wards')
export class WardsController {
  constructor(private readonly wardsService: WardsService) {}

  @Get()
  @ApiOperation({ summary: 'Get wards by LGA ID' })
  @ApiParam({ name: 'lgaId', description: 'LGA ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of wards in the LGA',
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
              lgaId: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' }
            }
          }
        },
        count: { type: 'number' }
      }
    }
  })
  async getWardsByLga(@Param('lgaId') lgaId: string) {
    const wards = await this.wardsService.getWardsByLga(lgaId);
    return {
      success: true,
      data: wards,
      count: wards.length,
      message: 'Wards retrieved successfully',
      timestamp: new Date().toISOString()
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ward by ID' })
  @ApiParam({ name: 'lgaId', description: 'LGA ID' })
  @ApiParam({ name: 'id', description: 'Ward ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Ward details',
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
            lgaId: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    }
  })
  async getWardById(
    @Param('lgaId') lgaId: string,
    @Param('id') id: string
  ) {
    const ward = await this.wardsService.getWardById(id);
    return {
      success: true,
      data: ward,
      message: 'Ward retrieved successfully',
      timestamp: new Date().toISOString()
    };
  }
}
