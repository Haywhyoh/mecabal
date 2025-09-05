# Supabase Deployment Guide

## Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link to your Supabase project:
   ```bash
   supabase link --project-ref jjmuogczhcunpehsocly
   ```

## Database Migration Deployment

1. Navigate to the project root:
   ```bash
   cd C:\Users\USER\Documents\Adedayo\mecabal
   ```

2. Run the database migration:
   ```bash
   supabase db push --include-all --db-url "postgresql://postgres:[password]@db.jjmuogczhcunpehsocly.supabase.co:5432/postgres"
   ```

   Or manually execute the SQL file in the Supabase dashboard:
   - Go to Database > SQL Editor
   - Copy and paste the content from `supabase-integration/database/migrations/20240905_create_email_otps_table.sql`
   - Run the query

## Edge Function Deployment

1. Deploy the email-otp-verify function:
   ```bash
   supabase functions deploy email-otp-verify --project-ref jjmuogczhcunpehsocly
   ```

2. Set up environment variables in Supabase dashboard:
   - Go to Project Settings > Edge Functions > Environment variables
   - Add the following variables:
     - `BREVO_API_KEY`: Your Brevo (SendinBlue) API key
     - `SUPABASE_URL`: Your Supabase URL (already set)
     - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (already set)

## Environment Variables Setup

### Required Environment Variables

Add these to your Supabase Edge Functions environment:

1. **BREVO_API_KEY**
   - Get from: https://app.brevo.com/settings/keys/api
   - Purpose: Send OTP emails via Brevo service
   - Example: `xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxx`

2. **SUPABASE_URL** (already configured)
   - Your Supabase project URL
   - Current: `https://jjmuogczhcunpehsocly.supabase.co`

3. **SUPABASE_SERVICE_ROLE_KEY** (already configured)
   - Your service role key with elevated permissions
   - Used to bypass RLS policies for the Edge Function

### Setting Environment Variables

**Via Supabase Dashboard:**
1. Go to your project dashboard: https://supabase.com/dashboard/project/jjmuogczhcunpehsocly
2. Navigate to Project Settings > Edge Functions
3. Scroll to "Environment Variables" section
4. Click "Add variable"
5. Add each variable name and value

**Via Supabase CLI:**
```bash
supabase secrets set BREVO_API_KEY=your_brevo_api_key_here
```

## Testing the Deployment

1. Test the Edge Function manually:
   ```bash
   curl -X POST 'https://jjmuogczhcunpehsocly.supabase.co/functions/v1/email-otp-verify' \
   -H 'Authorization: Bearer [your_anon_key]' \
   -H 'Content-Type: application/json' \
   -d '{
     "email": "test@example.com",
     "purpose": "registration"
   }'
   ```

2. Check the logs:
   ```bash
   supabase functions logs email-otp-verify --project-ref jjmuogczhcunpehsocly
   ```

3. Test from the mobile app by attempting email registration.

## Troubleshooting

### Common Issues

1. **"Edge Function returned a non 2xx status code"**
   - Check if BREVO_API_KEY is set correctly
   - Verify the Edge Function is deployed
   - Check Edge Function logs for detailed errors

2. **"Invalid email address" errors**
   - Verify email format in the request
   - Check email regex validation in the Edge Function

3. **Database connection errors**
   - Ensure the email_otps table exists
   - Verify RLS policies are correctly set
   - Check service role key permissions

### Log Commands
```bash
# View Edge Function logs
supabase functions logs email-otp-verify

# View real-time logs
supabase functions logs email-otp-verify --follow
```

## File Structure

```
supabase-integration/
├── database/
│   └── migrations/
│       └── 20240905_create_email_otps_table.sql
├── edge-functions/
│   └── email-otp-verify/
│       └── index.ts
└── DEPLOYMENT_GUIDE.md (this file)
```

## Security Considerations

1. **Row Level Security**: The email_otps table has RLS enabled with policies that only allow service_role access
2. **Environment Variables**: Never commit API keys to the repository
3. **CORS**: The Edge Function includes proper CORS headers for mobile app requests
4. **Input Validation**: Email format validation and OTP code validation implemented
5. **Rate Limiting**: Consider adding rate limiting for OTP generation to prevent abuse