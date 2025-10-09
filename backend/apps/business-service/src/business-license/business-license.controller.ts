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
import { BusinessLicenseService } from './business-license.service';
import {
  CreateBusinessLicenseDto,
  UpdateBusinessLicenseDto,
  VerifyLicenseDto,
} from '../dto/license.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('Business Licenses')
@Controller('business/:businessId/licenses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessLicenseController {
  constructor(private readonly licenseService: BusinessLicenseService) {}

  @Post()
  @ApiOperation({ summary: 'Add a license to business profile' })
  @ApiResponse({ status: 201, description: 'License added successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Param('businessId') businessId: string,
    @Request() req: AuthenticatedRequest,
    @Body() createDto: CreateBusinessLicenseDto,
  ) {
    const license = await this.licenseService.create(
      businessId,
      req.user.id,
      createDto,
    );
    return {
      success: true,
      message: 'License added successfully',
      data: license,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all licenses for a business' })
  @ApiResponse({ status: 200, description: 'Licenses retrieved' })
  async findAll(@Param('businessId') businessId: string) {
    const licenses = await this.licenseService.findByBusiness(businessId);
    return {
      success: true,
      data: licenses,
    };
  }

  @Put(':licenseId')
  @ApiOperation({ summary: 'Update a license' })
  @ApiResponse({ status: 200, description: 'License updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('licenseId') licenseId: string,
    @Request() req: AuthenticatedRequest,
    @Body() updateDto: UpdateBusinessLicenseDto,
  ) {
    const license = await this.licenseService.update(
      licenseId,
      req.user.id,
      updateDto,
    );
    return {
      success: true,
      message: 'License updated successfully',
      data: license,
    };
  }

  @Delete(':licenseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a license' })
  @ApiResponse({ status: 204, description: 'License deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async delete(@Param('licenseId') licenseId: string, @Request() req: AuthenticatedRequest) {
    await this.licenseService.delete(licenseId, req.user.id);
  }

  @Post(':licenseId/verify')
  @ApiOperation({ summary: 'Verify a license (Admin only)' })
  @ApiResponse({ status: 200, description: 'License verification status updated' })
  async verify(
    @Param('licenseId') licenseId: string,
    @Body() verifyDto: VerifyLicenseDto,
  ) {
    const license = await this.licenseService.verifyLicense(
      licenseId,
      verifyDto,
    );
    return {
      success: true,
      message: `License ${verifyDto.isVerified ? 'verified' : 'unverified'} successfully`,
      data: license,
    };
  }
}
