import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { PointsService } from '../services/points.service';
import { AwardPointsDto, UserPointsResponseDto } from '../dto/points.dto';

@ApiTags('Points')
@ApiBearerAuth()
@Controller('points')
@UseGuards(JwtAuthGuard)
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('my')
  @ApiOperation({ summary: 'Get current user points' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User points retrieved',
    type: UserPointsResponseDto,
  })
  async getMyPoints(@CurrentUser('id') userId: string) {
    return this.pointsService.getUserPoints(userId);
  }

  @Post('award')
  @ApiOperation({ summary: 'Award points for activity (internal use)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Points awarded' })
  async awardPoints(
    @CurrentUser('id') userId: string,
    @Body() dto: AwardPointsDto,
  ) {
    return this.pointsService.awardPoints(
      userId,
      dto.activityType,
      dto.basePoints,
      {
        multiplier: dto.multiplier,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        metadata: dto.metadata,
      },
    );
  }

  @Get('activity-history')
  @ApiOperation({ summary: 'Get user activity history' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Activity history retrieved' })
  async getActivityHistory(@CurrentUser('id') userId: string) {
    return this.pointsService.getActivityHistory(userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get points for specific user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User points retrieved' })
  async getUserPoints(@Param('userId') userId: string) {
    return this.pointsService.getUserPoints(userId);
  }
}