import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SocialServiceService } from './social-service.service';

@ApiTags('Social Service')
@Controller()
export class SocialServiceController {
  constructor(private readonly socialServiceService: SocialServiceService) {}

  @Get()
  @ApiOperation({ summary: 'Social service health check' })
  @ApiResponse({ status: 200, description: 'Social service is running' })
  getHello(): string {
    return this.socialServiceService.getHello();
  }

  @Get('test')
  @ApiOperation({ summary: 'Test endpoint without authentication' })
  @ApiResponse({ status: 200, description: 'Test endpoint response' })
  getTest(): { message: string; timestamp: string; service: string } {
    return {
      message: 'Social service is working!',
      timestamp: new Date().toISOString(),
      service: 'social-service',
    };
  }
}
