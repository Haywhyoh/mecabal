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
    this.initializeEmailTransporter();
  }

  private initializeEmailTransporter() {
    // Initialize Brevo (formerly SendinBlue) SMTP
    const brevoApiKey = this.configService.get<string>('BREVO_API_KEY');
    
    if (brevoApiKey) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
          user: this.configService.get<string>('BREVO_SMTP_USER'),
          pass: brevoApiKey,
        },
      });
    } else {
      this.logger.warn('Brevo API key not configured, email OTP will not work');
    }
  }

  async sendEmailOTP(
    email: string,
    purpose: 'registration' | 'login' | 'password_reset'
  ): Promise<{ success: boolean; message?: string; error?: string; expiresAt?: Date; otpCode?: string }> {
    try {
      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Find or create user for OTP tracking (don't create full user yet)
      let user = await this.userRepository.findOne({ where: { email } });
      let userId: string;

      if (!user && purpose === 'registration') {
        // Create minimal user record for OTP tracking during registration
        const tempUser = this.userRepository.create({
          email,
          firstName: '',
          lastName: '',
          passwordHash: '', // Will be set during actual registration
          phoneVerified: false,
          isVerified: false,
        });
        user = await this.userRepository.save(tempUser);
        userId = user.id;
      } else if (!user && purpose === 'login') {
        return {
          success: false,
          error: 'User not found. Please register first.'
        };
      } else {
        userId = user!.id;
      }

      // Clean up any existing OTPs for this user/purpose
      await this.otpVerificationRepository.delete({
        userId,
        contactMethod: 'email',
        purpose,
        isUsed: false,
      });

      // Create new OTP verification record
      const otpVerification = this.otpVerificationRepository.create({
        userId,
        contactMethod: 'email',
        contactValue: email,
        otpCode,
        purpose,
        expiresAt,
      });

      await this.otpVerificationRepository.save(otpVerification);

      // Send email
      const emailSent = await this.sendEmailViaBrevo(email, otpCode, purpose);
      
      if (!emailSent.success) {
        return {
          success: false,
          error: emailSent.error || 'Failed to send email'
        };
      }

      this.logger.log(`Email OTP sent successfully to ${email} for ${purpose}`);

      return {
        success: true,
        message: 'OTP code sent successfully',
        expiresAt,
        // Include OTP in development mode
        ...(process.env.NODE_ENV === 'development' && { otpCode })
      };

    } catch (error) {
      this.logger.error('Failed to send email OTP:', error);
      return {
        success: false,
        error: 'Failed to send OTP'
      };
    }
  }

  async verifyEmailOTP(
    email: string,
    otpCode: string,
    purpose: 'registration' | 'login' | 'password_reset'
  ): Promise<{ success: boolean; verified: boolean; error?: string }> {
    try {
      // Find user by email
      const user = await this.userRepository.findOne({ where: { email } });
      
      if (!user) {
        return {
          success: false,
          verified: false,
          error: 'User not found'
        };
      }

      // Find valid OTP record
      const otpRecord = await this.otpVerificationRepository.findOne({
        where: {
          userId: user.id,
          contactMethod: 'email',
          contactValue: email,
          purpose,
          isUsed: false,
        },
        order: { createdAt: 'DESC' }
      });

      if (!otpRecord) {
        return {
          success: false,
          verified: false,
          error: 'OTP not found or already used'
        };
      }

      // Check if OTP is expired
      if (otpRecord.isExpired()) {
        // Clean up expired OTP
        await this.otpVerificationRepository.delete({ id: otpRecord.id });
        return {
          success: false,
          verified: false,
          error: 'OTP code has expired. Please request a new code.'
        };
      }

      // Verify OTP code
      if (otpRecord.otpCode !== otpCode) {
        return {
          success: false,
          verified: false,
          error: 'Invalid OTP code'
        };
      }

      // Mark OTP as used
      otpRecord.isUsed = true;
      await this.otpVerificationRepository.save(otpRecord);

      this.logger.log(`Email OTP verified successfully for ${email}`);

      return {
        success: true,
        verified: true
      };

    } catch (error) {
      this.logger.error('Failed to verify email OTP:', error);
      return {
        success: false,
        verified: false,
        error: 'Failed to verify OTP'
      };
    }
  }

  private async sendEmailViaBrevo(
    email: string,
    otpCode: string,
    purpose: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.transporter) {
        return { success: false, error: 'Email service not configured' };
      }

      const subject = this.getEmailSubject(purpose);
      const htmlContent = this.getEmailTemplate(otpCode, purpose);

      const mailOptions = {
        from: {
          name: 'MeCabal Community',
          address: this.configService.get<string>('BREVO_FROM_EMAIL', 'noreply@mecabal.com')
        },
        to: email,
        subject,
        html: htmlContent,
        // Add tracking for Brevo
        headers: {
          'X-Mailin-Custom': JSON.stringify({
            purpose,
            timestamp: new Date().toISOString()
          })
        }
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully via Brevo: ${result.messageId}`);
      
      return { success: true };

    } catch (error) {
      this.logger.error('Failed to send email via Brevo:', error);
      return { success: false, error: 'Email service error' };
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
    const purposeText = purpose === 'registration' ? 'complete your registration' : 
                       purpose === 'login' ? 'sign in to your account' : 
                       'reset your password';

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
}