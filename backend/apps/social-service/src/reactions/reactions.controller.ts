import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SocialAuthGuard } from '../guards/social-auth.guard';
import { ReactionsService } from './reactions.service';
import { CreateReactionDto, ReactionResponseDto } from './dto';

@ApiTags('reactions')
@Controller('reactions')
@UseGuards(SocialAuthGuard)
@ApiBearerAuth()
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post('posts/:postId')
  @ApiOperation({ summary: 'Add or update reaction to a post' })
  @ApiResponse({
    status: 201,
    description: 'Reaction added successfully',
    type: ReactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async addReaction(
    @Param('postId') postId: string,
    @Body() createReactionDto: CreateReactionDto,
    @Request() req: any,
  ): Promise<ReactionResponseDto> {
    return this.reactionsService.addReaction(
      postId,
      req.user.id,
      createReactionDto,
    );
  }

  @Delete('posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove reaction from a post' })
  @ApiResponse({ status: 204, description: 'Reaction removed successfully' })
  @ApiResponse({ status: 404, description: 'Reaction not found' })
  async removeReaction(
    @Param('postId') postId: string,
    @Request() req: any,
  ): Promise<void> {
    return this.reactionsService.removeReaction(postId, req.user.id);
  }

  @Get('posts/:postId')
  @ApiOperation({ summary: 'Get all reactions for a post' })
  @ApiResponse({
    status: 200,
    description: 'Reactions retrieved successfully',
    type: [ReactionResponseDto],
  })
  async getPostReactions(
    @Param('postId') postId: string,
  ): Promise<ReactionResponseDto[]> {
    return this.reactionsService.getPostReactions(postId);
  }

  @Get('posts/:postId/counts')
  @ApiOperation({ summary: 'Get reaction counts for a post' })
  @ApiResponse({
    status: 200,
    description: 'Reaction counts retrieved successfully',
    schema: {
      type: 'object',
      additionalProperties: { type: 'number' },
      example: {
        like: 5,
        love: 3,
        laugh: 1,
      },
    },
  })
  async getPostReactionCounts(
    @Param('postId') postId: string,
  ): Promise<Record<string, number>> {
    return this.reactionsService.getPostReactionCounts(postId);
  }

  @Get('posts/:postId/stats')
  @ApiOperation({ summary: 'Get detailed reaction statistics for a post' })
  @ApiResponse({
    status: 200,
    description: 'Reaction statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalReactions: { type: 'number' },
        reactionCounts: {
          type: 'object',
          additionalProperties: { type: 'number' },
        },
        topReaction: { type: 'string' },
      },
    },
  })
  async getReactionStats(@Param('postId') postId: string): Promise<{
    totalReactions: number;
    reactionCounts: Record<string, number>;
    topReaction: string;
  }> {
    return this.reactionsService.getReactionStats(postId);
  }

  @Get('users/me')
  @ApiOperation({ summary: 'Get current user reactions' })
  @ApiResponse({
    status: 200,
    description: 'User reactions retrieved successfully',
    type: [ReactionResponseDto],
  })
  async getUserReactions(@Request() req: any): Promise<ReactionResponseDto[]> {
    return this.reactionsService.getUserReactions(req.user.id);
  }
}
