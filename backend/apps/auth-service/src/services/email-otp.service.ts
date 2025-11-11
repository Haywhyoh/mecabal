import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { OtpVerification } from '@app/database/entities/otp-verification.entity';
import { User } from '@app/database/entities/user.entity';

@Injectable()
export class EmailOtpService {
  private readonly logger = new Logger(EmailOtpService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(OtpVerification)
    private otpVerificationRepository: Repository<OtpVerification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    // Validate required environment variables
    const requiredEnvVars = [
      'EMAIL_HOST',
      'EMAIL_PORT',
      'EMAIL_SENDER',
      'EMAIL_HOST_USER',
      'EMAIL_HOST_PASSWORD',
      'CLIENT_URL',
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName],
    );
    if (missingVars.length > 0) {
      this.logger.error(
        'Missing required environment variables for mail service:',
        missingVars,
      );
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`,
      );
    }

    // Create transporter with better configuration
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_HOST_USER,
        pass: process.env.EMAIL_HOST_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000, // 30 seconds
      socketTimeout: 60000, // 60 seconds
    });

    // Verify connection on startup
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      // Add retry logic for DNS resolution issues
      let retries = 3;
      let lastError;

      while (retries > 0) {
        try {
          await this.transporter.verify();
          this.logger.log('Email service connection verified successfully');
          return;
        } catch (error) {
          lastError = error;
          retries--;

          if (error.code === 'ENOTFOUND' || error.code === 'EDNS') {
            this.logger.warn(
              `DNS resolution failed, retrying... (${retries} attempts left)`,
            );
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
          } else {
            throw error; // Re-throw non-DNS errors
          }
        }
      }

      throw lastError;
    } catch (error) {
      this.logger.error('Email service connection verification failed:', error);
      // Don't throw error here to allow service to start, but log the issue
    }
  }

  async sendEmailOTP(
    email: string,
    purpose: 'registration' | 'login' | 'password_reset',
  ): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    expiresAt?: Date;
    otpCode?: string;
  }> {
    try {
      this.logger.log(
        `Starting email OTP process for ${email} with purpose: ${purpose}`,
      );

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      this.logger.log(
        `Generated OTP code: ${otpCode} (expires at: ${expiresAt.toISOString()})`,
      );

      // For registration, don't create user record yet - just track OTP by email
      const user = await this.userRepository.findOne({ where: { email } });
      let userId: string | null = null;

      if (!user && purpose === 'registration') {
        this.logger.log(`Registration OTP requested for new email: ${email}`);
        // Don't create user record yet - will be created during phone verification
        userId = null;
      } else if (!user && purpose === 'login') {
        this.logger.warn(`Login attempt for non-existent user: ${email}`);
        return {
          success: false,
          error: 'User not found. Please register first.',
        };
      } else {
        userId = user!.id;
        this.logger.log(`Found existing user with ID: ${userId}`);
      }

      // Clean up any existing OTPs for this email/purpose
      const cleanupConditions: any = {
        contactMethod: 'email',
        contactValue: email,
        purpose,
        isUsed: false,
      };

      // For existing users, include userId in cleanup
      if (userId) {
        cleanupConditions.userId = userId;
      }

      const deletedCount =
        await this.otpVerificationRepository.delete(cleanupConditions);

      if (deletedCount.affected && deletedCount.affected > 0) {
        this.logger.log(
          `Cleaned up ${deletedCount.affected} existing OTP records for email ${email}`,
        );
      }

      // Create new OTP verification record
      const otpVerification = this.otpVerificationRepository.create({
        userId, // Can be null for registration
        contactMethod: 'email',
        contactValue: email,
        otpCode,
        purpose,
        expiresAt,
      });

      await this.otpVerificationRepository.save(otpVerification);
      this.logger.log(
        `OTP verification record created with ID: ${otpVerification.id}`,
      );

      // Send email
      this.logger.log(`Attempting to send email to ${email}...`);
      const emailSent = await this.sendEmailViaBrevo(email, otpCode, purpose);

      if (!emailSent.success) {
        this.logger.error(
          `Email sending failed for ${email}: ${emailSent.error}`,
        );
        return {
          success: false,
          error: emailSent.error || 'Failed to send email',
        };
      }

      this.logger.log(`Email OTP sent successfully to ${email} for ${purpose}`);

      return {
        success: true,
        message: 'OTP code sent successfully',
        expiresAt,
        // Include OTP in development mode
        ...(process.env.NODE_ENV === 'development' && { otpCode }),
      };
    } catch (error) {
      this.logger.error('Failed to send email OTP:', error);
      return {
        success: false,
        error: 'Failed to send OTP',
      };
    }
  }

  async verifyEmailOTP(
    email: string,
    otpCode: string,
    purpose: 'registration' | 'login' | 'password_reset',
    markAsUsed: boolean = true,
    userDetails?: {
      firstName?: string;
      lastName?: string;
      preferredLanguage?: string;
    },
  ): Promise<{
    success: boolean;
    verified: boolean;
    error?: string;
    otpId?: string;
  }> {
    try {
      // Development bypass: Allow code "2398" in development/staging environments
      const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'staging';
      const isDevBypassCode = otpCode === '2398';
      
      if (isDevelopment && isDevBypassCode) {
        this.logger.warn(
          `🔧 DEVELOPMENT BYPASS: Using hardcoded OTP code 2398 for ${email}`,
        );

        // Find user by email
        const user = await this.userRepository.findOne({ where: { email } });

        // For non-registration purposes, user must exist
        if (!user && purpose !== 'registration') {
          return {
            success: false,
            verified: false,
            error: 'User not found',
          };
        }

        // Mark any existing OTP as used (if found)
        const whereConditions: any = {
          contactMethod: 'email',
          contactValue: email,
          purpose,
        };

        if (user) {
          whereConditions.userId = user.id;
        }

        const existingOtp = await this.otpVerificationRepository.findOne({
          where: whereConditions,
          order: { createdAt: 'DESC' },
        });

        if (existingOtp && markAsUsed && !existingOtp.isUsed) {
          existingOtp.isUsed = true;
          await this.otpVerificationRepository.save(existingOtp);
        }

        this.logger.log(`Email OTP verified successfully (dev bypass) for ${email}`);

        return {
          success: true,
          verified: true,
          otpId: existingOtp?.id,
        };
      }

      // For registration, find OTP by email (user might not exist yet)
      // For other purposes, require user to exist
      const user = await this.userRepository.findOne({ where: { email } });

      if (!user && purpose !== 'registration') {
        return {
          success: false,
          verified: false,
          error: 'User not found',
        };
      }

      // Find valid OTP record by email and purpose
      const whereConditions: any = {
        contactMethod: 'email',
        contactValue: email,
        purpose,
      };

      // For existing users, include userId in search
      if (user) {
        whereConditions.userId = user.id;
      }

      const otpRecord = await this.otpVerificationRepository.findOne({
        where: whereConditions,
        order: { createdAt: 'DESC' },
      });

      if (!otpRecord) {
        return {
          success: false,
          verified: false,
          error: 'OTP not found',
        };
      }

      // Check if OTP is expired
      if (otpRecord.isExpired()) {
        // Clean up expired OTP
        await this.otpVerificationRepository.delete({ id: otpRecord.id });
        return {
          success: false,
          verified: false,
          error: 'OTP code has expired. Please request a new code.',
        };
      }

      // Verify OTP code
      if (otpRecord.otpCode !== otpCode) {
        return {
          success: false,
          verified: false,
          error: 'Invalid OTP code',
        };
      }

      // Grace period check: Allow reuse within 30 seconds if already used
      const now = new Date();
      const gracePeriod = 30 * 1000; // 30 seconds in milliseconds
      const timeSinceCreated = now.getTime() - otpRecord.createdAt.getTime();

      if (otpRecord.isUsed && timeSinceCreated > gracePeriod) {
        return {
          success: false,
          verified: false,
          error: 'OTP code has already been used. Please request a new code.',
        };
      }

      // For registration, don't update user details here - will be done during final user creation
      // User details will be stored when the actual user record is created during phone verification

      // Mark OTP as used only if requested and not already used
      if (markAsUsed && !otpRecord.isUsed) {
        otpRecord.isUsed = true;
        await this.otpVerificationRepository.save(otpRecord);
      }

      this.logger.log(
        `Email OTP verified successfully for ${email}${otpRecord.isUsed ? ' (within grace period)' : ''}`,
      );

      return {
        success: true,
        verified: true,
        otpId: otpRecord.id,
      };
    } catch (error) {
      this.logger.error('Failed to verify email OTP:', error);
      return {
        success: false,
        verified: false,
        error: 'Failed to verify OTP',
      };
    }
  }

  private async sendEmailViaBrevo(
    email: string,
    otpCode: string,
    purpose: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.transporter) {
        this.logger.error(
          'Email transporter not initialized. Please check your email configuration.',
        );
        return {
          success: false,
          error:
            'Email service not configured. Please check your environment variables.',
        };
      }

      const subject = this.getEmailSubject(purpose);
      const htmlContent = this.getEmailTemplate(otpCode, purpose);

      const mailOptions = {
        from: `MeCabal Community <${process.env.EMAIL_SENDER || 'noreply@mecabal.com'}>`,
        to: email,
        subject,
        html: htmlContent,
        // Add tracking headers
        headers: {
          'X-MeCabal-Purpose': purpose,
          'X-MeCabal-Timestamp': new Date().toISOString(),
          'X-MeCabal-Client-URL':
            process.env.CLIENT_URL || 'https://mecabal.com',
        },
      };

      // Add timeout wrapper to prevent hanging requests
      const sendEmailWithTimeout = () => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Email send timeout after 25 seconds'));
          }, 25000);

          this.transporter
            .sendMail(mailOptions)
            .then((result) => {
              clearTimeout(timeout);
              resolve(result);
            })
            .catch((error) => {
              clearTimeout(timeout);
              reject(error);
            });
        });
      };

      const result = (await sendEmailWithTimeout()) as any;
      this.logger.log(
        `Email sent successfully: ${result?.messageId || 'unknown'}`,
      );

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to send email:', error);

      // Provide more specific error messages
      let errorMessage = 'Email service error';
      if (error.message.includes('timeout')) {
        errorMessage = 'Email service timeout. Please try again.';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage =
          'Email service connection refused. Please check your email configuration.';
      } else if (error.message.includes('authentication')) {
        errorMessage =
          'Email authentication failed. Please check your email credentials.';
      } else if (error.message.includes('AbortError')) {
        errorMessage = 'Email request was aborted. Please try again.';
      } else {
        errorMessage = `Email service error: ${error.message}`;
      }

      return { success: false, error: errorMessage };
    }
  }

  private getEmailSubject(purpose: string): string {
    switch (purpose) {
      case 'registration':
        return 'Welcome to MeCabal - Verify Your Email';
      case 'login':
        return 'MeCabal Login Verification';
      case 'password_reset':
        return 'MeCabal Password Reset';
      default:
        return 'MeCabal Email Verification';
    }
  }

  private getEmailTemplate(otpCode: string, purpose: string): string {
    const purposeText =
      purpose === 'registration'
        ? 'complete your registration'
        : purpose === 'login'
          ? 'sign in to your account'
          : 'reset your password';

    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>MeCabal Email Verification</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 0; }
              .header { 
                  background: linear-gradient(135deg, #00A651 0%, #006B3C 100%); 
                  color: white; 
                  padding: 30px 20px; 
                  text-align: center;
                  border-radius: 8px 8px 0 0;
              }
              .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
              .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
              .content { 
                  padding: 40px 30px; 
                  background: #ffffff;
                  border: 1px solid #e0e0e0;
                  border-top: none;
              }
              .otp-code { 
                  font-size: 36px; 
                  font-weight: bold; 
                  color: #00A651; 
                  text-align: center; 
                  background: #f8f9fa; 
                  padding: 25px 20px; 
                  margin: 30px 0; 
                  border-radius: 12px;
                  border: 2px solid #E8F5E8;
                  letter-spacing: 8px;
                  font-family: 'Courier New', monospace;
              }
              .footer { 
                  text-align: center; 
                  color: #666; 
                  font-size: 14px; 
                  margin-top: 30px; 
                  padding: 20px;
                  background: #f8f9fa;
                  border-radius: 0 0 8px 8px;
              }
              .cta-text {
                  color: #00A651;
                  font-weight: 600;
                  font-size: 18px;
                  margin: 20px 0;
              }
              .warning {
                  background: #fff3cd;
                  border: 1px solid #ffeaa7;
                  border-radius: 6px;
                  padding: 15px;
                  margin: 20px 0;
                  color: #856404;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🏠 MeCabal Community</h1>
                  <p>Your Digital Neighborhood in Nigeria</p>
              </div>
              <div class="content">
                  <h2>Email Verification Code</h2>
                  <p>Hello there! 👋</p>
                  <p>Please use the following verification code to ${purposeText}:</p>
                  <div class="otp-code">${otpCode}</div>
                  <p class="cta-text">Enter this code in the MeCabal app to continue</p>
                  
                  <div class="warning">
                      <strong>⏰ This code will expire in 10 minutes.</strong><br>
                      If you didn't request this code, please ignore this email.
                  </div>
                  
                  <p>Welcome to your Nigerian neighborhood community! 🇳🇬</p>
                  <p>Need help? Reply to this email or contact our support team.</p>
              </div>
              <div class="footer">
                  <p><strong>© 2024 MeCabal</strong> • Nigerian-owned • Community-first</p>
                  <p>Building stronger communities across Nigeria</p>
                  <p>Lagos • Abuja • Port Harcourt • Kano • And growing...</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  // Mark OTP as used by ID (for atomic operations)
  async markOTPAsUsed(
    otpId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.otpVerificationRepository.update(
        { id: otpId },
        { isUsed: true },
      );

      if (result.affected === 0) {
        this.logger.warn(
          `Attempted to mark non-existent OTP as used: ${otpId}`,
        );
        return {
          success: false,
          error: 'OTP record not found',
        };
      }

      this.logger.log(`OTP marked as used: ${otpId}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to mark OTP as used:', error);
      return {
        success: false,
        error: 'Failed to mark OTP as used',
      };
    }
  }
}
