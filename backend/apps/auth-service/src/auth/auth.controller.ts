import {
  Controller,
  Post,
  Put,
  Body,
  UseGuards,
  Request,
  Get,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import {
  LocalAuthGuard,
  JwtAuthGuard,
  RolesGuard,
  Public,
  CurrentUser,
  Roles,
} from '@app/auth';
import { AuthService } from '../services/auth.service';
import { EmailOtpService } from '../services/email-otp.service';
import { PhoneOtpService } from '../services/phone-otp.service';
import {
  RegisterDto,
  LoginDto,
  VerifyOtpDto,
  RefreshTokenDto,
  ResetPasswordDto,
  ConfirmPasswordResetDto,
  InitiateOtpLoginDto,
  VerifyOtpLoginDto,
  InitiatePhoneVerificationDto,
  VerifyPhoneOtpDto,
  ResendPhoneOtpDto,
  AlternativeVerificationDto,
  SocialAuthWithPhoneDto,
  LinkSocialAccountDto,
  UnlinkSocialAccountDto,
  LandmarkSearchDto,
  EstateSearchDto,
  EnhancedRegisterDto,
  UpdateOnboardingStepDto,
} from '../dto/auth.dto';
import { MobileRegisterDto } from '../dto/mobile-register.dto';
import { User } from '@app/database';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard) // Rate limiting
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailOtpService: EmailOtpService,
    private readonly phoneOtpService: PhoneOtpService,
  ) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully. OTP sent for verification.',
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists with this email or phone number',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.registerUser(registerDto);
  }

  @Post('register-mobile')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user (Mobile App)' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully. OTP sent for verification.',
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists with this email or phone number',
  })
  async registerMobile(@Body() registerDto: MobileRegisterDto) {
    // Convert mobile DTO to internal format
    const internalDto = {
      email: registerDto.email,
      phoneNumber: registerDto.phone_number,
      firstName: registerDto.first_name,
      lastName: registerDto.last_name,
      password: 'temp_password_' + Date.now(), // Temporary password for OTP-based registration
      state: registerDto.state_of_origin,
      city: undefined,
      estate: undefined,
      preferredLanguage: registerDto.preferred_language || 'en',
    };

    return this.authService.registerUserMobile(internalDto);
  }

  @Post('verify-otp')
  @Public()
  @Throttle({ 'otp-verify': { limit: 10, ttl: 300000 } }) // 10 attempts per 5 minutes
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired OTP',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many verification attempts. Please try again later.',
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.authenticateWithOTP(
      verifyOtpDto.email,
      verifyOtpDto.otpCode,
      verifyOtpDto.purpose,
    );
  }

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            phoneNumber: { type: 'string' },
            isVerified: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or account not verified',
  })
  async login(@Body() loginDto: LoginDto, @Request() req: any) {
    const headers = (
      req as { headers: Record<string, string | string[] | undefined> }
    ).headers;
    const deviceInfo = {
      deviceId: headers?.['x-device-id'] as string,
      deviceType: headers?.['x-device-type'] as string,
      ipAddress: (req as { ip: string }).ip,
      userAgent: headers?.['user-agent'] as string,
    };

    return this.authService.loginUser(loginDto, deviceInfo);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'User logged out successfully',
  })
  async logout(
    @CurrentUser() user: User,
  ) {
    return this.authService.logoutUser(user.id);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  async getProfile(@CurrentUser() user: User) {
    return this.authService.getUserProfile(user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Current user retrieved successfully',
  })
  async getCurrentUser(@CurrentUser() user: User, @Request() req: any) {
    // Add cache control headers to prevent 304 responses
    (
      req as { res: { setHeader: (key: string, value: string) => void } }
    ).res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    (
      req as { res: { setHeader: (key: string, value: string) => void } }
    ).res.setHeader('Pragma', 'no-cache');
    (
      req as { res: { setHeader: (key: string, value: string) => void } }
    ).res.setHeader('Expires', '0');

    return this.authService.getUserProfile(user.id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  async updateProfile(
    @CurrentUser() user: User,
    @Body()
    updateData: {
      phone_number?: string;
      verification_level?: number;
      state?: string;
      city?: string;
      estate?: string;
      location?: string;
      landmark?: string;
      address?: string;
      phoneVerified?: boolean;
      addressVerified?: boolean;
      isVerified?: boolean;
    },
  ) {
    return this.authService.updateUserProfile(user.id, updateData);
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check for auth service' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  getHealth() {
    return {
      status: 'healthy',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate password reset' })
  @ApiResponse({
    status: 200,
    description: 'Password reset code sent to email (if email exists)',
  })
  async initiatePasswordReset(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.initiatePasswordReset(resetPasswordDto);
  }

  @Post('confirm-reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm password reset with OTP' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset code',
  })
  async confirmPasswordReset(@Body() confirmResetDto: ConfirmPasswordResetDto) {
    return this.authService.confirmPasswordReset(confirmResetDto);
  }

  @Post('login/otp/initiate')
  @Public()
  @Throttle({ 'otp-send': { limit: 3, ttl: 60000 } }) // 3 sends per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate OTP login via email' })
  @ApiResponse({
    status: 200,
    description: 'OTP login code sent to email (if email exists)',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many OTP requests. Please try again later.',
  })
  async initiateOtpLogin(@Body() initiateOtpDto: InitiateOtpLoginDto) {
    return this.authService.initiateOtpLogin(initiateOtpDto);
  }

  @Post('login/otp/verify')
  @Public()
  @Throttle({ 'otp-verify': { limit: 10, ttl: 300000 } }) // 10 attempts per 5 minutes
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP login code' })
  @ApiResponse({
    status: 200,
    description: 'Login successful with JWT tokens',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            phoneNumber: { type: 'string' },
            isVerified: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired OTP code',
  })
  async verifyOtpLogin(@Body() verifyOtpDto: VerifyOtpLoginDto) {
    return this.authService.verifyOtpLogin(verifyOtpDto);
  }

  @Post('complete-email-login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete email login with OTP' })
  @ApiResponse({
    status: 200,
    description: 'Login completed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid OTP or user not found',
  })
  async completeEmailLogin(@Body() body: { email: string; otpCode: string }) {
    return this.authService.authenticateWithOTP(
      body.email,
      body.otpCode,
      'login',
    );
  }

  @Post('complete-email-verification')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Complete email verification and registration in one atomic operation',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified and user registered successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid OTP or verification failed',
  })
  async completeEmailVerification(
    @Body()
    body: {
      email: string;
      otpCode: string;
      first_name: string;
      last_name: string;
      phone_number?: string;
      state_of_origin?: string;
      preferred_language?: string;
    },
  ) {
    return this.authService.authenticateWithOTP(
      body.email,
      body.otpCode,
      'registration',
      {
        first_name: body.first_name,
        last_name: body.last_name,
        phone_number: body.phone_number,
        state_of_origin: body.state_of_origin,
        preferred_language: body.preferred_language,
      },
    );
  }

  @Get('me/roles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user roles and permissions' })
  @ApiResponse({
    status: 200,
    description: 'User roles and permissions retrieved successfully',
  })
  getUserRoles(@CurrentUser() user: User) {
    return {
      roles: user.getRoleNames(),
      permissions: user.getAllPermissions(),
    };
  }

  @Get('admin/test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test admin-only endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Admin access confirmed',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  adminTest(@CurrentUser() user: User) {
    return {
      message: 'Admin access granted',
      user: user.email,
      roles: user.getRoleNames(),
    };
  }

  @Post('test/email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test email service functionality' })
  @ApiResponse({
    status: 200,
    description: 'Test email sent successfully',
  })
  async testEmail(@CurrentUser() user: User) {
    return this.authService.testEmailService(user.email);
  }

  // Nigerian Phone Verification Endpoints
  @Post('phone/verify/initiate')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate Nigerian phone number verification' })
  @ApiResponse({
    status: 200,
    description: 'OTP sent to phone number. Carrier auto-detected.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid Nigerian phone number or rate limit exceeded',
  })
  initiatePhoneVerification() {
    throw new Error('Method not implemented yet');
  }

  @Post('phone/verify/confirm')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Nigerian phone OTP code' })
  @ApiResponse({
    status: 200,
    description: 'Phone number verified successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired OTP code',
  })
  verifyPhoneOtp() {
    throw new Error('Method not implemented yet');
  }

  @Post('phone/verify/resend')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend phone verification OTP' })
  @ApiResponse({
    status: 200,
    description: 'New OTP sent successfully',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many resend attempts. Please wait.',
  })
  resendPhoneOtp() {
    throw new Error('Method not implemented yet');
  }

  @Post('phone/verify/alternative')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Use alternative phone verification (Call/USSD)' })
  @ApiResponse({
    status: 200,
    description: 'Alternative verification initiated',
  })
  alternativeVerification() {
    throw new Error('Method not implemented yet');
  }

  // Social Authentication Endpoints
  @Post('social/login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or register with social provider' })
  @ApiResponse({
    status: 200,
    description: 'Social authentication successful',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            socialProvider: { type: 'string' },
            isNewUser: { type: 'boolean' },
            onboardingStep: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid social token or provider error',
  })
  socialAuth() {
    throw new Error('Method not implemented yet');
  }

  @Post('social/link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Link social account to existing user' })
  @ApiResponse({
    status: 200,
    description: 'Social account linked successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Social account already linked to another user',
  })
  linkSocialAccount() {
    throw new Error('Method not implemented yet');
  }

  @Post('social/unlink')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlink social account from user' })
  @ApiResponse({
    status: 200,
    description: 'Social account unlinked successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot unlink last authentication method',
  })
  unlinkSocialAccount() {
    throw new Error('Method not implemented yet');
  }

  // Enhanced Registration with Onboarding
  @Post('register/enhanced')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Enhanced registration with Nigerian context and onboarding tracking',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully. Returns next onboarding step.',
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists with this email or phone number',
  })
  enhancedRegister() {
    throw new Error('Method not implemented yet');
  }

  @Post('onboarding/step')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user onboarding step' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding step updated successfully',
  })
  updateOnboardingStep() {
    throw new Error('Method not implemented yet');
  }

  @Get('onboarding/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user onboarding status' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding status retrieved successfully',
  })
  getOnboardingStatus() {
    throw new Error('Method not implemented yet');
  }

  // Location and Nigerian Context Endpoints
  @Post('location/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set user location (Nigerian context)' })
  @ApiResponse({
    status: 200,
    description: 'Location set successfully',
  })
  async setupLocation(
    @CurrentUser() user: User,
    @Body()
    locationData: {
      state?: string;
      city?: string;
      estate?: string;
      location?: string;
      landmark?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      completeRegistration?: boolean;
    },
  ) {
    // Format location string if coordinates provided
    let locationString = locationData.location;
    if (locationData.latitude && locationData.longitude) {
      locationString = `POINT(${locationData.longitude} ${locationData.latitude})`;
    }

    // If completing registration, use the complete registration method
    if (locationData.completeRegistration) {
      return this.authService.completeRegistrationWithLocation(user.id, {
        state: locationData.state,
        city: locationData.city,
        estate: locationData.estate,
        location: locationString,
        landmark: locationData.landmark,
        address: locationData.address,
      });
    }

    // Otherwise, just update the profile
    const updateData = {
      state: locationData.state,
      city: locationData.city,
      estate: locationData.estate,
      location: locationString,
      landmark: locationData.landmark,
      address: locationData.address,
      addressVerified: true, // Mark address as verified when location is set up
      isVerified: true, // Mark user as fully verified after location setup
    };

    return this.authService.updateUserProfile(user.id, updateData);
  }

  @Get('location/landmarks')
  @Public()
  @ApiOperation({ summary: 'Search Nigerian landmarks by state and city' })
  @ApiResponse({
    status: 200,
    description: 'Landmarks retrieved successfully',
  })
  searchLandmarks() {
    throw new Error('Method not implemented yet');
  }

  @Get('location/estates')
  @Public()
  @ApiOperation({ summary: 'Search Nigerian estates by state and city' })
  @ApiResponse({
    status: 200,
    description: 'Estates retrieved successfully',
  })
  searchEstates() {
    throw new Error('Method not implemented yet');
  }

  @Get('location/states')
  @Public()
  @ApiOperation({ summary: 'Get all Nigerian states and major cities' })
  @ApiResponse({
    status: 200,
    description: 'Nigerian states and cities retrieved successfully',
  })
  getNigerianStates() {
    throw new Error('Method not implemented yet');
  }

  // Email OTP Endpoints (moved from AuthServiceController)
  @Post('email/send-otp')
  @Public()
  @Throttle({ 'otp-send': { limit: 3, ttl: 60000 } }) // 3 sends per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send email verification OTP' })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many OTP requests. Please try again later.',
  })
  async sendEmailOTP(
    @Body()
    body: {
      email: string;
      purpose?: 'registration' | 'login' | 'password_reset';
    },
  ) {
    const result = await this.emailOtpService.sendEmailOTP(
      body.email,
      body.purpose || 'registration',
    );

    return {
      success: result.success,
      message: result.message,
      error: result.error,
      expiresAt: result.expiresAt,
      method: 'email',
      ...(result.otpCode && { otpCode: result.otpCode }),
    };
  }

  @Post('email/verify-otp')
  @Public()
  @Throttle({ 'otp-verify': { limit: 10, ttl: 300000 } }) // 10 attempts per 5 minutes
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email OTP code' })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired OTP',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many verification attempts. Please try again later.',
  })
  async verifyEmailOTP(
    @Body()
    body: {
      email: string;
      otpCode: string;
      purpose?: 'registration' | 'login' | 'password_reset';
      firstName?: string;
      lastName?: string;
      preferredLanguage?: string;
    },
  ) {
    const userDetails =
      body.purpose === 'registration' && (body.firstName || body.lastName)
        ? {
            firstName: body.firstName,
            lastName: body.lastName,
            preferredLanguage: body.preferredLanguage,
          }
        : undefined;

    const result = await this.emailOtpService.verifyEmailOTP(
      body.email,
      body.otpCode,
      body.purpose || 'registration',
      true, // markAsUsed
      userDetails,
    );

    return {
      success: result.success,
      verified: result.verified,
      error: result.error,
      method: 'email',
    };
  }

  // Phone OTP Endpoints (moved from AuthServiceController)
  @Post('phone/send-otp')
  @Public()
  @Throttle({ 'otp-send': { limit: 3, ttl: 60000 } }) // 3 sends per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send phone verification OTP' })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many OTP requests. Please try again later.',
  })
  async sendPhoneOTP(
    @Body()
    body: {
      phone: string;
      purpose?: 'registration' | 'login' | 'password_reset';
      method?: 'sms' | 'whatsapp';
      email?: string;
    },
  ) {
    const result = await this.phoneOtpService.sendPhoneOTP(
      body.phone,
      body.purpose || 'registration',
      body.method || 'sms',
      body.email,
    );

    return {
      success: result.success,
      message: result.message,
      error: result.error,
      expiresAt: result.expiresAt,
      method: 'phone',
      carrier: result.carrier,
      carrier_color: result.carrierColor,
      ...(result.otpCode && { otpCode: result.otpCode }),
    };
  }

  @Post('phone/verify-otp')
  @Public()
  @Throttle({ 'otp-verify': { limit: 10, ttl: 300000 } }) // 10 attempts per 5 minutes
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify phone OTP code' })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired OTP',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many verification attempts. Please try again later.',
  })
  async verifyPhoneOTP(
    @Body()
    body: {
      phoneNumber: string;
      otpCode: string;
      purpose?: 'registration' | 'login' | 'password_reset';
      deviceInfo?: {
        deviceId?: string;
        deviceType?: string;
        ipAddress?: string;
        userAgent?: string;
      };
    },
  ) {
    // Validate that this is a phone number (Nigerian format check)
    if (!body.phoneNumber || !body.phoneNumber.includes('+234')) {
      return {
        success: false,
        verified: false,
        error: 'Invalid phone number format. Expected Nigerian phone number.',
        method: 'phone',
      };
    }

    // Add debug logging
    console.log('🔍 Phone OTP Verification Request:', {
      phoneNumber: body.phoneNumber,
      otpCode: body.otpCode,
      purpose: body.purpose || 'registration',
      timestamp: new Date().toISOString(),
      endpoint: '/auth/phone/verify-otp',
    });

    const result = await this.phoneOtpService.verifyPhoneOTP(
      body.phoneNumber,
      body.otpCode,
      body.purpose || 'registration',
    );

    if (result.success && result.verified) {
      // For successful verification, find the user and generate tokens
      const user = await this.authService.findUserByPhoneNumber(
        body.phoneNumber,
      );

      if (user) {
        // Generate JWT tokens for authenticated access
        const tokenPair = await this.authService.generateTokensForUser(
          user,
          body.deviceInfo,
        );

        const response = {
          success: true,
          verified: true,
          method: 'phone',
          carrier: result.carrier,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            phoneVerified: user.phoneVerified,
            isVerified: user.isVerified,
            verificationLevel: user.getVerificationLevel(),
          },
          tokens: tokenPair,
        };

        console.log(
          '📤 Phone OTP Verification Response with tokens:',
          response,
        );
        return response;
      }
    }

    const response = {
      success: result.success,
      verified: result.verified,
      error: result.error,
      method: 'phone',
      carrier: result.carrier,
    };

    // Add debug logging for response
    console.log('📤 Phone OTP Verification Response:', response);

    return response;
  }
}
