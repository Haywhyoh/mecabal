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

// Message Central SMS service integration for Nigerian carriers
interface MessageCentralAuthResponse {
  token?: string;
  authToken?: string; // Alternative field name
  responseCode?: number;
  message?: string;
  error?: string;
  status?: string;
}

interface MessageCentralSMSResponse {
  responseCode: number;
  message: string;
  data: {
    verificationId: string;
    mobileNumber: string;
    responseCode: number;
    errorMessage?: string;
    timeout: string;
  };
}

// Get Message Central authentication token
async function getMessageCentralToken(): Promise<string | null> {
  try {
    const customerId = Deno.env.get('MESSAGE_CENTRAL_CUSTOMER_ID');
    const authToken = Deno.env.get('MESSAGE_CENTRAL_AUTH_TOKEN'); // This should be base64 encoded password
    
    if (!customerId || !authToken) {
      console.error('Message Central credentials not configured:', { 
        hasCustomerId: !!customerId, 
        hasAuthToken: !!authToken 
      });
      return null;
    }

    // Use the email address registered with Message Central account
    // You need to replace this with the actual email used for your Message Central account
    const accountEmail = Deno.env.get('MESSAGE_CENTRAL_EMAIL') || 'your-account-email@domain.com';
    const tokenUrl = `https://cpaas.messagecentral.com/auth/v1/authentication/token?customerId=${customerId}&key=${authToken}&scope=NEW&country=234&email=${accountEmail}`;
    
    console.log('Requesting Message Central token...', { customerId, tokenUrl: tokenUrl.replace(authToken, '[REDACTED]') });
    
    const response = await fetch(tokenUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('Message Central token response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Message Central token request failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return null;
    }

    const responseText = await response.text();
    console.log('Message Central raw response:', responseText);

    let tokenData: MessageCentralAuthResponse;
    try {
      tokenData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Message Central response as JSON:', parseError);
      return null;
    }
    
    console.log('Message Central token response:', { 
      responseCode: tokenData.responseCode, 
      message: tokenData.message,
      error: tokenData.error,
      status: tokenData.status,
      hasToken: !!(tokenData.token || tokenData.authToken),
      allKeys: Object.keys(tokenData)
    });

    // Check for different success indicators
    const isSuccess = tokenData.responseCode === 200 || 
                     tokenData.status === 'success' ||
                     !tokenData.error;

    if (!isSuccess) {
      console.error('Message Central token error:', 
        tokenData.message || tokenData.error || 'Unknown error');
      return null;
    }

    // Try different token field names
    const token = tokenData.token || tokenData.authToken;
    if (!token) {
      console.error('Message Central response missing token field');
      
      // Try alternative authentication method with POST
      return await getMessageCentralTokenAlternative(customerId, authToken);
    }

    console.log('Message Central token obtained successfully');
    return token;
  } catch (error) {
    console.error('Error getting Message Central token:', error);
    
    // Try alternative authentication method
    const customerId = Deno.env.get('MESSAGE_CENTRAL_CUSTOMER_ID');
    const authToken = Deno.env.get('MESSAGE_CENTRAL_AUTH_TOKEN');
    if (customerId && authToken) {
      return await getMessageCentralTokenAlternative(customerId, authToken);
    }
    return null;
  }
}

// Verify OTP with Message Central
async function verifyMessageCentralOTP(verificationId: string, otpCode: string, phoneNumber: string): Promise<{success: boolean, error?: string}> {
  try {
    // Use JWT token directly from environment variable
    const authToken = Deno.env.get('MESSAGE_CENTRAL_AUTH_TOKEN');
    if (!authToken) {
      return { success: false, error: 'MESSAGE_CENTRAL_AUTH_TOKEN not configured' };
    }

    const customerId = Deno.env.get('MESSAGE_CENTRAL_CUSTOMER_ID');
    
    // Format phone number for Message Central (remove country code, keep only local number)
    let formattedPhone = phoneNumber.replace(/^\+/, ''); // Remove +
    if (formattedPhone.startsWith('234')) {
      formattedPhone = formattedPhone.substring(3); // Remove country code 234
    }
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1); // Remove leading 0 if present
    }
    // Result should be: 8142064474 (just the local number)
    
    // Build verification URL with query parameters (as shown in documentation)
    const verifyUrl = `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=234&mobileNumber=${formattedPhone}&verificationId=${verificationId}&customerId=${customerId}&code=${otpCode}`;

    console.log('Verifying OTP with Message Central:', { 
      verificationId, 
      mobileNumber: formattedPhone,
      customerId,
      code: '[REDACTED]',
      url: verifyUrl.replace(otpCode, '[REDACTED]')
    });

    const response = await fetch(verifyUrl, {
      method: 'GET', // GET request as shown in documentation
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

    // Check verification result based on documentation
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

// Alternative authentication method for Message Central
async function getMessageCentralTokenAlternative(customerId: string, authToken: string): Promise<string | null> {
  try {
    console.log('Trying alternative Message Central authentication...');
    
    // Try POST method with JSON body
    const response = await fetch('https://cpaas.messagecentral.com/auth/v1/authentication/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerId: customerId,
        key: authToken,
        scope: 'NEW',
        country: '234',
        email: Deno.env.get('MESSAGE_CENTRAL_EMAIL') || 'your-account-email@domain.com'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Alternative Message Central auth failed:', {
        status: response.status,
        body: errorText
      });
      return null;
    }

    const responseText = await response.text();
    console.log('Alternative Message Central response:', responseText);

    const tokenData = JSON.parse(responseText);
    const token = tokenData.token || tokenData.authToken;
    
    if (token) {
      console.log('Alternative Message Central authentication successful');
      return token;
    }

    console.error('Alternative method also missing token');
    return null;
  } catch (error) {
    console.error('Alternative authentication error:', error);
    return null;
  }
}

async function sendSMSViaNigerian(
  phone: string, 
  message: string, 
  carrier: NigerianCarrier
): Promise<string | false> {
  console.log(`Sending SMS via Message Central to ${phone} (${carrier.name}): ${message}`);
  
  try {
    // Use JWT token directly from environment variable
    const authToken = Deno.env.get('MESSAGE_CENTRAL_AUTH_TOKEN');
    if (!authToken) {
      console.error('MESSAGE_CENTRAL_AUTH_TOKEN not configured');
      return false;
    }

    // Format phone number for Message Central (remove country code, keep only local number)
    let formattedPhone = phone.replace(/^\+/, ''); // Remove +
    if (formattedPhone.startsWith('234')) {
      formattedPhone = formattedPhone.substring(3); // Remove country code 234
    }
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1); // Remove leading 0 if present
    }
    // Result should be: 8142064474 (just the local number)

    const customerId = Deno.env.get('MESSAGE_CENTRAL_CUSTOMER_ID');
    
    // Message Central SMS API endpoint with query parameters (as shown in documentation)
    const smsApiUrl = `https://cpaas.messagecentral.com/verification/v3/send?countryCode=234&customerId=${customerId}&flowType=SMS&mobileNumber=${formattedPhone}`;

    console.log('Sending SMS with URL:', { 
      countryCode: "234",
      mobileNumber: formattedPhone,
      customerId: customerId,
      carrier: carrier.name,
      url: smsApiUrl
    });

    const smsResponse = await fetch(smsApiUrl, {
      method: 'POST', // POST method as shown in documentation
      headers: {
        'authToken': authToken, // JWT token directly
        'Accept': 'application/json'
      }
      // No body needed - all parameters in query string
    });

    if (!smsResponse.ok) {
      const errorData = await smsResponse.text();
      console.error('Message Central SMS API error:', {
        status: smsResponse.status,
        statusText: smsResponse.statusText,
        error: errorData
      });
      return false;
    }

    const responseData: MessageCentralSMSResponse = await smsResponse.json();
    console.log('Message Central SMS response:', responseData);

    // Check if SMS was sent successfully
    if (responseData.responseCode === 200 && responseData.data) {
      console.log('SMS sent successfully via Message Central:', {
        verificationId: responseData.data.verificationId,
        mobileNumber: responseData.data.mobileNumber,
        message: responseData.message,
        carrier: carrier.name
      });
      
      // Store the verificationId for later verification
      // We'll need this to verify the OTP with Message Central
      return responseData.data.verificationId; // Return verification ID instead of boolean
    } else {
      console.error('Message Central SMS delivery failed:', {
        responseCode: responseData.responseCode,
        message: responseData.message,
        errorMessage: responseData.data?.errorMessage,
        carrier: carrier.name
      });
      return false;
    }
  } catch (error) {
    console.error('Message Central SMS sending error:', error);
    return false;
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
    const { phone, purpose = 'registration', otp_code, verify } = requestData;

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

    // Check for existing pending OTP
    const { data: existingOtp } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone_number', phone)
      .eq('purpose', purpose)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingOtp) {
      return new Response(
        JSON.stringify({ 
          error: 'OTP already sent. Please wait before requesting a new one.',
          retry_after: existingOtp.expires_at
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send SMS via Message Central (they generate the OTP automatically)
    const smsMessage = `Your MeCabal verification code will be sent by Message Central.`;
    const verificationId = await sendSMSViaNigerian(phone, smsMessage, carrierInfo);

    if (!verificationId) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send SMS. Please try again.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Store Message Central verification ID in database
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const { error: dbError } = await supabase
      .from('otp_verifications')
      .insert({
        phone_number: phone,
        otp_code: verificationId, // Store Message Central verification ID
        carrier: carrierInfo.name,
        purpose,
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
        message: 'OTP sent successfully via Message Central',
        expires_at: expiresAt.toISOString(),
        verification_id: verificationId
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

    // Verify OTP with Message Central
    const verificationId = otpRecord.otp_code; // This is actually the Message Central verification ID
    const verifyResult = await verifyMessageCentralOTP(verificationId, otpCode, phone);
    
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