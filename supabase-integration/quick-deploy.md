# Quick Fix for OTP Database Error

## The Problem
You're getting this error:
```
"Database error: {
  code: "42P10", 
  message: "there is no unique or exclusion constraint matching the ON CONFLICT specification"
}"
```

## The Solution (2 Steps)

### Step 1: Fix the Database
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/jjmuogczhcunpehsocly
2. Navigate to **Database** → **SQL Editor**
3. Copy and paste the entire content from `fix_email_otps_table.sql`
4. Click **Run** to execute the SQL
5. You should see "email_otps table created successfully!" at the bottom

### Step 2: Redeploy the Edge Function
If you have Supabase CLI installed:
```bash
cd supabase-integration
supabase functions deploy email-otp-verify --project-ref jjmuogczhcunpehsocly
```

If you don't have Supabase CLI:
1. Install it: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref jjmuogczhcunpehsocly`
4. Deploy: `supabase functions deploy email-otp-verify`

## What I Fixed
1. **Database**: Recreated the `email_otps` table with proper constraints
2. **Edge Function**: Replaced problematic `upsert` with `delete` + `insert` approach
3. **Indexes**: Added proper unique constraint that won't cause conflicts

## Test It Works
After applying the fix, try joining a community again. You should now see:
1. OTP email gets sent successfully
2. No more database constraint errors
3. Proper authentication flow

## If Still Having Issues
Check the edge function logs:
```bash
supabase functions logs email-otp-verify --project-ref jjmuogczhcunpehsocly
```

Or test the function directly:
```bash
curl -X POST "https://jjmuogczhcunpehsocly.supabase.co/functions/v1/email-otp-verify" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "purpose": "registration"}'
```