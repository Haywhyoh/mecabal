# Final Setup Instructions

## Step 1: Run SQL in Supabase Dashboard

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/jjmuogczhcunpehsocly
2. Navigate to **Database > SQL Editor**
3. Copy and paste the content from `simple_email_otp.sql`
4. Click **Run** to execute the SQL

This will create:
- `email_otps` table to store OTP codes
- `send_email_otp()` function to generate OTP codes
- `verify_email_otp()` function to verify codes
- Proper security policies

## Step 2: Test the Mobile App

1. Start the app: `cd Hommie_Mobile && npm start`
2. Go to Email Registration screen
3. Enter your details and submit
4. **The OTP code will be shown in the success alert** (development mode only)
5. Enter the code in the verification screen

## How It Works

### For Development:
- OTP codes are generated and stored in the database
- **The actual OTP code is shown in the mobile app alert for testing**
- No email is actually sent (yet)

### For Production (Next Steps):
- Remove the OTP code from the alert
- Add email service integration (SendGrid, Mailgun, etc.)
- The database functions are already production-ready

## Current Flow:

1. **Email Registration**: User enters email + details
2. **Generate OTP**: Database function creates 6-digit code
3. **Show Code**: Alert displays the OTP code for testing
4. **Email Verification**: User enters the code
5. **Verify Code**: Database function validates the code
6. **Success**: User is registered and authenticated

## Benefits:

✅ **Works immediately** - No external services needed for testing
✅ **Secure** - OTP codes expire in 10 minutes  
✅ **Simple** - Uses Supabase database functions
✅ **Production-ready** - Easy to add email service later
✅ **No Edge Functions** - Avoids deployment complexity

## Next Steps (Optional):

To add actual email sending:
1. Choose email service (SendGrid, Mailgun, etc.)
2. Create Edge Function or webhook to send emails
3. Remove OTP code from mobile app alerts
4. Update SQL function to trigger email sending

But for now, this lets you test the complete OTP flow!