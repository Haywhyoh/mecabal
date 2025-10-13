import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { MarketplaceAuthGuard } from '../guards/marketplace-auth.guard';
import { JobsService } from './jobs.service';
import type { JobSearchDto, JobApplicationDto } from './jobs.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    neighborhoodId: string;
  };
}

@ApiTags('jobs')
@Controller('jobs')
@UseGuards(MarketplaceAuthGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'Search job listings' })
  @ApiResponse({
    status: 200,
    description: 'List of job listings',
  })
  async searchJobs(
    @Request() req: AuthenticatedRequest,
    @Query() searchDto: JobSearchDto,
  ) {
    return this.jobsService.searchJobs(searchDto, req.user?.userId);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby job listings' })
  @ApiResponse({
    status: 200,
    description: 'List of nearby job listings',
  })
  async getNearbyJobs(
    @Request() req: AuthenticatedRequest,
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius: number = 5,
    @Query() searchDto: JobSearchDto,
  ) {
    return this.jobsService.searchJobs({
      ...searchDto,
      latitude,
      longitude,
      radius,
    }, req.user?.userId);
  }

  @Get('matches')
  @ApiOperation({ summary: 'Get job matches for user' })
  @ApiResponse({
    status: 200,
    description: 'List of job matches',
  })
  async getJobMatches(
    @Request() req: AuthenticatedRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.jobsService.getJobMatches(req.user.userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiResponse({
    status: 200,
    description: 'Job details',
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobById(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.jobsService.getJobById(id, req.user?.userId);
  }

  @Post('applications')
  @ApiOperation({ summary: 'Apply for a job' })
  @ApiResponse({
    status: 201,
    description: 'Job application submitted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: Object })
  async createJobApplication(
    @Request() req: AuthenticatedRequest,
    @Body() applicationDto: JobApplicationDto,
  ) {
    return this.jobsService.createJobApplication(req.user.userId, applicationDto);
  }

  @Get('applications/my-applications')
  @ApiOperation({ summary: 'Get user job applications' })
  @ApiResponse({
    status: 200,
    description: 'List of user job applications',
  })
  async getUserApplications(
    @Request() req: AuthenticatedRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.jobsService.getUserApplications(req.user.userId, page, limit);
  }

  @Get(':id/applications')
  @ApiOperation({ summary: 'Get job applications (job owner only)' })
  @ApiResponse({
    status: 200,
    description: 'List of job applications',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getJobApplications(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.jobsService.getJobApplications(id, req.user.userId, page, limit);
  }

  @Patch('applications/:applicationId/status')
  @ApiOperation({ summary: 'Update application status (job owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Application status updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        status: { 
          type: 'string',
          enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired']
        },
        notes: { type: 'string' },
      },
      required: ['jobId', 'status'],
    },
  })
  async updateApplicationStatus(
    @Request() req: AuthenticatedRequest,
    @Param('applicationId') applicationId: string,
    @Body('jobId') jobId: string,
    @Body('status') status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired',
    @Body('notes') notes?: string,
  ) {
    return this.jobsService.updateApplicationStatus(
      applicationId,
      jobId,
      req.user.userId,
      status,
      notes,
    );
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get job analytics (job owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Job analytics data',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getJobAnalytics(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.jobsService.getJobAnalytics(id, req.user.userId);
  }
}
