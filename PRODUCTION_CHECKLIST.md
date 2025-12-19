# Production Deployment Checklist

## ✅ Completed Items

### Security - Secrets & Keys
- [x] **.env file NOT committed** to git (properly gitignored from start)
- [x] **Strong JWT secret generated** (512-bit): Ready in `.env.production.template`
- [x] **Strong encryption key generated** (256-bit): Ready in `.env.production.template`
- [x] **.env.example** created for reference
- [x] **.env.production.template** created with new strong keys

### Database
- [x] **Prisma schema updated** to PostgreSQL (from SQLite)
- [x] **Database provider changed** in schema.prisma

### Security - Rate Limiting
- [x] **Rate limiting implemented** for all critical endpoints
- [x] **Authentication rate limiter** (5 attempts/15min) - prevents brute force
- [x] **Registration rate limiter** (3/hour) - prevents spam
- [x] **File upload rate limiter** (10/hour)
- [x] **Patient creation rate limiter** (50/hour)
- [x] **Prescription rate limiter** (30/hour)
- [x] **General API rate limiter** (100 requests/15min)

### Security - Encryption
- [x] **AES-256-GCM encryption utility** created
- [x] **Encryption service layer** created for Doctor & Patient data
- [x] **Masking functions** for Aadhaar and phone numbers
- [x] **ENCRYPTION_KEY environment variable** added

### Deployment Configuration
- [x] **Railway configuration** created (railway.json)
- [x] **Build scripts** configured in package.json
- [x] **Deployment guide** created (RAILWAY_DEPLOYMENT_GUIDE.md)
- [x] **Production environment template** ready

### Bug Fixes
- [x] **403 authentication error** fixed (doctorId middleware)
- [x] **Patient deletion cascade** configured
- [x] **Network access** configured for mobile testing

---

## 🚨 CRITICAL - Must Do Before Deployment

### 1. API Keys & Secrets (HIGH PRIORITY)

- [ ] **Get Razorpay LIVE credentials**
  - Current: Test keys in `.env`
  - Action: Login to https://dashboard.razorpay.com/app/keys
  - Get: `rzp_live_*` key ID and secret
  - ⚠️ **NEVER use test keys in production!**

- [ ] **Create NEW Agora production project**
  - Current: Development keys in `.env`
  - Action: Go to https://console.agora.io/
  - Create: New project for production
  - Get: New APP_ID and APP_CERTIFICATE
  - ⚠️ **Do NOT reuse development credentials!**

- [ ] **Update .env with production keys**
  - Copy `.env.production.template` to `.env`
  - Add Razorpay LIVE keys
  - Add Agora production keys
  - Verify ENCRYPTION_KEY and JWT_SECRET are the strong ones generated

### 2. Database (CRITICAL)

- [ ] **Set up PostgreSQL on Railway**
  - Create new Railway project
  - Add PostgreSQL database service
  - Get DATABASE_URL from Railway

- [ ] **Test database migration locally** (Optional but recommended)
  - Install PostgreSQL locally
  - Update `.env` with local PostgreSQL URL
  - Run: `npm run prisma:migrate`
  - Verify schema works with PostgreSQL

- [ ] **Run migration on Railway**
  - Will happen automatically on first deploy
  - Verify in deployment logs

- [ ] **Seed admin user**
  - Option A: Use Railway CLI: `railway run npm run prisma:seed`
  - Option B: Manual via Prisma Studio
  - Option C: Create via direct database access

### 3. Data Encryption Integration (CRITICAL)

- [ ] **Integrate encryption into auth controller**
  - File: `backend/src/controllers/auth.controller.ts`
  - Function: `doctorSignup`
  - Action: Use `encryptDoctorData()` before saving

- [ ] **Integrate encryption into patient controller**
  - File: `backend/src/controllers/patient.controller.ts`
  - Functions: `createPatient`, `selfRegisterPatient`
  - Action: Use `encryptPatientData()` before saving

- [ ] **Integrate decryption into data retrieval**
  - All endpoints that return doctor/patient data
  - Use `decryptDoctorData()` / `decryptPatientData()`
  - Use `maskSensitive: true` for list views
  - Use `maskSensitive: false` for detail views (authorized users only)

---

## ⚠️ HIGH PRIORITY - Should Do Before Public Launch

### 4. Socket.io Security

- [ ] **Add authentication to Socket.io connections**
  - File: `backend/src/socket/chat.socket.ts`
  - Current: No authentication check on connection
  - Risk: Anyone can join consultations
  - Action: Verify JWT token on socket connection

- [ ] **Verify room ownership before joining**
  - Check user belongs to consultation before joining room
  - Prevent eavesdropping on other consultations

### 5. Patient Access Links

- [ ] **Implement token expiration**
  - Add `expiresAt` field to Patient model
  - Set expiration to 24-48 hours from creation
  - Check expiration in `getPatientByToken` controller
  - Return error if expired

- [ ] **Add token security**
  - Consider HMAC signatures
  - Track access attempts
  - Optional: IP-based restrictions

### 6. File Security

- [ ] **Implement cloud storage**
  - Current: Files stored locally (lost on Railway restart!)
  - Options: AWS S3, Cloudinary, Railway Volumes
  - Update upload middleware to use cloud storage
  - ⚠️ **CRITICAL for Railway deployment!**

- [ ] **Add magic number validation**
  - Don't trust MIME types alone
  - Check file headers (magic numbers)
  - Library: `file-type` npm package

- [ ] **Implement virus scanning** (Optional but recommended)
  - Library: `clamscan` or cloud service
  - Scan before accepting uploads

### 7. Input Sanitization

- [ ] **Add XSS protection**
  - Install: `dompurify` or `sanitize-html`
  - Sanitize: Doctor notes, chat messages, prescriptions
  - Prevent: Script injection attacks

### 8. Compliance & Legal

- [ ] **Implement audit logging**
  - Log all access to patient medical records
  - Log prescription views/downloads
  - Log authentication events
  - Required for DPDPA compliance

- [ ] **Add data retention policies**
  - Define how long data is kept
  - Implement automated deletion

- [ ] **Implement "Right to Deletion"**
  - Patient data deletion on request
  - Doctor data deletion on account close
  - Compliance with DPDPA

- [ ] **Add consent management**
  - Patient consent for data collection
  - Doctor consent for terms of service
  - Consent audit trail

---

## 📋 MEDIUM PRIORITY - Post-Launch Improvements

### 9. Enhanced Security

- [ ] **Implement refresh token rotation**
  - Current: 7-day JWT tokens
  - Better: Short-lived access tokens + refresh tokens
  - Improves security significantly

- [ ] **Add Content Security Policy (CSP)**
  - Configure strict CSP headers
  - Prevent XSS attacks

- [ ] **Add HSTS headers**
  - Force HTTPS in production
  - Prevent protocol downgrade attacks

- [ ] **Implement multi-factor authentication (MFA)**
  - SMS OTP for doctors
  - Email OTP for patients
  - Improves account security

### 10. Monitoring & Observability

- [ ] **Set up error tracking**
  - Options: Sentry, LogRocket, Rollbar
  - Track and fix errors proactively

- [ ] **Set up uptime monitoring**
  - Options: UptimeRobot, Pingdom, StatusCake
  - Get alerts when site goes down

- [ ] **Set up performance monitoring**
  - Options: New Relic, DataDog, Railway analytics
  - Track response times and bottlenecks

- [ ] **Set up log aggregation**
  - Options: Logtail, Papertrail, CloudWatch
  - Centralize and search logs

### 11. Backup & Disaster Recovery

- [ ] **Configure automated database backups**
  - Railway provides this automatically
  - Verify backup schedule
  - Test restore procedure

- [ ] **Document disaster recovery procedure**
  - What to do if database is corrupted
  - What to do if deployment fails
  - How to rollback to previous version

- [ ] **Set up staging environment**
  - Separate Railway project for testing
  - Test changes before production deploy

---

## 🎯 Deployment Timeline Recommendation

### Option 1: Minimum Viable Deployment (3-5 Days)

**Day 1:**
- [ ] Get Razorpay LIVE keys
- [ ] Create Agora production project
- [ ] Set up Railway PostgreSQL
- [ ] Update environment variables

**Day 2:**
- [ ] Integrate encryption into all controllers
- [ ] Test encryption/decryption thoroughly
- [ ] Run database migration

**Day 3:**
- [ ] Deploy to Railway
- [ ] Seed admin user
- [ ] Test all features

**Day 4:**
- [ ] Implement cloud file storage (S3/Cloudinary)
- [ ] Test file uploads in production

**Day 5:**
- [ ] Final security testing
- [ ] Monitor for issues
- [ ] Fix any bugs

**Remaining Risks:**
- No Socket.io auth
- Patient links don't expire
- No audit logging
- No XSS protection

---

### Option 2: Production-Ready (7-14 Days) - RECOMMENDED

**Week 1: Core Security**
- All items from Option 1
- Socket.io authentication
- Patient link expiration
- XSS sanitization
- Magic number file validation

**Week 2: Compliance & Polish**
- Audit logging implementation
- Data retention policies
- Consent management
- Security penetration testing
- Legal compliance review

---

## 📊 Deployment Readiness Score

| Category | Status | Priority |
|----------|--------|----------|
| Secrets Management | ✅ 100% | CRITICAL |
| Database | ⚠️ 50% | CRITICAL |
| Authentication | ✅ 90% | CRITICAL |
| Data Encryption | ⚠️ 50% | CRITICAL |
| Rate Limiting | ✅ 100% | HIGH |
| File Security | ❌ 30% | HIGH |
| Socket.io Security | ❌ 0% | HIGH |
| Input Sanitization | ❌ 0% | HIGH |
| Compliance | ❌ 10% | HIGH |
| Monitoring | ❌ 0% | MEDIUM |

**Overall Readiness: ~40%**

**Recommended Action: Complete CRITICAL items before any deployment**

---

## 🚀 Quick Start: Deploy Today (Testing Only)

If you absolutely need to deploy for internal testing only (NOT for real patients):

1. **Minimum requirements:**
   - [ ] Get Railway PostgreSQL (5 minutes)
   - [ ] Update .env with production keys (10 minutes)
   - [ ] Deploy to Railway (15 minutes)
   - [ ] Test basic functionality (30 minutes)

2. **Accept these risks:**
   - ⚠️ Files will be lost on restart
   - ⚠️ Socket.io is not authenticated
   - ⚠️ Patient data not encrypted (encryption built but not integrated)
   - ⚠️ No audit logging
   - ⚠️ Patient links never expire

3. **Add big warning banner:**
   - "TESTING ONLY - DO NOT USE WITH REAL PATIENT DATA"

---

## ❓ Questions Before Deploying?

- **For internal testing only?** → Option 1 (3-5 days)
- **For real patients (limited)?** → Option 2 (7-14 days)
- **For public commercial use?** → Option 2 + Legal review + Penetration testing

**Remember**: This is healthcare software. Patient data breaches have serious legal consequences. Better to take time and do it right! 🛡️

---

## 📞 Need Help?

See these files:
- `RAILWAY_DEPLOYMENT_GUIDE.md` - Step-by-step deployment instructions
- `SECURITY_IMPLEMENTATION.md` - Security features documentation
- `.env.production.template` - Production environment template

Your strong keys have been generated and are ready in `.env.production.template`! 🔐
