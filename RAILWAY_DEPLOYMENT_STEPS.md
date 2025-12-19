# Railway Deployment Guide - Bhishak Med

## Prerequisites
✅ Railway CLI installed (already done)
✅ Configuration files created (already done)
✅ Secure secrets generated (already done)

## Step 1: Login to Railway (DO THIS NOW)

Open a terminal and run:
```bash
cd C:\Users\hrish\Downloads\Bhishak_med\New_Model
railway login
```
This will open your browser for authentication.

## Step 2: Create a New Railway Project

After logging in, run:
```bash
railway init
```
- Choose: **"Empty Project"**
- Give it a name: **"bhishak-med"** or your preferred name

## Step 3: Add PostgreSQL Database

```bash
railway add -d postgres
```
This provisions a PostgreSQL database for your project.

## Step 4: Deploy Backend Service

```bash
cd backend
railway up
```

This will:
- Build your backend
- Generate Prisma client
- Deploy the service

After deployment completes:
```bash
railway domain
```
This generates a public URL for your backend (e.g., `https://backend-production-xxxx.up.railway.app`)

## Step 5: Set Backend Environment Variables

Get your database URL:
```bash
railway variables
```

Then set the remaining variables:
```bash
railway variables set JWT_SECRET="Ri/bf2rS5qfR5FbrpuR8veFyUaq/WLoMGGbAwu1YxPdXoklCr1tZNTRq/cuTS1Z/ULAkKyvex/0kQPfLD/zNrQ=="
railway variables set ENCRYPTION_KEY="nST6Y9AhEIk+VOqdzOzOJWD3WmpDhKDVtwLZq2Tgp/M="
railway variables set JWT_EXPIRES_IN="7d"
railway variables set NODE_ENV="production"
railway variables set PORT="5000"
railway variables set AGORA_APP_ID="6439adfae49c4ed6bb81f08d2aa2c79b"
railway variables set AGORA_APP_CERTIFICATE="27b5d43518254fc29992f95201838a65"
railway variables set RAZORPAY_KEY_ID="rzp_test_placeholder"
railway variables set RAZORPAY_KEY_SECRET="placeholder_secret"
railway variables set RAZORPAY_WEBHOOK_SECRET="placeholder_webhook"
railway variables set UPLOAD_DIR="./uploads"
```

**IMPORTANT:** After setting variables, you need to set FRONTEND_URL and CORS_ORIGIN once you have the frontend URL (Step 7).

## Step 6: Run Database Migration

```bash
railway run npx prisma migrate deploy
```

If that doesn't work, try:
```bash
railway run npx prisma db push
```

## Step 7: Deploy Frontend Service

Go back to root and create a new service:
```bash
cd ..
railway service create frontend
```

Then deploy:
```bash
cd frontend
railway up
```

Generate public domain:
```bash
railway domain
```
Note this URL (e.g., `https://frontend-production-xxxx.up.railway.app`)

## Step 8: Update Frontend Environment Variables

```bash
railway variables set NEXT_PUBLIC_API_URL="https://YOUR-BACKEND-URL.up.railway.app/api"
railway variables set NEXT_PUBLIC_SOCKET_URL="https://YOUR-BACKEND-URL.up.railway.app"
railway variables set NEXT_PUBLIC_AGORA_APP_ID="6439adfae49c4ed6bb81f08d2aa2c79b"
railway variables set NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_placeholder"
```

Replace `YOUR-BACKEND-URL` with your actual backend URL from Step 4.

## Step 9: Update Backend with Frontend URL

Go back to backend service:
```bash
cd ../backend
railway variables set FRONTEND_URL="https://YOUR-FRONTEND-URL.up.railway.app"
railway variables set CORS_ORIGIN="https://YOUR-FRONTEND-URL.up.railway.app"
```

This will trigger a redeployment.

## Step 10: Seed the Database

```bash
railway run npm run prisma:seed
```

## Step 11: Verify Deployment

Visit your frontend URL and test:
1. Admin login: Check if you can access /admin/login
2. Doctor registration: Try registering a new doctor
3. Database connection: Verify data is being saved

## Troubleshooting

### Check Logs
```bash
railway logs
```

### Check Environment Variables
```bash
railway variables
```

### Restart Service
```bash
railway up --detach
```

### Connect to Database
```bash
railway connect postgres
```

## Important Notes

1. **DATABASE_URL**: Railway automatically injects this - don't set it manually
2. **Secrets**: The JWT_SECRET and ENCRYPTION_KEY are already set with secure values
3. **Razorpay**: Update with real credentials when ready for production
4. **Uploads**: Files are stored in Railway's ephemeral filesystem - consider using S3/Cloudinary for production
5. **Domain**: You can add a custom domain later in Railway dashboard

## Next Steps After Deployment

1. Test all functionality
2. Update Razorpay with live credentials
3. Configure custom domain
4. Set up monitoring and alerts
5. Configure file uploads to persistent storage (S3/Cloudinary)

---

**Generated Environment Variables Summary:**
- JWT_SECRET: ✅ Generated (base64 64-byte)
- ENCRYPTION_KEY: ✅ Generated (base64 32-byte)
- PostgreSQL: ✅ Will be auto-provisioned by Railway
