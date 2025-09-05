# Supabase Email OTP Setup Guide

## Quick Setup (5 minutes)

Your Supabase project: `https://supabase.com/dashboard/project/jjmuogczhcunpehsocly`

### Step 1: Enable Email OTP in Authentication Settings

1. Go to **Authentication > Settings** in your Supabase dashboard
2. Scroll to **Auth Providers** section
3. Find **Email** provider and ensure it's enabled
4. Set **Enable email confirmations** to `true`
5. Set **Enable email change confirmations** to `false` (optional)

### Step 2: Configure Email Templates (Optional)

1. Go to **Authentication > Email Templates**
2. Customize the **Magic Link** template (used for OTP emails):
   - Subject: `Your MeCabal Verification Code`
   - Content: You can customize the email design and include your branding

### Step 3: SMTP Configuration (Optional but Recommended)

By default, Supabase uses their email service, but for production you should use your own SMTP:

1. Go to **Settings > Authentication**
2. Scroll to **SMTP Settings**
3. Configure your SMTP provider (Gmail, SendGrid, etc.)

For now, you can skip this and use Supabase's default email service.

### Step 4: Test the Configuration

The mobile app is already configured to use Supabase's built-in email OTP. Just run the app and try:

1. Email Registration: Enter email and see if you receive the OTP
2. Email Login: Try signing in with an existing email

## What Changed in the Mobile App

✅ **Updated `auth.ts`**: Now uses `supabase.auth.signInWithOtp()` and `supabase.auth.verifyOtp()`
✅ **Updated EmailRegistrationScreen**: Better error handling for Supabase auth errors
✅ **Updated EmailVerificationScreen**: Uses simplified authentication flow
✅ **Removed Custom Edge Functions**: No need for custom email-otp-verify function

## Environment Variables

Your `.env` file is already correctly configured:
```
EXPO_PUBLIC_SUPABASE_URL=https://jjmuogczhcunpehsocly.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Database Schema

For the simplified approach, Supabase handles all OTP storage internally. You only need a basic `users` table:

```sql
create table users (
  id uuid references auth.users on delete cascade,
  email text,
  first_name text,
  last_name text,
  phone_number text,
  state_of_origin text,
  preferred_language text default 'en',
  is_verified boolean default false,
  verification_level integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);
```

## Testing the Flow

1. **Start the mobile app**: `cd Hommie_Mobile && npm start`
2. **Try email registration**: Go through the registration flow with a real email
3. **Check your email**: You should receive a 6-digit OTP code
4. **Enter the code**: The verification should work and create your account

## Troubleshooting

**No email received?**
- Check spam folder
- Verify email address is correct
- Check Supabase logs in Dashboard > Logs

**"User already registered" error?**
- The email is already in use
- Try the login flow instead

**"Invalid token" error?**
- Code may have expired (usually 10 minutes)
- Request a new code
- Check for typos in the code

## Benefits of This Approach

✅ **Much simpler**: Uses Supabase's built-in functionality
✅ **More reliable**: Battle-tested by thousands of developers
✅ **Better security**: Built-in rate limiting and security features
✅ **Easier maintenance**: No custom code to maintain
✅ **Better error handling**: More specific error messages
✅ **Automatic cleanup**: Expired tokens are handled automatically

This approach eliminates the need for custom Edge Functions and database tables, making the implementation much cleaner and more maintainable.