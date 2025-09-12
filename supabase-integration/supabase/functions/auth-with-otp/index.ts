import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuthWithOTPRequest {
  email: string;
  otp_code: string;
  purpose: 'registration' | 'login';
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    state_of_origin?: string;
    preferred_language?: string;
  };
}

interface AuthWithOTPResponse {
  success: boolean;
  user?: any;
  session?: any;
  error?: string;
  requires_profile_completion?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Initialize client with anon key for auth operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { email, otp_code, purpose, user_metadata }: AuthWithOTPRequest = await req.json()

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

    if (!otp_code || otp_code.length !== 6) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid OTP code format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // First, verify the OTP code
    const { data: otpRecord, error: fetchError } = await supabase
      .from('email_otps')
      .select('*')
      .eq('email', email)
      .eq('purpose', purpose)
      .eq('otp_code', otp_code)
      .eq('verified', false)
      .single()

    if (fetchError || !otpRecord) {
      console.error('OTP verification failed:', fetchError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or expired OTP code' 
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
      // Clean up expired OTP
      await supabase
        .from('email_otps')
        .delete()
        .eq('email', email)
        .eq('purpose', purpose)

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OTP code has expired. Please request a new code.' 
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
      .eq('id', otpRecord.id)

    if (updateError) {
      console.error('Failed to update OTP status:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to verify OTP' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Handle authentication based on purpose
    if (purpose === 'registration') {
      return await handleRegistration(supabase, supabaseClient, email, user_metadata)
    } else if (purpose === 'login') {
      return await handleLogin(supabase, supabaseClient, email)
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid purpose' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Auth with OTP Error:', error)
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

async function handleRegistration(supabase: any, supabaseClient: any, email: string, user_metadata: any): Promise<Response> {
  try {
    // Check if user already exists in auth.users
    const { data: existingAuthUser } = await supabase.auth.admin.listUsers()
    const userExists = existingAuthUser?.users?.some((user: any) => user.email === email)

    if (userExists) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User with this email already exists' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create user in auth.users using admin API (no email confirmation needed since OTP verified)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: true, // Skip email confirmation since we verified via OTP
      user_metadata: user_metadata || {}
    })

    if (authError || !authUser.user) {
      console.error('Failed to create auth user:', authError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authError?.message || 'Failed to create user account' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create user profile in the users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: email,
        first_name: user_metadata?.first_name || '',
        last_name: user_metadata?.last_name || '',
        phone_number: user_metadata?.phone_number || null,
        state_of_origin: user_metadata?.state_of_origin || null,
        preferred_language: user_metadata?.preferred_language || 'en',
        is_verified: true,
        verification_level: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('Failed to create user profile:', profileError)
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create user profile' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create a session for the user using admin API
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    })

    if (sessionError) {
      console.error('Failed to generate session:', sessionError)
    }

    console.log('User registered successfully:', { userId: authUser.user.id, email })

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          ...userProfile,
          id: authUser.user.id,
          email: authUser.user.email,
          auth_metadata: authUser.user.user_metadata
        },
        message: 'Registration completed successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Registration failed' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleLogin(supabase: any, supabaseClient: any, email: string): Promise<Response> {
  try {
    // Check if user exists in auth.users
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const existingUser = authUsers?.users?.find((user: any) => user.email === email)

    if (!existingUser) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User not found. Please register first.' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', existingUser.id)
      .single()

    if (profileError) {
      console.error('Failed to fetch user profile:', profileError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User profile not found',
          requires_profile_completion: true 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate a session token for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    })

    if (sessionError) {
      console.error('Failed to generate session:', sessionError)
    }

    console.log('User logged in successfully:', { userId: existingUser.id, email })

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          ...userProfile,
          auth_metadata: existingUser.user_metadata
        },
        message: 'Login successful'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Login failed' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}