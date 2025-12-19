# Razorpay Payment Integration - Setup Guide

This document explains the complete Razorpay payment integration for the Bhishak Med subscription system.

## Features Implemented

1. **Minute Purchase** - One-time purchase of extra video minutes
2. **Subscription Upgrade** - Monthly subscription plan upgrades
3. **Payment Verification** - Frontend signature verification + Backend webhook confirmation
4. **Webhook Handler** - Server-side payment confirmation for security

## Architecture

### Payment Flow

```
Frontend → Create Order (Backend) → Razorpay Modal → Payment Success
   ↓                                                        ↓
   ↓                                                  Verify Signature
   ↓                                                        ↓
   ←────────── Confirm Purchase/Upgrade (Backend) ─────────┘
                           ↓
                    Update Database
                           ↓
                    Webhook (Razorpay → Backend)
                           ↓
                  Secondary Verification
```

### Dual Verification System

1. **Frontend Callback**: Immediate user feedback, verified with signature
2. **Webhook**: Server-side confirmation from Razorpay (backup + audit trail)

## Setup Instructions

### 1. Get Razorpay Credentials

#### For Testing (FREE):

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up / Log in
3. Navigate to: **Settings → API Keys**
4. Generate **Test Mode** keys:
   - `Key ID`: Starts with `rzp_test_`
   - `Key Secret`: Keep this secret!

#### For Production:

1. Complete KYC verification on Razorpay
2. Switch to **Live Mode** in dashboard
3. Generate **Live Mode** keys:
   - `Key ID`: Starts with `rzp_live_`
   - `Key Secret`: Keep this secret!

### 2. Configure Environment Variables

#### Backend (.env)

```env
# Razorpay Credentials
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET_HERE
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE
```

#### Frontend (.env.local)

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Razorpay Public Key (Safe to expose in frontend)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
```

### 3. Set Up Webhook (Production)

1. Go to **Settings → Webhooks** in Razorpay Dashboard
2. Click **Create Webhook**
3. Enter webhook URL: `https://yourdomain.com/api/subscription/webhook`
4. Select events:
   - `payment.captured`
   - `payment.failed`
5. Enter a secret (or generate one)
6. Copy the secret to `RAZORPAY_WEBHOOK_SECRET` in backend .env

**For Local Testing** (using ngrok or similar):
```bash
# Install ngrok
npm install -g ngrok

# Expose local backend
ngrok http 5000

# Use the ngrok URL in webhook setup
# Example: https://abc123.ngrok.io/api/subscription/webhook
```

## Testing the Integration

### Test Cards (Razorpay Test Mode)

**Success:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits (e.g., `123`)
- Expiry: Any future date (e.g., `12/25`)
- Name: Any name

**Failure:**
- Card Number: `4000 0000 0000 0002`

### Test Flow

#### 1. Test Minute Purchase

```javascript
// Navigate to: /doctor/subscription
// Click "Buy Now" on any minute package
// Use test card: 4111 1111 1111 1111
// Check console for payment confirmation
// Verify minutes added in database
```

**Expected Results:**
- Razorpay modal opens
- Payment succeeds
- Alert: "Success! 100 minutes added to your account."
- Dashboard shows updated minutes
- Database: `doctor.purchasedMinutes` increased

#### 2. Test Subscription Upgrade

```javascript
// Navigate to: /doctor/subscription
// Click "Upgrade to BASIC" (or any plan)
// Use test card: 4111 1111 1111 1111
// Check console for payment confirmation
// Verify subscription updated in database
```

**Expected Results:**
- Razorpay modal opens
- Payment succeeds
- Alert: "Success! You've been upgraded to Basic Plan."
- Dashboard shows new subscription tier
- Database: `doctor.subscriptionTier = 'BASIC'`

#### 3. Test Webhook (If Configured)

```bash
# Check backend logs for webhook events
# Should see:
📥 Webhook received: payment.captured
✅ Minute purchase confirmed: 100 minutes for doctor abc123
```

## API Endpoints

### Public Endpoints

```
GET  /api/subscription/plans             # Get all subscription plans
GET  /api/subscription/minute-packages   # Get minute packages
```

### Authenticated Endpoints (Doctor)

```
GET  /api/subscription/my-subscription   # Get current subscription info
POST /api/subscription/upgrade           # Create subscription upgrade order
POST /api/subscription/confirm-upgrade   # Confirm subscription payment
POST /api/subscription/purchase-minutes  # Create minute purchase order
POST /api/subscription/confirm-purchase  # Confirm minute purchase payment
```

### Webhook Endpoint (Razorpay Only)

```
POST /api/subscription/webhook           # Receive payment notifications
```

## Code Structure

### Backend

```
backend/src/
├── controllers/
│   └── subscription.controller.ts       # All subscription logic
├── routes/
│   └── subscription.routes.ts           # Subscription routes
└── middleware/
    └── auth.ts                           # Authentication middleware
```

**Key Functions:**

1. `upgradeSubscription()` - Creates Razorpay order for subscription
2. `confirmSubscriptionUpgrade()` - Verifies payment and updates subscription
3. `purchaseMinutes()` - Creates Razorpay order for minutes
4. `confirmMinutePurchase()` - Verifies payment and adds minutes
5. `handleRazorpayWebhook()` - Processes webhook events

### Frontend

```
frontend/
├── app/doctor/subscription/
│   └── page.tsx                          # Subscription management UI
├── lib/
│   └── api.ts                            # API client with subscription endpoints
└── types/
    └── index.ts                          # TypeScript types
```

**Key Components:**

1. Current Usage Display
2. Minute Packages Grid
3. Subscription Plans Grid
4. Razorpay Integration (Script + Payment Handlers)

## Security Features

### 1. Payment Signature Verification

Both minute purchase and subscription upgrade verify the Razorpay signature:

```typescript
const expectedSignature = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(orderId + '|' + paymentId)
  .digest('hex');

if (expectedSignature !== razorpaySignature) {
  throw new Error('Invalid signature');
}
```

### 2. Webhook Signature Verification

```typescript
const expectedSignature = crypto
  .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (webhookSignature !== expectedSignature) {
  return res.status(400).json({ error: 'Invalid signature' });
}
```

### 3. Idempotency

Webhooks check if payment already processed:

```typescript
if (existingPurchase?.paymentStatus === 'COMPLETED') {
  console.log('⚠️ Purchase already processed');
  return res.status(200).json({ success: true });
}
```

## Pricing

### Monthly Plans

| Plan | Price | Patients | Video Minutes |
|------|-------|----------|---------------|
| TRIAL | Free (14 days) | 2 | 100 |
| BASIC | ₹999/month | 50 | 500 |
| PROFESSIONAL | ₹2,499/month | 200 | 2000 |
| ENTERPRISE | ₹4,999/month | Unlimited | 5000 |

### Extra Minutes (One-time, Carry Over)

| Minutes | Price | Per Minute | Savings |
|---------|-------|------------|---------|
| 100 | ₹99 | ₹0.99 | - |
| 300 | ₹249 | ₹0.83 | 16% |
| 500 | ₹399 | ₹0.80 | 20% |
| 1000 | ₹699 | ₹0.70 | 30% |

## Database Models

### MinutePurchase

```prisma
model MinutePurchase {
  id                String   @id @default(uuid())
  doctorId          String
  minutes           Int
  price             Int      // in paise
  razorpayOrderId   String?  @unique
  razorpayPaymentId String?  @unique
  paymentStatus     String   @default("PENDING")  // PENDING | COMPLETED | FAILED
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### Doctor (Subscription Fields)

```prisma
model Doctor {
  subscriptionTier    SubscriptionTier @default(TRIAL)
  subscriptionStatus  String @default("TRIAL")
  subscriptionEndsAt  DateTime?
  trialEndsAt         DateTime

  patientLimit        Int @default(2)
  patientsCreated     Int @default(0)

  monthlyVideoMinutes Int @default(100)
  purchasedMinutes    Int @default(0)
  totalMinutesUsed    Int @default(0)
  lastResetDate       DateTime @default(now())
}
```

## Troubleshooting

### Issue: "Payment gateway is loading"

**Cause**: Razorpay script not loaded yet
**Solution**: Wait a few seconds and try again, or check browser console for script errors

### Issue: "Invalid payment signature"

**Cause**: Mismatch between frontend and backend Razorpay credentials
**Solution**: Ensure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` match in both .env files

### Issue: "Webhook not receiving events"

**Cause**: Webhook URL not configured or unreachable
**Solutions**:
- For local testing: Use ngrok or similar to expose localhost
- For production: Ensure HTTPS is configured
- Check Razorpay Dashboard → Webhooks → Logs for errors

### Issue: "Payment succeeded but minutes not added"

**Cause**: Frontend callback failed, webhook should catch it
**Solution**: Check backend logs for webhook events, manually check payment status in Razorpay dashboard

## Production Checklist

- [ ] Switch to Razorpay **Live Mode** keys
- [ ] Update `RAZORPAY_KEY_ID` in frontend .env
- [ ] Update `RAZORPAY_KEY_SECRET` in backend .env
- [ ] Configure webhook URL with HTTPS
- [ ] Set strong `RAZORPAY_WEBHOOK_SECRET`
- [ ] Test payment flow with real card (₹1)
- [ ] Enable webhook events: `payment.captured`, `payment.failed`
- [ ] Set up monitoring/alerts for payment failures
- [ ] Configure email notifications for successful payments
- [ ] Test subscription renewal flow
- [ ] Set up cron job for monthly quota reset

## Support

For Razorpay-specific issues:
- Docs: https://razorpay.com/docs/
- Support: https://razorpay.com/support/

For integration issues:
- Check backend logs for detailed error messages
- Verify environment variables are correctly set
- Test with Razorpay test cards first
- Use webhook logs in Razorpay dashboard to debug webhook issues
