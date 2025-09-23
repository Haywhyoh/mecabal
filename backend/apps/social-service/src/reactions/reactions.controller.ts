import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth';
import { ReactionsService } from './reactions.service';
import { CreateReactionDto, ReactionResponseDto, ReactionStatsDto } from './dto';

@ApiTags('Reactions')
@Controller('posts/:postId/reactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Add or update a reaction to a post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({
    status: 201,
    description: 'Reaction added successfully',
    type: ReactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addReaction(
    @Param('postId') postId: string,
    @Body() createReactionDto: CreateReactionDto,
    @Request() req: any,
  ): Promise<ReactionResponseDto> {
    const userId = req.user.id;
    return this.reactionsService.addReaction(postId, userId, createReactionDto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove user reaction from a post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({ status: 204, description: 'Reaction removed successfully' })
  @ApiResponse({ status: 404, description: 'Post or reaction not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeReaction(
    @Param('postId') postId: string,
    @Request() req: any,
  ): Promise<void> {
    const userId = req.user.id;
    return this.reactionsService.removeReaction(postId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reactions for a post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Reactions retrieved successfully',
    type: [ReactionResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPostReactions(
    @Param('postId') postId: string,
    @Request() req: any,
  ): Promise<ReactionResponseDto[]> {
    const userId = req.user.id;
    return this.reactionsService.getPostReactions(postId, userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get reaction statistics for a post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Reaction statistics retrieved successfully',
    type: ReactionStatsDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getReactionStats(
    @Param('postId') postId: string,
    @Request() req: any,
  ): Promise<ReactionStatsDto> {
    const userId = req.user.id;
    return this.reactionsService.getReactionStats(postId, userId);
  }

  @Get('user')
  @ApiOperation({ summary: 'Get user reactions with pagination' })
  @ApiQuery({ name: 'limit', description: 'Number of reactions to return', required: false })
  @ApiQuery({ name: 'offset', description: 'Number of reactions to skip', required: false })
  @ApiResponse({
    status: 200,
    description: 'User reactions retrieved successfully',
    type: [ReactionResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserReactions(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<ReactionResponseDto[]> {
    const userId = req.user.id;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    return this.reactionsService.getUserReactions(userId, limitNum, offsetNum);
  }
}
