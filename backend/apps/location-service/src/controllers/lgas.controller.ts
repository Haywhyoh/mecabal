import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LgasService } from '../services/lgas.service';

@ApiTags('LGAs')
@Controller('states/:stateId/lgas')
export class LgasController {
  constructor(private readonly lgasService: LgasService) {}

  @Get()
  @ApiOperation({ summary: 'Get LGAs by state ID' })
  @ApiParam({ name: 'stateId', description: 'State ID' })
  @ApiQuery({ 
    name: 'type', 
    required: false, 
    description: 'Filter by LGA type',
    enum: ['LGA', 'LCDA']
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of LGAs in the state',
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
              stateId: { type: 'string' },
              type: { type: 'string', enum: ['LGA', 'LCDA'] },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' }
            }
          }
        },
        count: { type: 'number' }
      }
    }
  })
  async getLgasByState(
    @Param('stateId') stateId: string,
    @Query('type') type?: 'LGA' | 'LCDA'
  ) {
    const lgas = await this.lgasService.getLgasByState(stateId, type);
    return {
      success: true,
      data: lgas,
      count: lgas.length,
      message: 'LGAs retrieved successfully',
      timestamp: new Date().toISOString()
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get LGA by ID' })
  @ApiParam({ name: 'stateId', description: 'State ID' })
  @ApiParam({ name: 'id', description: 'LGA ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'LGA details',
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
            stateId: { type: 'string' },
            type: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    }
  })
  async getLgaById(
    @Param('stateId') stateId: string,
    @Param('id') id: string
  ) {
    const lga = await this.lgasService.getLgaById(id);
    return {
      success: true,
      data: lga,
      message: 'LGA retrieved successfully',
      timestamp: new Date().toISOString()
    };
  }
}
