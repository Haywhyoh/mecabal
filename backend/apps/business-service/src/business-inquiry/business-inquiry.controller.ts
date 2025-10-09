import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BusinessInquiryService } from './business-inquiry.service';
import {
  CreateBusinessInquiryDto,
  RespondToInquiryDto,
  UpdateInquiryStatusDto,
  InquiryStatus,
} from '../dto/inquiry.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('Business Inquiries')
@Controller('business/:businessId/inquiries')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessInquiryController {
  constructor(private readonly inquiryService: BusinessInquiryService) {}

  @Post()
  @ApiOperation({ summary: 'Send an inquiry to a business' })
  @ApiResponse({ status: 201, description: 'Inquiry sent successfully' })
  async create(
    @Param('businessId') businessId: string,
    @Request() req: AuthenticatedRequest,
    @Body() createDto: CreateBusinessInquiryDto,
  ) {
    const inquiry = await this.inquiryService.create(
      businessId,
      req.user.id,
      createDto,
    );
    return {
      success: true,
      message: 'Inquiry sent successfully',
      data: inquiry,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all inquiries for a business (business owner)' })
  @ApiResponse({ status: 200, description: 'Inquiries retrieved' })
  async findAll(
    @Param('businessId') businessId: string,
    @Query('status') status?: InquiryStatus,
  ) {
    const inquiries = await this.inquiryService.findByBusiness(
      businessId,
      status,
    );
    return {
      success: true,
      data: inquiries,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get inquiry statistics for a business' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStats(@Param('businessId') businessId: string) {
    const stats = await this.inquiryService.getInquiryStats(businessId);
    return {
      success: true,
      data: stats,
    };
  }

  @Post(':inquiryId/respond')
  @ApiOperation({ summary: 'Business owner responds to inquiry' })
  @ApiResponse({ status: 200, description: 'Response sent successfully' })
  async respond(
    @Param('inquiryId') inquiryId: string,
    @Request() req: AuthenticatedRequest,
    @Body() respondDto: RespondToInquiryDto,
  ) {
    const inquiry = await this.inquiryService.respond(
      inquiryId,
      req.user.id,
      respondDto,
    );
    return {
      success: true,
      message: 'Response sent successfully',
      data: inquiry,
    };
  }

  @Put(':inquiryId/status')
  @ApiOperation({ summary: 'Update inquiry status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(
    @Param('inquiryId') inquiryId: string,
    @Request() req: AuthenticatedRequest,
    @Body() updateDto: UpdateInquiryStatusDto,
  ) {
    const inquiry = await this.inquiryService.updateStatus(
      inquiryId,
      req.user.id,
      updateDto,
    );
    return {
      success: true,
      message: 'Status updated successfully',
      data: inquiry,
    };
  }
}

@Controller('user/inquiries')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('User Inquiries')
export class UserInquiryController {
  constructor(private readonly inquiryService: BusinessInquiryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all inquiries sent by current user' })
  @ApiResponse({ status: 200, description: 'User inquiries retrieved' })
  async getMyInquiries(@Request() req: AuthenticatedRequest) {
    const inquiries = await this.inquiryService.findByUser(req.user.id);
    return {
      success: true,
      data: inquiries,
    };
  }
}
