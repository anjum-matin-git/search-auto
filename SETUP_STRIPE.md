# 🚀 Stripe Setup Guide for SearchAuto

Your payment system is **production-ready** and waiting for Stripe configuration!

## ✅ What's Already Built:

- JWT Authentication (secure token-based auth)
- Credit system with atomic deduction
- Stripe checkout integration
- Webhook handlers for payment fulfillment
- Frontend payment flow

## 📝 Step 1: Get Your Stripe API Keys

1. Go to your **Stripe Dashboard**: https://dashboard.stripe.com
2. Click **Developers** → **API keys**
3. Copy your **Secret key** (starts with `sk_test_` for test mode)
4. Copy your **Publishable key** (starts with `pk_test_` for test mode)

## 🔧 Step 2: Add Keys to Replit

1. In Replit, click **Secrets** (lock icon in left sidebar)
2. Add these secrets:
   - `STRIPE_SECRET_KEY` = your secret key
   - `STRIPE_PUBLISHABLE_KEY` = your publishable key
   - `JWT_SECRET_KEY` = any random string (e.g., `your-super-secret-jwt-key-change-me`)

## 🎨 Step 3: Create Products in Stripe

Run this command to create your pricing plans in Stripe:

```bash
cd backend && python scripts/create_stripe_products.py
```

This will create:
- **Personal Plan**: $5 for 50 credits
- **Pro Plan**: $25/month for unlimited searches

## 🔔 Step 4: Configure Webhook

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL:
   ```
   https://your-replit-url.repl.co/api/billing/webhook
   ```
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to Replit Secrets as `STRIPE_WEBHOOK_SECRET`

## 🧪 Step 5: Test with Stripe Test Cards

Use these test cards:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- Any future expiry date, any CVC

## 🎯 Test Account

Already created for you:
- **Email**: test@searchauto.ai
- **Password**: password123
- **Credits**: 999,999 (unlimited for testing)

## 🚀 Ready to Go Live?

When ready for production:
1. Switch to **live mode** in Stripe Dashboard
2. Get your live API keys (start with `sk_live_` and `pk_live_`)
3. Update Replit secrets with live keys
4. Complete Stripe's KYB verification

---

**Need help?** Check the logs or contact support.
