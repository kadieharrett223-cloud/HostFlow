# SMS & Status Tracking Setup Guide

This guide explains how to set up the new SMS notification and party status tracking features in HostFlow.

## Overview of Changes

### New Features
1. **SMS Notifications**: Customers receive text notifications when they join and when their table is ready
2. **Party Status Flow**: Parties now progress through: `waiting` → `ready` → `seated` (or `no_show`)
3. **Position Tracking**: Guests can see their position in the queue and estimated wait time
4. **No-Show Detection**: Staff can mark parties as no-show after 5 minutes of not being seated

### New Statuses
- `waiting`: Customer is in the queue
- `ready`: Table is ready, customer has been notified
- `seated`: Customer has been seated
- `no_show`: Customer didn't show up after being marked ready

## Database Schema Changes

You'll need to create these fields in the `parties` table:

```sql
-- Add these columns to the parties table:
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS ready_at TIMESTAMP WITH TIME ZONE;

-- Update the status constraint:
ALTER TABLE public.parties DROP CONSTRAINT IF EXISTS parties_status_check;
ALTER TABLE public.parties ADD CONSTRAINT parties_status_check 
  CHECK (status IN ('waiting', 'ready', 'seated', 'no_show'));

-- Create indexes for performance:
CREATE INDEX IF NOT EXISTS parties_status_restaurant_idx ON public.parties(status, restaurant_slug);
CREATE INDEX IF NOT EXISTS parties_ready_at_idx ON public.parties(ready_at) WHERE status = 'ready';
```

### RLS Policy Updates

Make sure your RLS policies allow updates to the `status` and `ready_at` columns:

```sql
-- For authenticated users (staff)
CREATE POLICY "Staff can update parties" ON public.parties
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- For anonymous users (guests - if needed)
CREATE POLICY "Anon can read parties" ON public.parties
  FOR SELECT
  USING (true);
```

## Setting Up Twilio for SMS

### 1. Create a Twilio Account
1. Go to [twilio.com](https://www.twilio.com)
2. Sign up and create an account
3. Verify your phone number

### 2. Get Your Credentials
1. Go to Twilio Console → Account Info
2. Copy your Account SID
3. Copy your Auth Token
4. Go to Phone Numbers → Manage Numbers
5. Purchase a phone number or use your trial number

### 3. Configure Environment Variables
Add these to your `.env.local`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### 4. Testing SMS (Trial Account)
Twilio trial accounts can only send SMS to verified numbers. To test:
1. Go to Twilio Console → Phone Numbers → Verified Caller IDs
2. Add your personal phone number
3. Verify it via SMS or call

## User Flow

### Customer Perspective
1. **Join Waitlist**: Customer enters name, party size, phone number, and notes
2. **SMS Confirmation**: Immediately receives text with their position in queue
3. **Status Page**: Sees their position (#1, #2, etc.) and estimated wait time
4. **Ready Notification**: Gets SMS when table is ready + sees "Your table is ready! 🎉" on status page
5. **Seating**: Goes to host stand and is seated

### Staff Perspective
1. **Add Walk-In**: Add customers directly from the host dashboard
2. **Mark Ready**: Click "Ready" button when table is prepared
3. **Send SMS**: Automatically sends "<Name>, your table is ready!" text
4. **Seat Party**: Click "Seated" after guest checks in
5. **No-Show Detection**: Row turns orange after 5 minutes if still marked "ready" but not seated
6. **Mark No-Show**: Click "No-Show" button to mark customer as no-show

## API Endpoints

### POST /api/send-sms
Sends an SMS notification to a customer.

**Request:**
```json
{
  "phone": "+1234567890",
  "message": "Your message here"
}
```

**Response:**
```json
{
  "success": true,
  "sid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

## SMS Message Templates

### Join Confirmation
```
Hi [Name]! You've been added to the waitlist at [Restaurant]. You're #[Position] in line. We'll text you when your table is ready.
```

### Table Ready
```
Your table at [Restaurant] is ready! Please proceed to the host stand.
```

## Testing Checklist

- [ ] Database migrations applied
- [ ] Twilio account created and configured
- [ ] `.env.local` includes Twilio credentials
- [ ] Customer can join waitlist and receive SMS
- [ ] Host can mark party as "Ready"
- [ ] Customer receives "table is ready" SMS
- [ ] No-show detection works (row turns orange after 5 mins)
- [ ] Status page shows correct position and wait time

## Troubleshooting

### SMS Not Sending
1. Check Twilio credentials in `.env.local`
2. Verify phone number includes country code (e.g., +1)
3. Check Twilio trial restrictions (verify numbers if in trial)
4. Look at Next.js server logs for API warnings

### Position Not Updating
1. Check that Realtime subscriptions are active in browser devtools
2. Verify RLS policies allow SELECT on parties table
3. Ensure `restaurant_slug` filter is correct

### No-Show Not Detecting
1. Verify `ready_at` timestamp is being set
2. Check that current time calculation is correct
3. Ensure row highlighting CSS is applied

## Cost Considerations

Twilio SMS pricing (US):
- Inbound SMS: ~$0.0075 per message
- Outbound SMS: ~$0.0075 per message

Pro tip: Use Twilio's free trial credits ($15) to test before going live.
