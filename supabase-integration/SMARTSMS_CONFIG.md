# SMS & WhatsApp OTP Configuration for MeCabal Edge Function

## Environment Variables Required

The `nigerian-phone-verify` edge function requires the following environment variables for SMS and WhatsApp OTP:

## SmartSMS Configuration (for SMS OTP)

### 1. SMARTSMS_API_TOKEN
- **Description**: Your SmartSMS API token
- **Required**: Yes (for SMS functionality)
- **Example**: `your-smartsms-api-token`
- **How to get**: Obtain from your SmartSMS dashboard

## Message Central Configuration (for WhatsApp OTP)

### 2. MESSAGE_CENTRAL_AUTH_TOKEN
- **Description**: Your Message Central JWT auth token
- **Required**: Yes (for WhatsApp functionality)
- **Example**: `eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLTQ3MDlFQz...`
- **How to get**: Generate from your Message Central dashboard

### 3. MESSAGE_CENTRAL_CUSTOMER_ID
- **Description**: Your Message Central customer ID
- **Required**: Yes (for WhatsApp functionality)
- **Example**: `C-4709EC8B87034B1`
- **How to get**: Find in your Message Central dashboard


## Setting Environment Variables in Supabase

### Using Supabase CLI:
```bash
# Navigate to your supabase project directory
cd supabase-integration

# Set SmartSMS environment variable (for SMS)
supabase secrets set SMARTSMS_API_TOKEN=your-smartsms-api-token

# Set Message Central environment variables (for WhatsApp)
supabase secrets set MESSAGE_CENTRAL_AUTH_TOKEN=your-jwt-auth-token
supabase secrets set MESSAGE_CENTRAL_CUSTOMER_ID=your-customer-id
```

### Using Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Navigate to Edge Functions > Environment Variables
3. Add the following variables:
   - `SMARTSMS_API_TOKEN`: your-smartsms-api-token
   - `MESSAGE_CENTRAL_AUTH_TOKEN`: your-jwt-auth-token
   - `MESSAGE_CENTRAL_CUSTOMER_ID`: your-customer-id

## API Details

### SMS via SmartSMS
**Endpoint**: `POST https://app.smartsmssolutions.com/io/api/client/v1/sms/`

### WhatsApp via Message Central  
**Send Endpoint**: `POST https://cpaas.messagecentral.com/verification/v3/send?countryCode=234&customerId={customerId}&flowType=WHATSAPP&mobileNumber={phone}`
**Verify Endpoint**: `GET https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=234&mobileNumber={phone}&verificationId={verificationId}&customerId={customerId}&code={otpCode}`

### Parameters Sent
- `token`: Your API token (from environment variable)
- `sender`: Fixed as "MeCabal" (SmartSMS requires this field)
- `to`: Nigerian phone number in format 080xxxxxxxx
- `message`: OTP message content
- `type`: 0 (Plain text message)
- `routing`: 3 (Basic route, but send DND via Corporate route)
- `ref_id`: Unique reference ID for tracking

**Note**: Sender ID is hardcoded as "MeCabal" since SmartSMS requires this field.

### OTP Message Template
The function automatically generates messages in this format:
```
Your MeCabal verification PIN is 1234. Valid for 5 minutes. Do not share this PIN with anyone.
```
**Note**: Uses "PIN" instead of "code" to avoid SmartSMS keyword restrictions.

### Phone Number Format
The function automatically handles Nigerian phone number formatting:
- Input: `+2348012345678` (from mobile app)
- Converted to: `08012345678` (for SmartSMS API)
- Removes country code (+234 or 234) and ensures leading 0

## Testing the Integration

After setting up the environment variables, you can test both SMS and WhatsApp:

1. **Deploy the edge function**:
   ```bash
   supabase functions deploy nigerian-phone-verify
   ```

2. **Test SMS OTP**:
   ```bash
   curl -X POST 'https://your-project.supabase.co/functions/v1/nigerian-phone-verify' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"phone": "+2348012345678", "purpose": "registration", "method": "sms"}'
   ```

3. **Test WhatsApp OTP**:
   ```bash
   curl -X POST 'https://your-project.supabase.co/functions/v1/nigerian-phone-verify' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"phone": "+2348012345678", "purpose": "registration", "method": "whatsapp"}'
   ```

4. **Test verifying OTP** (works for both methods):
   ```bash
   curl -X POST 'https://your-project.supabase.co/functions/v1/nigerian-phone-verify' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"phone": "+2348012345678", "otp_code": "1234", "verify": true, "purpose": "registration"}'
   ```

## Response Format

### Successful OTP Send
```json
{
  "success": true,
  "carrier": "MTN",
  "carrier_color": "#FFD700",
  "message": "OTP sent successfully via SmartSMS",
  "expires_at": "2024-01-01T12:05:00.000Z"
}
```

### Successful OTP Verification
```json
{
  "success": true,
  "verified": true,
  "carrier": "MTN",
  "message": "Phone number verified successfully"
}
```

### Error Response
```json
{
  "error": "Invalid Nigerian phone number. Use format +234XXXXXXXXXX"
}
```

## Troubleshooting

### Common Issues:

1. **"SmartSMS API token not configured"**
   - Ensure `SMARTSMS_API_TOKEN` is set in your environment variables

2. **"Invalid Nigerian phone number"**
   - Phone number must be in format `+234XXXXXXXXXX`
   - Must be a valid Nigerian mobile number

3. **"Unsupported Nigerian carrier"**
   - Only MTN, Airtel, Glo, and 9mobile are supported
   - Check if the phone number prefix is recognized

4. **SMS delivery failed**
   - Check SmartSMS API token validity
   - Check SmartSMS account balance and units remaining
   - Verify phone number is not on DND (will use corporate route automatically)

5. **Message contains restricted keywords**
   - SmartSMS blocks certain words like "code", "verify", etc.
   - The function uses "PIN" instead of "code" to avoid this
   - If you get keyword errors, check SmartSMS documentation for restricted words


## Supported Nigerian Carriers

- **MTN**: 0803, 0806, 0703, 0706, 0813, 0816, 0810, 0814, 0903, 0906
- **Airtel**: 0802, 0808, 0812, 0701, 0708, 0901, 0902, 0904, 0907  
- **Glo**: 0805, 0807, 0815, 0811, 0905, 0915
- **9mobile**: 0809, 0818, 0817, 0909, 0908