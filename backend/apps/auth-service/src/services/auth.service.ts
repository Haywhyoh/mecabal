import { Injectable, Logger, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@app/database/entities/user.entity';
import { RegisterUserDto, LoginUserDto } from '../dto/register-user.dto';
import { EmailOtpService } from './email-otp.service';
import { PhoneOtpService } from './phone-otp.service';
import { TokenService } from './token.service';
import { AuthResponseDto } from '../dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailOtpService: EmailOtpService,
    private phoneOtpService: PhoneOtpService,
    private tokenService: TokenService,
  ) {}

  async registerUser(registerDto: RegisterUserDto): Promise<AuthResponseDto> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: [
          { email: registerDto.email },
          ...(registerDto.phoneNumber ? [{ phoneNumber: registerDto.phoneNumber }] : [])
        ]
      });

      if (existingUser) {
        if (existingUser.email === registerDto.email) {
          return {
            success: false,
            error: 'A user with this email address already exists'
          };
        }
        if (existingUser.phoneNumber === registerDto.phoneNumber) {
          return {
            success: false,
            error: 'A user with this phone number already exists'
          };
        }
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

      // Create user
      const user = this.userRepository.create({
        email: registerDto.email,
        phoneNumber: registerDto.phoneNumber,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        passwordHash,
        state: registerDto.state,
        city: registerDto.city,
        estate: registerDto.estate,
        preferredLanguage: registerDto.preferredLanguage || 'en',
        isVerified: false,
        phoneVerified: false,
        identityVerified: false,
        addressVerified: false,
      });

      const savedUser = await this.userRepository.save(user);
      this.logger.log(`User registered successfully: ${savedUser.id}`);

      return {
        success: true,
        message: 'User registered successfully. Please verify your email and/or phone number.',
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          phoneNumber: savedUser.phoneNumber,
          phoneVerified: savedUser.phoneVerified,
          isVerified: savedUser.isVerified,
          verificationLevel: savedUser.getVerificationLevel(),
        }
      };

    } catch (error) {
      this.logger.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      };
    }
  }

  async loginUser(
    loginDto: LoginUserDto,
    deviceInfo?: {
      deviceId?: string;
      deviceType?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<AuthResponseDto> {
    try {
      // Find user by email or phone
      const user = await this.userRepository.findOne({
        where: [
          { email: loginDto.identifier },
          { phoneNumber: loginDto.identifier }
        ]
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Verify password
      const passwordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
      if (!passwordValid) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Check if account is active
      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is deactivated. Please contact support.'
        };
      }

      // Update last login
      user.lastLoginAt = new Date();
      await this.userRepository.save(user);

      // Generate tokens
      const tokenPair = await this.tokenService.generateTokenPair(user, deviceInfo);

      this.logger.log(`User logged in successfully: ${user.id}`);

      return this.tokenService.generateUserResponse(user, tokenPair);

    } catch (error) {
      this.logger.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  async authenticateWithOTP(
    email: string,
    otpCode: string,
    purpose: 'registration' | 'login',
    userMetadata?: {
      first_name?: string;
      last_name?: string;
      phone_number?: string;
      state_of_origin?: string;
      preferred_language?: string;
    },
    deviceInfo?: {
      deviceId?: string;
      deviceType?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<AuthResponseDto> {
    try {
      // Verify email OTP first
      const verifyResult = await this.emailOtpService.verifyEmailOTP(email, otpCode, purpose);
      
      if (!verifyResult.success || !verifyResult.verified) {
        return {
          success: false,
          error: verifyResult.error || 'Invalid or expired OTP code'
        };
      }

      if (purpose === 'registration') {
        return await this.handleOTPRegistration(email, userMetadata, deviceInfo);
      } else if (purpose === 'login') {
        return await this.handleOTPLogin(email, deviceInfo);
      }

      return {
        success: false,
        error: 'Invalid purpose'
      };

    } catch (error) {
      this.logger.error('OTP authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  async completeRegistrationAfterVerification(
    userId: string,
    updates: {
      phone_number?: string;
      first_name?: string;
      last_name?: string;
      state?: string;
      city?: string;
      estate?: string;
    }
  ): Promise<AuthResponseDto> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Update user with additional information
      if (updates.phone_number) user.phoneNumber = updates.phone_number;
      if (updates.first_name) user.firstName = updates.first_name;
      if (updates.last_name) user.lastName = updates.last_name;
      if (updates.state) user.state = updates.state;
      if (updates.city) user.city = updates.city;
      if (updates.estate) user.estate = updates.estate;

      // Update verification status
      user.isVerified = user.phoneVerified || !!user.phoneNumber;

      const savedUser = await this.userRepository.save(user);

      this.logger.log(`User registration completed: ${userId}`);

      return {
        success: true,
        message: 'Registration completed successfully',
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          phoneNumber: savedUser.phoneNumber,
          phoneVerified: savedUser.phoneVerified,
          isVerified: savedUser.isVerified,
          verificationLevel: savedUser.getVerificationLevel(),
        }
      };

    } catch (error) {
      this.logger.error('Complete registration error:', error);
      return {
        success: false,
        error: 'Failed to complete registration'
      };
    }
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const tokenPair = await this.tokenService.refreshTokens(refreshToken);
      
      if (!tokenPair) {
        return {
          success: false,
          error: 'Invalid refresh token'
        };
      }

      // Get user for response
      const payload = await this.tokenService.validateAccessToken(tokenPair.accessToken);
      if (!payload) {
        return {
          success: false,
          error: 'Invalid token payload'
        };
      }

      const user = await this.userRepository.findOne({ where: { id: payload.userId } });
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      return this.tokenService.generateUserResponse(user, tokenPair);

    } catch (error) {
      this.logger.error('Refresh token error:', error);
      return {
        success: false,
        error: 'Failed to refresh token'
      };
    }
  }

  async logoutUser(sessionId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const invalidated = await this.tokenService.invalidateSession(sessionId);
      
      return {
        success: invalidated,
        message: invalidated ? 'Logged out successfully' : 'Session not found'
      };

    } catch (error) {
      this.logger.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout failed'
      };
    }
  }

  async logoutAllDevices(userId: string, exceptSessionId?: string): Promise<{ success: boolean; message?: string; loggedOutSessions?: number }> {
    try {
      const loggedOutCount = await this.tokenService.invalidateUserSessions(userId, exceptSessionId);
      
      return {
        success: true,
        message: `Logged out from ${loggedOutCount} devices`,
        loggedOutSessions: loggedOutCount
      };

    } catch (error) {
      this.logger.error('Logout all devices error:', error);
      return {
        success: false,
        message: 'Failed to logout from all devices'
      };
    }
  }

  private async handleOTPRegistration(
    email: string,
    userMetadata?: any,
    deviceInfo?: any
  ): Promise<AuthResponseDto> {
    try {
      // Find existing user by email
      const existingUser = await this.userRepository.findOne({ where: { email } });
      
      if (existingUser && existingUser.isVerified) {
        return {
          success: false,
          error: 'User with this email already exists and is verified'
        };
      }

      let user: User;
      
      if (existingUser) {
        // Update existing user with proper information
        existingUser.firstName = userMetadata?.first_name || existingUser.firstName;
        existingUser.lastName = userMetadata?.last_name || existingUser.lastName;
        existingUser.phoneNumber = userMetadata?.phone_number || existingUser.phoneNumber;
        existingUser.state = userMetadata?.state_of_origin || existingUser.state;
        existingUser.preferredLanguage = userMetadata?.preferred_language || existingUser.preferredLanguage || 'en';
        existingUser.isVerified = true; // Email is now verified
        
        // Set a temporary password if not set
        if (!existingUser.passwordHash) {
          const tempPassword = Math.random().toString(36).slice(-8);
          existingUser.passwordHash = await bcrypt.hash(tempPassword, 12);
        }
        
        user = await this.userRepository.save(existingUser);
      } else {
        // This shouldn't happen if OTP verification worked, but handle it
        return {
          success: false,
          error: 'User record not found after OTP verification'
        };
      }

      // Generate tokens
      const tokenPair = await this.tokenService.generateTokenPair(user, deviceInfo);

      this.logger.log(`OTP registration completed for: ${user.id}`);

      return this.tokenService.generateUserResponse(user, tokenPair);

    } catch (error) {
      this.logger.error('OTP registration error:', error);
      return {
        success: false,
        error: 'Registration failed'
      };
    }
  }

  private async handleOTPLogin(email: string, deviceInfo?: any): Promise<AuthResponseDto> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      
      if (!user) {
        return {
          success: false,
          error: 'User not found. Please register first.'
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is deactivated. Please contact support.'
        };
      }

      // Update last login
      user.lastLoginAt = new Date();
      await this.userRepository.save(user);

      // Generate tokens
      const tokenPair = await this.tokenService.generateTokenPair(user, deviceInfo);

      this.logger.log(`OTP login completed for: ${user.id}`);

      return this.tokenService.generateUserResponse(user, tokenPair);

    } catch (error) {
      this.logger.error('OTP login error:', error);
      return {
        success: false,
        error: 'Login failed'
      };
    }
  }
}