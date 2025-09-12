# Resend OTP Integration Testing Guide

## Prerequisites Checklist

### 1. Environment Variables
Ensure these are set in your `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=https://jjmuogczhcunpehsocly.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_RESEND_API_KEY=your_resend_api_key_here
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

### 2. Supabase Setup
- [ ] Deploy edge functions to Supabase (see `MANUAL_DEPLOYMENT.md`)
- [ ] Set `RESEND_API_KEY` in Supabase Dashboard → Settings → Edge Functions
- [ ] Run database migration for `email_otps` table
- [ ] Verify functions are deployed and accessible

### 3. Resend Setup
- [ ] Create Resend account at https://resend.com
- [ ] Add and verify your domain (or use sandbox for testing)
- [ ] Get API key from https://resend.com/api-keys
- [ ] Test API key works with a simple curl request

## Testing Flow

### Step 1: App Startup Validation
1. Start the app with `npm start`
2. Check Metro logs for environment validation:
   ```
   🔧 Environment Configuration:
     - Supabase URL: ✅ Set
     - Supabase Anon Key: ✅ Set
     - Resend API Key: ✅ Set
     - Development Mode: 🔧 ON
   ✅ All required environment variables are set
   ```

### Step 2: Phone Verification Flow
1. Navigate to Phone Verification screen
2. Enter a Nigerian phone number (e.g., +2348012345678)
3. Tap "Send Code" button
4. Check logs for edge function calls:
   ```
   📧 [AUTH] Sending OTP to email: 2348012345678@temp.mecabal.com
   ✅ [AUTH] OTP sent successfully via Resend
   ```

### Step 3: OTP Verification
1. Check your email inbox (or Resend logs) for the OTP code
2. Enter the 6-digit code in the app
3. Tap "Verify" button
4. Check logs for authentication success:
   ```
   🔐 [AUTH] OTP verified successfully
   ✅ [AUTH] User authenticated and session created
   Auth state changed: SIGNED_IN user-id-here
   ```

### Step 4: Session Persistence
1. Force quit the app
2. Reopen the app
3. Verify user remains logged in (no need to re-authenticate)

## Troubleshooting

### Common Issues

#### "Email service not configured"
- **Cause**: RESEND_API_KEY not set in Supabase edge function environment
- **Fix**: Go to Supabase Dashboard → Settings → Edge Functions → Add RESEND_API_KEY

#### "Failed to send email via Resend"
- **Cause**: Invalid API key or domain not verified
- **Fix**: 
  1. Check API key is correct in Supabase
  2. Verify domain in Resend dashboard
  3. Check Resend API logs for error details

#### "OTP not found or already used"
- **Cause**: OTP expired or already verified
- **Fix**: Request a new OTP code

#### "User not authenticated on Supabase"
- **Cause**: Session creation failed after OTP verification
- **Fix**: Check `auth-with-otp` edge function logs in Supabase

### Debug Commands

Test edge functions directly:
```bash
# Test email OTP sending
curl -X POST "https://jjmuogczhcunpehsocly.supabase.co/functions/v1/email-otp-verify" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@yourdomain.com", "purpose": "registration"}'

# Test OTP verification
curl -X POST "https://jjmuogczhcunpehsocly.supabase.co/functions/v1/email-otp-verify" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@yourdomain.com", "otp_code": "123456", "purpose": "registration", "verify": true}'

# Test authentication with OTP
curl -X POST "https://jjmuogczhcunpehsocly.supabase.co/functions/v1/auth-with-otp" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@yourdomain.com",
    "otp_code": "123456",
    "purpose": "registration",
    "user_metadata": {
      "first_name": "Test",
      "last_name": "User"
    }
  }'
```

### Check Logs
- Supabase Edge Functions: `supabase functions logs email-otp-verify`
- Resend Dashboard: https://resend.com/emails
- Mobile App: Metro bundler console

## Success Indicators

✅ **Complete Success** when you see:
1. OTP email delivered to inbox
2. OTP verification succeeds in app
3. User automatically logged in
4. Session persists across app restarts
5. User profile created in Supabase `users` table

## Next Steps After Testing

1. **Switch to real phone SMS**: Replace email temporary solution with SMS
2. **Add rate limiting**: Implement proper OTP request limits
3. **Improve error handling**: Better user feedback for failures
4. **Add email templates**: Create better-looking OTP emails
5. **Domain verification**: Set up proper sending domain in Resend