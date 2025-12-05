import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { BookingService } from './booking.service';
import {
  CreateBookingDto,
  UpdateBookingStatusDto,
  BookingFilterDto,
} from '../dto/create-booking.dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    userId?: string; // For backward compatibility
    email: string;
  };
}

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 404, description: 'Business or service not found' })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() createDto: CreateBookingDto,
  ) {
    const userId = req.user.id || req.user.userId;
    if (!userId) {
      throw new Error('User ID is required');
    }
    const booking = await this.bookingService.create(userId, createDto);
    return {
      success: true,
      message: 'Booking created successfully',
      data: booking,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get user bookings' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved' })
  async getMyBookings(
    @Request() req: AuthenticatedRequest,
    @Query() filter: BookingFilterDto,
  ) {
    const userId = req.user.id || req.user.userId;
    if (!userId) {
      throw new Error('User ID is required');
    }
    const result = await this.bookingService.findUserBookings(
      userId,
      filter,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('reviewable')
  @ApiOperation({ summary: 'Get reviewable bookings' })
  @ApiResponse({ status: 200, description: 'Reviewable bookings retrieved' })
  async getReviewableBookings(@Request() req: AuthenticatedRequest) {
    const userId = req.user.id || req.user.userId;
    if (!userId) {
      throw new Error('User ID is required');
    }
    const bookings = await this.bookingService.findReviewableBookings(
      userId,
    );
    return {
      success: true,
      data: bookings,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking retrieved' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getById(@Param('id') id: string) {
    const booking = await this.bookingService.findById(id);
    return {
      success: true,
      data: booking,
    };
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update booking status' })
  @ApiResponse({ status: 200, description: 'Booking status updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async updateStatus(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() updateDto: UpdateBookingStatusDto,
  ) {
    const userId = req.user.id || req.user.userId;
    if (!userId) {
      throw new Error('User ID is required');
    }
    const booking = await this.bookingService.updateStatus(
      id,
      userId,
      updateDto,
    );
    return {
      success: true,
      message: 'Booking status updated successfully',
      data: booking,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async cancel(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id || req.user.userId;
    if (!userId) {
      throw new Error('User ID is required');
    }
    await this.bookingService.cancel(id, userId);
    return {
      success: true,
      message: 'Booking cancelled successfully',
    };
  }
}

@ApiTags('Business Bookings')
@Controller('business/:businessId/bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessBookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  @ApiOperation({ summary: 'Get business bookings' })
  @ApiResponse({ status: 200, description: 'Business bookings retrieved' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async getBusinessBookings(
    @Param('businessId') businessId: string,
    @Query() filter: BookingFilterDto,
  ) {
    const result = await this.bookingService.findBusinessBookings(
      businessId,
      filter,
    );
    return {
      success: true,
      data: result,
    };
  }
}

