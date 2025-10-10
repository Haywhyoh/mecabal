import {
  Controller,
  Get,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { AchievementsService } from '../services/achievements.service';
import { BadgesService } from '../services/badges.service';
import { PointsService } from '../services/points.service';
import { LeaderboardService, LeaderboardCategory, LeaderboardPeriod } from '../services/leaderboard.service';

@ApiTags('Gamification')
@ApiBearerAuth()
@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly badgesService: BadgesService,
    private readonly pointsService: PointsService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get complete gamification dashboard for user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Dashboard data retrieved' })
  async getGamificationDashboard(@CurrentUser('id') userId: string) {
    const [points, achievements, badges, achievementStats, leaderboard] = await Promise.all([
      this.pointsService.getUserPoints(userId),
      this.achievementsService.getUserAchievements(userId),
      this.badgesService.getUserBadges(userId),
      this.achievementsService.getUserAchievementStats(userId),
      this.leaderboardService.getLeaderboard(
        LeaderboardCategory.OVERALL,
        LeaderboardPeriod.ALL_TIME,
        10,
        userId,
      ),
    ]);

    return {
      points,
      achievements: {
        list: achievements.slice(0, 5), // Recent 5
        stats: achievementStats,
      },
      badges: badges.slice(0, 5), // Recent 5
      leaderboard: {
        topRankings: leaderboard.rankings.slice(0, 10),
        userRank: leaderboard.userRank,
      },
    };
  }
}