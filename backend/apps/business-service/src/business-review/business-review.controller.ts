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
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BusinessReviewService } from './business-review.service';
import {
  CreateBusinessReviewDto,
  RespondToReviewDto,
  ReviewQueryDto,
} from '../dto/create-review.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('Business Reviews')
@Controller('business/:businessId/reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessReviewController {
  constructor(private readonly reviewService: BusinessReviewService) {}

  @Post()
  @ApiOperation({ summary: 'Create a review for a business' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Already reviewed or bad request' })
  async create(
    @Param('businessId') businessId: string,
    @Request() req: AuthenticatedRequest,
    @Body() createDto: CreateBusinessReviewDto,
  ) {
    const review = await this.reviewService.create(
      businessId,
      req.user.id,
      createDto,
    );
    return {
      success: true,
      message: 'Review created successfully',
      data: review,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews for a business' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved' })
  async findAll(
    @Param('businessId') businessId: string,
    @Query() queryDto: ReviewQueryDto,
  ) {
    const result = await this.reviewService.findByBusiness(
      businessId,
      queryDto,
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get review statistics for a business' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStats(@Param('businessId') businessId: string) {
    const stats = await this.reviewService.getReviewStats(businessId);
    return {
      success: true,
      data: stats,
    };
  }

  @Put(':reviewId')
  @ApiOperation({ summary: 'Update your review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('reviewId') reviewId: string,
    @Request() req: AuthenticatedRequest,
    @Body() updateDto: CreateBusinessReviewDto,
  ) {
    const review = await this.reviewService.update(
      reviewId,
      req.user.id,
      updateDto,
    );
    return {
      success: true,
      message: 'Review updated successfully',
      data: review,
    };
  }

  @Post(':reviewId/respond')
  @ApiOperation({ summary: 'Business owner responds to a review' })
  @ApiResponse({ status: 200, description: 'Response added successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async respond(
    @Param('reviewId') reviewId: string,
    @Request() req: AuthenticatedRequest,
    @Body() respondDto: RespondToReviewDto,
  ) {
    const review = await this.reviewService.respondToReview(
      reviewId,
      req.user.id,
      respondDto,
    );
    return {
      success: true,
      message: 'Response added successfully',
      data: review,
    };
  }

  @Delete(':reviewId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete your review' })
  @ApiResponse({ status: 204, description: 'Review deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async delete(@Param('reviewId') reviewId: string, @Request() req: AuthenticatedRequest) {
    await this.reviewService.delete(reviewId, req.user.id);
  }
}
