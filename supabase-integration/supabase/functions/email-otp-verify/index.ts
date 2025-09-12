import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailOTPRequest {
  email: string;
  purpose: 'registration' | 'login' | 'password_reset';
  otp_code?: string;
  verify?: boolean;
}

interface EmailOTPResponse {
  success: boolean;
  message?: string;
  verified?: boolean;
  expires_at?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, purpose, otp_code, verify }: EmailOTPRequest = await req.json()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email address' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (verify && otp_code) {
      // Verify OTP code
      return await verifyEmailOTP(supabase, email, otp_code, purpose)
    } else {
      // Send OTP code
      return await sendEmailOTP(supabase, email, purpose)
    }

  } catch (error) {
    console.error('Email OTP Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function sendEmailOTP(supabase: any, email: string, purpose: string): Promise<Response> {
  try {
    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    // Store OTP in database - first delete any existing OTP for this email/purpose
    await supabase
      .from('email_otps')
      .delete()
      .eq('email', email)
      .eq('purpose', purpose)
      .eq('verified', false)
    
    // Insert new OTP
    const { error: dbError } = await supabase
      .from('email_otps')
      .insert({
        email,
        otp_code: otpCode,
        purpose,
        expires_at: expiresAt.toISOString(),
        verified: false,
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to store OTP code' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send email via Resend
    const emailSent = await sendEmailViaResend(email, otpCode, purpose)
    
    if (!emailSent.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: emailSent.error || 'Failed to send email' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OTP code sent successfully',
        expires_at: expiresAt.toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Send OTP error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to send OTP' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function verifyEmailOTP(supabase: any, email: string, otpCode: string, purpose: string): Promise<Response> {
  try {
    // Get OTP from database
    const { data: otpRecord, error: fetchError } = await supabase
      .from('email_otps')
      .select('*')
      .eq('email', email)
      .eq('purpose', purpose)
      .eq('verified', false)
      .single()

    if (fetchError || !otpRecord) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false, 
          error: 'OTP not found or already used' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if OTP is expired
    const now = new Date()
    const expiresAt = new Date(otpRecord.expires_at)
    
    if (now > expiresAt) {
      // Mark as expired and delete
      await supabase
        .from('email_otps')
        .delete()
        .eq('email', email)
        .eq('purpose', purpose)

      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false, 
          error: 'OTP code has expired. Please request a new code.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify OTP code
    if (otpRecord.otp_code !== otpCode) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false, 
          error: 'Invalid OTP code' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Mark OTP as verified
    const { error: updateError } = await supabase
      .from('email_otps')
      .update({ 
        verified: true, 
        verified_at: new Date().toISOString() 
      })
      .eq('email', email)
      .eq('purpose', purpose)

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false, 
          error: 'Failed to verify OTP' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        message: 'Email verified successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Verify OTP error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        verified: false, 
        error: 'Failed to verify OTP' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function sendEmailViaResend(email: string, otpCode: string, purpose: string): Promise<{success: boolean, error?: string}> {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found in environment variables')
      return { success: false, error: 'Email service not configured' }
    }

    const subject = getEmailSubject(purpose)
    const htmlContent = getEmailTemplate(otpCode, purpose)

    console.log(`Sending email via Resend to: ${email}`)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'MeCabal Community <noreply@codemygig.com>',
        to: [email],
        subject: subject,
        html: htmlContent
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Resend API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      return { 
        success: false, 
        error: `Failed to send email via Resend: ${errorData.message || response.statusText}` 
      }
    }

    const result = await response.json()
    console.log('Email sent successfully via Resend:', { id: result.id })
    return { success: true }

  } catch (error) {
    console.error('Resend send error:', error)
    return { success: false, error: 'Email service error' }
  }
}

function getEmailSubject(purpose: string): string {
  switch (purpose) {
    case 'registration':
      return 'Welcome to MeCabal - Verify Your Email'
    case 'login':
      return 'MeCabal Login Verification'
    case 'password_reset':
      return 'MeCabal Password Reset'
    default:
      return 'MeCabal Email Verification'
  }
}

function getEmailTemplate(otpCode: string, purpose: string): string {
  const purposeText = purpose === 'registration' ? 'complete your registration' : 
                     purpose === 'login' ? 'sign in to your account' : 
                     'reset your password'

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>MeCabal Email Verification</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #00A651; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .otp-code { 
                font-size: 32px; 
                font-weight: bold; 
                color: #00A651; 
                text-align: center; 
                background: #f5f5f5; 
                padding: 20px; 
                margin: 20px 0; 
                border-radius: 8px;
                letter-spacing: 8px;
            }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MeCabal Community</h1>
                <p>Your Digital Neighborhood</p>
            </div>
            <div class="content">
                <h2>Email Verification Code</h2>
                <p>Hi there!</p>
                <p>Please use the following verification code to ${purposeText}:</p>
                <div class="otp-code">${otpCode}</div>
                <p><strong>This code will expire in 10 minutes.</strong></p>
                <p>If you didn't request this code, please ignore this email.</p>
                <p>Welcome to your Nigerian neighborhood community!</p>
            </div>
            <div class="footer">
                <p>© 2024 MeCabal - Nigerian-owned • Community-first</p>
                <p>Building stronger communities across Nigeria</p>
            </div>
        </div>
    </body>
    </html>
  `
}