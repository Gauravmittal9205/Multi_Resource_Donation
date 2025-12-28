# Twilio Setup Guide for Phone OTP

## Quick Setup Steps

### 1. Create Twilio Account
- Visit: https://www.twilio.com/try-twilio
- Sign up with your email
- Verify your email address

### 2. Get Your Trial Phone Number

1. **Login to Twilio Console**
   - Go to: https://console.twilio.com/
   - You'll see your dashboard

2. **Get a Phone Number**
   - Click on **"Phone Numbers"** in the left sidebar
   - Click **"Manage"** → **"Buy a number"**
   - Click **"Get a number"** button
   - Select:
     - **Country**: Choose your country (e.g., India, USA)
     - **Type**: Phone Number
     - **Capabilities**: Check **SMS**
   - Click **"Search"**
   - Select a number from the list
   - Click **"Buy"** (Free for trial accounts)

3. **Copy Your Phone Number**
   - After purchase, you'll see your number
   - Copy it (format: `+1234567890`)
   - This is your `TWILIO_PHONE_NUMBER`

### 3. Get Your API Credentials

1. **Account SID**
   - In Twilio Console, go to **Account** → **API Keys & Tokens**
   - Your **Account SID** is displayed (starts with `AC...`)
   - Copy this as `TWILIO_ACCOUNT_SID`

2. **Auth Token**
   - On the same page, find **Auth Token**
   - Click **"View"** to reveal it
   - Copy this as `TWILIO_AUTH_TOKEN`

### 4. Update Your .env File

Create or update `backend/.env` file with:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Important Notes:**
- Replace `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your actual Account SID
- Replace `your_auth_token_here` with your actual Auth Token
- Replace `+1234567890` with your actual Twilio phone number
- The phone number must include country code with `+` (e.g., `+919876543210` for India)

### 5. Verify Phone Numbers (Trial Account)

**For Trial Accounts:**
- You can only send SMS to **verified phone numbers**
- To verify a number:
  1. Go to **Phone Numbers** → **Manage** → **Verified Caller IDs**
  2. Click **"Add a new Caller ID"**
  3. Enter the phone number you want to verify
  4. Enter the verification code sent to that number

**For Production:**
- Upgrade your account to send to any number
- Visit: https://www.twilio.com/pricing

### 6. Test Your Setup

1. Restart your backend server
2. Try sending an OTP from your application
3. Check Twilio Console → **Monitor** → **Logs** → **Messaging** for delivery status

## Troubleshooting

### Error: "To and From number cannot be the same"
- **Solution**: Make sure `TWILIO_PHONE_NUMBER` in `.env` is your Twilio number, NOT the user's phone number

### Error: "This phone number is not verified"
- **Solution**: Verify the phone number in Twilio Console (Trial accounts only)

### Error: "Invalid phone number format"
- **Solution**: Ensure phone numbers are in E.164 format: `+[country code][number]`
  - Example: `+919876543210` (India)
  - Example: `+1234567890` (USA)

### Error: "Account SID or Auth Token is incorrect"
- **Solution**: Double-check your credentials in `.env` file
- Make sure there are no extra spaces or quotes

## Trial Account Limitations

- **Free Credits**: $15.50 free credit
- **Verified Numbers Only**: Can only send to verified phone numbers
- **SMS Cost**: ~$0.0075 per SMS (varies by country)
- **Upgrade**: Remove limitations by upgrading your account

## Useful Links

- Twilio Console: https://console.twilio.com/
- Twilio Documentation: https://www.twilio.com/docs
- Phone Number Pricing: https://www.twilio.com/pricing
- Support: https://support.twilio.com/

## Example .env Configuration

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
TWILIO_AUTH_TOKEN=abc123def456ghi789jkl012mno345pqr
TWILIO_PHONE_NUMBER=+15551234567
```

**Remember**: Never commit your `.env` file to version control!

