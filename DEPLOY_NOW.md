# ⚡ QUICK START - Deploy to Railway NOW

## ⏱️ 15 Minute Deployment

## 🔐 CRITICAL SECURITY STEP - READ FIRST!

**⚠️ YOU MUST GENERATE YOUR OWN UNIQUE SECRETS!**
- NEVER use example secrets from documentation
- NEVER reuse secrets across projects
- NEVER share secrets publicly

---

### Step 1: Generate Your Unique Security Keys (5 min)

Open your terminal and run these commands:

```bash
# Generate JWT Secret (copy the output)
openssl rand -base64 64

# Generate Encryption Key (copy the output)
openssl rand -base64 32
```

**📋 Expected Output:**
- JWT_SECRET: ~88 characters (e.g., `abc123XYZ...`)
- ENCRYPTION_KEY: ~44 characters (e.g., `def456UVW...`)

**💾 SAVE THESE OUTPUTS!** Copy them to a secure note - you'll paste them into Railway in Step 3.

**🚨 SECURITY WARNING:**
These keys are like passwords for your entire application:
- Protect patient data encryption
- Secure authentication tokens
- Must remain SECRET forever

**DO NOT:**
- ❌ Use any example values from this guide
- ❌ Commit these to git
- ❌ Share in screenshots or messages
- ❌ Reuse from other projects

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
2. Select your repository: `Noman-crl/Bhishak_Med`
3. **IMPORTANT**: Set Root Directory to `backend`
4. Go to "Variables" tab and add these environment variables:

**🔐 CRITICAL - Use YOUR Generated Secrets from Step 1:**

```bash
NODE_ENV=production
PORT=5000

# 🚨 PASTE YOUR ACTUAL SECRETS FROM STEP 1 (NOT these placeholders!)
JWT_SECRET=<PASTE_THE_88_CHAR_STRING_FROM_STEP_1_HERE>
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=<PASTE_THE_44_CHAR_STRING_FROM_STEP_1_HERE>

# Razorpay (get LIVE keys from https://dashboard.razorpay.com/app/keys)
RAZORPAY_KEY_ID=rzp_live_YOUR_ACTUAL_LIVE_KEY
RAZORPAY_KEY_SECRET=YOUR_ACTUAL_SECRET_FROM_RAZORPAY
RAZORPAY_WEBHOOK_SECRET=YOUR_ACTUAL_WEBHOOK_SECRET

# Agora (get from https://console.agora.io/)
AGORA_APP_ID=YOUR_ACTUAL_AGORA_APP_ID
AGORA_APP_CERTIFICATE=YOUR_ACTUAL_AGORA_CERTIFICATE

# Frontend (update after Step 4)
FRONTEND_URL=https://your-app.railway.app
UPLOAD_DIR=./uploads
CORS_ORIGIN=https://your-app.railway.app
```

**⚠️ DOUBLE CHECK:**
- [ ] JWT_SECRET is ~88 characters long (your own generated value)
- [ ] ENCRYPTION_KEY is ~44 characters long (your own generated value)
- [ ] You used LIVE Razorpay keys (not test keys)
- [ ] You created a NEW Agora project for production

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

## 🔥 CRITICAL - Do This Immediately After Deployment

### 1. Seed Database (Creates admin & test accounts)
```bash
# In Railway: Backend service → "..." → "Shell"
npm run prisma:seed
```

This creates:
- Admin: `admin@bhishakmed.com` / `admin123`
- Test Doctor: `doctor@test.com` / `doctor123`

### 2. Change Default Passwords **IMMEDIATELY**
🚨 **SECURITY RISK**: Default passwords are public knowledge!

- Login to admin panel
- Change password NOW
- Update test doctor password too

### 3. Configure Razorpay Webhook
- Go to https://dashboard.razorpay.com
- Settings → Webhooks
- Add URL: `https://your-backend.railway.app/api/payments/webhook`
- Select events: `subscription.*`, `payment.*`

### 4. Verify Environment Variables
Double-check in Railway backend Variables tab:
- [ ] JWT_SECRET is YOUR generated 88-char string (not a placeholder)
- [ ] ENCRYPTION_KEY is YOUR generated 44-char string (not a placeholder)
- [ ] All URLs use HTTPS (not http)
- [ ] CORS_ORIGIN matches your frontend URL exactly

---

## ✅ DEPLOYMENT COMPLETE!

**Your Bhishak Med platform is now LIVE! 🎉**

### 🔒 Security Checklist:
- [ ] Changed default admin password
- [ ] Generated unique JWT_SECRET
- [ ] Generated unique ENCRYPTION_KEY
- [ ] Using LIVE Razorpay credentials
- [ ] Configured Razorpay webhooks
- [ ] Using production Agora credentials
- [ ] No .env files committed to git

---

## 📚 Next Steps:

See **RAILWAY_DEPLOY_GUIDE.md** for:
- Detailed troubleshooting
- Custom domain setup
- Performance monitoring
- Backup strategies

---

## 🆘 If You See Errors:

**"Authentication failed"** → Check JWT_SECRET is set correctly
**"Database connection error"** → Verify DATABASE_URL reference is linked
**"CORS error"** → Update CORS_ORIGIN to match your frontend URL exactly
**"Payment webhook failed"** → Configure webhook URL in Razorpay dashboard

---

**Need help?** Check the logs in Railway: Service → "View Logs"
