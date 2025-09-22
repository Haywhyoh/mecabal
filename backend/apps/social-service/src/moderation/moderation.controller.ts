import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@mecabal/auth';
import { ModerationService } from './moderation.service';
import {
  ReportContentDto,
  ModerateContentDto,
  ModerationQueueItemDto,
  ModerationStatsDto,
  ContentReportDto,
} from './dto';

@ApiTags('Moderation')
@Controller('moderation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('report/:contentType/:contentId')
  @ApiOperation({ summary: 'Report content for moderation' })
  @ApiParam({ name: 'contentType', description: 'Type of content', enum: ['post', 'comment'] })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiResponse({ status: 201, description: 'Content reported successfully' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async reportContent(
    @Param('contentType') contentType: 'post' | 'comment',
    @Param('contentId') contentId: string,
    @Body() reportDto: ReportContentDto,
    @Request() req: any,
  ): Promise<void> {
    const reporterId = req.user.id;
    return this.moderationService.reportContent(contentId, contentType, reporterId, reportDto);
  }

  @Put('moderate/:contentType/:contentId')
  @ApiOperation({ summary: 'Moderate content (moderators only)' })
  @ApiParam({ name: 'contentType', description: 'Type of content', enum: ['post', 'comment'] })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiResponse({ status: 200, description: 'Content moderated successfully' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async moderateContent(
    @Param('contentType') contentType: 'post' | 'comment',
    @Param('contentId') contentId: string,
    @Body() moderationDto: ModerateContentDto,
    @Request() req: any,
  ): Promise<void> {
    const moderatorId = req.user.id;
    return this.moderationService.moderateContent(contentId, contentType, moderatorId, moderationDto);
  }

  @Get('queue')
  @ApiOperation({ summary: 'Get moderation queue (moderators only)' })
  @ApiQuery({ name: 'limit', description: 'Number of items to return', required: false })
  @ApiQuery({ name: 'offset', description: 'Number of items to skip', required: false })
  @ApiResponse({
    status: 200,
    description: 'Moderation queue retrieved successfully',
    type: [ModerationQueueItemDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getModerationQueue(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<ModerationQueueItemDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    return this.moderationService.getModerationQueue(limitNum, offsetNum);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get moderation statistics (moderators only)' })
  @ApiResponse({
    status: 200,
    description: 'Moderation statistics retrieved successfully',
    type: ModerationStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getModerationStats(): Promise<ModerationStatsDto> {
    return this.moderationService.getModerationStats();
  }

  @Get('reports/:contentType/:contentId')
  @ApiOperation({ summary: 'Get reports for specific content (moderators only)' })
  @ApiParam({ name: 'contentType', description: 'Type of content', enum: ['post', 'comment'] })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiResponse({
    status: 200,
    description: 'Content reports retrieved successfully',
    type: [ContentReportDto],
  })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getContentReports(
    @Param('contentType') contentType: 'post' | 'comment',
    @Param('contentId') contentId: string,
  ): Promise<ContentReportDto[]> {
    return this.moderationService.getContentReports(contentId, contentType);
  }

  @Post('auto-moderate/:contentType/:contentId')
  @ApiOperation({ summary: 'Trigger auto-moderation for content' })
  @ApiParam({ name: 'contentType', description: 'Type of content', enum: ['post', 'comment'] })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiResponse({ status: 200, description: 'Auto-moderation completed' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async autoModerateContent(
    @Param('contentType') contentType: 'post' | 'comment',
    @Param('contentId') contentId: string,
  ): Promise<{ status: string }> {
    const status = await this.moderationService.autoModerateContent(contentId, contentType);
    return { status };
  }
}
