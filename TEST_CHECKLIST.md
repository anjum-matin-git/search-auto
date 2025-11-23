# 🧪 End-to-End Testing Checklist

Test your complete SearchAuto payment system:

## 1️⃣ Authentication Flow

- [ ] **Signup**: Create new account
  - Navigate to `/signup`
  - Enter username, email, password
  - Should receive JWT token
  - Should be redirected to home

- [ ] **Login**: Login with test account
  - Email: test@searchauto.ai
  - Password: password123
  - Should receive JWT token
  - Should see username in navbar

- [ ] **Logout**: Sign out
  - Click logout button
  - Should clear localStorage
  - Should redirect to home

## 2️⃣ Search Flow (Free Tier)

- [ ] **First Search**: Run a search
  - Query: "fast sports car under $50k"
  - Should show results
  - Credits remaining: 2/3

- [ ] **Second Search**:
  - Query: "family SUV"
  - Should show results
  - Credits remaining: 1/3

- [ ] **Third Search**:
  - Query: "electric vehicle"
  - Should show results
  - Credits remaining: 0/3

- [ ] **Paywall Trigger**: Fourth search
  - Query: "luxury sedan"
  - Should show **paywall modal**
  - Should display "Out of Credits"

## 3️⃣ Pricing Page

- [ ] **View Plans**:
  - Navigate to `/pricing`
  - Should see 3 plans:
    - Personal: $5 for 50 credits
    - Pro: $25/month unlimited
    - Premium: Contact sales

- [ ] **Unauthenticated Checkout**:
  - Logout if logged in
  - Click "Get Started" on Personal
  - Should redirect to `/login`

- [ ] **Authenticated Checkout**:
  - Login first
  - Click "Go Pro"
  - Should create Stripe checkout session
  - Should redirect to Stripe checkout page

## 4️⃣ Stripe Checkout (Test Mode)

- [ ] **Enter Payment Info**:
  - Card: 4242 4242 4242 4242
  - Expiry: 12/34
  - CVC: 123
  - Name: Test User

- [ ] **Complete Payment**:
  - Click "Pay"
  - Should process payment
  - Should redirect to success URL

## 5️⃣ Payment Fulfillment

- [ ] **Webhook Processing**:
  - Check backend logs for webhook event
  - Should see "payment_success_credits_granted"

- [ ] **Credits Updated**:
  - Pro plan: Should have unlimited searches
  - Personal plan: Should have +50 credits

- [ ] **Unlimited Search Test**:
  - If Pro: Run 10+ searches
  - Should never hit paywall

## 6️⃣ Subscription Management

- [ ] **View Active Subscription**:
  - Check `/api/billing/credits`
  - Should show active subscription

- [ ] **Cancel Subscription** (Stripe Dashboard):
  - Cancel in Stripe
  - Webhook should revoke unlimited
  - Should revert to free tier

## 7️⃣ Edge Cases

- [ ] **Invalid Token**: Remove token from localStorage
  - Protected endpoints should return 401

- [ ] **Expired Token**: Wait 7 days (or modify JWT_SECRET)
  - Should require re-login

- [ ] **No Credits**: Drain all credits
  - Search should return 402
  - Should show paywall

## ✅ Production Readiness Checklist

- [ ] All LSP errors resolved
- [ ] JWT authentication working
- [ ] Stripe checkout creates sessions
- [ ] Webhooks receive and process events
- [ ] Credits deducted atomically
- [ ] Paywall triggers correctly
- [ ] Frontend sends JWT in Authorization header
- [ ] Database plans have stripe_price_id values
- [ ] Test account works (test@searchauto.ai)
- [ ] Architect approved final code

---

**Status**: Ready for testing once Stripe keys are added!
