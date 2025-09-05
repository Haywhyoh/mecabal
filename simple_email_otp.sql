-- Simple Email OTP Implementation using Database Functions
-- Run this SQL in your Supabase SQL Editor

-- Create email_otps table for storing verification codes
CREATE TABLE IF NOT EXISTS public.email_otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('registration', 'login', 'password_reset')),
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint to prevent multiple active OTPs for same email/purpose
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_otps_email_purpose_active 
ON public.email_otps (email, purpose) 
WHERE verified = FALSE;

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON public.email_otps (expires_at);
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON public.email_otps (email);

-- Enable Row Level Security
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own OTPs" ON public.email_otps
FOR ALL USING (auth.email() = email);

-- Function to send email OTP (stores in database, you'll handle email sending separately)
CREATE OR REPLACE FUNCTION public.send_email_otp(
    p_email TEXT,
    p_purpose TEXT DEFAULT 'registration'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_otp_code TEXT;
    v_expires_at TIMESTAMPTZ;
    v_result JSON;
BEGIN
    -- Validate email format
    IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid email address format'
        );
    END IF;

    -- Generate 6-digit OTP
    v_otp_code := LPAD((random() * 999999)::INTEGER::TEXT, 6, '0');
    v_expires_at := NOW() + INTERVAL '10 minutes';

    -- Store OTP in database (upsert to replace existing)
    INSERT INTO public.email_otps (email, otp_code, purpose, expires_at, verified)
    VALUES (p_email, v_otp_code, p_purpose, v_expires_at, FALSE)
    ON CONFLICT (email, purpose)
    WHERE verified = FALSE
    DO UPDATE SET 
        otp_code = EXCLUDED.otp_code,
        expires_at = EXCLUDED.expires_at,
        created_at = NOW(),
        updated_at = NOW();

    -- Return success with OTP code (in production, you'd send this via email service)
    RETURN json_build_object(
        'success', true,
        'message', 'OTP code generated successfully',
        'otp_code', v_otp_code, -- Remove this in production!
        'expires_at', v_expires_at,
        'email', p_email
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Function to verify email OTP
CREATE OR REPLACE FUNCTION public.verify_email_otp(
    p_email TEXT,
    p_otp_code TEXT,
    p_purpose TEXT DEFAULT 'registration'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_otp_record RECORD;
    v_result JSON;
BEGIN
    -- Get OTP record
    SELECT * INTO v_otp_record
    FROM public.email_otps
    WHERE email = p_email 
      AND purpose = p_purpose 
      AND verified = FALSE
      AND expires_at > NOW();

    -- Check if OTP exists and is valid
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'verified', false,
            'error', 'OTP not found, expired, or already used'
        );
    END IF;

    -- Verify OTP code
    IF v_otp_record.otp_code != p_otp_code THEN
        RETURN json_build_object(
            'success', false,
            'verified', false,
            'error', 'Invalid OTP code'
        );
    END IF;

    -- Mark OTP as verified
    UPDATE public.email_otps
    SET verified = TRUE, verified_at = NOW(), updated_at = NOW()
    WHERE email = p_email AND purpose = p_purpose;

    -- Return success
    RETURN json_build_object(
        'success', true,
        'verified', true,
        'message', 'Email verified successfully'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'verified', false,
            'error', SQLERRM
        );
END;
$$;

-- Function to clean up expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_email_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.email_otps 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.send_email_otp(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_email_otp(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_email_otps() TO authenticated;

-- Test the functions (remove in production)
-- SELECT public.send_email_otp('test@example.com', 'registration');
-- SELECT public.verify_email_otp('test@example.com', '123456', 'registration');