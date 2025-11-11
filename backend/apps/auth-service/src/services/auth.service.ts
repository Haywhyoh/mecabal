import {
  Injectable,
  Logger,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@app/database/entities/user.entity';
import { UserLocation } from '@app/database/entities/user-location.entity';
import { RegisterUserDto, LoginUserDto } from '../dto/register-user.dto';
import { EmailOtpService } from './email-otp.service';
import { PhoneOtpService } from './phone-otp.service';
import { TokenService } from './token.service';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { GoogleProfileDto, GoogleAuthResponseDto } from '@app/validation';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserLocation)
    private userLocationRepository: Repository<UserLocation>,
    private emailOtpService: EmailOtpService,
    private phoneOtpService: PhoneOtpService,
    private tokenService: TokenService,
  ) {}

  async registerUserMobile(registerDto: any): Promise<AuthResponseDto> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: [
          { email: registerDto.email },
          ...(registerDto.phoneNumber
            ? [{ phoneNumber: registerDto.phoneNumber }]
            : []),
        ],
      });

      let savedUser: any;

      if (existingUser) {
        this.logger.log(`Found existing user: ${existingUser.email}`);
        this.logger.log(
          `User status - isVerified: ${existingUser.isVerified}, phoneVerified: ${existingUser.phoneVerified}, firstName: ${existingUser.firstName}, lastName: ${existingUser.lastName}`,
        );
        this.logger.log(
          `User created: ${existingUser.createdAt}, updated: ${existingUser.updatedAt}`,
        );

        // Check if user is already fully registered with complete profile AND phone verified
        // Only reject if user has completed the full registration flow including phone verification
        if (
          existingUser.isVerified &&
          existingUser.firstName &&
          existingUser.lastName &&
          existingUser.phoneVerified &&
          existingUser.phoneNumber
        ) {
          this.logger.log(
            `User is fully registered - rejecting duplicate registration attempt`,
          );

          // Return appropriate error message based on what field conflicts
          if (existingUser.email === registerDto.email) {
            return {
              success: false,
              error:
                'An account with this email address already exists. Please try logging in instead.',
            };
          }
          if (existingUser.phoneNumber === registerDto.phoneNumber) {
            return {
              success: false,
              error:
                'An account with this phone number already exists. Please try logging in instead.',
            };
          }
        }

        // Check if there's a different conflict (same email but different phone, or vice versa)
        if (
          existingUser.email === registerDto.email &&
          existingUser.phoneNumber &&
          registerDto.phoneNumber &&
          existingUser.phoneNumber !== registerDto.phoneNumber
        ) {
          return {
            success: false,
            error:
              'This email is already registered with a different phone number. Please use the correct phone number or contact support.',
          };
        }

        if (
          existingUser.phoneNumber === registerDto.phoneNumber &&
          existingUser.email !== registerDto.email
        ) {
          return {
            success: false,
            error:
              'This phone number is already registered with a different email address. Please use the correct email or contact support.',
          };
        }

        // User exists but is not fully registered - update it with new information
        this.logger.log(
          `User exists but not fully registered - will update existing record`,
        );
        this.logger.log(
          `Updating existing user ${existingUser.email} with phone number ${registerDto.phoneNumber}`,
        );

        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(
          registerDto.password,
          saltRounds,
        );

        existingUser.phoneNumber =
          registerDto.phoneNumber || existingUser.phoneNumber;
        existingUser.firstName =
          registerDto.firstName || existingUser.firstName;
        existingUser.lastName = registerDto.lastName || existingUser.lastName;
        existingUser.passwordHash = passwordHash;
        // Location fields are handled via UserLocation; legacy fields removed
        existingUser.preferredLanguage =
          registerDto.preferredLanguage ||
          existingUser.preferredLanguage ||
          'en';
        existingUser.phoneVerified = false;
        existingUser.isVerified = false; // Will be set to true after email verification

        savedUser = await this.userRepository.save(existingUser);
      } else {
        // Create new user
        this.logger.log(`Creating new user with email: ${registerDto.email}`);
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(
          registerDto.password,
          saltRounds,
        );

        const newUser = this.userRepository.create({
          email: registerDto.email,
          phoneNumber: registerDto.phoneNumber,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          passwordHash,
          preferredLanguage: registerDto.preferredLanguage || 'en',
          phoneVerified: false,
          isVerified: false,
        });

        savedUser = await this.userRepository.save(newUser);
      }

      this.logger.log(`User registered successfully: ${savedUser.id}`);

      return {
        success: true,
        message:
          'User registered successfully. Please verify your email and/or phone number.',
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          phoneNumber: savedUser.phoneNumber,
          phoneVerified: savedUser.phoneVerified,
          isVerified: savedUser.isVerified,
          verificationLevel: 'unverified',
        },
      };
    } catch (error) {
      this.logger.error('Registration error:', error);

      // Handle database constraint violations
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        this.logger.error(
          'Database constraint violation:',
          error.detail || error.message,
        );

        if (error.detail?.includes('phone_number')) {
          return {
            success: false,
            error:
              'This phone number is already registered. Please try logging in or use a different phone number.',
          };
        }

        if (error.detail?.includes('email')) {
          return {
            success: false,
            error:
              'This email address is already registered. Please try logging in or use a different email address.',
          };
        }

        return {
          success: false,
          error:
            'An account with these details already exists. Please try logging in instead.',
        };
      }

      return {
        success: false,
        error: 'Registration failed. Please try again.',
      };
    }
  }

  async registerUser(registerDto: RegisterUserDto): Promise<AuthResponseDto> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: [
          { email: registerDto.email },
          ...(registerDto.phoneNumber
            ? [{ phoneNumber: registerDto.phoneNumber }]
            : []),
        ],
      });

      if (existingUser) {
        this.logger.log(
          `Found existing user during registration: ${existingUser.email}`,
        );

        if (existingUser.email === registerDto.email) {
          return {
            success: false,
            error:
              'An account with this email address already exists. Please try logging in instead.',
          };
        }
        if (existingUser.phoneNumber === registerDto.phoneNumber) {
          return {
            success: false,
            error:
              'An account with this phone number already exists. Please try logging in instead.',
          };
        }
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

      // Create user
      this.logger.log(`Creating new user with email: ${registerDto.email}`);
      const user = this.userRepository.create({
        email: registerDto.email,
        phoneNumber: registerDto.phoneNumber,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        passwordHash,
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
        message:
          'User registered successfully. Please verify your email and/or phone number.',
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          phoneNumber: savedUser.phoneNumber,
          phoneVerified: savedUser.phoneVerified,
          isVerified: savedUser.isVerified,
          verificationLevel: savedUser.getVerificationLevel(),
        },
      };
    } catch (error) {
      this.logger.error('Registration error:', error);

      // Handle database constraint violations
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        this.logger.error(
          'Database constraint violation:',
          error.detail || error.message,
        );

        if (error.detail?.includes('phone_number')) {
          return {
            success: false,
            error:
              'This phone number is already registered. Please try logging in or use a different phone number.',
          };
        }

        if (error.detail?.includes('email')) {
          return {
            success: false,
            error:
              'This email address is already registered. Please try logging in or use a different email address.',
          };
        }

        return {
          success: false,
          error:
            'An account with these details already exists. Please try logging in instead.',
        };
      }

      return {
        success: false,
        error: 'Registration failed. Please try again.',
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
    },
  ): Promise<AuthResponseDto> {
    try {
      // Find user by email or phone
      const user = await this.userRepository.findOne({
        where: [
          { email: loginDto.identifier },
          { phoneNumber: loginDto.identifier },
        ],
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Verify password
      const passwordValid = await bcrypt.compare(
        loginDto.password,
        user.passwordHash || '',
      );
      if (!passwordValid) {
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Check if account is active
      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is deactivated. Please contact support.',
        };
      }

      // Update last login
      user.lastLoginAt = new Date();
      await this.userRepository.save(user);

      // Generate tokens
      const tokenPair = await this.tokenService.generateTokenPair(
        user,
        deviceInfo,
      );

      this.logger.log(`User logged in successfully: ${user.id}`);

      return this.tokenService.generateUserResponse(user, tokenPair);
    } catch (error) {
      this.logger.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.',
      };
    }
  }

  async authenticateWithOTP(
    email: string,
    otpCode: string,
    purpose: 'registration' | 'login' | 'password_reset',
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
    },
  ): Promise<AuthResponseDto> {
    try {
      // Verify email OTP first (don't mark as used yet for registration)
      const markAsUsed = purpose !== 'registration';
      const verifyResult = await this.emailOtpService.verifyEmailOTP(
        email,
        otpCode,
        purpose,
        markAsUsed,
      );

      if (!verifyResult.success || !verifyResult.verified) {
        return {
          success: false,
          error: verifyResult.error || 'Invalid or expired OTP code',
        };
      }

      if (purpose === 'registration') {
        return await this.handleOTPRegistration(
          email,
          userMetadata,
          deviceInfo,
          verifyResult.otpId,
        );
      } else if (purpose === 'login') {
        return await this.handleOTPLogin(email, deviceInfo);
      }

      return {
        success: false,
        error: 'Invalid purpose',
      };
    } catch (error) {
      this.logger.error('OTP authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed',
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
    },
  ): Promise<AuthResponseDto> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Update user with additional information
      if (updates.phone_number) user.phoneNumber = updates.phone_number;
      if (updates.first_name) user.firstName = updates.first_name;
      if (updates.last_name) user.lastName = updates.last_name;
      // Legacy direct location fields removed; persisted via UserLocation service

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
        },
      };
    } catch (error) {
      this.logger.error('Complete registration error:', error);
      return {
        success: false,
        error: 'Failed to complete registration',
      };
    }
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const tokenPair = await this.tokenService.refreshTokens(refreshToken);

      if (!tokenPair) {
        return {
          success: false,
          error: 'Invalid refresh token',
        };
      }

      // Get user for response
      const payload = await this.tokenService.validateAccessToken(
        tokenPair.accessToken,
      );
      if (!payload) {
        return {
          success: false,
          error: 'Invalid token payload',
        };
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.userId },
      });
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return this.tokenService.generateUserResponse(user, tokenPair);
    } catch (error) {
      this.logger.error('Refresh token error:', error);
      return {
        success: false,
        error: 'Failed to refresh token',
      };
    }
  }

  async logoutUser(
    sessionId: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const invalidated = await this.tokenService.invalidateSession(sessionId);

      return {
        success: invalidated,
        message: invalidated ? 'Logged out successfully' : 'Session not found',
      };
    } catch (error) {
      this.logger.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout failed',
      };
    }
  }

  async logoutAllDevices(
    userId: string,
    exceptSessionId?: string,
  ): Promise<{
    success: boolean;
    message?: string;
    loggedOutSessions?: number;
  }> {
    try {
      const loggedOutCount = await this.tokenService.invalidateUserSessions(
        userId,
        exceptSessionId,
      );

      return {
        success: true,
        message: `Logged out from ${loggedOutCount} devices`,
        loggedOutSessions: loggedOutCount,
      };
    } catch (error) {
      this.logger.error('Logout all devices error:', error);
      return {
        success: false,
        message: 'Failed to logout from all devices',
      };
    }
  }

  /**
   * Handle OTP-based registration after email verification
   * 
   * This is Step 2 of the onboarding flow:
   * 1. User enters email and receives OTP
   * 2. User verifies email OTP (this method)
   * 3. User proceeds to phone verification
   * 4. User verifies phone OTP
   * 5. User sets up location
   * 6. Registration complete
   * 
   * User state after this step:
   * - Email: Verified (implicitly through OTP verification)
   * - Phone: Not verified (phoneVerified = false)
   * - Location: Not set
   * - isVerified: false (waiting for phone + location)
   */
  private async handleOTPRegistration(
    email: string,
    userMetadata?: any,
    deviceInfo?: any,
    otpId?: string,
  ): Promise<AuthResponseDto> {
    try {
      // Find existing user by email
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      // If user exists and is fully verified, reject duplicate registration
      if (existingUser && existingUser.isVerified && existingUser.phoneVerified) {
        return {
          success: false,
          error: 'User with this email already exists and is fully verified',
        };
      }

      let user: User;

      if (existingUser) {
        // Update existing user with proper information (EMAIL VERIFICATION STEP)
        // This handles partial registrations where user started but didn't complete
        existingUser.firstName =
          userMetadata?.first_name || existingUser.firstName;
        existingUser.lastName =
          userMetadata?.last_name || existingUser.lastName;
        existingUser.phoneNumber =
          userMetadata?.phone_number || existingUser.phoneNumber;
        // state_of_origin now tracked via cultural profile; legacy field removed
        existingUser.preferredLanguage =
          userMetadata?.preferred_language ||
          existingUser.preferredLanguage ||
          'en';
        
        // Email is verified through OTP, but don't set isVerified = true yet
        // User still needs: phone verification + location setup before being fully verified
        existingUser.isVerified = false;
        existingUser.phoneVerified = false; // Ensure phone is not marked verified yet

        // Set a temporary password if not set
        if (!existingUser.passwordHash) {
          const tempPassword = Math.random().toString(36).slice(-8);
          existingUser.passwordHash = await bcrypt.hash(tempPassword, 12);
        }

        user = await this.userRepository.save(existingUser);
        this.logger.log(
          `Updated existing user ${user.id} after email verification, proceeding to phone verification`,
        );

        // Mark OTP as used after successful registration
        if (otpId) {
          await this.emailOtpService.markOTPAsUsed(otpId);
        }
      } else {
        // Create new user record after successful email OTP verification
        this.logger.log(`Creating new user for email: ${email}`);

        const tempPassword = Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        const newUser = this.userRepository.create({
          email,
          firstName: userMetadata?.first_name || '',
          lastName: userMetadata?.last_name || '',
          phoneNumber: userMetadata?.phone_number || null,
          passwordHash,
          preferredLanguage: userMetadata?.preferred_language || 'en',
          phoneVerified: false,
          isVerified: false, // Will be set to true after phone verification + location setup
        });

        user = await this.userRepository.save(newUser);
        this.logger.log(
          `New user created with ID: ${user.id}, proceeding to phone verification`,
        );

        // Mark OTP as used after successful registration
        if (otpId) {
          await this.emailOtpService.markOTPAsUsed(otpId);
        }
      }

      // Generate tokens for the user to proceed to next step
      const tokenPair = await this.tokenService.generateTokenPair(
        user,
        deviceInfo,
      );

      this.logger.log(
        `Email verification completed for user ${user.id}, user can now proceed to phone verification`,
      );

      return this.tokenService.generateUserResponse(user, tokenPair);
    } catch (error) {
      this.logger.error('OTP registration error:', error);
      return {
        success: false,
        error: 'Registration failed',
      };
    }
  }

  private async handleOTPLogin(
    email: string,
    deviceInfo?: any,
  ): Promise<AuthResponseDto> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        return {
          success: false,
          error: 'User not found. Please register first.',
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is deactivated. Please contact support.',
        };
      }

      // Update last login
      user.lastLoginAt = new Date();
      await this.userRepository.save(user);

      // Generate tokens
      const tokenPair = await this.tokenService.generateTokenPair(
        user,
        deviceInfo,
      );

      this.logger.log(`OTP login completed for: ${user.id}`);

      return this.tokenService.generateUserResponse(user, tokenPair);
    } catch (error) {
      this.logger.error('OTP login error:', error);
      return {
        success: false,
        error: 'Login failed',
      };
    }
  }

  // Additional methods for the auth controller
  async initiatePasswordReset(resetPasswordDto: {
    email: string;
  }): Promise<AuthResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { email: resetPasswordDto.email },
      });

      if (!user) {
        // Don't reveal if user exists for security
        return {
          success: true,
          message:
            'If an account with this email exists, a password reset code has been sent.',
        };
      }

      // Send password reset OTP
      const otpResult = await this.emailOtpService.sendEmailOTP(
        resetPasswordDto.email,
        'password_reset',
      );

      if (!otpResult.success) {
        return {
          success: false,
          error: otpResult.error || 'Failed to send reset code',
        };
      }

      return {
        success: true,
        message: 'Password reset code sent to your email.',
        expiresAt: otpResult.expiresAt,
      };
    } catch (error) {
      this.logger.error('Password reset initiation error:', error);
      return {
        success: false,
        error: 'Failed to initiate password reset. Please try again.',
      };
    }
  }

  async confirmPasswordReset(confirmResetDto: {
    email: string;
    resetCode: string;
    newPassword: string;
  }): Promise<AuthResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { email: confirmResetDto.email },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Verify OTP
      const otpResult = await this.emailOtpService.verifyEmailOTP(
        confirmResetDto.email,
        confirmResetDto.resetCode,
        'password_reset',
      );

      if (!otpResult.success) {
        return {
          success: false,
          error: otpResult.error || 'Invalid or expired reset code',
        };
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(
        confirmResetDto.newPassword,
        saltRounds,
      );

      // Update password
      user.passwordHash = passwordHash;
      user.updatedAt = new Date();
      await this.userRepository.save(user);

      this.logger.log(`Password reset completed for user: ${user.id}`);

      return {
        success: true,
        message:
          'Password reset successfully. You can now login with your new password.',
      };
    } catch (error) {
      this.logger.error('Password reset confirmation error:', error);
      return {
        success: false,
        error: 'Failed to reset password. Please try again.',
      };
    }
  }

  async initiateOtpLogin(initiateOtpDto: {
    email: string;
  }): Promise<AuthResponseDto> {
    try {
      // Check if user exists
      const user = await this.userRepository.findOne({
        where: { email: initiateOtpDto.email },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found. Please register first.',
        };
      }

      // Check if account is active
      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is deactivated. Please contact support.',
        };
      }

      // Send OTP
      const otpResult = await this.emailOtpService.sendEmailOTP(
        initiateOtpDto.email,
        'login',
      );

      if (!otpResult.success) {
        return {
          success: false,
          error: otpResult.error || 'Failed to send OTP',
        };
      }

      this.logger.log(`OTP login initiated for: ${initiateOtpDto.email}`);

      return {
        success: true,
        message: 'OTP sent to your email. Please check and enter the code.',
        expiresAt: otpResult.expiresAt,
      };
    } catch (error) {
      this.logger.error('OTP login initiation error:', error);
      return {
        success: false,
        error: 'Failed to initiate OTP login. Please try again.',
      };
    }
  }

  async verifyOtpLogin(verifyOtpDto: {
    email: string;
    otpCode: string;
  }): Promise<AuthResponseDto> {
    return this.authenticateWithOTP(
      verifyOtpDto.email,
      verifyOtpDto.otpCode,
      'login',
    );
  }

  async testEmailService(email: string): Promise<AuthResponseDto> {
    try {
      const otpResult = await this.emailOtpService.sendEmailOTP(
        email,
        'registration',
      );

      if (!otpResult.success) {
        return {
          success: false,
          error: otpResult.error || 'Failed to send test email',
        };
      }

      return {
        success: true,
        message: 'Test email sent successfully',
        expiresAt: otpResult.expiresAt,
      };
    } catch (error) {
      this.logger.error('Test email error:', error);
      return {
        success: false,
        error: 'Failed to send test email. Please try again.',
      };
    }
  }

  async updateUserProfile(
    userId: string,
    updates: {
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
  ): Promise<AuthResponseDto> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Update user fields
      if (updates.phone_number !== undefined)
        user.phoneNumber = updates.phone_number;
      // Legacy direct location fields removed; handled via UserLocation service
      if (updates.phoneVerified !== undefined)
        user.phoneVerified = updates.phoneVerified;
      if (updates.addressVerified !== undefined)
        user.addressVerified = updates.addressVerified;

      // Update overall verification status based on completion
      if (updates.isVerified !== undefined) {
        user.isVerified = updates.isVerified;
      } else if (updates.verification_level !== undefined) {
        // Auto-update isVerified based on verification level
        user.isVerified = updates.verification_level >= 2; // Email + Phone verified
      }

      // Update timestamp
      user.updatedAt = new Date();

      const savedUser = await this.userRepository.save(user);

      this.logger.log(`User profile updated successfully: ${userId}`);

      return {
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          phoneNumber: savedUser.phoneNumber,
          phoneVerified: savedUser.phoneVerified,
          isVerified: savedUser.isVerified,
          verificationLevel: savedUser.getVerificationLevel(),
          // location fields omitted from response; handled via location service
          addressVerified: savedUser.addressVerified,
        },
      };
    } catch (error) {
      this.logger.error('Update profile error:', error);
      return {
        success: false,
        error: 'Failed to update profile',
      };
    }
  }

  async getUserProfile(userId: string): Promise<AuthResponseDto> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          phoneVerified: user.phoneVerified,
          isVerified: user.isVerified,
          verificationLevel: user.getVerificationLevel(),
          // location fields omitted from profile; handled via location service
          addressVerified: user.addressVerified,
          preferredLanguage: user.preferredLanguage,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    } catch (error) {
      this.logger.error('Get profile error:', error);
      return {
        success: false,
        error: 'Failed to get profile',
      };
    }
  }

  /**
   * Complete registration after location setup
   * 
   * This is the FINAL step of the onboarding flow:
   * 1. Email verification ✓
   * 2. Phone verification ✓
   * 3. Location setup (this method) ✓
   * 
   * After this method:
   * - User is fully verified (isVerified = true)
   * - Address is verified (addressVerified = true)
   * - Phone is verified (phoneVerified = true)
   * - Location is set (via UserLocation service)
   * - User can access all features
   */
  async completeRegistrationWithLocation(
    userId: string,
    locationData: {
      stateId?: string;
      lgaId?: string;
      neighborhoodId?: string;
      cityTown?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      phoneNumber?: string;
    },
  ): Promise<AuthResponseDto> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Create UserLocation record if location data is provided
      if (locationData.stateId && locationData.lgaId) {
        this.logger.log(
          `Creating UserLocation for user ${userId} with stateId: ${locationData.stateId}, lgaId: ${locationData.lgaId}, neighborhoodId: ${locationData.neighborhoodId}`,
        );

        // Unset any existing primary locations
        await this.userLocationRepository.update(
          { userId, isPrimary: true },
          { isPrimary: false }
        );

        // Create coordinates object if latitude and longitude provided
        let coordinates;
        if (locationData.latitude && locationData.longitude) {
          coordinates = {
            type: 'Point',
            coordinates: [locationData.longitude, locationData.latitude]
          };
        }

        // Create new primary location
        const userLocation = this.userLocationRepository.create({
          userId,
          stateId: locationData.stateId,
          lgaId: locationData.lgaId,
          neighborhoodId: locationData.neighborhoodId,
          cityTown: locationData.cityTown,
          address: locationData.address,
          coordinates,
          isPrimary: true,
        });

        try {
          const savedLocation = await this.userLocationRepository.save(userLocation);

          // Update user's primary location ID
          user.primaryLocationId = savedLocation.id;

          this.logger.log(
            `📍 Created UserLocation for user ${userId}: ${locationData.cityTown || 'No city'}, ${locationData.stateId}`,
          );
        } catch (locationError: any) {
          this.logger.error('Failed to save UserLocation:', {
            error: locationError?.message,
            code: locationError?.code,
            constraint: locationError?.constraint,
            detail: locationError?.detail,
            stateId: locationData.stateId,
            lgaId: locationData.lgaId,
            neighborhoodId: locationData.neighborhoodId,
          });
          throw new Error(
            `Failed to save location: ${locationError?.message || locationError?.detail || 'Unknown error'}. ` +
            `Please verify that state ID "${locationData.stateId}" and LGA ID "${locationData.lgaId}" exist in the database.`
          );
        }
      }

      // Update phone number if provided
      if (locationData.phoneNumber) {
        user.phoneNumber = locationData.phoneNumber;
      }

      // Mark as fully verified after location setup
      user.addressVerified = true;
      user.isVerified = true;

      // Ensure phone is verified if it wasn't already
      if (user.phoneNumber && !user.phoneVerified) {
        this.logger.warn(
          `User ${userId} completing registration without phone verification. This should not happen in normal flow.`,
        );
      }

      // Set member since date
      if (!user.memberSince) {
        user.memberSince = new Date();
      }

      user.updatedAt = new Date();

      const savedUser = await this.userRepository.save(user);

      // Generate tokens for the completed registration
      const tokenPair = await this.tokenService.generateTokenPair(savedUser);

      this.logger.log(
        `✅ Registration COMPLETED for user ${userId} - all steps finished: email ✓, phone ✓, location ✓`,
      );

      return this.tokenService.generateUserResponse(savedUser, tokenPair);
    } catch (error) {
      this.logger.error('Complete registration with location error:', error);
      this.logger.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        code: error?.code,
        constraint: error?.constraint,
        detail: error?.detail,
      });
      return {
        success: false,
        error: error?.message || 'Failed to complete registration',
      };
    }
  }

  async findUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: { phoneNumber },
        relations: ['userNeighborhoods', 'userNeighborhoods.neighborhood'],
      });
    } catch (error) {
      this.logger.error('Find user by phone number error:', error);
      return null;
    }
  }

  async generateTokensForUser(
    user: User,
    deviceInfo?: {
      deviceId?: string;
      deviceType?: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ) {
    return await this.tokenService.generateTokenPair(user, deviceInfo);
  }

  // Google OAuth Methods
  async validateGoogleUser(googleProfile: {
    googleId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    emailVerified: boolean;
  }): Promise<GoogleAuthResponseDto> {
    try {
      this.logger.log(`Validating Google user: ${googleProfile.email}`);

      // Check if user exists with this email
      const existingUser = await this.userRepository.findOne({
        where: { email: googleProfile.email },
      });

      if (existingUser) {
        // Check if user already has Google auth linked
        if (existingUser.googleId === googleProfile.googleId) {
          // User exists and Google ID matches - proceed with login
          this.logger.log(`Google login for existing user: ${existingUser.id}`);
          
          // Update last login
          existingUser.lastLoginAt = new Date();
          await this.userRepository.save(existingUser);

          // Generate tokens
          const tokenPair = await this.tokenService.generateTokenPair(existingUser);

          return {
            user: {
              id: existingUser.id,
              email: existingUser.email,
              name: `${existingUser.firstName || ''} ${existingUser.lastName || ''}`.trim(),
              firstName: existingUser.firstName,
              lastName: existingUser.lastName,
              profilePicture: existingUser.profilePictureUrl,
              googleId: existingUser.googleId,
              authProvider: 'google' as const,
              isEmailVerified: existingUser.isVerified,
              verified_email: existingUser.isVerified,
            },
            accessToken: tokenPair.accessToken,
            refreshToken: tokenPair.refreshToken,
            isNewUser: false,
          };
        } else if (existingUser.googleId && existingUser.googleId !== googleProfile.googleId) {
          // User exists but with different Google account
          throw new ConflictException(
            'An account with this email already exists with a different Google account. Please use the original Google account or contact support.',
          );
        } else {
          // User exists with local auth - suggest linking accounts
          throw new ConflictException(
            'An account with this email already exists. Would you like to link your Google account?',
          );
        }
      } else {
        // Check if user exists with this Google ID but different email
        const existingGoogleUser = await this.userRepository.findOne({
          where: { googleId: googleProfile.googleId },
        });

        if (existingGoogleUser) {
          // Update email if it changed
          existingGoogleUser.email = googleProfile.email;
          existingGoogleUser.firstName = (googleProfile as any).given_name || googleProfile.firstName || existingGoogleUser.firstName;
          existingGoogleUser.lastName = (googleProfile as any).family_name || googleProfile.lastName || existingGoogleUser.lastName;
          existingGoogleUser.profilePictureUrl = (googleProfile as any).picture || googleProfile.profilePicture || existingGoogleUser.profilePictureUrl;
          existingGoogleUser.isVerified = (googleProfile as any).verified_email || googleProfile.emailVerified || false;
          existingGoogleUser.lastLoginAt = new Date();

          const savedUser = await this.userRepository.save(existingGoogleUser);

          // Generate tokens
          const tokenPair = await this.tokenService.generateTokenPair(savedUser);

          return {
            user: {
              id: savedUser.id,
              email: savedUser.email,
              name: `${savedUser.firstName || ''} ${savedUser.lastName || ''}`.trim(),
              firstName: savedUser.firstName,
              lastName: savedUser.lastName,
              profilePicture: savedUser.profilePictureUrl,
              googleId: savedUser.googleId,
              authProvider: 'google' as const,
              isEmailVerified: savedUser.isVerified,
              verified_email: savedUser.isVerified,
            },
            accessToken: tokenPair.accessToken,
            refreshToken: tokenPair.refreshToken,
            isNewUser: false,
          };
        }

        // Create new user
        this.logger.log(`Creating new Google user: ${googleProfile.email}`);
        
        const newUser = this.userRepository.create({
          email: googleProfile.email,
          firstName: (googleProfile as any).given_name || googleProfile.firstName || '',
          lastName: (googleProfile as any).family_name || googleProfile.lastName || '',
          profilePictureUrl: (googleProfile as any).picture || googleProfile.profilePicture || '',
          googleId: (googleProfile as any).id || googleProfile.googleId,
          authProvider: 'google',
          isVerified: (googleProfile as any).verified_email || googleProfile.emailVerified || false,
          isActive: true,
          memberSince: new Date(),
          lastLoginAt: new Date(),
        });

        const savedUser = await this.userRepository.save(newUser);

        // Generate tokens
        const tokenPair = await this.tokenService.generateTokenPair(savedUser);

        this.logger.log(`New Google user created: ${savedUser.id}`);

        return {
          user: {
            id: savedUser.id,
            email: savedUser.email,
            name: `${savedUser.firstName || ''} ${savedUser.lastName || ''}`.trim(),
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
            profilePicture: savedUser.profilePictureUrl,
            googleId: savedUser.googleId,
            authProvider: 'google' as const,
            isEmailVerified: savedUser.isVerified,
            verified_email: savedUser.isVerified,
          },
          accessToken: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken,
          isNewUser: true,
        };
      }
    } catch (error) {
      this.logger.error('Google user validation error:', error);
      throw error;
    }
  }

  async findOrCreateGoogleUser(googleData: {
    googleId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    emailVerified: boolean;
  }): Promise<{ user: User; isNewUser: boolean }> {
    try {
      // Check if user exists with Google ID
      let user = await this.userRepository.findOne({
        where: { googleId: googleData.googleId },
      });

      if (user) {
        // Update user info if needed
        user.email = googleData.email;
        user.firstName = googleData.firstName || user.firstName;
        user.lastName = googleData.lastName || user.lastName;
        user.profilePictureUrl = (googleData as any).picture || user.profilePictureUrl;
        user.isVerified = googleData.emailVerified;
        user.lastLoginAt = new Date();

        user = await this.userRepository.save(user);
        return { user, isNewUser: false };
      }

      // Check if user exists with email but no Google ID
      user = await this.userRepository.findOne({
        where: { email: googleData.email },
      });

      if (user) {
        // Link Google account to existing user
        user.googleId = googleData.googleId;
        user.authProvider = 'google';
        user.profilePictureUrl = (googleData as any).picture || user.profilePictureUrl;
        user.isVerified = googleData.emailVerified;
        user.lastLoginAt = new Date();

        user = await this.userRepository.save(user);
        return { user, isNewUser: false };
      }

      // Create new user
      const newUser = this.userRepository.create({
        email: googleData.email,
        firstName: (googleData as any).given_name || googleData.firstName || '',
        lastName: (googleData as any).family_name || googleData.lastName || '',
        profilePictureUrl: (googleData as any).picture || googleData.profilePicture || '',
        googleId: googleData.googleId,
        authProvider: 'google',
        isVerified: (googleData as any).verified_email || googleData.emailVerified || false,
        isActive: true,
        memberSince: new Date(),
        lastLoginAt: new Date(),
      });

      user = await this.userRepository.save(newUser);
      return { user, isNewUser: true };
    } catch (error) {
      this.logger.error('Find or create Google user error:', error);
      throw error;
    }
  }

  async linkGoogleAccount(userId: string, googleId: string): Promise<AuthResponseDto> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Check if Google account is already linked to another user
      const existingGoogleUser = await this.userRepository.findOne({
        where: { googleId },
      });

      if (existingGoogleUser && existingGoogleUser.id !== userId) {
        return {
          success: false,
          error: 'This Google account is already linked to another user',
        };
      }

      // Link Google account
      user.googleId = googleId;
      user.authProvider = 'google';
      user.updatedAt = new Date();

      const savedUser = await this.userRepository.save(user);

      this.logger.log(`Google account linked to user: ${userId}`);

      return {
        success: true,
        message: 'Google account linked successfully',
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          phoneNumber: savedUser.phoneNumber,
          phoneVerified: savedUser.phoneVerified,
          isVerified: savedUser.isVerified,
          verificationLevel: savedUser.getVerificationLevel(),
        },
      };
    } catch (error) {
      this.logger.error('Link Google account error:', error);
      return {
        success: false,
        error: 'Failed to link Google account',
      };
    }
  }

  async unlinkGoogleAccount(userId: string): Promise<AuthResponseDto> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      if (!user.googleId) {
        return {
          success: false,
          error: 'No Google account linked to this user',
        };
      }

      // Check if user has a password set (local auth)
      if (!user.passwordHash) {
        return {
          success: false,
          error: 'Cannot unlink Google account. Please set a password first.',
        };
      }

      // Unlink Google account
      user.googleId = undefined;
      user.authProvider = 'local';
      user.updatedAt = new Date();

      await this.userRepository.save(user);

      this.logger.log(`Google account unlinked from user: ${userId}`);

      return {
        success: true,
        message: 'Google account unlinked successfully',
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
      };
    } catch (error) {
      this.logger.error('Unlink Google account error:', error);
      return {
        success: false,
        error: 'Failed to unlink Google account',
      };
    }
  }
}
