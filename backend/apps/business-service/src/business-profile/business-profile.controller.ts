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

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    email: string;
  };
}
import { BusinessProfileService } from './business-profile.service';
import { CreateBusinessProfileDto } from '../dto/create-business-profile.dto';
import { UpdateBusinessProfileDto } from '../dto/update-business-profile.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';

@ApiTags('Business Profile')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessProfileController {
  constructor(private readonly businessProfileService: BusinessProfileService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new business profile' })
  @ApiResponse({ status: 201, description: 'Business profile created successfully' })
  @ApiResponse({ status: 400, description: 'User already has a business profile' })
  async register(
    @Request() req: AuthenticatedRequest,
    @Body() createDto: CreateBusinessProfileDto,
  ) {
      const business = await this.businessProfileService.create(
        req.user.id,
        createDto,
      );
    return {
      success: true,
      message: 'Business profile created successfully',
      data: business,
    };
  }

  @Get('my-business')
  @ApiOperation({ summary: 'Get current user\'s business profile' })
  @ApiResponse({ status: 200, description: 'Business profile retrieved' })
  @ApiResponse({ status: 404, description: 'No business profile found' })
  async getMyBusiness(@Request() req: AuthenticatedRequest) {
      const business = await this.businessProfileService.findByUserId(
        req.user.id,
      );
    return {
      success: true,
      data: business,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business profile by ID' })
  @ApiResponse({ status: 200, description: 'Business profile retrieved' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async getById(@Param('id') id: string) {
    const business = await this.businessProfileService.findById(id);
    return {
      success: true,
      data: business,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update business profile' })
  @ApiResponse({ status: 200, description: 'Business profile updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async update(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() updateDto: UpdateBusinessProfileDto,
  ) {
      const business = await this.businessProfileService.update(
        id,
        req.user.id,
        updateDto,
      );
    return {
      success: true,
      message: 'Business profile updated successfully',
      data: business,
    };
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update business online/offline status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body('isActive') isActive: boolean,
  ) {
      const business = await this.businessProfileService.updateStatus(
        id,
        req.user.id,
        isActive,
      );
    return {
      success: true,
      message: `Business is now ${isActive ? 'online' : 'offline'}`,
      data: business,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete business profile' })
  @ApiResponse({ status: 204, description: 'Business profile deleted' })
    async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
      await this.businessProfileService.delete(id, req.user.id);
    }
}
