# 🚀 Complete Stripe Setup Guide

I'll walk you through setting up Stripe for SearchAuto step-by-step!

## ✅ Step 1: Get Your Stripe Keys (2 minutes)

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com
   - If you don't have an account, sign up (it's free!)

2. **Get Your API Keys**:
   - Click **Developers** in the left sidebar
   - Click **API keys**
   - You'll see two keys:
     - **Publishable key** (starts with `pk_test_...`)
     - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key"
   
3. **Copy both keys** - you'll need them in the next step

## 🔐 Step 2: Add Keys to Replit (1 minute)

1. In Replit, click the **🔒 Secrets** tab (lock icon in left sidebar)

2. Add these 3 secrets (click "+ New Secret" for each):

   ```
   Name: STRIPE_SECRET_KEY
   Value: sk_test_your_secret_key_here
   ```

   ```
   Name: STRIPE_PUBLISHABLE_KEY
   Value: pk_test_your_publishable_key_here
   ```

   ```
   Name: JWT_SECRET_KEY
   Value: make-this-a-random-string-at-least-32-characters-long
   ```

   **Important**: For JWT_SECRET_KEY, use a random string like:
   ```
   mysupersecretjwtkey123456789abcdefghijklmnopqrstuvwxyz
   ```

3. Click **Save** after each secret

## 🎨 Step 3: Create Products in Stripe Dashboard

**I'll create the products for you automatically!** But first, let me explain what we're creating:

### Products to Create:

**1. Personal Plan**
- Name: SearchAuto Personal
- Price: $5 one-time
- Description: 50 car search credits

**2. Pro Plan**
- Name: SearchAuto Pro
- Price: $25/month subscription
- Description: Unlimited car searches

**3. Premium Plan** (Contact sales - no Stripe product needed)

### Automatic Setup:

I'll create a script that:
1. Creates these products in your Stripe account
2. Updates your database with the Stripe price IDs
3. Makes everything work automatically

**Ready?** Just let me know when you've added the Stripe keys to Replit Secrets, and I'll run the setup for you!

## 🔔 Step 4: Webhook Configuration (2 minutes)

After products are created, we need to set up webhooks so Stripe can notify us when payments succeed:

1. In Stripe Dashboard, go to **Developers** → **Webhooks**

2. Click **Add endpoint**

3. Enter your endpoint URL:
   ```
   https://[your-repl-name].[your-username].repl.co/api/billing/webhook
   ```
   **Replace** `[your-repl-name]` and `[your-username]` with your actual Replit info

4. Under "Select events to listen to", choose:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`

5. Click **Add endpoint**

6. On the webhook details page, click **Reveal signing secret**

7. Copy the secret (starts with `whsec_...`)

8. Add it to Replit Secrets:
   ```
   Name: STRIPE_WEBHOOK_SECRET
   Value: whsec_your_webhook_secret_here
   ```

## 🧪 Step 5: Test with Stripe Test Cards

Use these test cards to make sure everything works:

### Successful Payment:
```
Card Number: 4242 4242 4242 4242
Expiry: 12/34 (any future date)
CVC: 123 (any 3 digits)
ZIP: 12345 (any 5 digits)
```

### Declined Payment:
```
Card Number: 4000 0000 0000 0002
```

## ✅ What Happens After Setup:

1. **User signs up** → Creates account
2. **User runs 3 searches** → Free tier exhausted
3. **Paywall appears** → Redirects to pricing page
4. **User clicks "Go Pro"** → Redirects to Stripe checkout
5. **User pays** → Stripe webhook grants credits/subscription
6. **User can search** → Unlimited (Pro) or +50 credits (Personal)

---

## 🆘 Need Help?

**Common Issues:**

❌ **"No such price"** error:
- Make sure you ran the product creation script
- Check that price IDs are in your database

❌ **Webhook not receiving events**:
- Verify webhook URL is correct
- Check webhook signing secret is set
- Make sure you selected the right events

❌ **Checkout redirects to error page**:
- Verify STRIPE_SECRET_KEY is set correctly
- Check browser console for errors

---

**Ready to start?** Add your Stripe keys to Replit Secrets and let me know! 🚀
