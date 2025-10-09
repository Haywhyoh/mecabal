import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('User Service')
@Controller()
export class UserServiceController {
  @Get('health')
  @ApiOperation({ summary: 'Health check for user service' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  getHealth() {
    return {
      status: 'healthy',
      service: 'user-service',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
