import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { MarketplaceAuthGuard } from '../guards/marketplace-auth.guard';
import { BusinessApiService } from './business.service';
import type { BusinessSearchDto, ServiceInquiryDto, BusinessReviewDto } from './business.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    neighborhoodId: string;
  };
}

@ApiTags('businesses')
@Controller('businesses')
@UseGuards(MarketplaceAuthGuard)
@ApiBearerAuth()
export class BusinessController {
  constructor(private readonly businessService: BusinessApiService) {}

  @Get()
  @ApiOperation({ summary: 'Search businesses' })
  @ApiResponse({
    status: 200,
    description: 'List of businesses',
  })
  async searchBusinesses(
    @Request() req: AuthenticatedRequest,
    @Query() searchDto: BusinessSearchDto,
  ) {
    return this.businessService.searchBusinesses(searchDto, req.user?.userId);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby businesses' })
  @ApiResponse({
    status: 200,
    description: 'List of nearby businesses',
  })
  async getNearbyBusinesses(
    @Request() req: AuthenticatedRequest,
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius: number = 5,
    @Query() searchDto: BusinessSearchDto,
  ) {
    return this.businessService.getNearbyBusinesses(
      latitude,
      longitude,
      radius,
      searchDto,
      req.user?.userId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business by ID' })
  @ApiResponse({
    status: 200,
    description: 'Business details',
  })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async getBusinessById(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.businessService.getBusinessById(id, req.user?.userId);
  }

  @Post('inquiries')
  @ApiOperation({ summary: 'Create service inquiry' })
  @ApiResponse({
    status: 201,
    description: 'Service inquiry created successfully',
  })
  @ApiBody({ type: Object })
  async createServiceInquiry(
    @Request() req: AuthenticatedRequest,
    @Body() inquiryDto: ServiceInquiryDto,
  ) {
    return this.businessService.createServiceInquiry(req.user.userId, inquiryDto);
  }

  @Get(':id/inquiries')
  @ApiOperation({ summary: 'Get business inquiries (business owner only)' })
  @ApiResponse({
    status: 200,
    description: 'List of business inquiries',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getBusinessInquiries(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.businessService.getBusinessInquiries(id, req.user.userId, page, limit);
  }

  @Post(':id/inquiries/:inquiryId/respond')
  @ApiOperation({ summary: 'Respond to service inquiry (business owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Response sent successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Inquiry not found' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        response: { type: 'string' },
      },
      required: ['response'],
    },
  })
  async respondToInquiry(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('inquiryId') inquiryId: string,
    @Body('response') response: string,
  ) {
    return this.businessService.respondToInquiry(inquiryId, id, req.user.userId, response);
  }

  @Post('reviews')
  @ApiOperation({ summary: 'Create business review' })
  @ApiResponse({
    status: 201,
    description: 'Review created successfully',
  })
  @ApiBody({ type: Object })
  async createBusinessReview(
    @Request() req: AuthenticatedRequest,
    @Body() reviewDto: BusinessReviewDto,
  ) {
    return this.businessService.createBusinessReview(req.user.userId, reviewDto);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get business reviews' })
  @ApiResponse({
    status: 200,
    description: 'List of business reviews',
  })
  async getBusinessReviews(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.businessService.getBusinessReviews(id, page, limit);
  }

  @Post(':id/services')
  @ApiOperation({ summary: 'Update business services (business owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Services updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        services: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              serviceName: { type: 'string' },
              description: { type: 'string' },
              priceMin: { type: 'number' },
              priceMax: { type: 'number' },
              duration: { type: 'string' },
            },
          },
        },
      },
      required: ['services'],
    },
  })
  async updateBusinessServices(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('services') services: any[],
  ) {
    return this.businessService.updateBusinessServices(id, req.user.userId, services);
  }
}
