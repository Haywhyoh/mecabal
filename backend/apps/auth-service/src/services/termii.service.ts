import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface TermiiSendTokenResponse {
  smsStatus: string;
  phone_number: string;
  to: string;
  pinId: string;
  pin_id: string;
  message_id_str: string;
  status: string;
}

interface TermiiWhatsAppTokenResponse {
  code: string;
  balance: number;
  message_id: string;
  message: string;
  user: string;
  message_id_str: string;
}

interface TermiiVerifyTokenResponse {
  pinId: string;
  verified: boolean | string;
  msisdn: string;
}

interface TermiiSMSResponse {
  message_id: string;
  message: string;
  balance: number;
  user: string;
}

@Injectable()
export class TermiiService {
  private readonly logger = new Logger(TermiiService.name);
  private readonly baseUrl = 'https://api.ng.termii.com/api';
  private readonly apiKey: string | undefined;
  private readonly senderId: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('TERMII_API_KEY');
    this.senderId = this.configService.get<string>('TERMII_SENDER_ID', 'MeCabal');

    if (!this.apiKey) {
      this.logger.warn('TERMII_API_KEY not configured. Termii service will not work.');
    }
  }

  async sendToken(
    phoneNumber: string,
    channel: 'generic' | 'dnd' | 'whatsapp' = 'dnd',
    pinLength: number = 4,
    pinPlaceholder: string = '< 1234 >',
    messageText: string = 'Your MeCabal verification code is < 1234 >. Valid for 5 minutes.',
    pinTimeToLive: number = 5,
  ): Promise<TermiiSendTokenResponse> {
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;

      const response = await axios.post<TermiiSendTokenResponse>(
        `${this.baseUrl}/sms/otp/send`,
        {
          api_key: this.apiKey,
          message_type: 'NUMERIC',
          to: formattedPhone,
          from: this.senderId,
          channel,
          pin_attempts: 3,
          pin_time_to_live: pinTimeToLive,
          pin_length: pinLength,
          pin_placeholder: pinPlaceholder,
          message_text: messageText,
          pin_type: 'NUMERIC',
        },
      );

      const verificationId = response.data.pinId || response.data.pin_id;
      this.logger.log(`OTP sent to ${formattedPhone} via ${channel}. ID: ${verificationId}, Status: ${response.data.smsStatus}`);

      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data || {};
      const errorMessage = errorData.message || errorData.error || error.message || 'Unknown error';
      
      this.logger.error('Failed to send OTP:', {
        status: error.response?.status,
        error: errorMessage,
        data: errorData,
      });
      
      // Preserve the original error message for better debugging
      const errorToThrow = new Error(`Failed to send OTP: ${errorMessage}`);
      (errorToThrow as any).response = error.response;
      (errorToThrow as any).originalError = error;
      throw errorToThrow;
    }
  }

  async sendWhatsAppToken(
    phoneNumber: string,
    pinLength: number = 4,
    pinPlaceholder: string = '< 1234 >',
    messageText: string = 'Your MeCabal verification code is < 1234 >. Valid for 5 minutes.',
    pinTimeToLive: number = 5,
  ): Promise<TermiiWhatsAppTokenResponse> {
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;

      const response = await axios.post<TermiiWhatsAppTokenResponse>(
        `${this.baseUrl}/sms/otp/send`,
        {
          api_key: this.apiKey,
          message_type: 'NUMERIC',
          to: formattedPhone,
          from: this.senderId,
          channel: 'whatsapp',
          pin_attempts: 3,
          pin_time_to_live: pinTimeToLive,
          pin_length: pinLength,
          pin_placeholder: pinPlaceholder,
          message_text: messageText,
          pin_type: 'NUMERIC',
        },
      );

      const verificationId = response.data.message_id || response.data.message_id_str;
      this.logger.log(`WhatsApp OTP sent to ${formattedPhone}. ID: ${verificationId}, Code: ${response.data.code}`);

      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to send WhatsApp OTP:', error.response?.data || error.message);
      throw new Error('Failed to send WhatsApp OTP');
    }
  }

  async verifyToken(pinId: string, pin: string): Promise<TermiiVerifyTokenResponse> {
    try {
      const response = await axios.post<TermiiVerifyTokenResponse>(
        `${this.baseUrl}/sms/otp/verify`,
        {
          api_key: this.apiKey,
          pin_id: pinId,
          pin,
        },
      );

      const verified = response.data.verified === true || response.data.verified === 'True';
      this.logger.log(`OTP verification for ${pinId}: ${verified}`);

      return {
        ...response.data,
        verified,
      };
    } catch (error: any) {
      this.logger.error('Failed to verify OTP:', error.response?.data || error.message);
      throw new Error('Failed to verify OTP');
    }
  }

  async sendSMS(phoneNumber: string, message: string): Promise<TermiiSMSResponse> {
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;

      const response = await axios.post<TermiiSMSResponse>(
        `${this.baseUrl}/sms/send`,
        {
          api_key: this.apiKey,
          to: formattedPhone,
          from: this.senderId,
          sms: message,
          type: 'plain',
          channel: 'generic',
        },
      );

      this.logger.log(`SMS sent to ${formattedPhone}`);
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to send SMS:', error.response?.data || error.message);
      throw new Error('Failed to send SMS');
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}
