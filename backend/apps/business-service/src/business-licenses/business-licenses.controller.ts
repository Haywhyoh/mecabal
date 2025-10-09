import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BusinessLicensesService } from './business-licenses.service';
import { CreateBusinessLicenseDto } from '../dto/create-business-license.dto';
import { UpdateBusinessLicenseDto } from '../dto/update-business-license.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
    email: string;
  };
}

@ApiTags('Business Licenses')
@Controller('business-licenses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessLicensesController {
  constructor(private readonly businessLicensesService: BusinessLicensesService) {}

  @Post(':businessId')
  @ApiOperation({ summary: 'Add a new license to a business' })
  @ApiResponse({ status: 201, description: 'License created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Param('businessId') businessId: string,
    @Request() req: AuthenticatedRequest,
    @Body() createDto: CreateBusinessLicenseDto,
  ) {
    const license = await this.businessLicensesService.create(
      businessId,
      req.user.userId,
      createDto,
    );
    return {
      success: true,
      message: 'License created successfully',
      data: license,
    };
  }

  @Get('business/:businessId')
  @ApiOperation({ summary: 'Get all licenses for a business' })
  @ApiResponse({ status: 200, description: 'Licenses retrieved successfully' })
  async findByBusinessId(@Param('businessId') businessId: string) {
    const licenses = await this.businessLicensesService.findByBusinessId(
      businessId,
    );
    return {
      success: true,
      data: licenses,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business license by ID' })
  @ApiResponse({ status: 200, description: 'License retrieved successfully' })
  @ApiResponse({ status: 404, description: 'License not found' })
  async findById(@Param('id') id: string) {
    const license = await this.businessLicensesService.findById(id);
    return {
      success: true,
      data: license,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update business license' })
  @ApiResponse({ status: 200, description: 'License updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'License not found' })
  async update(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() updateDto: UpdateBusinessLicenseDto,
  ) {
    const license = await this.businessLicensesService.update(
      id,
      req.user.userId,
      updateDto,
    );
    return {
      success: true,
      message: 'License updated successfully',
      data: license,
    };
  }

  @Put(':id/verify')
  @ApiOperation({ summary: 'Verify or unverify a license (Admin only)' })
  @ApiResponse({ status: 200, description: 'License verification status updated' })
  async verifyLicense(
    @Param('id') id: string,
    @Body('isVerified') isVerified: boolean,
  ) {
    const license = await this.businessLicensesService.verifyLicense(
      id,
      isVerified,
    );
    return {
      success: true,
      message: `License ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: license,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete business license' })
  @ApiResponse({ status: 204, description: 'License deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    await this.businessLicensesService.delete(id, req.user.userId);
  }
}
