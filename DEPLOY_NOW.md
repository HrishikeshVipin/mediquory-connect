# ⚡ QUICK START - Deploy to Railway NOW

## ⏱️ 15 Minute Deployment

### Step 1: Prepare Credentials (5 min)

Open your terminal and generate security keys:

```bash
# Generate JWT Secret
openssl rand -base64 64

# Generate Encryption Key
openssl rand -base64 32
```

**Save these keys!** You'll need them in Step 3.

---

### Step 2: Create Railway Project (2 min)

1. Go to https://railway.app
2. Login with GitHub
3. Click "Start a New Project"
4. Click "+ New" → Select "PostgreSQL"
   - Wait for database to provision ✅

---

### Step 3: Deploy Backend (4 min)

1. Click "+ New" → "GitHub Repo"
2. Select your repository
3. **IMPORTANT**: Set Root Directory to `backend`
4. Go to "Variables" tab and add these (copy-paste):

```bash
NODE_ENV=production
PORT=5000
JWT_SECRET=<PASTE_YOUR_GENERATED_JWT_SECRET_HERE>
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=<PASTE_YOUR_GENERATED_ENCRYPTION_KEY_HERE>
RAZORPAY_KEY_ID=rzp_live_YOUR_KEY
RAZORPAY_KEY_SECRET=YOUR_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
AGORA_APP_ID=YOUR_AGORA_ID
AGORA_APP_CERTIFICATE=YOUR_AGORA_CERT
FRONTEND_URL=https://your-app.railway.app
UPLOAD_DIR=./uploads
CORS_ORIGIN=https://your-app.railway.app
```

5. Add DATABASE_URL:
   - Click "+ New Variable"
   - Click "Add Reference"
   - Select PostgreSQL → DATABASE_URL ✅

6. Wait for deployment to complete
7. Copy backend URL (looks like: https://backend-production-xxxx.up.railway.app)

---

### Step 4: Deploy Frontend (3 min)

1. Click "+ New" → "GitHub Repo"
2. Select same repository
3. **IMPORTANT**: Set Root Directory to frontend
4. Go to "Variables" tab and add:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_YOUR_KEY
```

5. Go to Settings → Click "Generate Domain"
6. Copy your frontend URL ✅

---

### Step 5: Update Backend CORS (1 min)

1. Go back to Backend service
2. Go to "Variables" tab
3. Update these two variables with your actual frontend URL:
   - FRONTEND_URL=https://your-actual-frontend.railway.app
   - CORS_ORIGIN=https://your-actual-frontend.railway.app
4. Save (backend will auto-redeploy)

---

## ✅ YOU'RE LIVE!

**Admin Login:** https://your-frontend.railway.app/admin/login
- Email: admin@bhishakmed.com
- Password: admin123

**Doctor Login:** https://your-frontend.railway.app/doctor/login
- Email: doctor@test.com  
- Password: doctor123

---

## 🔥 Do This Right After Deployment

1. **Seed Database** (creates admin & test accounts)
   - Backend service → "..." → "Shell"
   - Run: npm run prisma:seed

2. **Change Admin Password**
   - Login and update immediately

3. **Update Razorpay Webhook**
   - Go to https://dashboard.razorpay.com
   - Settings → Webhooks
   - Add: https://your-backend.railway.app/api/payments/webhook

---

**That's it! Your app is LIVE! 🎉**

See RAILWAY_DEPLOY_GUIDE.md for detailed instructions.
