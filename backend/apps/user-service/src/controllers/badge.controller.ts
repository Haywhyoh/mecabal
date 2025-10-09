import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth';
import { BadgeService } from '../services/badge.service';
import {
  AwardBadgeDto,
  RevokeBadgeDto,
  BadgeResponseDto,
  UserBadgesResponseDto,
  AvailableBadgeTypesDto,
  AwardLeadershipBadgeDto,
  AwardContributionBadgeDto,
} from '../dto/badge.dto';

@ApiTags('Badges')
@Controller('verification/badges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BadgeController {
  private readonly logger = new Logger(BadgeController.name);

  constructor(private readonly badgeService: BadgeService) {}

  @Post('award')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Award a badge to a user',
    description: 'Award a badge to a specific user (admin function)',
  })
  @ApiBody({ type: AwardBadgeDto })
  @ApiResponse({
    status: 200,
    description: 'Badge awarded successfully',
    type: BadgeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data or user already has this badge',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async awardBadge(
    @Request() req: any,
    @Body() awardBadgeDto: AwardBadgeDto,
  ): Promise<BadgeResponseDto> {
    const awardedBy = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    this.logger.log(`Awarding badge '${awardBadgeDto.badgeType}' to user ${awardBadgeDto.userId}`);

    return this.badgeService.awardBadge(
      { ...awardBadgeDto, awardedBy },
      ipAddress,
      userAgent,
    );
  }

  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke a badge from a user',
    description: 'Revoke an active badge from a user (admin function)',
  })
  @ApiBody({ type: RevokeBadgeDto })
  @ApiResponse({
    status: 200,
    description: 'Badge revoked successfully',
    type: BadgeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Badge not found or already revoked',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async revokeBadge(
    @Request() req: any,
    @Body() revokeBadgeDto: RevokeBadgeDto,
  ): Promise<BadgeResponseDto> {
    const revokedBy = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    this.logger.log(`Revoking badge ${revokeBadgeDto.badgeId}`);

    return this.badgeService.revokeBadge(
      { ...revokeBadgeDto, revokedBy },
      ipAddress,
      userAgent,
    );
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get badges for a specific user',
    description: 'Retrieve all badges (active and revoked) for a specific user',
  })
  @ApiParam({ name: 'userId', description: 'User ID to get badges for' })
  @ApiResponse({
    status: 200,
    description: 'User badges retrieved successfully',
    type: UserBadgesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getUserBadges(@Param('userId') userId: string): Promise<UserBadgesResponseDto> {
    this.logger.log(`Getting badges for user ${userId}`);

    const badges = await this.badgeService.getUserBadges(userId);

    return {
      success: true,
      data: badges,
      message: 'User badges retrieved successfully',
    };
  }

  @Get('my-badges')
  @ApiOperation({
    summary: 'Get current user badges',
    description: 'Retrieve all badges for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User badges retrieved successfully',
    type: UserBadgesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getMyBadges(@Request() req: any): Promise<UserBadgesResponseDto> {
    const userId = req.user.id;
    this.logger.log(`Getting badges for current user ${userId}`);

    const badges = await this.badgeService.getUserBadges(userId);

    return {
      success: true,
      data: badges,
      message: 'User badges retrieved successfully',
    };
  }

  @Get('stats/:userId')
  @ApiOperation({
    summary: 'Get badge statistics for a user',
    description: 'Get detailed badge statistics for a specific user',
  })
  @ApiParam({ name: 'userId', description: 'User ID to get stats for' })
  @ApiResponse({
    status: 200,
    description: 'Badge statistics retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getBadgeStats(@Param('userId') userId: string) {
    this.logger.log(`Getting badge stats for user ${userId}`);

    const stats = await this.badgeService.getBadgeStats(userId);

    return {
      success: true,
      data: stats,
      message: 'Badge statistics retrieved successfully',
    };
  }

  @Get('available-types')
  @ApiOperation({
    summary: 'Get available badge types',
    description: 'Get all available badge types organized by category',
  })
  @ApiResponse({
    status: 200,
    description: 'Available badge types retrieved successfully',
    type: AvailableBadgeTypesDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getAvailableBadgeTypes(): Promise<{
    success: boolean;
    data: AvailableBadgeTypesDto;
    message: string;
  }> {
    this.logger.log('Getting available badge types');

    const badgeTypes = this.badgeService.getAvailableBadgeTypes();

    return {
      success: true,
      data: { badgeTypes },
      message: 'Available badge types retrieved successfully',
    };
  }

  @Post('leadership')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Award leadership badge',
    description: 'Award a leadership badge to a user',
  })
  @ApiBody({ type: AwardLeadershipBadgeDto })
  @ApiResponse({
    status: 200,
    description: 'Leadership badge awarded successfully',
    type: BadgeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid leadership type or user already has this badge',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async awardLeadershipBadge(
    @Request() req: any,
    @Body() awardLeadershipBadgeDto: AwardLeadershipBadgeDto,
  ): Promise<BadgeResponseDto> {
    const awardedBy = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    this.logger.log(`Awarding leadership badge '${awardLeadershipBadgeDto.leadershipType}' to user ${awardLeadershipBadgeDto.userId}`);

    return this.badgeService.awardLeadershipBadge(
      awardLeadershipBadgeDto.userId,
      awardLeadershipBadgeDto.leadershipType,
      awardedBy,
      awardLeadershipBadgeDto.metadata,
    );
  }

  @Post('contribution')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Award contribution badge',
    description: 'Award a contribution badge to a user',
  })
  @ApiBody({ type: AwardContributionBadgeDto })
  @ApiResponse({
    status: 200,
    description: 'Contribution badge awarded successfully',
    type: BadgeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid contribution type or user already has this badge',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async awardContributionBadge(
    @Request() req: any,
    @Body() awardContributionBadgeDto: AwardContributionBadgeDto,
  ): Promise<BadgeResponseDto> {
    const awardedBy = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    this.logger.log(`Awarding contribution badge '${awardContributionBadgeDto.contributionType}' to user ${awardContributionBadgeDto.userId}`);

    return this.badgeService.awardContributionBadge(
      awardContributionBadgeDto.userId,
      awardContributionBadgeDto.contributionType,
      awardedBy,
      awardContributionBadgeDto.metadata,
    );
  }
}
