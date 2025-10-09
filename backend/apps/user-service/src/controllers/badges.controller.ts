import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { BadgesService } from '../services/badges.service';
import { BadgeType } from '@app/database';

@ApiTags('Badges')
@ApiBearerAuth()
@Controller('badges')
@UseGuards(JwtAuthGuard)
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available badges' })
  @ApiQuery({ name: 'type', required: false, enum: BadgeType })
  @ApiResponse({ status: HttpStatus.OK, description: 'Badges retrieved' })
  async getAllBadges(@Query('type') type?: BadgeType) {
    return this.badgesService.getAllBadges(type);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user badges' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User badges retrieved' })
  async getMyBadges(@CurrentUser('id') userId: string) {
    return this.badgesService.getUserBadges(userId);
  }

  @Post('my/:badgeId/claim')
  @ApiOperation({ summary: 'Claim a badge' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Badge claimed' })
  async claimBadge(
    @CurrentUser('id') userId: string,
    @Param('badgeId') badgeId: string,
  ) {
    return this.badgesService.claimBadge(userId, badgeId);
  }

  @Post('my/:badgeId/toggle-visibility')
  @ApiOperation({ summary: 'Toggle badge visibility on profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Badge visibility toggled' })
  async toggleVisibility(
    @CurrentUser('id') userId: string,
    @Param('badgeId') badgeId: string,
  ) {
    return this.badgesService.toggleBadgeVisibility(userId, badgeId);
  }

  @Post('check-eligibility')
  @ApiOperation({ summary: 'Check and award all eligible badges' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Eligible badges awarded' })
  async checkEligibility(@CurrentUser('id') userId: string) {
    return this.badgesService.checkAndAwardEligibleBadges(userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get badges for specific user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User badges retrieved' })
  async getUserBadges(@Param('userId') userId: string) {
    return this.badgesService.getUserBadges(userId);
  }
}
