import {
  Controller,
  Get,
  UseGuards,
  Request,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth';
import { TrustScoreService } from '../services/trust-score.service';
import { TrustScoreResponseDto, TrustScoreConfigDto } from '../dto/trust-score.dto';

@ApiTags('Trust Score')
@Controller('verification/trust-score')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TrustScoreController {
  private readonly logger = new Logger(TrustScoreController.name);

  constructor(private readonly trustScoreService: TrustScoreService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user trust score',
    description: 'Calculate and return the comprehensive trust score for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Trust score calculated successfully',
    type: TrustScoreResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getTrustScore(@Request() req: any): Promise<TrustScoreResponseDto> {
    const userId = req.user.id;

    this.logger.log(`Calculating trust score for user ${userId}`);

    try {
      const breakdown = await this.trustScoreService.calculateTrustScore(userId);

      return {
        success: true,
        data: breakdown,
        message: 'Trust score calculated successfully',
      };
    } catch (error) {
      this.logger.error(`Error calculating trust score for user ${userId}:`, error);
      throw error;
    }
  }

  @Get('config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get trust score configuration',
    description: 'Get the current trust score calculation configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'Trust score configuration retrieved successfully',
    type: TrustScoreConfigDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getTrustScoreConfig(): Promise<{
    success: boolean;
    data: TrustScoreConfigDto;
    message: string;
  }> {
    this.logger.log('Retrieving trust score configuration');

    const config = this.trustScoreService.getTrustScoreConfig();

    return {
      success: true,
      data: config,
      message: 'Trust score configuration retrieved successfully',
    };
  }
}
