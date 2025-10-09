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
import { BusinessServicesService } from './business-services.service';
import { CreateBusinessServiceDto } from '../dto/create-business-service.dto';
import { UpdateBusinessServiceDto } from '../dto/update-business-service.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
    email: string;
  };
}

@ApiTags('Business Services')
@Controller('business-services')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessServicesController {
  constructor(private readonly businessServicesService: BusinessServicesService) {}

  @Post(':businessId')
  @ApiOperation({ summary: 'Add a new service to a business' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Param('businessId') businessId: string,
    @Request() req: AuthenticatedRequest,
    @Body() createDto: CreateBusinessServiceDto,
  ) {
    const service = await this.businessServicesService.create(
      businessId,
      req.user.userId,
      createDto,
    );
    return {
      success: true,
      message: 'Service created successfully',
      data: service,
    };
  }

  @Get('business/:businessId')
  @ApiOperation({ summary: 'Get all services for a business' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  async findByBusinessId(@Param('businessId') businessId: string) {
    const services = await this.businessServicesService.findByBusinessId(
      businessId,
    );
    return {
      success: true,
      data: services,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business service by ID' })
  @ApiResponse({ status: 200, description: 'Service retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findById(@Param('id') id: string) {
    const service = await this.businessServicesService.findById(id);
    return {
      success: true,
      data: service,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update business service' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async update(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() updateDto: UpdateBusinessServiceDto,
  ) {
    const service = await this.businessServicesService.update(
      id,
      req.user.userId,
      updateDto,
    );
    return {
      success: true,
      message: 'Service updated successfully',
      data: service,
    };
  }

  @Put(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle service active status' })
  @ApiResponse({ status: 200, description: 'Service status updated' })
  async toggleActive(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const service = await this.businessServicesService.toggleActive(
      id,
      req.user.userId,
    );
    return {
      success: true,
      message: `Service is now ${service.isActive ? 'active' : 'inactive'}`,
      data: service,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete business service' })
  @ApiResponse({ status: 204, description: 'Service deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    await this.businessServicesService.delete(id, req.user.userId);
  }
}
