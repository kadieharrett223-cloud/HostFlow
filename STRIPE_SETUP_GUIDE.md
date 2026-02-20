# Stripe Payment Setup Guide

This guide walks you through setting up Stripe for HostFlow subscriptions.

## 1. Create a Stripe Account

1. Go to **https://stripe.com**
2. Click **Sign up** and create an account
3. Verify your email
4. Complete basic business info

## 2. Get Your API Keys

1. In Stripe Dashboard, click **Developers** → **API keys**
2. Copy both keys:
   - **Publishable Key** (starts with `pk_test_`)
   - **Secret Key** (starts with `sk_test_`)
3. Add to your `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

## 3. Create Products & Prices

You need 6 products (2 price tiers × 3 billing options):

### In Stripe Dashboard:

1. Go to **Products** → **Create Product**

**Product 1: Starter Plan**
- Name: `HostFlow Starter - Monthly`
- Type: Recurring
- Price: $49/month
- Billing period: Monthly
- Get the **Price ID** (starts with `price_`)

**Product 2: Starter Plan Annual**
- Name: `HostFlow Starter - Annual`
- Type: Recurring
- Price: $499/year
- Billing period: Yearly
- Get the Price ID

**Product 3: Professional Plan Monthly**
- Name: `HostFlow Professional - Monthly`
- Type: Recurring
- Price: $99/month
- Billing period: Monthly
- Get the Price ID

**Product 4: Professional Plan Annual**
- Name: `HostFlow Professional - Annual`
- Type: Recurring
- Price: $999/year
- Billing period: Yearly
- Get the Price ID

**Product 5: Enterprise Plan Monthly**
- Name: `HostFlow Enterprise - Monthly`
- Type: Recurring
- Price: $299/month
- Billing period: Monthly
- Get the Price ID

**Product 6: Enterprise Plan Annual**
- Name: `HostFlow Enterprise - Annual`
- Type: Recurring
- Price: $2,999/year
- Billing period: Yearly
- Get the Price ID

### Update `src/app/api/checkout/route.ts`

Replace the `priceIdMap` with your actual Price IDs:

```typescript
const priceIdMap = {
  starter_monthly: "price_1234567890abcdef",     // Your actual Price ID
  starter_annual: "price_0987654321fedcba",
  professional_monthly: "price_xxx",
  professional_annual: "price_yyy",
  enterprise_monthly: "price_zzz",
  enterprise_annual: "price_aaa",
};
```

## 4. Set Up Webhook

Stripe needs to notify your app when subscriptions are updated.

### Create Webhook Endpoint:

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. URL: `https://yourdomain.com/api/webhooks/stripe`
4. Events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.paid`
5. Click **Create endpoint**
6. Click your new endpoint, then **Reveal** to get the **Signing secret** (starts with `whsec_`)

### Add to `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 5. Test in Development

### Local Testing

To test webhook locally, you need Stripe CLI:

1. Download **Stripe CLI**: https://stripe.com/docs/stripe-cli
2. Install it
3. Run:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. You'll get a signing secret to add to `.env.local`

### Test Payment Flow

1. Go to `http://localhost:3000/pricing`
2. Click **Get Started** on any plan
3. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
4. Complete checkout
5. Check Supabase `subscriptions` table - should have new record

## 6. Environment Variables Checklist

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Twilio (existing)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_MESSAGING_SERVICE_SID=MGxxx

# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

## 7. Go Live Checklist

Before going to production with paid subscriptions:

- [ ] Switch from `pk_test_` to `pk_live_` keys (live mode in Stripe)
- [ ] Switch from `sk_test_` to `sk_live_` keys
- [ ] Update webhook to `https://yourdomain.com/api/webhooks/stripe` (not localhost)
- [ ] Set `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Deploy to production
- [ ] Test with a real credit card (small charge like $1)
- [ ] Verify subscription shows in Supabase `subscriptions` table
- [ ] Create Terms of Service and Privacy Policy

## 8. Testing Stripe Events

In development with Stripe CLI running, you can manually trigger events:

```bash
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

## 9. Test Card Numbers

| Scenario | Card Number | Expiry | CVC |
|----------|------------|--------|-----|
| Success | 4242 4242 4242 4242 | 12/25 | 123 |
| Decline | 4000 0000 0000 0002 | 12/25 | 123 |
| 3D Secure | 4000 0025 0000 3155 | 12/25 | 123 |

## 10. Common Issues

### "Webhook signature verification failed"
- Make sure `STRIPE_WEBHOOK_SECRET` is set correctly
- In development, use secret from `stripe listen` output

### "Invalid plan or billing period"
- Check that `priceIdMap` keys match exactly: `starter_monthly`, `professional_annual`, etc.
- Verify Price IDs are correct (should start with `price_`)

### Subscription not appearing in database
- Check that webhook is running (if testing locally, Stripe CLI must be active)
- Check server logs for errors
- Verify RLS policies allow insert on `subscriptions` table

## Next Steps

1. **Create restaurant registration page** - Let users sign up and chose a plan
2. **Create dashboard** - Show subscription status and usage
3. **Enforce plan limits** - Block features based on subscription tier
4. **Add team management** - Let restaurant owners add staff
