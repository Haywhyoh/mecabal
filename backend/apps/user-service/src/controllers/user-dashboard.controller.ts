import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@app/auth';
import { User } from '@app/database';
import { UserStatisticsService, DashboardStatsResponse } from '../services/user-statistics.service';

@ApiTags('User Dashboard')
@Controller('users/dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserDashboardController {
  constructor(
    private readonly statisticsService: UserStatisticsService,
  ) {}

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
  })
  async getDashboardStats(
    @CurrentUser() user: User,
  ): Promise<DashboardStatsResponse> {
    return this.statisticsService.getDashboardStats(user.id);
  }

  @Post('bookmarks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add bookmark' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        itemType: {
          type: 'string',
          enum: ['post', 'listing', 'event'],
        },
        itemId: { type: 'string', format: 'uuid' },
      },
      required: ['itemType', 'itemId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Bookmark added successfully',
  })
  async addBookmark(
    @CurrentUser() user: User,
    @Body() body: { itemType: 'post' | 'listing' | 'event'; itemId: string },
  ) {
    return this.statisticsService.addBookmark(
      user.id,
      body.itemType,
      body.itemId,
    );
  }

  @Delete('bookmarks/:itemType/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove bookmark' })
  @ApiParam({ name: 'itemType', enum: ['post', 'listing', 'event'] })
  @ApiParam({ name: 'itemId', description: 'Item ID' })
  @ApiResponse({
    status: 200,
    description: 'Bookmark removed successfully',
  })
  async removeBookmark(
    @CurrentUser() user: User,
    @Param('itemType') itemType: 'post' | 'listing' | 'event',
    @Param('itemId') itemId: string,
  ) {
    return this.statisticsService.removeBookmark(user.id, itemType, itemId);
  }

  @Get('bookmarks/:itemType')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get bookmarks by type' })
  @ApiParam({ name: 'itemType', enum: ['post', 'listing', 'event'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({
    status: 200,
    description: 'Bookmarks retrieved successfully',
  })
  async getBookmarks(
    @CurrentUser() user: User,
    @Param('itemType') itemType: 'post' | 'listing' | 'event',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.statisticsService.getBookmarksByType(
      user.id,
      itemType,
      page,
      limit,
    );
  }

  @Get('bookmarks/check/:itemType/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if item is bookmarked' })
  @ApiParam({ name: 'itemType', enum: ['post', 'listing', 'event'] })
  @ApiParam({ name: 'itemId', description: 'Item ID' })
  @ApiResponse({
    status: 200,
    description: 'Bookmark status retrieved',
    schema: {
      type: 'object',
      properties: {
        isBookmarked: { type: 'boolean' },
      },
    },
  })
  async checkBookmark(
    @CurrentUser() user: User,
    @Param('itemType') itemType: 'post' | 'listing' | 'event',
    @Param('itemId') itemId: string,
  ): Promise<{ isBookmarked: boolean }> {
    const isBookmarked = await this.statisticsService.isBookmarked(
      user.id,
      itemType,
      itemId,
    );
    return { isBookmarked };
  }
}
