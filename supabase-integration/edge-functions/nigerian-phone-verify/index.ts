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

async function sendSMSViaNigerian(
  phone: string, 
  message: string, 
  carrier: NigerianCarrier
): Promise<boolean> {
  // In production, integrate with Nigerian SMS providers like:
  // - Bulk SMS Nigeria
  // - Smart SMS
  // - Nigerian SMS Gateway
  // - Twilio (with Nigerian numbers)
  
  console.log(`Sending SMS via ${carrier.name} to ${phone}: ${message}`);
  
  // For MVP, we'll simulate SMS sending
  // Replace with actual API calls to Nigerian SMS providers
  try {
    // Example integration with a Nigerian SMS service
    const smsResponse = await fetch(`https://api.nigeriansms.com/v1/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('NIGERIAN_SMS_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: phone,
        message,
        sender_id: 'MeCabal',
        carrier_hint: carrier.name
      })
    });
    
    return smsResponse.ok;
  } catch (error) {
    console.error('SMS sending error:', error);
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

    const { phone, purpose = 'registration' } = await req.json();

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

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP in database
    const { error: dbError } = await supabase
      .from('otp_verifications')
      .insert({
        phone_number: phone,
        otp_code: hashOTP(otpCode),
        carrier: carrierInfo.name,
        purpose,
        expires_at: expiresAt.toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to store OTP' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send SMS
    const smsMessage = `Your MeCabal verification code is: ${otpCode}. Valid for 5 minutes. Don't share this code with anyone.`;
    const smsSent = await sendSMSViaNigerian(phone, smsMessage, carrierInfo);

    if (!smsSent) {
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

    return new Response(
      JSON.stringify({ 
        success: true,
        carrier: carrierInfo.name,
        carrier_color: carrierInfo.color,
        message: 'OTP sent successfully',
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
export async function verifyOTP(req: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { phone, otp_code, purpose = 'registration' } = await req.json();

    if (!phone || !otp_code) {
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

    // Verify OTP
    const hashedInput = hashOTP(otp_code);
    if (hashedInput !== otpRecord.otp_code) {
      // Increment attempts
      await supabase
        .from('otp_verifications')
        .update({ attempts: (otpRecord.attempts || 0) + 1 })
        .eq('id', otpRecord.id);

      return new Response(
        JSON.stringify({ error: 'Invalid OTP code' }),
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