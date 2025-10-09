import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth';
import { NinVerificationService } from '../services/nin-verification.service';
import {
  InitiateNinVerificationDto,
  NinVerificationStatusDto,
  NinVerificationResponseDto,
} from '../dto/nin-verification.dto';

@ApiTags('NIN Verification')
@Controller('verification/nin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NinVerificationController {
  private readonly logger = new Logger(NinVerificationController.name);

  constructor(private readonly ninVerificationService: NinVerificationService) {}

  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initiate NIN verification',
    description: 'Start the NIN verification process for the authenticated user',
  })
  @ApiBody({ type: InitiateNinVerificationDto })
  @ApiResponse({
    status: 200,
    description: 'NIN verification initiated successfully',
    type: NinVerificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data or validation failed',
  })
  @ApiResponse({
    status: 409,
    description: 'User already has a verified NIN or verification in progress',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async initiateVerification(
    @Request() req: any,
    @Body() initiateNinVerificationDto: InitiateNinVerificationDto,
  ): Promise<NinVerificationResponseDto> {
    const userId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    this.logger.log(`Initiating NIN verification for user ${userId}`);

    return this.ninVerificationService.initiateVerification(
      userId,
      initiateNinVerificationDto,
      ipAddress,
      userAgent,
    );
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get NIN verification status',
    description: 'Get the current NIN verification status for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'NIN verification status retrieved successfully',
    type: NinVerificationStatusDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getVerificationStatus(@Request() req: any): Promise<NinVerificationStatusDto> {
    const userId = req.user.id;

    this.logger.log(`Getting NIN verification status for user ${userId}`);

    return this.ninVerificationService.getVerificationStatus(userId);
  }

  @Get('details')
  @ApiOperation({
    summary: 'Get NIN verification details',
    description: 'Get detailed NIN verification information for the authenticated user (admin use)',
  })
  @ApiResponse({
    status: 200,
    description: 'NIN verification details retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'No verification record found for user',
  })
  async getVerificationDetails(@Request() req: any) {
    const userId = req.user.id;

    this.logger.log(`Getting NIN verification details for user ${userId}`);

    const details = await this.ninVerificationService.getVerificationDetails(userId);
    
    if (!details) {
      return {
        success: false,
        message: 'No verification record found for user',
      };
    }

    // Return sanitized data (exclude sensitive information)
    return {
      success: true,
      data: {
        id: details.id,
        verificationStatus: details.verificationStatus,
        verificationMethod: details.verificationMethod,
        verifiedAt: details.verifiedAt,
        verifiedBy: details.verifiedBy,
        apiProvider: details.apiProvider,
        apiReference: details.apiReference,
        failureReason: details.failureReason,
        createdAt: details.createdAt,
        updatedAt: details.updatedAt,
        // Don't return sensitive data like NIN number, personal details, etc.
      },
    };
  }
}
