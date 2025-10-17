import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';
import { LocationVerificationService } from '../verification/location-verification.service';
import { 
  PhotoVerificationDto,
  DocumentVerificationDto,
  SmsVerificationDto,
  AdminVerificationDto,
  VerificationRequestDto,
  VerificationStatsDto,
  VerificationRequirementsDto,
  SendSmsCodeDto,
  SmsCodeResponseDto
} from '../dto/verification.dto';

@ApiTags('Location Verification')
@Controller('verification')
export class VerificationController {
  constructor(
    private readonly verificationService: LocationVerificationService,
  ) {}

  @Post('photo/:locationId')
  @ApiOperation({ summary: 'Submit photo verification' })
  @ApiResponse({ status: 201, description: 'Photo verification submitted successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async submitPhotoVerification(
    @Param('locationId') locationId: string,
    @Body() photoVerificationDto: PhotoVerificationDto,
    @Request() req: any,
  ): Promise<VerificationRequestDto> {
    return this.verificationService.submitPhotoVerification(
      req.user.id,
      locationId,
      photoVerificationDto,
    );
  }

  @Post('document/:locationId')
  @ApiOperation({ summary: 'Submit document verification' })
  @ApiResponse({ status: 201, description: 'Document verification submitted successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async submitDocumentVerification(
    @Param('locationId') locationId: string,
    @Body() documentVerificationDto: DocumentVerificationDto,
    @Request() req: any,
  ): Promise<VerificationRequestDto> {
    return this.verificationService.submitDocumentVerification(
      req.user.id,
      locationId,
      documentVerificationDto,
    );
  }

  @Post('sms/:locationId')
  @ApiOperation({ summary: 'Submit SMS verification' })
  @ApiResponse({ status: 201, description: 'SMS verification submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification code or location' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async submitSmsVerification(
    @Param('locationId') locationId: string,
    @Body() smsVerificationDto: SmsVerificationDto,
    @Request() req: any,
  ): Promise<VerificationRequestDto> {
    return this.verificationService.submitSmsVerification(
      req.user.id,
      locationId,
      smsVerificationDto,
    );
  }

  @Post('admin/:locationId')
  @ApiOperation({ summary: 'Submit admin verification request' })
  @ApiResponse({ status: 201, description: 'Admin verification request submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification request' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async submitAdminVerification(
    @Param('locationId') locationId: string,
    @Body() adminVerificationDto: AdminVerificationDto,
    @Request() req: any,
  ): Promise<VerificationRequestDto> {
    return this.verificationService.submitAdminVerification(
      req.user.id,
      locationId,
      adminVerificationDto,
    );
  }

  @Post('sms/send-code')
  @ApiOperation({ summary: 'Send SMS verification code' })
  @ApiResponse({ status: 200, description: 'SMS verification code sent successfully' })
  async sendSmsCode(
    @Body() sendSmsCodeDto: SendSmsCodeDto,
  ): Promise<SmsCodeResponseDto> {
    return this.verificationService.sendSmsVerificationCode(
      sendSmsCodeDto.phoneNumber,
    );
  }

  @Get('requirements/:locationId')
  @ApiOperation({ summary: 'Get verification requirements for a location' })
  @ApiResponse({ status: 200, description: 'Verification requirements retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async getVerificationRequirements(
    @Param('locationId') locationId: string,
  ): Promise<VerificationRequirementsDto> {
    return this.verificationService.getVerificationRequirements(locationId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get user verification history' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of results to skip' })
  @ApiResponse({ status: 200, description: 'Verification history retrieved successfully' })
  async getUserVerificationHistory(
    @Request() req: any,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ): Promise<VerificationRequestDto[]> {
    return this.verificationService.getUserVerificationHistory(
      req.user.id,
      limit,
      offset,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get verification statistics' })
  @ApiResponse({ status: 200, description: 'Verification statistics retrieved successfully' })
  async getVerificationStats(): Promise<VerificationStatsDto> {
    return this.verificationService.getVerificationStats();
  }

  // Admin endpoints
  @Get('admin/pending')
  @ApiOperation({ summary: 'Get pending verification requests (Admin only)' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by verification type' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of results to skip' })
  @ApiResponse({ status: 200, description: 'Pending verification requests retrieved successfully' })
  async getPendingVerifications(
    @Request() req: any,
    @Query('type') type?: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ): Promise<VerificationRequestDto[]> {
    return this.verificationService.getPendingVerifications(
      req.user.id,
      type,
      limit,
      offset,
    );
  }

  @Post('admin/approve/:verificationId')
  @ApiOperation({ summary: 'Approve verification request (Admin only)' })
  @ApiResponse({ status: 200, description: 'Verification request approved successfully' })
  @ApiResponse({ status: 404, description: 'Verification request not found' })
  async approveVerification(
    @Param('verificationId') verificationId: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ): Promise<void> {
    return this.verificationService.approveVerification(
      verificationId,
      body.reason,
      req.user.id,
    );
  }

  @Post('admin/reject/:verificationId')
  @ApiOperation({ summary: 'Reject verification request (Admin only)' })
  @ApiResponse({ status: 200, description: 'Verification request rejected successfully' })
  @ApiResponse({ status: 404, description: 'Verification request not found' })
  async rejectVerification(
    @Param('verificationId') verificationId: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ): Promise<void> {
    return this.verificationService.rejectVerification(
      verificationId,
      body.reason,
      req.user.id,
    );
  }
}
