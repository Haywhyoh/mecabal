import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
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
import {
  LeaderboardService,
  LeaderboardCategory,
  LeaderboardPeriod,
} from '../services/leaderboard.service';

@ApiTags('Leaderboard')
@ApiBearerAuth()
@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get leaderboard rankings' })
  @ApiQuery({ name: 'category', enum: LeaderboardCategory, required: false })
  @ApiQuery({ name: 'period', enum: LeaderboardPeriod, required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leaderboard retrieved' })
  async getLeaderboard(
    @Query('category') category: LeaderboardCategory = LeaderboardCategory.OVERALL,
    @Query('period') period: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @CurrentUser('id') userId?: string,
  ) {
    return this.leaderboardService.getLeaderboard(category, period, limit, userId);
  }
}
