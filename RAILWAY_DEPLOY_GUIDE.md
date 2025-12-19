# 🚀 Railway Deployment Guide - Bhishak Med

## 🔐 CRITICAL SECURITY NOTICE

**⚠️ NEVER USE EXAMPLE SECRETS FROM DOCUMENTATION!**

This guide contains placeholder values like `REPLACE_WITH_YOUR_OWN`.
You MUST generate your own unique secrets. Exposed secrets = compromised security.

---

## Pre-Deployment Checklist

### 1. Prerequisites
- [ ] Railway account created at [railway.app](https://railway.app)
- [ ] GitHub repository with your code
- [ ] Razorpay account (production LIVE keys - not test)
- [ ] Agora account (production credentials - NEW project)

---

## 📋 Step-by-Step Deployment

### Phase 1: Create Railway Project

1. **Login to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "Start a New Project"

2. **Create PostgreSQL Database**
   - Click "+ New"
   - Select "Database" → "PostgreSQL"
   - Wait for database to provision
   - Railway will automatically provide `DATABASE_URL`

### Phase 2: Deploy Backend

1. **Create Backend Service**
   - Click "+ New" → "GitHub Repo"
   - Select your repository
   - Set **Root Directory**: `backend`
   - Railway will auto-detect Node.js

2. **Configure Backend Environment Variables**

   Go to Backend service → Variables tab and add:

   ```bash
   # Node Environment
   NODE_ENV=production
   PORT=5000

   # JWT Authentication (CRITICAL - Generate new keys!)
   # Run: openssl rand -base64 64
   JWT_SECRET=<PASTE_YOUR_GENERATED_KEY_HERE>
   JWT_EXPIRES_IN=7d

   # Field Encryption (CRITICAL - Generate new key!)
   # Run: openssl rand -base64 32
   ENCRYPTION_KEY=<PASTE_YOUR_GENERATED_KEY_HERE>

   # Razorpay - LIVE CREDENTIALS ONLY
   # Get from: https://dashboard.razorpay.com/app/keys
   RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY
   RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET
   RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET

   # Agora Video SDK - PRODUCTION CREDENTIALS
   # Get from: https://console.agora.io/
   AGORA_APP_ID=YOUR_AGORA_APP_ID
   AGORA_APP_CERTIFICATE=YOUR_AGORA_CERTIFICATE

   # Frontend URL (will update after frontend deployment)
   FRONTEND_URL=https://your-frontend.railway.app

   # File Uploads
   UPLOAD_DIR=./uploads

   # CORS Origins (update with your frontend URL)
   CORS_ORIGIN=https://your-frontend.railway.app
   ```

3. **Add DATABASE_URL Reference**
   - Click "+ New Variable"
   - Click "Add Reference"
   - Select your PostgreSQL database
   - Choose `DATABASE_URL`
   - This automatically links your database

4. **Deploy Backend**
   - Railway will automatically build and deploy
   - Check deployment logs for any errors
   - Once deployed, copy the backend URL (e.g., `https://backend-production-xxxx.up.railway.app`)

### Phase 3: Deploy Frontend

1. **Create Frontend Service**
   - Click "+ New" → "GitHub Repo"
   - Select same repository
   - Set **Root Directory**: `frontend`

2. **Configure Frontend Environment Variables**

   ```bash
   # API URL (use your backend Railway URL)
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api

   # Razorpay LIVE Key
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_ID
   ```

3. **Generate Domain**
   - Go to Frontend service → Settings
   - Click "Generate Domain"
   - Copy the generated domain (e.g., `https://your-app.railway.app`)

4. **Update Backend CORS**
   - Go back to Backend service → Variables
   - Update `FRONTEND_URL` with your frontend domain
   - Update `CORS_ORIGIN` with your frontend domain
   - Save changes (backend will auto-redeploy)

### Phase 4: Database Setup

1. **Run Migrations**

   The migrations run automatically on deployment via:
   ```bash
   npx prisma migrate deploy
   ```

2. **Seed Database (Optional)**

   Connect to your Railway backend shell:
   - Go to Backend service
   - Click "..." → "Shell"
   - Run:
   ```bash
   npm run prisma:seed
   ```

   This creates:
   - Admin user: `admin@bhishakmed.com` / `admin123`
   - Test doctor: `doctor@test.com` / `doctor123`
   - All subscription plans

---

## 🔧 Post-Deployment Configuration

### 1. Update Razorpay Webhooks

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to Settings → Webhooks
3. Add webhook URL:
   ```
   https://your-backend.railway.app/api/payments/webhook
   ```
4. Select events:
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`
   - `payment.captured`
   - `payment.failed`

### 2. Test the Application

1. **Admin Portal**
   - Visit: `https://your-frontend.railway.app/admin/login`
   - Login: `admin@bhishakmed.com` / `admin123`
   - Verify dashboard loads correctly

2. **Doctor Portal**
   - Visit: `https://your-frontend.railway.app/doctor/login`
   - Login: `doctor@test.com` / `doctor123`
   - Test patient creation
   - Test consultation features

3. **Payment Testing**
   - Create a test subscription
   - Verify Razorpay integration
   - Check webhook callbacks

---

## 📊 Monitoring & Maintenance

### View Logs
- Backend Logs: Backend service → "View Logs"
- Frontend Logs: Frontend service → "View Logs"
- Database Logs: PostgreSQL → "View Logs"

### Metrics
- Monitor CPU usage
- Monitor Memory usage
- Monitor Database connections

### Backup Database

Railway provides automatic backups, but you can also:
```bash
# From Railway Shell
pg_dump $DATABASE_URL > backup.sql
```

---

## 🔒 Security Checklist

- [ ] Changed default admin password
- [ ] Generated new JWT_SECRET for production
- [ ] Generated new ENCRYPTION_KEY for production
- [ ] Using Razorpay LIVE credentials (not test)
- [ ] Using production Agora credentials
- [ ] CORS configured with frontend URL only
- [ ] HTTPS enabled (automatic on Railway)
- [ ] Environment variables secured

---

## 🚨 Troubleshooting

### Backend Won't Start
1. Check deployment logs
2. Verify DATABASE_URL is set
3. Ensure all required env vars are present
4. Check Prisma migrations ran successfully

### Frontend Can't Connect to Backend
1. Verify NEXT_PUBLIC_API_URL is correct
2. Check CORS settings in backend
3. Ensure backend is deployed and healthy

### Database Connection Errors
1. Verify DATABASE_URL reference is added
2. Check PostgreSQL service is running
3. Review database connection limits

### File Upload Issues
1. Railway has ephemeral filesystem
2. Consider using:
   - Cloudinary for images
   - AWS S3 for file storage
   - Railway Volume (paid feature)

---

## 💰 Cost Optimization

### Free Tier Limits
- Railway offers $5/month credit on free tier
- Monitor usage in Railway dashboard

### Recommended Settings
- Use "Sleep after inactivity" for development environments
- Set appropriate resource limits
- Consider Railway Pro ($20/month) for production

---

## 📱 Custom Domain (Optional)

1. Go to Frontend service → Settings
2. Click "Custom Domain"
3. Add your domain (e.g., `app.bhishakmed.com`)
4. Update DNS records as instructed
5. Update backend CORS and FRONTEND_URL accordingly

---

## 🔄 Continuous Deployment

Railway automatically deploys when you push to your GitHub repository:

1. Make changes locally
2. Commit and push to GitHub
3. Railway detects changes
4. Automatic build and deploy

To disable auto-deploy:
- Go to service settings
- Disable "Auto Deploy"

---

## 📞 Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app

---

## ✅ Deployment Complete!

Your Bhishak Med platform should now be live at:
- **Frontend**: https://your-frontend.railway.app
- **Backend API**: https://your-backend.railway.app/api
- **Admin Panel**: https://your-frontend.railway.app/admin/login
- **Doctor Portal**: https://your-frontend.railway.app/doctor/login

Remember to:
1. Change default passwords immediately
2. Test all features thoroughly
3. Monitor application logs
4. Set up error tracking (Sentry recommended)
5. Configure backup strategy
