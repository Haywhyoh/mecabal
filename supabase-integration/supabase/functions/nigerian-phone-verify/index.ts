import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Nigerian carrier detection and SMS service
interface NigerianCarrier {
  name: string;
  prefixes: string[];
  color: string;
  smsGateway: string;
}

const NIGERIAN_CARRIERS: NigerianCarrier[] = [
  {
    name: 'MTN',
    prefixes: ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906'],
    color: '#FFD700',
    smsGateway: 'mtn'
  },
  {
    name: 'Airtel',
    prefixes: ['0802', '0808', '0812', '0701', '0708', '0901', '0902', '0904', '0907'],
    color: '#FF0000',
    smsGateway: 'airtel'
  },
  {
    name: 'Glo',
    prefixes: ['0805', '0807', '0815', '0811', '0905', '0915'],
    color: '#00FF00',
    smsGateway: 'glo'
  },
  {
    name: '9mobile',
    prefixes: ['0809', '0818', '0817', '0909', '0908'],
    color: '#00CED1',
    smsGateway: '9mobile'
  }
];

function detectNigerianCarrier(phoneNumber: string): NigerianCarrier | null {
  // Remove country code and normalize
  let normalizedPhone = phoneNumber.replace(/^\+234/, '');
  if (normalizedPhone.startsWith('234')) {
    normalizedPhone = normalizedPhone.substring(3);
  }
  if (!normalizedPhone.startsWith('0')) {
    normalizedPhone = '0' + normalizedPhone;
  }

  const prefix = normalizedPhone.substring(0, 4);
  
  return NIGERIAN_CARRIERS.find(carrier => 
    carrier.prefixes.includes(prefix)
  ) || null;
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOTP(otp: string): string {
  // Simple hash for demo - in production use proper crypto
  return btoa(otp + 'mecabal_salt');
}

// SmartSMS Solutions regular SMS API integration
interface SmartSMSResponse {
  code?: number;
  successful?: string;
  basic_successful?: string;
  corp_successful?: string;
  failed?: string;
  invalid?: string;
  insufficient_unit?: string;
  all_numbers?: string;
  dnd_numbers?: string;
  nondnd_numbers?: string;
  units_used?: string;
  units_calculated?: string;
  units_before?: string;
  units_after?: string;
  sms_pages?: number;
  message_id?: string;
  ref_id?: string;
  comment?: string;
  error?: string;
}

// Send OTP via SmartSMS Solutions regular SMS API
async function sendSmartSMSOTP(phoneNumber: string): Promise<string | false> {
  try {
    const apiToken = Deno.env.get('SMARTSMS_API_TOKEN');
    
    if (!apiToken) {
      console.error('SmartSMS API token not configured');
      return false;
    }

    // Generate 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Format phone number for SmartSMS (remove country code +234, ensure starts with 0)
    let formattedPhone = phoneNumber.replace(/^\+234/, ''); // Remove +234
    
    if (formattedPhone.startsWith('234')) {
      formattedPhone = formattedPhone.substring(3); // Remove 234 if still present
    }
    
    if (!formattedPhone.startsWith('0')) {
      formattedPhone = '0' + formattedPhone; // Add leading 0
    }

    // Create OTP message - avoiding restricted words like "code"
    const message = `Your MeCabal verification PIN is ${otpCode}. Valid for 5 minutes. Do not share this PIN with anyone.`;

    // Generate unique reference ID
    const refId = `mecabal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('Sending OTP via SmartSMS SMS API:', { 
      originalPhone: phoneNumber,
      formattedPhone: formattedPhone,
      otp: '[REDACTED]',
      refId,
      messageLength: message.length
    });

    // Prepare form data for SmartSMS regular SMS API
    const formData = new FormData();
    formData.append('token', apiToken);
    formData.append('sender', 'MeCabal'); // SmartSMS requires a sender ID
    formData.append('to', formattedPhone);
    formData.append('message', message);
    formData.append('type', '0'); // Plain text message
    formData.append('routing', '3'); // Basic route, but send DND via Corporate route
    formData.append('ref_id', refId);
    

    const response = await fetch('https://app.smartsmssolutions.com/io/api/client/v1/sms/', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SmartSMS SMS API request failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return false;
    }

    const responseData: SmartSMSResponse = await response.json();
    console.log('SmartSMS SMS response:', responseData);

    // Check if SMS was sent successfully (SmartSMS uses code: 1000 for success)
    if (responseData.code === 1000 && responseData.comment === 'Completed Successfully') {
      console.log('OTP sent successfully via SmartSMS SMS:', {
        messageId: responseData.message_id,
        unitsUsed: responseData.units_used,
        unitsBefore: responseData.units_before,
        unitsAfter: responseData.units_after,
        successful: responseData.successful,
        refId: responseData.ref_id,
        smsPages: responseData.sms_pages
      });
      
      // Return the OTP code for storage in database
      return otpCode;
    } else {
      console.error('SmartSMS SMS delivery failed:', {
        code: responseData.code,
        comment: responseData.comment,
        failed: responseData.failed,
        invalid: responseData.invalid,
        insufficient_unit: responseData.insufficient_unit,
        error: responseData.error
      });
      return false;
    }
  } catch (error) {
    console.error('SmartSMS SMS sending error:', error);
    return false;
  }
}

// Send WhatsApp OTP via Message Central
async function sendWhatsAppOTP(phoneNumber: string): Promise<string | false> {
  try {
    const authToken = Deno.env.get('MESSAGE_CENTRAL_AUTH_TOKEN');
    const customerId = Deno.env.get('MESSAGE_CENTRAL_CUSTOMER_ID');
    
    if (!authToken || !customerId) {
      console.error('Message Central credentials not configured');
      return false;
    }

    // Format phone number for Message Central (remove country code, keep only local number)
    let formattedPhone = phoneNumber.replace(/^\+234/, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1); // Remove leading 0
    }

    const whatsappUrl = `https://cpaas.messagecentral.com/verification/v3/send?countryCode=234&customerId=${customerId}&flowType=WHATSAPP&mobileNumber=${formattedPhone}`;

    console.log('Sending WhatsApp OTP via Message Central:', { 
      phone: formattedPhone,
      customerId
    });

    const response = await fetch(whatsappUrl, {
      method: 'POST',
      headers: {
        'authToken': authToken,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Message Central WhatsApp API error:', {
        status: response.status,
        error: errorText
      });
      return false;
    }

    const responseData = await response.json();
    console.log('Message Central WhatsApp response:', responseData);

    // Check if WhatsApp OTP was sent successfully
    if (responseData.responseCode === 200 && responseData.data?.verificationId) {
      console.log('WhatsApp OTP sent successfully via Message Central:', {
        verificationId: responseData.data.verificationId,
        mobileNumber: responseData.data.mobileNumber,
        message: responseData.message
      });
      
      // Return the verification ID for storage in database
      return responseData.data.verificationId;
    } else {
      console.error('Message Central WhatsApp delivery failed:', {
        responseCode: responseData.responseCode,
        message: responseData.message,
        errorMessage: responseData.data?.errorMessage
      });
      return false;
    }
  } catch (error) {
    console.error('Message Central WhatsApp sending error:', error);
    return false;
  }
}

// Verify OTP with Message Central (for WhatsApp OTPs)
async function verifyMessageCentralOTP(verificationId: string, otpCode: string, phoneNumber: string): Promise<{success: boolean, error?: string}> {
  try {
    const authToken = Deno.env.get('MESSAGE_CENTRAL_AUTH_TOKEN');
    const customerId = Deno.env.get('MESSAGE_CENTRAL_CUSTOMER_ID');
    
    if (!authToken || !customerId) {
      return { success: false, error: 'Message Central credentials not configured' };
    }

    // Format phone number for Message Central
    let formattedPhone = phoneNumber.replace(/^\+234/, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1);
    }
    
    const verifyUrl = `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=234&mobileNumber=${formattedPhone}&verificationId=${verificationId}&customerId=${customerId}&code=${otpCode}`;

    console.log('Verifying OTP with Message Central:', { 
      verificationId, 
      mobileNumber: formattedPhone,
      customerId
    });

    const response = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        'authToken': authToken,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Message Central OTP verification failed:', {
        status: response.status,
        error: errorText
      });
      return { success: false, error: 'OTP verification failed' };
    }

    const responseData = await response.json();
    console.log('Message Central OTP verification response:', responseData);

    if (responseData.responseCode === 200 && responseData.data?.verificationStatus === 'VERIFICATION_COMPLETED') {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: responseData.message || responseData.data?.errorMessage || 'Invalid OTP code'
      };
    }
  } catch (error) {
    console.error('Error verifying OTP with Message Central:', error);
    return { success: false, error: 'OTP verification error' };
  }
}

// Verify OTP code against stored value (for SmartSMS OTPs)
function verifyOTPCode(storedOTP: string, inputOTP: string): {success: boolean, error?: string} {
  try {
    if (!storedOTP || !inputOTP) {
      return { success: false, error: 'Missing OTP codes' };
    }

    // Simple string comparison for OTP verification
    if (storedOTP.trim() === inputOTP.trim()) {
      console.log('OTP verification successful');
      return { success: true };
    } else {
      console.log('OTP verification failed: codes do not match');
      return { success: false, error: 'Invalid OTP code' };
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: 'OTP verification error' };
  }
}


serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData = await req.json();
    const { phone, purpose = 'registration', otp_code, verify, method = 'sms' } = requestData;

    // Route to verification if verify flag is set
    if (verify && otp_code) {
      return await verifyOTP(req, supabase, phone, otp_code, purpose, corsHeaders);
    }

    // Validate Nigerian phone number format
    if (!phone || !/^\+234[0-9]{10}$/.test(phone)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Nigerian phone number. Use format +234XXXXXXXXXX' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Detect carrier
    const carrierInfo = detectNigerianCarrier(phone);
    if (!carrierInfo) {
      return new Response(
        JSON.stringify({ 
          error: 'Unsupported Nigerian carrier' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check for existing pending OTP and invalidate if found (to allow resend)
    const { data: existingOtps } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone_number', phone)
      .eq('purpose', purpose)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString());

    if (existingOtps && existingOtps.length > 0) {
      // Invalidate existing OTPs to allow resend
      await supabase
        .from('otp_verifications')
        .update({ is_used: true })
        .eq('phone_number', phone)
        .eq('purpose', purpose)
        .eq('is_used', false);
      
      console.log(`Invalidated ${existingOtps.length} existing OTP(s) for resend`);
    }

    // Send OTP based on method (SMS via SmartSMS or WhatsApp via Message Central)
    let otpResult: string | false;
    let otpMethod: string;

    if (method === 'whatsapp') {
      console.log('Sending WhatsApp OTP via Message Central');
      otpResult = await sendWhatsAppOTP(phone);
      otpMethod = 'WhatsApp';
    } else {
      console.log('Sending SMS OTP via SmartSMS');
      otpResult = await sendSmartSMSOTP(phone);
      otpMethod = 'SMS';
    }

    if (!otpResult) {
      return new Response(
        JSON.stringify({ 
          error: `Failed to send ${otpMethod} OTP. Please try again.`
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Store OTP/verification ID in database
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const { error: dbError } = await supabase
      .from('otp_verifications')
      .insert({
        phone_number: phone,
        otp_code: otpResult, // Store OTP code (SMS) or verification ID (WhatsApp)
        carrier: carrierInfo.name,
        purpose,
        method: method, // Store the method used
        expires_at: expiresAt.toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to store verification record' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        carrier: carrierInfo.name,
        carrier_color: carrierInfo.color,
        message: `OTP sent successfully via ${otpMethod}`,
        method: method,
        expires_at: expiresAt.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Verification endpoint
async function verifyOTP(req: Request, supabase: any, phone: string, otpCode: string, purpose: string, corsHeaders: any): Promise<Response> {
  try {

    if (!phone || !otpCode) {
      return new Response(
        JSON.stringify({ error: 'Phone number and OTP code required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get OTP record
    const { data: otpRecord, error } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone_number', phone)
      .eq('purpose', purpose)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !otpRecord) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired OTP' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify OTP based on method used
    let verifyResult: {success: boolean, error?: string};
    
    if (otpRecord.method === 'whatsapp') {
      // WhatsApp OTP: verify with Message Central using verification ID
      const verificationId = otpRecord.otp_code; // This is the Message Central verification ID
      verifyResult = await verifyMessageCentralOTP(verificationId, otpCode, phone);
    } else {
      // SMS OTP: verify against stored OTP code
      const storedOtpCode = otpRecord.otp_code; // This is the actual OTP code sent via SmartSMS
      verifyResult = verifyOTPCode(storedOtpCode, otpCode);
    }
    
    if (!verifyResult.success) {
      // Increment attempts
      await supabase
        .from('otp_verifications')
        .update({ attempts: (otpRecord.attempts || 0) + 1 })
        .eq('id', otpRecord.id);

      return new Response(
        JSON.stringify({ error: verifyResult.error || 'Invalid OTP code' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Mark OTP as used
    await supabase
      .from('otp_verifications')
      .update({ is_used: true })
      .eq('id', otpRecord.id);

    // Update user verification status if this is registration
    if (purpose === 'registration') {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', phone)
        .single();

      if (user) {
        await supabase
          .from('users')
          .update({ 
            is_verified: true,
            verification_level: Math.max(1, user.verification_level || 0)
          })
          .eq('id', user.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        verified: true,
        carrier: otpRecord.carrier,
        message: 'Phone number verified successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Verification failed' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}