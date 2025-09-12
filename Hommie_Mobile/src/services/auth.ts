// MeCabal Authentication Service
// Nigerian-specific authentication with phone verification

import { supabase, handleSupabaseError, logPerformance } from './supabase';
// import { MockOTPService } from './mockOTP'; // Replaced with real Resend integration
import type { 
  NigerianUser, 
  ApiResponse, 
  OTPResponse, 
  VerifyOTPResponse,
  AuthResponse 
} from '../types/supabase';
import type { NigerianCarrier } from '../types/nigerian';

export class MeCabalAuth {
  // Send OTP to Nigerian phone number
  static async sendOTP(
    phoneNumber: string, 
    purpose: 'registration' | 'login' | 'password_reset' = 'registration'
  ): Promise<OTPResponse> {
    const startTime = Date.now();
    
    try {
      // Validate phone number format
      if (!this.isValidNigerianPhone(phoneNumber)) {
        return {
          success: false,
          error: 'Invalid Nigerian phone number. Use format +234XXXXXXXXXX'
        };
      }

      // Use Nigerian phone verification edge function for real SMS
      const { data, error } = await supabase.functions.invoke('nigerian-phone-verify', {
        body: {
          phone: phoneNumber,
          purpose
        }
      });

      logPerformance('sendOTP', startTime);

      if (error || !data) {
        console.error('SMS OTP edge function error:', error);
        return {
          success: false,
          error: error?.message || 'Failed to send SMS OTP'
        };
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Failed to send SMS OTP'
        };
      }

      // Extract carrier info from response for user feedback
      const carrierInfo = data.carrier ? {
        name: data.carrier,
        color: data.carrier_color || '#00A651'
      } : null;

      return {
        success: true,
        message: data.message || 'SMS OTP sent successfully to your phone',
        expires_at: data.expires_at || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        carrier: carrierInfo
      };
    } catch (error: any) {
      logPerformance('sendOTP', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Verify OTP code
  static async verifyOTP(
    phoneNumber: string, 
    otpCode: string, 
    purpose: 'registration' | 'login' | 'password_reset' = 'registration'
  ): Promise<VerifyOTPResponse> {
    const startTime = Date.now();
    
    try {
      // Use Nigerian phone verification edge function for SMS OTP verification
      const { data, error } = await supabase.functions.invoke('nigerian-phone-verify', {
        body: {
          phone: phoneNumber,
          otp_code: otpCode,
          purpose,
          verify: true
        }
      });

      logPerformance('verifyOTP', startTime);

      if (error || !data) {
        console.error('SMS OTP verification error:', error);
        return {
          success: false,
          verified: false,
          error: error?.message || 'Failed to verify SMS OTP'
        };
      }

      if (!data.success) {
        return {
          success: false,
          verified: false,
          error: data.error || 'Invalid or expired OTP code'
        };
      }

      return {
        success: true,
        verified: true,
        message: data.message || 'Phone number verified successfully',
        carrier: data.carrier
      };
    } catch (error: any) {
      logPerformance('verifyOTP', startTime);
      return {
        success: false,
        verified: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Create user account after OTP verification
  static async createUser(userData: {
    phone_number: string;
    email?: string;
    first_name: string;
    last_name: string;
    state_of_origin?: string;
    preferred_language?: string;
    carrier_info?: NigerianCarrier;
  }): Promise<AuthResponse> {
    const startTime = Date.now();
    
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', userData.phone_number)
        .single();

      if (existingUser) {
        return {
          success: false,
          error: 'User with this phone number already exists'
        };
      }

      // Create auth user with email (required for Supabase Auth)
      const tempEmail = userData.email || `${userData.phone_number.replace(/^\+234/, '0').replace(/^234/, '0')}@mecabal.temp`;
      const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
        phone: userData.phone_number,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
          }
        }
      });

      if (authError) {
        return {
          success: false,
          error: handleSupabaseError(authError)
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Failed to create user account'
        };
      }

      // Create user profile in users table
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          phone_number: userData.phone_number,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          state_of_origin: userData.state_of_origin,
          preferred_language: userData.preferred_language || 'en',
          carrier_info: userData.carrier_info,
          is_verified: true, // Already verified via OTP
          verification_level: 1
        })
        .select()
        .single();

      logPerformance('createUser', startTime);

      if (userError) {
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return {
          success: false,
          error: handleSupabaseError(userError)
        };
      }

      return {
        success: true,
        user: user as NigerianUser,
        session: authData.session
      };
    } catch (error: any) {
      logPerformance('createUser', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Login with phone number (triggers OTP)
  static async loginWithPhone(phoneNumber: string): Promise<ApiResponse<any>> {
    const startTime = Date.now();
    
    try {
      // Check if user exists
      const { data: user } = await supabase
        .from('users')
        .select('id, email')
        .eq('phone_number', phoneNumber)
        .single();

      if (!user) {
        return {
          success: false,
          error: 'User not found. Please register first.'
        };
      }

      // Send OTP for login
      const otpResult = await this.sendOTP(phoneNumber, 'login');
      
      logPerformance('loginWithPhone', startTime);
      
      return otpResult;
    } catch (error: any) {
      logPerformance('loginWithPhone', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Complete login after OTP verification
  static async completeLogin(phoneNumber: string): Promise<AuthResponse> {
    const startTime = Date.now();
    
    try {
      // Get user data
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (userError || !user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Get current session (should exist after OTP verification)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      logPerformance('completeLogin', startTime);

      if (sessionError) {
        return {
          success: false,
          error: handleSupabaseError(sessionError)
        };
      }

      return {
        success: true,
        user: user as NigerianUser,
        session
      };
    } catch (error: any) {
      logPerformance('completeLogin', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Get current authenticated user
  static async getCurrentUser(): Promise<NigerianUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return profile as NigerianUser;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Update user profile
  static async updateProfile(
    userId: string, 
    updates: Partial<NigerianUser>
  ): Promise<ApiResponse<NigerianUser>> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      logPerformance('updateProfile', startTime);

      if (error) {
        return {
          success: false,
          error: handleSupabaseError(error)
        };
      }

      return {
        success: true,
        data: data as NigerianUser
      };
    } catch (error: any) {
      logPerformance('updateProfile', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  // Check if user session is valid
  static async isSessionValid(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      return !error && !!session && new Date(session.expires_at!) > new Date();
    } catch {
      return false;
    }
  }

  // Refresh session
  static async refreshSession(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      return !error && !!data.session;
    } catch {
      return false;
    }
  }

  // Helper: Validate Nigerian phone number
  private static isValidNigerianPhone(phone: string): boolean {
    // Nigerian phone format: +234XXXXXXXXXX (where X are digits)
    const nigerianPhoneRegex = /^\+234[789][01]\d{8}$/;
    return nigerianPhoneRegex.test(phone);
  }

  // Helper: Extract carrier from phone number
  static extractCarrierFromPhone(phone: string): NigerianCarrier['name'] | null {
    const carriers: { [key: string]: NigerianCarrier['name'] } = {
      '0803': 'MTN', '0806': 'MTN', '0703': 'MTN', '0706': 'MTN',
      '0813': 'MTN', '0816': 'MTN', '0810': 'MTN', '0814': 'MTN',
      '0903': 'MTN', '0906': 'MTN',
      
      '0802': 'Airtel', '0808': 'Airtel', '0812': 'Airtel', '0701': 'Airtel',
      '0708': 'Airtel', '0901': 'Airtel', '0902': 'Airtel', '0904': 'Airtel',
      '0907': 'Airtel',
      
      '0805': 'Glo', '0807': 'Glo', '0815': 'Glo', '0811': 'Glo',
      '0905': 'Glo', '0915': 'Glo',
      
      '0809': '9mobile', '0818': '9mobile', '0817': '9mobile',
      '0909': '9mobile', '0908': '9mobile'
    };

    // Remove country code and normalize
    let normalizedPhone = phone.replace(/^\+234/, '');
    if (normalizedPhone.startsWith('234')) {
      normalizedPhone = normalizedPhone.substring(3);
    }
    if (!normalizedPhone.startsWith('0')) {
      normalizedPhone = '0' + normalizedPhone;
    }

    const prefix = normalizedPhone.substring(0, 4);
    return carriers[prefix] || null;
  }

  // Helper: Format Nigerian phone number for display
  static formatNigerianPhone(phone: string): string {
    // Convert +234XXXXXXXXXX to +234 XXX XXX XXXX
    if (phone.length === 14 && phone.startsWith('+234')) {
      return `+234 ${phone.substring(4, 7)} ${phone.substring(7, 10)} ${phone.substring(10)}`;
    }
    return phone;
  }

  // Email Authentication Methods (Using Supabase Built-in Auth)
  
  // Send OTP to email address using Supabase's built-in email OTP
  static async sendEmailOTP(
    email: string, 
    purpose: 'registration' | 'login' | 'password_reset' = 'registration'
  ): Promise<OTPResponse> {
    const startTime = Date.now();
    
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        return {
          success: false,
          error: 'Invalid email address format'
        };
      }

      // Use Supabase Edge Function with Resend integration
      const { data, error } = await supabase.functions.invoke('email-otp-verify', {
        body: {
          email,
          purpose
        }
      });

      logPerformance('sendEmailOTP', startTime);

      if (error || !data) {
        console.error('Edge function error:', error);
        return {
          success: false,
          error: error?.message || 'Failed to send OTP email'
        };
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Failed to send OTP email'
        };
      }

      return {
        success: true,
        message: data.message || 'OTP code sent to your email address',
        expires_at: data.expires_at || new Date(Date.now() + 10 * 60 * 1000).toISOString()
      };
    } catch (error: any) {
      logPerformance('sendEmailOTP', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Verify email OTP code using Supabase's built-in verification
  static async verifyEmailOTP(
    email: string, 
    otpCode: string, 
    purpose: 'registration' | 'login' | 'password_reset' = 'registration'
  ): Promise<VerifyOTPResponse> {
    const startTime = Date.now();
    
    try {
      // Use Supabase Edge Function to verify OTP code
      const { data, error } = await supabase.functions.invoke('email-otp-verify', {
        body: {
          email,
          otp_code: otpCode,
          purpose,
          verify: true
        }
      });

      logPerformance('verifyEmailOTP', startTime);

      if (error || !data) {
        console.error('Edge function verify error:', error);
        return {
          success: false,
          verified: false,
          error: error?.message || 'Failed to verify OTP code'
        };
      }

      return {
        success: data.success,
        verified: data.verified || false,
        message: data.message || (data.success ? 'OTP verified successfully' : 'Invalid OTP code')
      };
    } catch (error: any) {
      logPerformance('verifyEmailOTP', startTime);
      return {
        success: false,
        verified: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Create user account after both email and phone verification are complete
  static async createUserAfterVerification(userData: {
    email: string;
    phone_number?: string;
    first_name: string;
    last_name: string;
    state_of_origin?: string;
    preferred_language?: string;
  }): Promise<AuthResponse> {
    const startTime = Date.now();
    
    try {
      // Create a temporary password for Supabase auth
      const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create auth user with email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: tempPassword,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
          }
        }
      });

      if (authError) {
        return {
          success: false,
          error: handleSupabaseError(authError)
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Failed to create user account'
        };
      }

      // Create user profile in users table
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          phone_number: userData.phone_number,
          first_name: userData.first_name,
          last_name: userData.last_name,
          state_of_origin: userData.state_of_origin,
          preferred_language: userData.preferred_language || 'en',
          is_verified: true, // Already verified via OTP
          verification_level: userData.phone_number ? 2 : 1, // 2 if both email and phone, 1 if just email
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      logPerformance('createUserAfterVerification', startTime);

      if (userError) {
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return {
          success: false,
          error: handleSupabaseError(userError)
        };
      }

      return {
        success: true,
        user: user as NigerianUser,
        session: authData.session
      };
    } catch (error: any) {
      logPerformance('createUserAfterVerification', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Login with email (triggers OTP) - simplified to use Supabase built-in
  static async loginWithEmail(email: string): Promise<ApiResponse<any>> {
    const startTime = Date.now();
    
    try {
      // Send OTP for login - Supabase will check if user exists
      const otpResult = await this.sendEmailOTP(email, 'login');
      
      logPerformance('loginWithEmail', startTime);
      
      return otpResult;
    } catch (error: any) {
      logPerformance('loginWithEmail', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Complete email login after OTP verification - simplified
  static async completeEmailLogin(): Promise<AuthResponse> {
    const startTime = Date.now();
    
    try {
      // Get current user and session (should exist after OTP verification)
      const { data: { user: authUser }, error: getUserError } = await supabase.auth.getUser();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (getUserError || !authUser) {
        return {
          success: false,
          error: 'User not found. Please verify your email first.'
        };
      }

      if (sessionError || !session) {
        return {
          success: false,
          error: 'Session not found. Please verify your email first.'
        };
      }

      // Get user profile data
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      logPerformance('completeEmailLogin', startTime);

      if (userError) {
        // User might not have completed profile setup
        return {
          success: true,
          user: {
            id: authUser.id,
            email: authUser.email!,
            first_name: authUser.user_metadata?.first_name || '',
            last_name: authUser.user_metadata?.last_name || '',
            is_verified: true,
            verification_level: 1
          } as NigerianUser,
          session: session,
          needsProfileCompletion: true
        };
      }

      return {
        success: true,
        user: user as NigerianUser,
        session
      };
    } catch (error: any) {
      logPerformance('completeEmailLogin', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Authenticate with OTP and create proper Supabase session
  static async authenticateWithOTP(
    email: string,
    otpCode: string,
    purpose: 'registration' | 'login',
    userMetadata?: {
      first_name?: string;
      last_name?: string;
      phone_number?: string;
      state_of_origin?: string;
      preferred_language?: string;
    }
  ): Promise<AuthResponse> {
    const startTime = Date.now();
    
    try {
      // Use the auth-with-otp edge function to verify OTP and create session
      const { data, error } = await supabase.functions.invoke('auth-with-otp', {
        body: {
          email,
          otp_code: otpCode,
          purpose,
          user_metadata: userMetadata
        }
      });

      logPerformance('authenticateWithOTP', startTime);

      if (error || !data) {
        console.error('Auth with OTP error:', error);
        return {
          success: false,
          error: error?.message || 'Authentication failed'
        };
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Authentication failed'
        };
      }

      // After successful authentication, get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('Session retrieval error after auth:', sessionError);
      }

      return {
        success: true,
        user: data.user as NigerianUser,
        session: session,
        message: data.message
      };
    } catch (error: any) {
      logPerformance('authenticateWithOTP', startTime);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  // Helper: Validate email format
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}