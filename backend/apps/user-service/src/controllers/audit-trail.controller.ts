import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth';
import { AuditTrailService } from '../services/audit-trail.service';
import {
  AuditTrailQueryDto,
  AuditTrailResponseDto,
  AuditTrailStatsResponseDto,
  AuditSummaryResponseDto,
  MultiTypeAuditQueryDto,
  ExportAuditTrailDto,
} from '../dto/audit-trail.dto';

@ApiTags('Audit Trail')
@Controller('verification/audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditTrailController {
  private readonly logger = new Logger(AuditTrailController.name);

  constructor(private readonly auditTrailService: AuditTrailService) {}

  @Get()
  @ApiOperation({
    summary: 'Get audit trail',
    description: 'Get verification audit trail with filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit trail retrieved successfully',
    type: AuditTrailResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getAuditTrail(@Query() query: AuditTrailQueryDto): Promise<AuditTrailResponseDto> {
    this.logger.log('Getting audit trail with filters');

    const queryParams = {
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    };

    const result = await this.auditTrailService.getAuditTrail(queryParams);

    return {
      success: true,
      data: result,
      message: 'Audit trail retrieved successfully',
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get audit trail statistics',
    description: 'Get comprehensive statistics for the audit trail',
  })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID to filter by' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for filtering' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for filtering' })
  @ApiResponse({
    status: 200,
    description: 'Audit trail statistics retrieved successfully',
    type: AuditTrailStatsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getAuditStats(
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AuditTrailStatsResponseDto> {
    this.logger.log('Getting audit trail statistics');

    const stats = await this.auditTrailService.getAuditStats(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      success: true,
      data: stats,
      message: 'Audit trail statistics retrieved successfully',
    };
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Get audit trail summary',
    description: 'Get a summary of audit trail for dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit trail summary retrieved successfully',
    type: AuditSummaryResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getAuditSummary(): Promise<AuditSummaryResponseDto> {
    this.logger.log('Getting audit trail summary');

    const summary = await this.auditTrailService.getAuditSummary();

    return {
      success: true,
      data: summary,
      message: 'Audit trail summary retrieved successfully',
    };
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get user audit trail',
    description: 'Get audit trail for a specific user',
  })
  @ApiParam({ name: 'userId', description: 'User ID to get audit trail for' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of records to skip' })
  @ApiResponse({
    status: 200,
    description: 'User audit trail retrieved successfully',
    type: AuditTrailResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getUserAuditTrail(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<AuditTrailResponseDto> {
    this.logger.log(`Getting audit trail for user ${userId}`);

    const result = await this.auditTrailService.getUserAuditTrail(
      userId,
      limit || 50,
      offset || 0,
    );

    return {
      success: true,
      data: result,
      message: 'User audit trail retrieved successfully',
    };
  }

  @Get('type/:verificationType')
  @ApiOperation({
    summary: 'Get verification type audit trail',
    description: 'Get audit trail for a specific verification type',
  })
  @ApiParam({ name: 'verificationType', description: 'Verification type to filter by' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of records to skip' })
  @ApiResponse({
    status: 200,
    description: 'Verification type audit trail retrieved successfully',
    type: AuditTrailResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getVerificationTypeAuditTrail(
    @Param('verificationType') verificationType: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<AuditTrailResponseDto> {
    this.logger.log(`Getting audit trail for verification type ${verificationType}`);

    const result = await this.auditTrailService.getVerificationTypeAuditTrail(
      verificationType,
      limit || 50,
      offset || 0,
    );

    return {
      success: true,
      data: result,
      message: 'Verification type audit trail retrieved successfully',
    };
  }

  @Get('action/:action')
  @ApiOperation({
    summary: 'Get action audit trail',
    description: 'Get audit trail for a specific action',
  })
  @ApiParam({ name: 'action', description: 'Action to filter by' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of records to skip' })
  @ApiResponse({
    status: 200,
    description: 'Action audit trail retrieved successfully',
    type: AuditTrailResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getActionAuditTrail(
    @Param('action') action: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<AuditTrailResponseDto> {
    this.logger.log(`Getting audit trail for action ${action}`);

    const result = await this.auditTrailService.getActionAuditTrail(
      action,
      limit || 50,
      offset || 0,
    );

    return {
      success: true,
      data: result,
      message: 'Action audit trail retrieved successfully',
    };
  }

  @Get('failed')
  @ApiOperation({
    summary: 'Get failed audits',
    description: 'Get all failed audit entries',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of records to skip' })
  @ApiResponse({
    status: 200,
    description: 'Failed audits retrieved successfully',
    type: AuditTrailResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getFailedAudits(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<AuditTrailResponseDto> {
    this.logger.log('Getting failed audits');

    const result = await this.auditTrailService.getFailedAudits(
      limit || 50,
      offset || 0,
    );

    return {
      success: true,
      data: result,
      message: 'Failed audits retrieved successfully',
    };
  }

  @Get('successful')
  @ApiOperation({
    summary: 'Get successful audits',
    description: 'Get all successful audit entries',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of records to skip' })
  @ApiResponse({
    status: 200,
    description: 'Successful audits retrieved successfully',
    type: AuditTrailResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getSuccessfulAudits(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<AuditTrailResponseDto> {
    this.logger.log('Getting successful audits');

    const result = await this.auditTrailService.getSuccessfulAudits(
      limit || 50,
      offset || 0,
    );

    return {
      success: true,
      data: result,
      message: 'Successful audits retrieved successfully',
    };
  }

  @Post('multi-type')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get multi-type audit trail',
    description: 'Get audit trail for multiple verification types',
  })
  @ApiResponse({
    status: 200,
    description: 'Multi-type audit trail retrieved successfully',
    type: AuditTrailResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getMultiTypeAuditTrail(
    @Query() query: MultiTypeAuditQueryDto,
  ): Promise<AuditTrailResponseDto> {
    this.logger.log(`Getting multi-type audit trail for types: ${query.verificationTypes.join(', ')}`);

    const result = await this.auditTrailService.getMultiTypeAuditTrail(
      query.verificationTypes,
      query.limit || 50,
      query.offset || 0,
    );

    return {
      success: true,
      data: result,
      message: 'Multi-type audit trail retrieved successfully',
    };
  }

  @Get('export')
  @ApiOperation({
    summary: 'Export audit trail',
    description: 'Export audit trail to CSV format',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit trail exported successfully',
    type: ExportAuditTrailDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async exportAuditTrail(
    @Query() query: AuditTrailQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log('Exporting audit trail to CSV');

    const queryParams = {
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    };

    const csvData = await this.auditTrailService.exportAuditTrail(queryParams);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-trail.csv');
    res.send(csvData);
  }
}
