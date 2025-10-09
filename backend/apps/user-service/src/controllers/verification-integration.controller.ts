import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth';
import { VerificationIntegrationService } from '../services/verification-integration.service';

export class CompleteVerificationStepDto {
  stepId: string;
  data?: any;
}

export class VerificationStatusResponseDto {
  success: boolean;
  data: any;
  message: string;
}

export class VerificationWorkflowResponseDto {
  success: boolean;
  data: {
    userId: string;
    steps: any[];
    progress: number;
    nextStep?: string;
  };
  message: string;
}

export class VerificationDashboardResponseDto {
  success: boolean;
  data: {
    totalUsers: number;
    verifiedUsers: number;
    pendingVerifications: number;
    recentActivity: any[];
    trustScoreDistribution: Array<{ range: string; count: number }>;
    verificationTypes: Array<{ type: string; count: number }>;
  };
  message: string;
}

export class AutoAwardBadgesResponseDto {
  success: boolean;
  data: {
    awarded: string[];
    errors: string[];
  };
  message: string;
}

@ApiTags('Verification Integration')
@Controller('verification/integration')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VerificationIntegrationController {
  private readonly logger = new Logger(VerificationIntegrationController.name);

  constructor(
    private readonly verificationIntegrationService: VerificationIntegrationService,
  ) {}

  @Get('status/:userId')
  @ApiOperation({
    summary: 'Get comprehensive verification status',
    description: 'Get complete verification status for a user including NIN, documents, badges, and trust score',
  })
  @ApiParam({ name: 'userId', description: 'User ID to get status for' })
  @ApiResponse({
    status: 200,
    description: 'Verification status retrieved successfully',
    type: VerificationStatusResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getUserVerificationStatus(
    @Param('userId') userId: string,
  ): Promise<VerificationStatusResponseDto> {
    this.logger.log(`Getting verification status for user ${userId}`);

    const status = await this.verificationIntegrationService.getUserVerificationStatus(userId);

    return {
      success: true,
      data: status,
      message: 'Verification status retrieved successfully',
    };
  }

  @Get('workflow/:userId')
  @ApiOperation({
    summary: 'Get verification workflow',
    description: 'Get the verification workflow steps for a user with progress tracking',
  })
  @ApiParam({ name: 'userId', description: 'User ID to get workflow for' })
  @ApiResponse({
    status: 200,
    description: 'Verification workflow retrieved successfully',
    type: VerificationWorkflowResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getVerificationWorkflow(
    @Param('userId') userId: string,
  ): Promise<VerificationWorkflowResponseDto> {
    this.logger.log(`Getting verification workflow for user ${userId}`);

    const workflow = await this.verificationIntegrationService.getVerificationWorkflow(userId);

    return {
      success: true,
      data: workflow,
      message: 'Verification workflow retrieved successfully',
    };
  }

  @Post('complete-step/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete verification step',
    description: 'Complete a specific verification workflow step',
  })
  @ApiParam({ name: 'userId', description: 'User ID to complete step for' })
  @ApiBody({ type: CompleteVerificationStepDto })
  @ApiResponse({
    status: 200,
    description: 'Verification step completed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid step data or step already completed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async completeVerificationStep(
    @Param('userId') userId: string,
    @Body() completeStepDto: CompleteVerificationStepDto,
  ): Promise<{
    success: boolean;
    message: string;
    nextStep?: string;
  }> {
    this.logger.log(`Completing verification step ${completeStepDto.stepId} for user ${userId}`);

    const result = await this.verificationIntegrationService.completeVerificationStep(
      userId,
      completeStepDto.stepId,
      completeStepDto.data,
    );

    return result;
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get verification dashboard',
    description: 'Get comprehensive verification dashboard data for admin',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification dashboard data retrieved successfully',
    type: VerificationDashboardResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getVerificationDashboard(): Promise<VerificationDashboardResponseDto> {
    this.logger.log('Getting verification dashboard data');

    const dashboard = await this.verificationIntegrationService.getVerificationDashboard();

    return {
      success: true,
      data: dashboard,
      message: 'Verification dashboard data retrieved successfully',
    };
  }

  @Post('auto-award-badges/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Auto-award badges',
    description: 'Automatically award badges based on user verification status',
  })
  @ApiParam({ name: 'userId', description: 'User ID to award badges for' })
  @ApiResponse({
    status: 200,
    description: 'Badges auto-awarded successfully',
    type: AutoAwardBadgesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async autoAwardBadges(
    @Param('userId') userId: string,
  ): Promise<AutoAwardBadgesResponseDto> {
    this.logger.log(`Auto-awarding badges for user ${userId}`);

    const result = await this.verificationIntegrationService.autoAwardBadges(userId);

    return {
      success: true,
      data: result,
      message: 'Badges auto-awarded successfully',
    };
  }

  @Get('my-status')
  @ApiOperation({
    summary: 'Get current user verification status',
    description: 'Get verification status for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User verification status retrieved successfully',
    type: VerificationStatusResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getMyVerificationStatus(@Request() req: any): Promise<VerificationStatusResponseDto> {
    const userId = req.user.id;
    this.logger.log(`Getting verification status for current user ${userId}`);

    const status = await this.verificationIntegrationService.getUserVerificationStatus(userId);

    return {
      success: true,
      data: status,
      message: 'User verification status retrieved successfully',
    };
  }

  @Get('my-workflow')
  @ApiOperation({
    summary: 'Get current user verification workflow',
    description: 'Get verification workflow for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User verification workflow retrieved successfully',
    type: VerificationWorkflowResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getMyVerificationWorkflow(@Request() req: any): Promise<VerificationWorkflowResponseDto> {
    const userId = req.user.id;
    this.logger.log(`Getting verification workflow for current user ${userId}`);

    const workflow = await this.verificationIntegrationService.getVerificationWorkflow(userId);

    return {
      success: true,
      data: workflow,
      message: 'User verification workflow retrieved successfully',
    };
  }

  @Post('complete-my-step')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete current user verification step',
    description: 'Complete a verification step for the authenticated user',
  })
  @ApiBody({ type: CompleteVerificationStepDto })
  @ApiResponse({
    status: 200,
    description: 'Verification step completed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid step data or step already completed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async completeMyVerificationStep(
    @Request() req: any,
    @Body() completeStepDto: CompleteVerificationStepDto,
  ): Promise<{
    success: boolean;
    message: string;
    nextStep?: string;
  }> {
    const userId = req.user.id;
    this.logger.log(`Completing verification step ${completeStepDto.stepId} for current user ${userId}`);

    const result = await this.verificationIntegrationService.completeVerificationStep(
      userId,
      completeStepDto.stepId,
      completeStepDto.data,
    );

    return result;
  }
}
