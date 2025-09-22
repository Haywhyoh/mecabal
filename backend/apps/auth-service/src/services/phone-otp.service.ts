import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OtpVerification } from '@app/database/entities/otp-verification.entity';
import { User } from '@app/database/entities/user.entity';

interface NigerianCarrier {
  name: string;
  prefixes: string[];
  color: string;
  smsGateway: string;
}

interface SmartSMSResponse {
  code?: number;
  successful?: string;
  failed?: string;
  invalid?: string;
  insufficient_unit?: string;
  units_used?: string;
  units_before?: string;
  units_after?: string;
  message_id?: string;
  ref_id?: string;
  comment?: string;
  error?: string;
}

@Injectable()
export class PhoneOtpService {
  private readonly logger = new Logger(PhoneOtpService.name);

  private readonly NIGERIAN_CARRIERS: NigerianCarrier[] = [
    {
      name: 'MTN',
      prefixes: [
        '0803',
        '0806',
        '0703',
        '0706',
        '0813',
        '0816',
        '0810',
        '0814',
        '0903',
        '0906',
      ],
      color: '#FFD700',
      smsGateway: 'mtn',
    },
    {
      name: 'Airtel',
      prefixes: [
        '0802',
        '0808',
        '0812',
        '0701',
        '0708',
        '0901',
        '0902',
        '0904',
        '0907',
      ],
      color: '#FF0000',
      smsGateway: 'airtel',
    },
    {
      name: 'Glo',
      prefixes: ['0805', '0807', '0815', '0811', '0905', '0915'],
      color: '#00FF00',
      smsGateway: 'glo',
    },
    {
      name: '9mobile',
      prefixes: ['0809', '0818', '0817', '0909', '0908'],
      color: '#00CED1',
      smsGateway: '9mobile',
    },
  ];

  constructor(
    @InjectRepository(OtpVerification)
    private otpVerificationRepository: Repository<OtpVerification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async sendPhoneOTP(
    phoneNumber: string,
    purpose: 'registration' | 'login' | 'password_reset',
    method: 'sms' | 'whatsapp' = 'sms',
    email?: string,
  ): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    carrier?: string;
    carrierColor?: string;
    expiresAt?: Date;
    otpCode?: string;
    deliveryMethod?: string;
  }> {
    try {
      // Detect Nigerian carrier
      const carrierInfo = this.detectNigerianCarrier(phoneNumber);
      if (!carrierInfo) {
        return {
          success: false,
          error: 'Unsupported Nigerian carrier',
        };
      }

      // Find existing user (should exist from email verification step)
      let user = await this.userRepository.findOne({
        where: [
          { phoneNumber },
          // For registration, also look for users with missing phone numbers (from email verification)
          ...(purpose === 'registration' && email
            ? [{ email }] // For registration, prioritize finding user by email
            : []),
        ],
        order: { createdAt: 'DESC' },
      });

      // Additional fallback: if registration and email provided, look specifically by email
      if (!user && purpose === 'registration' && email) {
        user = await this.userRepository.findOne({
          where: { email },
          order: { updatedAt: 'DESC' },
        });
        this.logger.log(`Found user by email for phone verification: ${user?.id}`);
      }

      let userId: string;

      if (!user && purpose === 'registration') {
        this.logger.error(`User not found for registration. Phone: ${phoneNumber}, Email: ${email}`);
        return {
          success: false,
          error:
            'User record not found. Please complete email verification first.',
        };
      } else if (!user && purpose === 'login') {
        return {
          success: false,
          error: 'User not found. Please register first.',
        };
      } else {
        userId = user!.id;

        // Update user with phone number and carrier info if not set
        if (!user!.phoneNumber) {
          try {
            // Check if phone number already exists for another user
            const existingPhoneUser = await this.userRepository.findOne({
              where: { phoneNumber },
            });

            if (existingPhoneUser && existingPhoneUser.id !== user!.id) {
              this.logger.error(`Phone number ${phoneNumber} already registered to another user: ${existingPhoneUser.id}`);
              return {
                success: false,
                error: 'Phone number is already registered to another account. Please use a different number.',
              };
            }

            // Update phone number and carrier if no conflict
            user!.phoneNumber = phoneNumber;
            user!.phoneCarrier = carrierInfo.name;
            await this.userRepository.save(user!);
            this.logger.log(`Updated user ${user!.id} with phone number ${phoneNumber}`);
          } catch (error) {
            this.logger.error(`Failed to update user with phone number: ${error.message}`);

            // Handle specific constraint violation
            if (error.code === '23505' && error.constraint === 'UQ_17d1817f241f10a3dbafb169fd2') {
              return {
                success: false,
                error: 'Phone number is already registered to another account. Please use a different number.',
              };
            }

            return {
              success: false,
              error: 'Failed to update phone number. Please try again.',
            };
          }
        }
      }

      // Clean up any existing OTPs for this user/purpose
      await this.otpVerificationRepository.delete({
        userId,
        contactMethod: 'phone',
        purpose,
        isUsed: false,
      });

      // Send OTP based on method
      let otpResult: string | false;
      let otpMethod: string;

      if (method === 'whatsapp') {
        this.logger.log('Sending WhatsApp OTP via Message Central');
        otpResult = await this.sendWhatsAppOTP(phoneNumber);
        otpMethod = 'WhatsApp';
      } else {
        this.logger.log('Using hardcoded SMS OTP for testing');
        otpResult = '2398'; // Hardcoded OTP for testing
        otpMethod = 'SMS';
      }

      if (!otpResult) {
        return {
          success: false,
          error: `Failed to send ${otpMethod} OTP. Please try again.`,
        };
      }

      // Store OTP/verification ID in database
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      const otpVerification = this.otpVerificationRepository.create({
        userId,
        contactMethod: 'phone',
        contactValue: phoneNumber,
        otpCode: otpResult, // Store OTP code (SMS) or verification ID (WhatsApp)
        purpose,
        expiresAt,
      });

      await this.otpVerificationRepository.save(otpVerification);

      this.logger.log(
        `${otpMethod} OTP sent successfully to ${phoneNumber} via ${carrierInfo.name}`,
      );

      return {
        success: true,
        message: `OTP sent successfully via ${otpMethod}`,
        carrier: carrierInfo.name,
        carrierColor: carrierInfo.color,
        expiresAt,
        deliveryMethod: method,
        // Include OTP in development mode (only for SMS)
        ...(process.env.NODE_ENV === 'development' &&
          method === 'sms' && { otpCode: otpResult }),
      };
    } catch (error) {
      this.logger.error('Failed to send phone OTP:', error);
      return {
        success: false,
        error: 'Failed to send OTP',
      };
    }
  }

  async verifyPhoneOTP(
    phoneNumber: string,
    otpCode: string,
    purpose: 'registration' | 'login' | 'password_reset',
  ): Promise<{
    success: boolean;
    verified: boolean;
    error?: string;
    carrier?: string;
  }> {
    try {
      // Add debug logging
      this.logger.log(
        `🔍 Starting phone OTP verification: ${phoneNumber}, purpose: ${purpose}, code: ${otpCode}`,
      );

      // Find OTP record first - this is the primary lookup
      const otpRecord = await this.otpVerificationRepository.findOne({
        where: {
          contactMethod: 'phone',
          contactValue: phoneNumber,
          purpose,
          isUsed: false,
        },
        order: { createdAt: 'DESC' },
      });

      if (!otpRecord) {
        return {
          success: false,
          verified: false,
          error: 'Invalid or expired OTP',
        };
      }

      // Find user by OTP record's userId or by phone number
      let user = null;
      if (otpRecord.userId) {
        user = await this.userRepository.findOne({
          where: { id: otpRecord.userId },
        });
      }

      // Fallback: find user by phone number if not found by userId
      if (!user) {
        user = await this.userRepository.findOne({
          where: { phoneNumber },
          order: { updatedAt: 'DESC' },
        });
      }

      // For non-registration purposes, user must exist
      if (!user && purpose !== 'registration') {
        return {
          success: false,
          verified: false,
          error: 'User not found',
        };
      }

      // Check if OTP is expired
      if (otpRecord.isExpired()) {
        await this.otpVerificationRepository.delete({ id: otpRecord.id });
        return {
          success: false,
          verified: false,
          error: 'OTP code has expired. Please request a new code.',
        };
      }

      // Verify OTP based on method used
      let verifyResult: { success: boolean; error?: string };

      // Check if this is a Message Central verification ID (WhatsApp) or SMS OTP
      if (otpRecord.otpCode.length > 6) {
        // WhatsApp OTP: verify with Message Central using verification ID
        const verificationId = otpRecord.otpCode;
        verifyResult = await this.verifyMessageCentralOTP(
          verificationId,
          otpCode,
          phoneNumber,
        );
      } else {
        // SMS OTP: verify against stored OTP code
        verifyResult = this.verifyOTPCode(otpRecord.otpCode, otpCode);
      }

      if (!verifyResult.success) {
        return {
          success: false,
          verified: false,
          error: verifyResult.error || 'Invalid OTP code',
        };
      }

      // Check if OTP is already used to prevent double verification
      if (otpRecord.isUsed) {
        this.logger.warn(
          `⚠️ Attempted to use already verified OTP for ${phoneNumber}`,
        );
        return {
          success: false,
          verified: false,
          error:
            'This OTP code has already been used. Please request a new code.',
        };
      }

      // Mark OTP as used
      otpRecord.isUsed = true;
      await this.otpVerificationRepository.save(otpRecord);

      // Update user phone verification status if this is registration
      if (purpose === 'registration' && user) {
        user.phoneVerified = true;
        // For mobile registration flow, user should be considered verified after phone verification
        // This allows them to proceed to location setup and complete registration
        user.isVerified = true;
        await this.userRepository.save(user);
      }

      this.logger.log(`📞 Phone OTP verified successfully for ${phoneNumber}`);

      const result = {
        success: true,
        verified: true,
        carrier: user?.phoneCarrier,
      };

      this.logger.log(`📤 Phone OTP service returning:`, result);

      return result;
    } catch (error) {
      this.logger.error('Failed to verify phone OTP:', error);
      return {
        success: false,
        verified: false,
        error: 'Verification failed',
      };
    }
  }

  private detectNigerianCarrier(phoneNumber: string): NigerianCarrier | null {
    // Remove country code and normalize
    let normalizedPhone = phoneNumber.replace(/^\+234/, '');
    if (normalizedPhone.startsWith('234')) {
      normalizedPhone = normalizedPhone.substring(3);
    }
    if (!normalizedPhone.startsWith('0')) {
      normalizedPhone = '0' + normalizedPhone;
    }

    const prefix = normalizedPhone.substring(0, 4);

    return (
      this.NIGERIAN_CARRIERS.find((carrier) =>
        carrier.prefixes.includes(prefix),
      ) || null
    );
  }

  // COMMENTED OUT: SmartSMS implementation - using hardcoded OTP '2398' for testing
  // TODO: Re-enable when SMS service is ready
  /*
  private async sendSmartSMSOTP(phoneNumber: string): Promise<string | false> {
    try {
      const apiToken = this.configService.get<string>('SMARTSMS_API_TOKEN');

      if (!apiToken) {
        this.logger.error('SmartSMS API token not configured');
        return false;
      }

      // Generate 4-digit OTP
      const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

      // Format phone number for SmartSMS (remove country code +234, ensure starts with 0)
      let formattedPhone = phoneNumber.replace(/^\+234/, '');

      if (formattedPhone.startsWith('234')) {
        formattedPhone = formattedPhone.substring(3);
      }

      if (!formattedPhone.startsWith('0')) {
        formattedPhone = '0' + formattedPhone;
      }

      // Create OTP message - avoiding restricted words like "code"
      const message = `Your MeCabal verification PIN is ${otpCode}. Valid for 5 minutes. Do not share this PIN with anyone.`;

      // Generate unique reference ID
      const refId = `mecabal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.logger.log(`Sending OTP via SmartSMS to: ${formattedPhone}`);

      // Prepare form data for SmartSMS regular SMS API
      const formData = new URLSearchParams();
      formData.append('token', apiToken);
      formData.append('sender', 'MeCabal');
      formData.append('to', formattedPhone);
      formData.append('message', message);
      formData.append('type', '0'); // Plain text message
      formData.append('routing', '3'); // Basic route
      formData.append('ref_id', refId);

      const response = await fetch('https://app.smartsmssolutions.com/io/api/client/v1/sms/', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('SmartSMS API request failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        return false;
      }

      const responseData: SmartSMSResponse = await response.json();
      this.logger.log('SmartSMS response:', responseData);

      // Check if SMS was sent successfully
      if (responseData.code === 1000 && responseData.comment === 'Completed Successfully') {
        this.logger.log('OTP sent successfully via SmartSMS:', {
          messageId: responseData.message_id,
          unitsUsed: responseData.units_used,
          refId: responseData.ref_id
        });

        return otpCode;
      } else {
        this.logger.error('SmartSMS delivery failed:', {
          code: responseData.code,
          comment: responseData.comment,
          failed: responseData.failed,
          error: responseData.error
        });
        return false;
      }
    } catch (error) {
      this.logger.error('SmartSMS sending error:', error);
      return false;
    }
  }
  */

  private async sendWhatsAppOTP(phoneNumber: string): Promise<string | false> {
    try {
      const authToken = this.configService.get<string>(
        'MESSAGE_CENTRAL_AUTH_TOKEN',
      );
      const customerId = this.configService.get<string>(
        'MESSAGE_CENTRAL_CUSTOMER_ID',
      );

      if (!authToken || !customerId) {
        this.logger.error('Message Central credentials not configured');
        return false;
      }

      // Format phone number for Message Central (remove country code, keep only local number)
      let formattedPhone = phoneNumber.replace(/^\+234/, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
      }

      const whatsappUrl = `https://cpaas.messagecentral.com/verification/v3/send?countryCode=234&customerId=${customerId}&flowType=WHATSAPP&mobileNumber=${formattedPhone}`;

      this.logger.log(
        `Sending WhatsApp OTP via Message Central to: ${formattedPhone}`,
      );

      const response = await fetch(whatsappUrl, {
        method: 'POST',
        headers: {
          authToken: authToken,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('Message Central WhatsApp API error:', {
          status: response.status,
          error: errorText,
        });
        return false;
      }

      const responseData = await response.json();
      this.logger.log('Message Central WhatsApp response:', responseData);

      // Check if WhatsApp OTP was sent successfully
      if (
        responseData.responseCode === 200 &&
        responseData.data?.verificationId
      ) {
        this.logger.log('WhatsApp OTP sent successfully via Message Central:', {
          verificationId: responseData.data.verificationId,
          mobileNumber: responseData.data.mobileNumber,
        });

        // Return the verification ID for storage in database
        return responseData.data.verificationId;
      } else {
        this.logger.error('Message Central WhatsApp delivery failed:', {
          responseCode: responseData.responseCode,
          message: responseData.message,
          errorMessage: responseData.data?.errorMessage,
        });
        return false;
      }
    } catch (error) {
      this.logger.error('Message Central WhatsApp sending error:', error);
      return false;
    }
  }

  private async verifyMessageCentralOTP(
    verificationId: string,
    otpCode: string,
    phoneNumber: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const authToken = this.configService.get<string>(
        'MESSAGE_CENTRAL_AUTH_TOKEN',
      );
      const customerId = this.configService.get<string>(
        'MESSAGE_CENTRAL_CUSTOMER_ID',
      );

      if (!authToken || !customerId) {
        return {
          success: false,
          error: 'Message Central credentials not configured',
        };
      }

      // Format phone number for Message Central
      let formattedPhone = phoneNumber.replace(/^\+234/, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
      }

      const verifyUrl = `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=234&mobileNumber=${formattedPhone}&verificationId=${verificationId}&customerId=${customerId}&code=${otpCode}`;

      this.logger.log(`Verifying OTP with Message Central: ${verificationId}`);

      const response = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          authToken: authToken,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('Message Central OTP verification failed:', {
          status: response.status,
          error: errorText,
        });
        return { success: false, error: 'OTP verification failed' };
      }

      const responseData = await response.json();
      this.logger.log(
        'Message Central OTP verification response:',
        responseData,
      );

      if (
        responseData.responseCode === 200 &&
        responseData.data?.verificationStatus === 'VERIFICATION_COMPLETED'
      ) {
        return { success: true };
      } else {
        return {
          success: false,
          error:
            responseData.message ||
            responseData.data?.errorMessage ||
            'Invalid OTP code',
        };
      }
    } catch (error) {
      this.logger.error('Error verifying OTP with Message Central:', error);
      return { success: false, error: 'OTP verification error' };
    }
  }

  private verifyOTPCode(
    storedOTP: string,
    inputOTP: string,
  ): { success: boolean; error?: string } {
    try {
      if (!storedOTP || !inputOTP) {
        return { success: false, error: 'Missing OTP codes' };
      }

      if (storedOTP.trim() === inputOTP.trim()) {
        this.logger.log('OTP verification successful');
        return { success: true };
      } else {
        this.logger.log('OTP verification failed: codes do not match');
        return { success: false, error: 'Invalid OTP code' };
      }
    } catch (error) {
      this.logger.error('Error verifying OTP:', error);
      return { success: false, error: 'OTP verification error' };
    }
  }
}
