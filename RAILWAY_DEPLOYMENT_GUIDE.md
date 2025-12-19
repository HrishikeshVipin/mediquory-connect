# Railway Deployment Guide - Bhishak Med

## Prerequisites

1. ✅ Railway account (sign up at https://railway.app)
2. ✅ GitHub repository with your code
3. ✅ Production API keys ready (Razorpay Live, Agora Production)

---

## Step 1: Create PostgreSQL Database on Railway

1. **Login to Railway**: https://railway.app
2. **Create New Project**: Click "New Project"
3. **Provision PostgreSQL**:
   - Click "+ New"
   - Select "Database" → "PostgreSQL"
   - Railway will automatically create a PostgreSQL database

4. **Get Database URL**:
   - Click on the PostgreSQL service
   - Go to "Variables" tab
   - Copy the `DATABASE_URL` value
   - Format: `postgresql://postgres:password@hostname:port/railway`

---

## Step 2: Deploy Backend to Railway

### A. Connect GitHub Repository

1. In your Railway project, click "+ New"
2. Select "GitHub Repo"
3. Authorize Railway to access your GitHub
4. Select your `Bhishak_med/New_Model` repository

### B. Configure Build Settings

1. **Root Directory**: Set to `backend`
   - Go to Settings → "Root Directory" → Enter: `backend`

2. **Build Command** (Railway will auto-detect, but verify):
   ```bash
   npm install && npx prisma generate
   ```

3. **Start Command**:
   ```bash
   npx prisma migrate deploy && npm run build && npm start
   ```

### C. Add Environment Variables

Go to your backend service → "Variables" tab → Add these:

```bash
# Database (automatically provided by Railway if you link the PostgreSQL service)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Server
NODE_ENV=production
PORT=5000

# JWT Authentication
# Use the strong key generated earlier:
JWT_SECRET=P8wmHxAlnBgjHcjwkEpjNcY1eflgK4otkpU15pyCFiaNZtO0TR5MnmCiYTd1r2R5GZ4OBbDo63VOGuCUogm8gA==
JWT_EXPIRES_IN=7d

# Field Encryption
# Use the strong key generated earlier:
ENCRYPTION_KEY=VgEDuC6YvSaruygSZMrGVzZdtezjDZBv34fCaXg+2j0=

# Razorpay - LIVE CREDENTIALS ONLY!
RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY
RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET

# Agora - NEW PRODUCTION PROJECT!
AGORA_APP_ID=YOUR_NEW_PRODUCTION_APP_ID
AGORA_APP_CERTIFICATE=YOUR_NEW_PRODUCTION_CERTIFICATE

# Frontend URL (update after deploying frontend)
FRONTEND_URL=https://your-frontend.railway.app

# Upload Directory
UPLOAD_DIR=./uploads

# CORS (update with your actual frontend URL)
CORS_ORIGIN=https://your-frontend.railway.app
```

**⚠️ IMPORTANT NOTES:**

1. **Link PostgreSQL Service**:
   - In the backend service variables
   - Click "+ New Variable"
   - Select "Reference" → Choose your PostgreSQL service
   - Reference: `${{Postgres.DATABASE_URL}}`

2. **DO NOT use development/test API keys in production!**
   - Razorpay: Get LIVE keys from dashboard
   - Agora: Create a NEW production project

---

## Step 3: Configure TypeScript Build

Update `backend/package.json`:

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "prisma:seed": "ts-node prisma/seed.ts"
  }
}
```

Create `backend/tsconfig.json` if not exists:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Step 4: Run Database Migrations

Railway will automatically run migrations on deploy via the start command.

To manually run migrations:

1. Go to your backend service
2. Click "Settings" → "Deploy Logs"
3. Verify migration ran successfully
4. Look for: `Prisma Migrate applied X migrations`

---

## Step 5: Deploy Frontend to Railway

1. **Create New Service** in same project:
   - Click "+ New" → "GitHub Repo"
   - Select same repository

2. **Configure Frontend**:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Add Frontend Environment Variables**:

```bash
# Backend API URL (get from backend service URL)
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app

# Agora (same as backend)
NEXT_PUBLIC_AGORA_APP_ID=YOUR_PRODUCTION_APP_ID

# Razorpay (LIVE key only!)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY
```

---

## Step 6: Update CORS Settings

After frontend is deployed:

1. Get your frontend Railway URL (e.g., `https://your-app-production.up.railway.app`)
2. Update backend environment variables:
   ```bash
   FRONTEND_URL=https://your-app-production.up.railway.app
   CORS_ORIGIN=https://your-app-production.up.railway.app
   ```
3. Redeploy backend service

---

## Step 7: Seed Admin User

**Option A: Using Railway CLI**

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login:
   ```bash
   railway login
   ```

3. Link to project:
   ```bash
   cd backend
   railway link
   ```

4. Run seed:
   ```bash
   railway run npm run prisma:seed
   ```

**Option B: Manual via Prisma Studio**

1. In Railway backend service:
   - Go to "Settings" → "Service Domains"
   - Note the public URL

2. Use Prisma Studio locally connected to production:
   ```bash
   cd backend
   DATABASE_URL="your-railway-postgres-url" npx prisma studio
   ```

3. Create admin manually in the Admin table

---

## Step 8: Post-Deployment Checklist

### Security

- [ ] All environment variables are set (no default values)
- [ ] Strong JWT_SECRET is configured (512 bits)
- [ ] Strong ENCRYPTION_KEY is configured (256 bits)
- [ ] LIVE Razorpay keys are used (not test keys)
- [ ] NEW Agora production project is created
- [ ] CORS is configured with actual frontend URL
- [ ] DATABASE_URL points to Railway PostgreSQL

### Testing

- [ ] Backend health check works: `https://your-backend.railway.app/health`
- [ ] Database connection works: `https://your-backend.railway.app/api/test-db`
- [ ] Admin can login
- [ ] Doctor can register and login
- [ ] File uploads work
- [ ] Prescriptions generate
- [ ] Video calls work (Agora)
- [ ] Payments work (Razorpay - test small amount first!)

### Monitoring

- [ ] Check Railway logs for errors
- [ ] Monitor database usage
- [ ] Set up uptime monitoring (UptimeRobot, etc.)
- [ ] Configure error tracking (Sentry, LogRocket, etc.)

---

## Troubleshooting

### Database Migration Failed

```bash
# Check logs in Railway dashboard
# If migrations are out of sync, reset:
railway run npx prisma migrate reset
railway run npx prisma migrate deploy
```

### Cannot Connect to Database

1. Verify DATABASE_URL is correctly set
2. Check PostgreSQL service is running
3. Ensure services are in same Railway project (for private networking)

### CORS Errors

1. Update CORS_ORIGIN in backend environment variables
2. Ensure FRONTEND_URL matches actual deployed URL
3. Redeploy backend after changes

### File Uploads Not Working

1. Railway has ephemeral filesystem - files are lost on restart
2. **TODO**: Implement cloud storage (AWS S3, Cloudinary, etc.)
3. For now, uploads work but won't persist across deployments

---

## Important Production TODOs

### Critical (Must Do Before Live Users)

1. **Implement Cloud File Storage**:
   - Current: Files stored locally (lost on restart)
   - Solution: AWS S3, Cloudinary, or Railway Volumes

2. **Set Up Database Backups**:
   - Railway provides automated backups
   - Verify backup schedule in PostgreSQL service settings

3. **Configure Custom Domain**:
   - Add your domain in Railway
   - Update DNS records
   - SSL certificate auto-configured by Railway

4. **Enable Rate Limiting in Production**:
   - Already implemented
   - Verify limits are appropriate for production load

5. **Set Up Monitoring**:
   - Railway provides basic metrics
   - Consider: Sentry, LogRocket, New Relic

### High Priority (Do Within First Week)

6. **Implement Audit Logging**:
   - Log all access to patient data
   - Required for compliance

7. **Add Socket.io Authentication**:
   - Currently anyone can join consultations
   - Security vulnerability

8. **Patient Link Expiration**:
   - Links currently never expire
   - Implement 24-48 hour expiration

9. **XSS Protection**:
   - Sanitize user inputs
   - Prevent script injection

10. **File Upload Security**:
    - Add magic number validation
    - Implement virus scanning

---

## Cost Estimates (Railway)

**Free Tier Limits**:
- $5 credit/month
- Enough for small-scale testing
- ~2-3 services (backend + PostgreSQL + frontend)

**Production Pricing** (approximate):
- Backend: $5-10/month (depending on traffic)
- PostgreSQL: $5/month (starter)
- Frontend: $5-10/month
- **Total**: ~$15-25/month

For high traffic, costs will increase based on usage.

---

## Support

Railway Docs: https://docs.railway.app
Railway Discord: https://discord.gg/railway
Prisma + Railway: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-railway

---

## Next Steps After Deployment

1. Test thoroughly with real users (internal team first)
2. Monitor logs and fix any errors
3. Implement remaining security features (audit logging, etc.)
4. Get legal compliance review (DPDPA, medical regulations)
5. Set up customer support system
6. Create user documentation

**Remember**: This is healthcare software. Test extensively before public launch!
