import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Req, 
  HttpCode, 
  HttpStatus,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { EmailOtpService } from './services/email-otp.service';
import { PhoneOtpService } from './services/phone-otp.service';
import { TokenService } from './services/token.service';

// DTOs
import { SendEmailOtpDto, VerifyEmailOtpDto } from './dto/send-email-otp.dto';
import { SendPhoneOtpDto, VerifyPhoneOtpDto } from './dto/send-phone-otp.dto';
import { RegisterUserDto, LoginUserDto } from './dto/register-user.dto';
import { AuthResponseDto, OtpResponseDto, RefreshTokenDto } from './dto/auth-response.dto';

@ApiTags('Authentication')
@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class AuthServiceController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailOtpService: EmailOtpService,
    private readonly phoneOtpService: PhoneOtpService,
    private readonly tokenService: TokenService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for auth service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      status: 'healthy',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
    };
  }

  // Email OTP Endpoints
  @Post('email/send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send email verification OTP' })
  @ApiBody({ type: SendEmailOtpDto })
  @ApiResponse({ status: 200, type: OtpResponseDto, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async sendEmailOTP(@Body() sendEmailOtpDto: SendEmailOtpDto): Promise<OtpResponseDto> {
    const result = await this.emailOtpService.sendEmailOTP(
      sendEmailOtpDto.email,
      sendEmailOtpDto.purpose
    );

    return {
      success: result.success,
      message: result.message,
      error: result.error,
      expiresAt: result.expiresAt,
      method: 'email',
      ...(result.otpCode && { otpCode: result.otpCode })
    };
  }

  @Post('email/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email OTP code' })
  @ApiBody({ type: VerifyEmailOtpDto })
  @ApiResponse({ status: 200, type: OtpResponseDto, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyEmailOTP(@Body() verifyEmailOtpDto: VerifyEmailOtpDto): Promise<OtpResponseDto> {
    const result = await this.emailOtpService.verifyEmailOTP(
      verifyEmailOtpDto.email,
      verifyEmailOtpDto.otpCode,
      verifyEmailOtpDto.purpose
    );

    return {
      success: result.success,
      verified: result.verified,
      error: result.error,
      method: 'email'
    };
  }

  // Phone OTP Endpoints
  @Post('phone/send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send phone verification OTP via SMS or WhatsApp' })
  @ApiBody({ type: SendPhoneOtpDto })
  @ApiResponse({ status: 200, type: OtpResponseDto, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async sendPhoneOTP(@Body() sendPhoneOtpDto: SendPhoneOtpDto): Promise<OtpResponseDto> {
    const result = await this.phoneOtpService.sendPhoneOTP(
      sendPhoneOtpDto.phoneNumber,
      sendPhoneOtpDto.purpose,
      sendPhoneOtpDto.method
    );

    return {
      success: result.success,
      message: result.message,
      error: result.error,
      carrier: result.carrier,
      carrierColor: result.carrierColor,
      expiresAt: result.expiresAt,
      method: result.deliveryMethod as 'email' | 'sms' | 'whatsapp',
      ...(result.otpCode && { otpCode: result.otpCode })
    };
  }

  @Post('phone/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify phone OTP code' })
  @ApiBody({ type: VerifyPhoneOtpDto })
  @ApiResponse({ status: 200, type: OtpResponseDto, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyPhoneOTP(@Body() verifyPhoneOtpDto: VerifyPhoneOtpDto): Promise<OtpResponseDto> {
    const result = await this.phoneOtpService.verifyPhoneOTP(
      verifyPhoneOtpDto.phoneNumber,
      verifyPhoneOtpDto.otpCode,
      verifyPhoneOtpDto.purpose
    );

    return {
      success: result.success,
      verified: result.verified,
      error: result.error,
      carrier: result.carrier,
      method: 'sms' // or whatsapp based on verification method
    };
  }

  // Authentication Endpoints
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({ status: 201, type: AuthResponseDto, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async registerUser(@Body() registerUserDto: RegisterUserDto): Promise<AuthResponseDto> {
    return await this.authService.registerUser(registerUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user with email/phone and password' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({ status: 200, type: AuthResponseDto, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async loginUser(
    @Body() loginUserDto: LoginUserDto,
    @Req() req: Request
  ): Promise<AuthResponseDto> {
    const deviceInfo = this.extractDeviceInfo(req);
    return await this.authService.loginUser(loginUserDto, deviceInfo);
  }

  @Post('auth-with-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete authentication using verified email OTP' })
  @ApiResponse({ status: 200, type: AuthResponseDto, description: 'Authentication successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async authenticateWithOTP(
    @Body() body: {
      email: string;
      otp_code: string;
      purpose: 'registration' | 'login';
      user_metadata?: {
        first_name?: string;
        last_name?: string;
        phone_number?: string;
        state_of_origin?: string;
        preferred_language?: string;
      };
    },
    @Req() req: Request
  ): Promise<AuthResponseDto> {
    const deviceInfo = this.extractDeviceInfo(req);
    return await this.authService.authenticateWithOTP(
      body.email,
      body.otp_code,
      body.purpose,
      body.user_metadata,
      deviceInfo
    );
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, type: AuthResponseDto, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return await this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from current session' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @Body() body: { sessionId: string }
  ): Promise<{ success: boolean; message?: string }> {
    return await this.authService.logoutUser(body.sessionId);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from all devices/sessions' })
  @ApiResponse({ status: 200, description: 'Logout from all devices successful' })
  async logoutAll(
    @Body() body: { userId: string; exceptSessionId?: string }
  ): Promise<{ success: boolean; message?: string; loggedOutSessions?: number }> {
    return await this.authService.logoutAllDevices(body.userId, body.exceptSessionId);
  }

  @Post('complete-registration')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete user registration with additional details' })
  @ApiResponse({ status: 200, type: AuthResponseDto, description: 'Registration completed' })
  async completeRegistration(
    @Body() body: {
      userId: string;
      phone_number?: string;
      first_name?: string;
      last_name?: string;
      state?: string;
      city?: string;
      estate?: string;
    }
  ): Promise<AuthResponseDto> {
    return await this.authService.completeRegistrationAfterVerification(body.userId, body);
  }

  // Helper method to extract device information from request
  private extractDeviceInfo(req: Request) {
    return {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      deviceType: this.detectDeviceType(req.headers['user-agent']),
    };
  }

  private detectDeviceType(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    }
    return 'desktop';
  }
}
