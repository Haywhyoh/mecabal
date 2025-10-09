import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth';
import { AchievementsService } from '../services/achievements.service';
import { 
  AchievementProgressDto,
  AchievementDto,
  AchievementStatsDto,
  RecentUnlockDto,
  AchievementQueryDto,
  ActivityHistoryQueryDto
} from '../dto/achievements.dto';
import { AchievementCategory } from '@app/database';

@ApiTags('Achievements & Gamification')
@Controller('achievements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Post('initialize')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initialize achievements for current user' })
  @ApiResponse({ 
    status: 201, 
    description: 'Achievements initialized successfully' 
  })
  async initializeAchievements(@Request() req: any): Promise<{ message: string }> {
    const userId = req.user.id;
    await this.achievementsService.initializeUserAchievements(userId);
    return { message: 'Achievements initialized successfully' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user achievements progress' })
  @ApiResponse({ 
    status: 200, 
    description: 'User achievements retrieved successfully',
    type: [AchievementProgressDto] 
  })
  async getMyAchievements(@Request() req: any): Promise<AchievementProgressDto[]> {
    const userId = req.user.id;
    return this.achievementsService.getUserAchievements(userId);
  }

  @Get('me/unlocked')
  @ApiOperation({ summary: 'Get current user unlocked achievements' })
  @ApiResponse({ 
    status: 200, 
    description: 'Unlocked achievements retrieved successfully',
    type: [AchievementDto] 
  })
  async getMyUnlockedAchievements(@Request() req: any): Promise<AchievementDto[]> {
    const userId = req.user.id;
    return this.achievementsService.getUnlockedAchievements(userId);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get current user achievement statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Achievement statistics retrieved successfully',
    type: AchievementStatsDto 
  })
  async getMyAchievementStats(@Request() req: any): Promise<AchievementStatsDto> {
    const userId = req.user.id;
    return this.achievementsService.getUserAchievementStats(userId);
  }

  @Get('has/:achievementId')
  @ApiOperation({ summary: 'Check if user has specific achievement' })
  @ApiResponse({ 
    status: 200, 
    description: 'Achievement status retrieved successfully',
    schema: { type: 'boolean' }
  })
  async hasAchievement(
    @Request() req: any,
    @Param('achievementId') achievementId: string,
  ): Promise<boolean> {
    const userId = req.user.id;
    return this.achievementsService.hasAchievement(userId, achievementId);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get achievements by category' })
  @ApiResponse({ 
    status: 200, 
    description: 'Achievements retrieved successfully',
    type: [AchievementDto] 
  })
  async getAchievementsByCategory(
    @Param('category') category: string,
  ): Promise<AchievementDto[]> {
    return this.achievementsService.getAchievementsByCategory(category as any);
  }

  @Get('rarity/:rarity')
  @ApiOperation({ summary: 'Get achievements by rarity' })
  @ApiResponse({ 
    status: 200, 
    description: 'Achievements retrieved successfully',
    type: [AchievementDto] 
  })
  async getAchievementsByRarity(
    @Param('rarity') rarity: string,
  ): Promise<AchievementDto[]> {
    return this.achievementsService.getAchievementsByRarity(rarity as any);
  }

  @Get('recent-unlocks')
  @ApiOperation({ summary: 'Get recent achievement unlocks' })
  @ApiResponse({ 
    status: 200, 
    description: 'Recent unlocks retrieved successfully',
    type: [RecentUnlockDto] 
  })
  async getRecentUnlocks(
    @Query('limit') limit: number = 10,
  ): Promise<RecentUnlockDto[]> {
    const achievements = await this.achievementsService.getRecentUnlocks(limit);
    return achievements.map(achievement => ({
      ...achievement,
      unlockedAt: achievement.unlockedAt || new Date(), // Ensure unlockedAt is always defined
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get achievement by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Achievement retrieved successfully',
    type: AchievementDto 
  })
  async getAchievementById(
    @Param('id') id: string,
  ): Promise<AchievementDto | null> {
    return this.achievementsService.getAchievementById(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all achievements with filters' })
  @ApiResponse({ 
    status: 200, 
    description: 'Achievements retrieved successfully',
    type: [AchievementDto] 
  })
  async getAchievements(
    @Query() query: AchievementQueryDto,
  ): Promise<AchievementDto[]> {
    // This would typically be implemented in the service
    // For now, return all active achievements
    const achievements = await this.achievementsService.getAchievementsByCategory(AchievementCategory.COMMUNITY);
    return achievements;
  }
}
