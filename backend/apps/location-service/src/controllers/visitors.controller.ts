import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  HttpStatus,
  HttpException,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { VisitorService } from '../services/visitor.service';
import type { PreRegisterVisitorDto, GenerateVisitorPassDto } from '../services/visitor.service';
import { VisitorLogService } from '../services/visitor-log.service';
import type { VisitorLogFilters } from '../services/visitor-log.service';
import { VisitorAnalyticsService } from '../services/visitor-analytics.service';
import { VisitorAlertService } from '../services/visitor-alert.service';
import type { CreateAlertDto, AlertFilters } from '../services/visitor-alert.service';
import { JwtAuthGuard, CurrentUser, Public } from '@app/auth';
import { UseGuards } from '@nestjs/common';

@ApiTags('Estate Visitor Management')
@Controller('estate')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VisitorsController {
  constructor(
    private readonly visitorService: VisitorService,
    private readonly visitorLogService: VisitorLogService,
    private readonly visitorAnalyticsService: VisitorAnalyticsService,
    private readonly visitorAlertService: VisitorAlertService,
  ) {}

  // Visitor Management Endpoints
  @Post(':id/visitors/pre-register')
  @ApiOperation({ summary: 'Pre-register a visitor for an estate (residents can pre-register)' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiResponse({ status: 201, description: 'Visitor pre-registered successfully' })
  async preRegisterVisitor(
    @Param('id') estateId: string,
    @CurrentUser() user: any,
    @Body() dto: PreRegisterVisitorDto,
  ) {
    try {
      const visitor = await this.visitorService.preRegisterVisitor(estateId, user.id, dto);
      return {
        success: true,
        data: visitor,
        message: 'Visitor pre-registered successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to pre-register visitor',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/visitors/pre-register-with-pass')
  @ApiOperation({ summary: 'Pre-register visitor and generate pass in one call' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiResponse({ status: 201, description: 'Visitor pre-registered and pass generated successfully' })
  async preRegisterVisitorWithPass(
    @Param('id') estateId: string,
    @CurrentUser() user: any,
    @Body() body: { visitor: PreRegisterVisitorDto; pass: Omit<GenerateVisitorPassDto, 'visitorId' | 'hostId'> },
  ) {
    try {
      const result = await this.visitorService.preRegisterVisitorWithPass(
        estateId,
        user.id,
        body.visitor,
        body.pass,
      );
      return {
        success: true,
        data: result,
        message: 'Visitor pre-registered and pass generated successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to pre-register visitor with pass',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/visitors')
  @ApiOperation({ summary: 'Get all visitors for an estate' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiResponse({ status: 200, description: 'Visitors retrieved successfully' })
  async getVisitors(
    @Param('id') estateId: string,
    @CurrentUser() user: any,
  ) {
    try {
      const visitors = await this.visitorService.getVisitors(estateId, user.id);
      return {
        success: true,
        data: visitors,
        count: visitors.length,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve visitors',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/visitors/:visitorId')
  @ApiOperation({ summary: 'Get visitor by ID' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiParam({ name: 'visitorId', description: 'Visitor ID' })
  @ApiResponse({ status: 200, description: 'Visitor retrieved successfully' })
  async getVisitorById(
    @Param('id') estateId: string,
    @Param('visitorId') visitorId: string,
    @CurrentUser() user: any,
  ) {
    try {
      const visitor = await this.visitorService.getVisitorById(visitorId, estateId, user.id);
      return {
        success: true,
        data: visitor,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve visitor',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/visitors/:visitorId')
  @ApiOperation({ summary: 'Update visitor information' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiParam({ name: 'visitorId', description: 'Visitor ID' })
  @ApiResponse({ status: 200, description: 'Visitor updated successfully' })
  async updateVisitor(
    @Param('id') estateId: string,
    @Param('visitorId') visitorId: string,
    @CurrentUser() user: any,
    @Body() dto: Partial<PreRegisterVisitorDto>,
  ) {
    try {
      const visitor = await this.visitorService.updateVisitor(visitorId, estateId, user.id, dto);
      return {
        success: true,
        data: visitor,
        message: 'Visitor updated successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update visitor',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id/visitors/:visitorId')
  @ApiOperation({ summary: 'Delete visitor' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiParam({ name: 'visitorId', description: 'Visitor ID' })
  @ApiResponse({ status: 200, description: 'Visitor deleted successfully' })
  async deleteVisitor(
    @Param('id') estateId: string,
    @Param('visitorId') visitorId: string,
    @CurrentUser() user: any,
  ) {
    try {
      await this.visitorService.deleteVisitor(visitorId, estateId, user.id);
      return {
        success: true,
        message: 'Visitor deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete visitor',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Visitor Pass Endpoints
  @Post(':id/visitor-pass/generate')
  @ApiOperation({ summary: 'Generate visitor pass with QR code' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiResponse({ status: 201, description: 'Visitor pass generated successfully' })
  async generateVisitorPass(
    @Param('id') estateId: string,
    @CurrentUser() user: any,
    @Body() dto: GenerateVisitorPassDto,
  ) {
    try {
      const pass = await this.visitorService.generateVisitorPass(estateId, user.id, dto);
      return {
        success: true,
        data: pass,
        message: 'Visitor pass generated successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate visitor pass',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/visitor-pass/:passId')
  @ApiOperation({ summary: 'Get visitor pass by ID' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiParam({ name: 'passId', description: 'Visitor Pass ID' })
  @ApiResponse({ status: 200, description: 'Visitor pass retrieved successfully' })
  async getVisitorPass(
    @Param('id') estateId: string,
    @Param('passId') passId: string,
    @CurrentUser() user: any,
  ) {
    try {
      const pass = await this.visitorService.getVisitorPass(passId, estateId, user.id);
      return {
        success: true,
        data: pass,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve visitor pass',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/visitor-pass/:passId/check-in')
  @ApiOperation({ summary: 'Check in visitor' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiParam({ name: 'passId', description: 'Visitor Pass ID' })
  @ApiQuery({ name: 'gateName', required: false, description: 'Gate name' })
  @ApiResponse({ status: 200, description: 'Visitor checked in successfully' })
  async checkInVisitor(
    @Param('id') estateId: string,
    @Param('passId') passId: string,
    @Query('gateName') gateName: string,
    @CurrentUser() user: any,
  ) {
    try {
      const pass = await this.visitorService.checkInVisitor(passId, estateId, user.id, gateName);
      return {
        success: true,
        data: pass,
        message: 'Visitor checked in successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to check in visitor',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/visitor-pass/:passId/check-out')
  @ApiOperation({ summary: 'Check out visitor' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiParam({ name: 'passId', description: 'Visitor Pass ID' })
  @ApiQuery({ name: 'gateName', required: false, description: 'Gate name' })
  @ApiResponse({ status: 200, description: 'Visitor checked out successfully' })
  async checkOutVisitor(
    @Param('id') estateId: string,
    @Param('passId') passId: string,
    @Query('gateName') gateName: string,
    @CurrentUser() user: any,
  ) {
    try {
      const pass = await this.visitorService.checkOutVisitor(passId, estateId, user.id, gateName);
      return {
        success: true,
        data: pass,
        message: 'Visitor checked out successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to check out visitor',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/visitor-pass/:passId/revoke')
  @ApiOperation({ summary: 'Revoke visitor pass (host or admin can revoke)' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiParam({ name: 'passId', description: 'Visitor Pass ID' })
  @ApiResponse({ status: 200, description: 'Visitor pass revoked successfully' })
  async revokeVisitorPass(
    @Param('id') estateId: string,
    @Param('passId') passId: string,
    @CurrentUser() user: any,
  ) {
    try {
      const pass = await this.visitorService.revokeVisitorPass(passId, estateId, user.id);
      return {
        success: true,
        data: pass,
        message: 'Visitor pass revoked successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to revoke visitor pass',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/visitor-pass/my-passes')
  @ApiOperation({ summary: 'Get visitor passes created by the current user' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiResponse({ status: 200, description: 'Visitor passes retrieved successfully' })
  async getMyVisitorPasses(
    @Param('id') estateId: string,
    @CurrentUser() user: any,
  ) {
    try {
      const passes = await this.visitorService.getMyVisitorPasses(estateId, user.id);
      return {
        success: true,
        data: passes,
        count: passes.length,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve visitor passes',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/visitor-pass/:passId/send-code')
  @ApiOperation({ summary: 'Send visitor code via email or SMS' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiParam({ name: 'passId', description: 'Visitor Pass ID' })
  @ApiBody({ schema: { properties: { method: { type: 'string', enum: ['EMAIL', 'SMS', 'QR'] } } } })
  @ApiResponse({ status: 200, description: 'Code sent successfully' })
  async sendVisitorCode(
    @Param('id') estateId: string,
    @Param('passId') passId: string,
    @CurrentUser() user: any,
    @Body() body: { method: 'EMAIL' | 'SMS' | 'QR' },
  ) {
    try {
      await this.visitorService.sendVisitorCode(passId, estateId, user.id, body.method as any);
      return {
        success: true,
        message: 'Code sent successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to send code',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Public QR Validation Endpoint (for gate scanners)
  @Post('visitor-pass/validate')
  @Public()
  @ApiOperation({ summary: 'Validate QR code at entry gate (public endpoint)' })
  @ApiBody({ schema: { properties: { qrCode: { type: 'string' }, gateName: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'QR code validation result' })
  async validateQRCode(
    @Body() body: { qrCode: string; gateName?: string },
    @Req() req: any,
  ) {
    try {
      const result = await this.visitorService.validateQRCode(body.qrCode, body.gateName);
      
      // If validation fails, create a system alert
      if (!result.valid && result.pass) {
        await this.visitorAlertService.createSystemAlert(
          result.pass.estateId,
          {
            type: 'UNAUTHORIZED_ACCESS' as any,
            severity: 'HIGH' as any,
            title: 'Failed QR Code Validation',
            description: result.message,
            qrCode: body.qrCode,
            gateName: body.gateName,
            visitorId: result.pass.visitorId,
            visitorPassId: result.pass.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          },
        );
      }

      return {
        success: result.valid,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to validate QR code',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Public Access Code Validation Endpoint (for gate scanners)
  @Post('visitor-pass/validate-code')
  @Public()
  @ApiOperation({ summary: 'Validate 4-digit access code at entry gate (public endpoint)' })
  @ApiBody({ schema: { properties: { code: { type: 'string' }, estateId: { type: 'string' }, gateName: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Access code validation result' })
  async validateAccessCode(
    @Body() body: { code: string; estateId: string; gateName?: string },
    @Req() req: any,
  ) {
    try {
      const result = await this.visitorService.validateAccessCode(body.code, body.estateId, body.gateName);
      
      // If validation fails, create a system alert
      if (!result.valid && result.pass) {
        await this.visitorAlertService.createSystemAlert(
          result.pass.estateId,
          {
            type: 'UNAUTHORIZED_ACCESS' as any,
            severity: 'HIGH' as any,
            title: 'Failed Access Code Validation',
            description: result.message,
            qrCode: body.code,
            gateName: body.gateName,
            visitorId: result.pass.visitorId,
            visitorPassId: result.pass.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          },
        );
      }

      return {
        success: result.valid,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to validate access code',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Visitor Logs Endpoints
  @Get(':id/visitor-logs')
  @ApiOperation({ summary: 'Get visitor logs for an estate' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  @ApiQuery({ name: 'status', required: false, description: 'Status filter' })
  @ApiQuery({ name: 'hostId', required: false, description: 'Host ID filter' })
  @ApiQuery({ name: 'visitorId', required: false, description: 'Visitor ID filter' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset results' })
  @ApiResponse({ status: 200, description: 'Visitor logs retrieved successfully' })
  async getVisitorLogs(
    @Param('id') estateId: string,
    @CurrentUser() user: any,
    @Query() filters: VisitorLogFilters,
  ) {
    try {
      const result = await this.visitorLogService.getVisitorLogs(estateId, user.id, filters);
      return {
        success: true,
        data: result.data,
        total: result.total,
        count: result.data.length,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve visitor logs',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/visitor-logs/current')
  @ApiOperation({ summary: 'Get current active visitors' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiResponse({ status: 200, description: 'Current visitors retrieved successfully' })
  async getCurrentVisitors(
    @Param('id') estateId: string,
    @CurrentUser() user: any,
  ) {
    try {
      const visitors = await this.visitorLogService.getCurrentVisitors(estateId, user.id);
      return {
        success: true,
        data: visitors,
        count: visitors.length,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve current visitors',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Analytics Endpoints
  @Get(':id/visitor-analytics')
  @ApiOperation({ summary: 'Get visitor analytics for an estate' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getVisitorAnalytics(
    @Param('id') estateId: string,
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const stats = await this.visitorAnalyticsService.getVisitorStats(
        estateId,
        user.id,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
      );
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve analytics',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/visitor-analytics/peak-hours')
  @ApiOperation({ summary: 'Get peak hours analysis' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiResponse({ status: 200, description: 'Peak hours data retrieved successfully' })
  async getPeakHours(
    @Param('id') estateId: string,
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const data = await this.visitorAnalyticsService.getPeakHours(
        estateId,
        user.id,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
      );
      return {
        success: true,
        data,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve peak hours',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/visitor-analytics/frequent-visitors')
  @ApiOperation({ summary: 'Get frequent visitors' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit results' })
  @ApiResponse({ status: 200, description: 'Frequent visitors retrieved successfully' })
  async getFrequentVisitors(
    @Param('id') estateId: string,
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const data = await this.visitorAnalyticsService.getFrequentVisitors(
        estateId,
        user.id,
        limit || 10,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
      );
      return {
        success: true,
        data,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve frequent visitors',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Alert Endpoints
  @Get(':id/alerts')
  @ApiOperation({ summary: 'Get security alerts for an estate' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiQuery({ name: 'severity', required: false, description: 'Severity filter' })
  @ApiQuery({ name: 'status', required: false, description: 'Status filter' })
  @ApiQuery({ name: 'type', required: false, description: 'Type filter' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset results' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  async getAlerts(
    @Param('id') estateId: string,
    @CurrentUser() user: any,
    @Query() filters: AlertFilters,
  ) {
    try {
      const result = await this.visitorAlertService.getAlerts(estateId, user.id, filters);
      return {
        success: true,
        data: result.data,
        total: result.total,
        count: result.data.length,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve alerts',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/alerts')
  @ApiOperation({ summary: 'Create a security alert' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiResponse({ status: 201, description: 'Alert created successfully' })
  async createAlert(
    @Param('id') estateId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateAlertDto,
    @Req() req: any,
  ) {
    try {
      const alert = await this.visitorAlertService.createAlert(estateId, user.id, {
        ...dto,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return {
        success: true,
        data: alert,
        message: 'Alert created successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create alert',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/alerts/:alertId/status')
  @ApiOperation({ summary: 'Update alert status' })
  @ApiParam({ name: 'id', description: 'Estate ID' })
  @ApiParam({ name: 'alertId', description: 'Alert ID' })
  @ApiBody({ schema: { properties: { status: { type: 'string' }, resolutionNotes: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Alert status updated successfully' })
  async updateAlertStatus(
    @Param('id') estateId: string,
    @Param('alertId') alertId: string,
    @CurrentUser() user: any,
    @Body() body: { status: string; resolutionNotes?: string },
  ) {
    try {
      const alert = await this.visitorAlertService.updateAlertStatus(
        alertId,
        estateId,
        user.id,
        body.status as any,
        body.resolutionNotes,
      );
      return {
        success: true,
        data: alert,
        message: 'Alert status updated successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update alert status',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

