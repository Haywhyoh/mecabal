import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BusinessActivityService, ActivityType } from './business-activity.service';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessProfile } from '@app/database/entities/business-profile.entity';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('Business Analytics')
@Controller('business/:businessId')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessActivityController {
  constructor(
    private readonly activityService: BusinessActivityService,
    @InjectRepository(BusinessProfile)
    private businessRepo: Repository<BusinessProfile>,
  ) {}

  private async verifyBusinessOwnership(
    businessId: string,
    userId: string,
  ): Promise<void> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });

    if (!business || business.userId !== userId) {
      throw new ForbiddenException('You do not own this business');
    }
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get business analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved' })
  async getAnalytics(
    @Param('businessId') businessId: string,
    @Query('period') period: '7d' | '30d' | '90d' | 'all' = '30d',
    @Request() req: AuthenticatedRequest,
  ) {
    await this.verifyBusinessOwnership(businessId, req.user.id);

    const analytics = await this.activityService.getAnalytics(
      businessId,
      period,
    );
    return {
      success: true,
      data: analytics,
    };
  }

  @Get('analytics/daily')
  @ApiOperation({ summary: 'Get daily statistics' })
  @ApiResponse({ status: 200, description: 'Daily stats retrieved' })
  async getDailyStats(
    @Param('businessId') businessId: string,
    @Query('days') days: number = 30,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.verifyBusinessOwnership(businessId, req.user.id);

    const stats = await this.activityService.getDailyStats(businessId, days);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent activity log' })
  @ApiResponse({ status: 200, description: 'Activity log retrieved' })
  async getActivity(
    @Param('businessId') businessId: string,
    @Query('limit') limit: number = 50,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.verifyBusinessOwnership(businessId, req.user.id);

    const activities = await this.activityService.getRecentActivity(
      businessId,
      limit,
    );
    return {
      success: true,
      data: activities,
    };
  }

  @Post('activity/view')
  @ApiOperation({ summary: 'Log a profile view (public endpoint)' })
  @ApiResponse({ status: 201, description: 'View logged' })
  async logView(@Param('businessId') businessId: string) {
    await this.activityService.logActivity(
      businessId,
      ActivityType.PROFILE_VIEWED,
    );
    return {
      success: true,
      message: 'View logged',
    };
  }

  @Post('activity/contact-click')
  @ApiOperation({ summary: 'Log a contact button click' })
  @ApiResponse({ status: 201, description: 'Contact click logged' })
  async logContactClick(@Param('businessId') businessId: string) {
    await this.activityService.logActivity(
      businessId,
      ActivityType.CONTACT_CLICKED,
    );
    return {
      success: true,
      message: 'Contact click logged',
    };
  }
}
