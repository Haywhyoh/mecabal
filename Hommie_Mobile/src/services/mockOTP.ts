// Mock OTP Service for Development
// Simulates SMS OTP sending for Nigerian phone numbers

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OTPResponse, VerifyOTPResponse } from '../types/supabase';

interface StoredOTP {
  code: string;
  phone: string;
  purpose: string;
  expiresAt: number;
  attempts: number;
}

export class MockOTPService {
  private static readonly OTP_STORAGE_KEY = 'mock_otp_codes';
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly OTP_EXPIRY_MINUTES = 10;

  // Generate a random 6-digit OTP code
  private static generateOTPCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Get carrier information from Nigerian phone number
  private static getCarrierInfo(phone: string): { carrier: string; color: string } {
    const carriers = {
      '0803': { carrier: 'MTN', color: '#FFC720' },
      '0806': { carrier: 'MTN', color: '#FFC720' },
      '0703': { carrier: 'MTN', color: '#FFC720' },
      '0706': { carrier: 'MTN', color: '#FFC720' },
      '0813': { carrier: 'MTN', color: '#FFC720' },
      '0816': { carrier: 'MTN', color: '#FFC720' },
      '0810': { carrier: 'MTN', color: '#FFC720' },
      '0814': { carrier: 'MTN', color: '#FFC720' },
      '0903': { carrier: 'MTN', color: '#FFC720' },
      '0906': { carrier: 'MTN', color: '#FFC720' },
      
      '0802': { carrier: 'Airtel', color: '#FF0000' },
      '0808': { carrier: 'Airtel', color: '#FF0000' },
      '0812': { carrier: 'Airtel', color: '#FF0000' },
      '0701': { carrier: 'Airtel', color: '#FF0000' },
      '0708': { carrier: 'Airtel', color: '#FF0000' },
      '0901': { carrier: 'Airtel', color: '#FF0000' },
      '0902': { carrier: 'Airtel', color: '#FF0000' },
      '0904': { carrier: 'Airtel', color: '#FF0000' },
      '0907': { carrier: 'Airtel', color: '#FF0000' },
      
      '0805': { carrier: 'Glo', color: '#00AF50' },
      '0807': { carrier: 'Glo', color: '#00AF50' },
      '0815': { carrier: 'Glo', color: '#00AF50' },
      '0811': { carrier: 'Glo', color: '#00AF50' },
      '0905': { carrier: 'Glo', color: '#00AF50' },
      '0915': { carrier: 'Glo', color: '#00AF50' },
      
      '0809': { carrier: '9mobile', color: '#00A86B' },
      '0818': { carrier: '9mobile', color: '#00A86B' },
      '0817': { carrier: '9mobile', color: '#00A86B' },
      '0909': { carrier: '9mobile', color: '#00A86B' },
      '0908': { carrier: '9mobile', color: '#00A86B' }
    };

    // Normalize phone number
    let normalizedPhone = phone.replace(/^\+234/, '');
    if (normalizedPhone.startsWith('234')) {
      normalizedPhone = normalizedPhone.substring(3);
    }
    if (!normalizedPhone.startsWith('0')) {
      normalizedPhone = '0' + normalizedPhone;
    }

    const prefix = normalizedPhone.substring(0, 4);
    return carriers[prefix] || { carrier: 'Unknown', color: '#666666' };
  }

  // Store OTP code in AsyncStorage
  private static async storeOTP(storedOTP: StoredOTP): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(this.OTP_STORAGE_KEY);
      const otpData = existingData ? JSON.parse(existingData) : {};
      
      otpData[storedOTP.phone] = storedOTP;
      
      await AsyncStorage.setItem(this.OTP_STORAGE_KEY, JSON.stringify(otpData));
    } catch (error) {
      console.error('Error storing OTP:', error);
    }
  }

  // Retrieve OTP code from AsyncStorage
  private static async getStoredOTP(phone: string): Promise<StoredOTP | null> {
    try {
      const existingData = await AsyncStorage.getItem(this.OTP_STORAGE_KEY);
      if (!existingData) return null;
      
      const otpData = JSON.parse(existingData);
      return otpData[phone] || null;
    } catch (error) {
      console.error('Error retrieving OTP:', error);
      return null;
    }
  }

  // Clean expired OTP codes
  private static async cleanExpiredOTPs(): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(this.OTP_STORAGE_KEY);
      if (!existingData) return;
      
      const otpData = JSON.parse(existingData);
      const now = Date.now();
      const cleanedData = {};
      
      for (const [phone, storedOTP] of Object.entries(otpData)) {
        if ((storedOTP as StoredOTP).expiresAt > now) {
          cleanedData[phone] = storedOTP;
        }
      }
      
      await AsyncStorage.setItem(this.OTP_STORAGE_KEY, JSON.stringify(cleanedData));
    } catch (error) {
      console.error('Error cleaning expired OTPs:', error);
    }
  }

  // Send OTP (Mock implementation)
  static async sendOTP(
    phoneNumber: string,
    purpose: 'registration' | 'login' | 'password_reset' = 'registration'
  ): Promise<OTPResponse> {
    // Clean expired OTPs first
    await this.cleanExpiredOTPs();

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const otpCode = this.generateOTPCode();
    const carrierInfo = this.getCarrierInfo(phoneNumber);
    const expiresAt = Date.now() + (this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store the OTP code
    await this.storeOTP({
      code: otpCode,
      phone: phoneNumber,
      purpose,
      expiresAt,
      attempts: 0
    });

    // Log the OTP code for development (remove in production)
    console.log(`🔐 Mock OTP for ${phoneNumber}: ${otpCode}`);

    return {
      success: true,
      carrier: carrierInfo.carrier,
      carrier_color: carrierInfo.color,
      message: `SMS sent to ${phoneNumber} via ${carrierInfo.carrier}`,
      expires_at: new Date(expiresAt).toISOString(),
      // For development: include OTP in response (remove in production)
      otp_code: otpCode
    };
  }

  // Verify OTP (Mock implementation)
  static async verifyOTP(
    phoneNumber: string,
    otpCode: string,
    purpose: 'registration' | 'login' | 'password_reset' = 'registration'
  ): Promise<VerifyOTPResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    const storedOTP = await this.getStoredOTP(phoneNumber);

    if (!storedOTP) {
      return {
        success: false,
        verified: false,
        error: 'No OTP found. Please request a new code.'
      };
    }

    // Check if OTP has expired
    if (storedOTP.expiresAt <= Date.now()) {
      return {
        success: false,
        verified: false,
        error: 'OTP has expired. Please request a new code.'
      };
    }

    // Check if maximum attempts exceeded
    if (storedOTP.attempts >= this.MAX_ATTEMPTS) {
      return {
        success: false,
        verified: false,
        error: 'Maximum verification attempts exceeded. Please request a new code.'
      };
    }

    // Check if OTP matches
    if (storedOTP.code !== otpCode) {
      // Increment attempts
      storedOTP.attempts++;
      await this.storeOTP(storedOTP);

      const remainingAttempts = this.MAX_ATTEMPTS - storedOTP.attempts;
      return {
        success: false,
        verified: false,
        error: `Invalid OTP code. ${remainingAttempts} attempts remaining.`
      };
    }

    // Check if purpose matches
    if (storedOTP.purpose !== purpose) {
      return {
        success: false,
        verified: false,
        error: 'OTP purpose mismatch.'
      };
    }

    // OTP is valid - clean it up
    await this.cleanUpOTP(phoneNumber);

    const carrierInfo = this.getCarrierInfo(phoneNumber);

    return {
      success: true,
      verified: true,
      carrier: carrierInfo.carrier,
      message: 'Phone number verified successfully'
    };
  }

  // Clean up specific OTP
  private static async cleanUpOTP(phone: string): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(this.OTP_STORAGE_KEY);
      if (!existingData) return;
      
      const otpData = JSON.parse(existingData);
      delete otpData[phone];
      
      await AsyncStorage.setItem(this.OTP_STORAGE_KEY, JSON.stringify(otpData));
    } catch (error) {
      console.error('Error cleaning up OTP:', error);
    }
  }

  // Get remaining time for OTP (helper for UI)
  static async getOTPRemainingTime(phoneNumber: string): Promise<number> {
    const storedOTP = await this.getStoredOTP(phoneNumber);
    if (!storedOTP) return 0;
    
    const remainingTime = Math.max(0, storedOTP.expiresAt - Date.now());
    return Math.floor(remainingTime / 1000); // Return seconds
  }

  // Check if phone number can request new OTP (rate limiting)
  static async canRequestNewOTP(phoneNumber: string): Promise<boolean> {
    const storedOTP = await this.getStoredOTP(phoneNumber);
    if (!storedOTP) return true;
    
    // Allow new OTP if current one expired or if 1 minute has passed
    const timeSinceCreation = Date.now() - (storedOTP.expiresAt - (this.OTP_EXPIRY_MINUTES * 60 * 1000));
    return storedOTP.expiresAt <= Date.now() || timeSinceCreation >= 60000;
  }

  // Clear all OTPs (utility method)
  static async clearAllOTPs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.OTP_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing OTPs:', error);
    }
  }
}