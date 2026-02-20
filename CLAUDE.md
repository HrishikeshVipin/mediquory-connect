# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Deployment (Live)

### VPS
- **Provider**: DigitalOcean Bangalore (`blr1`)
- **Plan**: 4GB RAM / 2 vCPU / 80GB SSD — $24/month
- **IP**: 165.22.213.29
- **OS**: Ubuntu 24.04 LTS
- **Code path**: `/opt/mediquory-connect`

### Live URLs
| URL | Purpose |
|-----|---------|
| https://mediquory.workhrishi.in | Frontend (Next.js) |
| https://mediquory-api.workhrishi.in | Backend API (Express) |

### Cloudflare Tunnel
- **Tunnel name**: mediquory
- **Tunnel ID**: `29d64841-87cb-4e45-9036-6cb1e836a79a`
- **Config**: `C:\Users\hrish\.cloudflared\config-mediquory.yml`
- **Auto-start**: `C:\Users\hrish\.cloudflared\start-all-tunnels.bat` (in Windows Startup folder)

### Docker Stack
- `mediquory_postgres` — PostgreSQL 16 (port 5432 internal)
- `mediquory_backend` — Express API (port 5000)
- `mediquory_frontend` — Next.js (port 3002)
- `mediquory_nginx` — Nginx reverse proxy (port 80)
- `uploads_data` — Docker volume for file uploads (KYC, reports, signatures)
- `postgres_data` — Docker volume for database

### Common VPS Commands
```bash
ssh root@165.22.213.29
cd /opt/mediquory-connect

docker compose ps                          # Check container status
docker compose logs -f backend             # Backend logs
docker compose logs -f frontend            # Frontend logs
docker compose up -d --build               # Rebuild and restart all
docker compose restart backend             # Restart backend only
docker exec mediquory_backend npx ts-node prisma/seed.ts  # Re-seed DB
```

### Deploy Updates
```bash
# On VPS:
cd /opt/mediquory-connect && git pull && docker compose up -d --build
```

### Default Credentials (change after login)
- Admin: `admin@mediquory.com` / `admin123`
- Test Doctor: `doctor@test.com` / `doctor123`

### Pending
- Razorpay keys (awaiting website approval)
- Rename "Bhishak Med" → "Mediquory Connect" in codebase
- Test full doctor + patient flow end to end

---

## Flutter Doctor App (Planned — Not Started)

### Overview
Native Flutter mobile app for doctors consuming the existing backend API.

### Location
`mobile/` subfolder inside the repo (not yet created)

### Create Project
```bash
cd "C:\Users\hrish\Downloads\New_Mediquory_Connect"
flutter create mobile --org com.mediquory --project-name mediquory_doctor
```

### Planned Structure
```
mobile/
├── lib/
│   ├── core/
│   │   ├── api/           ← Dio client + interceptors (JWT Bearer token)
│   │   ├── models/        ← Data models
│   │   ├── providers/     ← Riverpod providers
│   │   └── utils/         ← Constants, helpers
│   └── features/
│       ├── auth/          ← Login, signup, pending verification screen
│       ├── dashboard/     ← Home, stats, unread count
│       ├── patients/      ← Patient list, detail, activate waitlisted
│       ├── consultation/  ← Chat (Socket.io) + video call (Agora)
│       ├── prescriptions/ ← Create, view, PDF download
│       ├── appointments/  ← Requests, upcoming, history
│       ├── profile/       ← Photo upload, digital signature
│       └── notifications/ ← Notification list + badge count
```

### Key Packages
- `dio` — HTTP client
- `flutter_riverpod` — State management
- `socket_io_client` — Real-time chat + notifications
- `agora_rtc_engine` — Video calls
- `go_router` — Navigation
- `image_picker` — Profile photo + signature upload
- `razorpay_flutter` — Subscription payments
- `cached_network_image` — Profile images
- `permission_handler` — Camera + microphone permissions
- `shared_preferences` — JWT token storage

### Backend API Base URL
`https://mediquory-api.workhrishi.in/api`

### Auth
JWT via `Authorization: Bearer <token>` header (mobile can't use httpOnly cookies)

### Socket.io URL
`https://mediquory-api.workhrishi.in`

### Agora
- App ID: `6439adfae49c4ed6bb81f08d2aa2c79b`
- Doctor UID: `1000000`, Patient UID: `2000000`

### Screens Priority (MVP)
1. Login
2. Dashboard (stats + unread chats)
3. Patient list + detail
4. Chat (consultation)
5. Video call
6. Create prescription
7. Notifications
8. Profile

---

## Project Overview

**Mediquory Connect** (Bhishak Med) is a production-ready telemedicine platform enabling doctors to conduct online consultations with patients via chat and video. The application features a monorepo architecture with separated frontend (Next.js) and backend (Express.js) services.

---

## Development Commands

### Backend (Express.js + Prisma)

**Location**: `backend/`

```bash
# Development
npm run dev                    # Start dev server on port 5000 (uses nodemon + ts-node)

# Database
npm run prisma:generate        # Generate Prisma client after schema changes
npm run prisma:migrate         # Create and apply new migration (local dev only)
npm run prisma:deploy          # Apply existing migrations (production)
npm run prisma:push            # Sync schema to DB without migrations (quick prototyping)
npm run prisma:seed            # Seed database with default admin user

# Build & Production
npm run build                  # Generate Prisma client + compile TypeScript
npm start                      # Push schema + start compiled server (production)
```

**Important**: Always run `prisma:generate` after modifying `prisma/schema.prisma` to update the Prisma client.

### Frontend (Next.js 16 App Router)

**Location**: `frontend/`

```bash
# Development
npm run dev                    # Start dev server on port 3002

# Build & Production
npm run build                  # Build production Next.js app
npm start                      # Start production server on port 3002
npm run lint                   # Run ESLint
```

**Note**: Frontend runs on port 3002 (not default 3000) to avoid conflicts.

---

## Architecture Patterns

### Authentication & Authorization

**Multi-Role JWT System**:
- **Doctors**: JWT (7-day expiry) + status check (must be VERIFIED)
- **Admins**: JWT + role check (ADMIN vs SUPER_ADMIN) + isActive check
- **Patients (Link-based)**: UUID access token (no auth required, access via `/p/{token}`)
- **Patients (App-based)**: OTP + 6-digit PIN (optional feature flag)

**Middleware Chain**:
```typescript
// backend/src/middleware/auth.ts
verifyToken         // Validates JWT from cookie or Authorization header
isDoctor            // Requires DOCTOR role + VERIFIED status
isAdmin             // Requires ADMIN or SUPER_ADMIN role + isActive
isSuperAdmin        // Requires SUPER_ADMIN role only
hasPermission(perm) // Granular permission check for regular admins
```

**Key Pattern**: Super admins bypass permission checks; regular admins require specific permissions in their `permissions` JSON array.

### Database Schema Strategy

**Core Models** (Prisma):
- `Admin`, `Doctor`, `Patient` (user models)
- `Consultation` → `ChatMessage`, `Prescription`, `PaymentConfirmation`, `ConsultationReview`
- `SubscriptionPlan`, `DoctorSubscriptionHistory` (snapshot pattern for plan changes)
- `Medicine`, `DoctorMedicine` (many-to-many with doctor's personal list)
- `AuditLog`, `AdminAccessLog` (compliance logging)

**Patient Waitlist Pattern**:
- Unlimited self-registration → `status: WAITLISTED`
- Doctor activates patients → respects subscription limit → `status: ACTIVE`
- Waitlisted patients: 10 chat messages max, no video/prescriptions
- Active patients: Full access

**Video Minutes Tracking**:
```typescript
Doctor {
  monthlyVideoMinutes: Int   // Resets monthly (from subscription plan)
  purchasedMinutes: Int      // One-time purchases, never expire
  totalMinutesUsed: Int      // Cumulative usage counter
  lastResetDate: DateTime    // Track last monthly reset
}
```

### Real-Time Communication (Socket.io)

**Architecture**: Room-based namespace with dual-purpose channels

**Chat System** (`backend/src/socket/chat.socket.ts`):
```typescript
// Rooms
consultation-${consultationId}  // Both doctor + patient
doctor-${doctorId}              // Doctor's personal room
patient-${patientId}            // Patient's personal room
admin-room                      // All admins

// Key Events
'join-consultation'             // User joins consultation room
'send-message'                  // Save to DB → broadcast to room
'typing' / 'stop-typing'        // Typing indicators
'initiate-video-call'           // Doctor starts video
'user-online-in-consultation'   // Presence tracking
```

**Notification System**:
- Frontend: `NotificationContext` manages socket connection
- Backend: Emits to user-specific rooms (`doctor-${id}`, `admin-room`)
- Types: `NEW_CHAT`, `DOCTOR_VERIFIED`, `PRESCRIPTION_READY`, etc.

**Message Flow with Waitlist Enforcement**:
1. Socket receives 'send-message' event
2. Check patient status: if WAITLISTED, enforce 10-message limit
3. Save to `ChatMessage` table
4. Update `Consultation.lastMessageAt`
5. Broadcast to room via `socket.to(consultationId).emit('receive-message')`
6. Create in-app notification + optional email

### File Upload System

**Current**: Cloudinary cloud storage (migrated from local filesystem)

**Configuration**: `backend/src/config/cloudinary.ts`
- Requires: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**Legacy**: Local filesystem uploads (deprecated but code remains in `backend/src/middleware/upload.ts`)

**File Categories**:
- Doctor KYC: Registration cert, Aadhaar photos, profile photo, digital signature
- Medical: Patient reports, vitals documents
- Payments: UPI payment screenshots, QR codes
- Prescriptions: Generated PDFs

### Security Layers

**1. Field-Level Encryption** (`backend/src/utils/encryption.ts`):
- AES-256-GCM encryption for: Aadhaar numbers, phone numbers, UPI IDs
- Uses `ENCRYPTION_KEY` from environment (must be 32 bytes)

**2. Rate Limiting** (`backend/src/middleware/rateLimiter.ts`):
```typescript
authLimiter: 5 requests/15min           // Login attempts
registrationLimiter: 3 requests/hour    // Signups
apiLimiter: 100 requests/15min          // General API
uploadLimiter: 10 uploads/hour          // File uploads
prescriptionLimiter: 30/hour            // Prescription generation
```

**Trust Proxy**: Configured for Railway deployment (`app.set('trust proxy', 1)`)

**3. Admin Access Controls**:
- **15-Second Reveal Window**: Decrypt Aadhaar/UPI for 15 seconds only
- **Mandatory Reason**: All sensitive data access requires reason + admin notes
- **Audit Logging**: All reveals logged to `AdminAccessLog` with timestamp, reason, IP

**4. Patient Data Privacy** (Super Admin Only):
- Regular admins: Cannot see patient counts, consultation metrics
- Super admins: Full access to patient data (for legal/compliance)
- Check: `req.user?.role === 'SUPER_ADMIN'`

### Subscription & Payment Flow

**Razorpay Integration**:
1. Admin creates subscription plans in database (not directly in Razorpay)
2. Doctor selects plan → Backend creates Razorpay order → Frontend shows checkout
3. Payment completed → Webhook verification → Database update

**Signature Verification**:
```typescript
const generated_signature = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(`${razorpayOrderId}|${razorpayPaymentId}`)
  .digest('hex');

if (generated_signature !== razorpaySignature) {
  throw new Error('Payment verification failed');
}
```

**Minute Purchases**:
- One-time payments (not subscriptions)
- Purchased minutes stored in `Doctor.purchasedMinutes` (never expire)
- Monthly quota in `Doctor.monthlyVideoMinutes` (resets based on `lastResetDate`)

**Subscription Lifecycle**:
```
TRIAL (14 days, 2 patients, 100 minutes)
  ↓ Upgrade
BASIC / PROFESSIONAL / ENTERPRISE
  Status: ACTIVE
  ↓ Expiry check
EXPIRED / CANCELLED (blocked by middleware)
```

### API Route Structure

**Backend Endpoint Organization** (`backend/src/server.ts`):
```
/api/auth                 # Doctor/Admin login, logout, signup
/api/admin                # Admin dashboard, doctor verification
/api/admin/reveal-*       # 15-sec Aadhaar/UPI decryption (SUPER_ADMIN only)
/api/admin/audit-logs     # Audit log viewer (SUPER_ADMIN only)
/api/patients             # Patient CRUD (doctor-only)
/api/patient-auth         # Patient OTP signup/login (feature flag)
/api/doctors              # Doctor discovery, public profiles
/api/doctor/profile       # Doctor profile update, KYC, signature
/api/consultations        # Consultation management, video tokens
/api/prescriptions        # Prescription generation, PDF download
/api/payments             # Razorpay payment handling
/api/subscription         # Subscription plans, upgrades, minute purchases
/api/reviews              # Patient reviews, ratings
/api/feedback             # Doctor app feedback (bug reports, features)
/api/medicines            # Medicine database, doctor's personal list
/api/notifications        # In-app notifications
/api/appointments         # Appointment requests, scheduling
/api/system-settings      # Admin system settings (feature flags)
```

### Prescription Serial Numbering

**Pattern**: Per-doctor sequential counter
- `Doctor.lastPrescriptionSerial` increments on each prescription
- Format: `RX-001`, `RX-002`, etc.
- Compound unique constraint: `[doctorId, serialNumber]` prevents duplicates

**Implementation**:
```typescript
// Atomic increment
const doctor = await prisma.doctor.update({
  where: { id: doctorId },
  data: { lastPrescriptionSerial: { increment: 1 } },
  select: { lastPrescriptionSerial: true },
});

const serialNumber = `RX-${String(doctor.lastPrescriptionSerial).padStart(3, '0')}`;
```

### Video Call Architecture

**Agora SDK Integration**:
1. Doctor initiates → Socket event `'initiate-video-call'` to patient
2. Patient accepts → Backend generates Agora tokens (1-hour expiry)
3. Token payload: `channelName`, `uid` (doctor=1, patient=2), `role` (publisher)
4. Frontend: Agora Web SDK (`agora-rtc-sdk-ng`) creates video room
5. Duration tracking: `Consultation.videoDuration` (for billing)

**Token Generation** (`backend/src/controllers/consultation.controller.ts`):
```typescript
import { RtcTokenBuilder, RtcRole } from 'agora-token';

const token = RtcTokenBuilder.buildTokenWithUid(
  AGORA_APP_ID,
  AGORA_APP_CERTIFICATE,
  channelName,
  uid,
  RtcRole.PUBLISHER,
  expirationTime
);
```

---

## Environment Variables

### Backend (.env)

**Required**:
```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
NODE_ENV=production
PORT=5000
JWT_SECRET=<openssl rand -base64 64>
ENCRYPTION_KEY=<openssl rand -base64 32>
FRONTEND_URL=https://your-frontend.com
```

**Third-Party Services**:
```env
# Razorpay (payments)
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

# Agora (video)
AGORA_APP_ID=xxx
AGORA_APP_CERTIFICATE=xxx

# Cloudinary (file storage)
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

**Feature Flags**:
```env
ENABLE_PATIENT_SIGNUP=false  # Enable patient app signup (OTP-based)
```

**Security Note**: All secrets MUST be generated per deployment. Default values in documentation are placeholders only.

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
NEXT_PUBLIC_ENABLE_PATIENT_SIGNUP=false
```

---

## Database Workflow

### Local Development

```bash
cd backend

# After schema changes
npm run prisma:generate        # Update Prisma client
npm run prisma:migrate         # Create migration + apply to DB

# Fresh database setup
npm run prisma:migrate         # Apply all migrations
npm run prisma:seed            # Create default admin user
```

**Default Admin Credentials** (from seed):
- Email: `admin@mediquory.com`
- Password: `admin123`
- Role: `SUPER_ADMIN`

### Production Deployment (Railway)

```bash
# In production, use migrate deploy (no interactive prompts)
npm run prisma:deploy          # Apply all pending migrations

# Alternative: Direct schema push (bypasses migrations)
npm run prisma:push            # Sync schema to DB (useful for quick fixes)
```

**Migration Strategy**:
- Development: Use `prisma migrate dev` to create migration files
- Commit migrations to git: `backend/prisma/migrations/`
- Production: Railway runs `prisma migrate deploy` automatically

**Manual Migration Creation** (for non-interactive environments):
1. Create directory: `backend/prisma/migrations/{timestamp}_{name}/`
2. Write SQL: `migration.sql`
3. Commit and push
4. Railway applies on next deployment

---

## State Management (Frontend)

**Global Auth State**: Zustand store (`frontend/store/authStore.ts`)
```typescript
useAuthStore() // Access user, token, isAuthenticated
initAuth()     // Load auth from localStorage on mount
clearAuth()    // Logout + clear state
isSuperAdmin() // Check if current user is super admin
```

**Real-Time State**: React Context (`frontend/context/NotificationContext.tsx`)
- Manages Socket.io connection
- Handles notification subscriptions
- Provides `notifications`, `unreadCount`, `markAsRead()`

**Form State**: React Hook Form + Zod validation
- Use `@hookform/resolvers/zod` for schema validation
- Forms: Doctor signup, patient vitals, prescription creation

---

## Testing Workflow

**Manual Testing Checklist**: See `TESTING_CHECKLIST.csv` (140+ test cases)

**Typical Test Flow**:
1. **Admin**: Login → Verify doctor → Manage subscriptions
2. **Doctor**: Signup → Wait for verification → Create patient → Share link
3. **Patient**: Access link → Chat → Upload vitals → Video call
4. **Doctor**: Create prescription → Patient pays → Doctor confirms payment
5. **Patient**: Download prescription PDF

**Test Accounts** (after seeding):
- Admin: `admin@mediquory.com` / `admin123`
- Doctor: Create via signup form, verify via admin panel

---

## Deployment (Railway)

**Project Structure**:
- Backend service (Express API)
- Frontend service (Next.js app)
- PostgreSQL database (managed)

**Build Commands**:
```json
{
  "backend": {
    "build": "npm install && npx prisma generate && npm run build",
    "deploy": "npx prisma migrate deploy && npm start"
  },
  "frontend": {
    "build": "npm install && npm run build",
    "deploy": "npm start"
  }
}
```

**Pre-Deployment Checklist**:
1. Generate unique `JWT_SECRET` and `ENCRYPTION_KEY`
2. Configure all environment variables (Razorpay, Agora, Cloudinary)
3. Set `FRONTEND_URL` to production domain
4. Change default admin password after first login
5. Test webhook endpoints (Razorpay webhook URL)

**Post-Deployment**:
1. SSH into backend service
2. Run `npm run prisma:seed` (creates admin if not exists)
3. Verify database migrations applied: `npx prisma migrate status`

---

## Important Caveats

### Patient Data Access
- **Regular Admins**: Cannot see patient counts, consultation/prescription metrics
- **Super Admins**: Full access to patient data (for legal/compliance needs)
- **Backend Check**: `req.user?.role === 'SUPER_ADMIN'`
- **Frontend Check**: `isSuperAdmin()` function in authStore

### Prescription Generation
- Requires doctor's digital signature (uploaded in profile)
- PDF generated server-side using PDFKit
- Stored in Cloudinary (migrated from local storage)
- Logo appears at top of PDF (from `backend/public/logo.png`)

### Video Call Minutes
- Monthly quota resets based on `Doctor.lastResetDate` (not calendar month)
- Purchased minutes never expire
- Deduction happens after call ends (from `Consultation.videoDuration`)

### Waitlist System
- Patient self-registration creates WAITLISTED status
- Doctor must manually activate (respects subscription patient limit)
- Middleware enforces 10-message limit for waitlisted patients
- Socket handler checks status before allowing video calls

### File Uploads
- All new uploads go to Cloudinary
- Legacy local filesystem code remains but is deprecated
- Cloudinary URLs stored in database (not relative paths)

---

## Common Pitfalls

1. **Prisma Client Out of Sync**: Always run `prisma:generate` after schema changes
2. **Port Conflicts**: Frontend uses port 3002 (not 3000)
3. **CORS Issues**: Backend allows multiple origins (localhost:3002, Railway URLs)
4. **Rate Limiting**: Trust proxy must be enabled for Railway (`trust proxy: 1`)
5. **Migration Conflicts**: Use `prisma migrate deploy` in production, not `prisma migrate dev`
6. **Encryption Key**: Must be exactly 32 bytes (use `openssl rand -base64 32`)
7. **Socket.io CORS**: Must match frontend URL exactly in `socket.io` configuration
8. **JWT Expiry**: 7-day expiry, users must re-login after expiration

---

## Code Organization Principles

### Backend Controllers
- **One controller per resource**: `doctor.controller.ts`, `patient.controller.ts`, etc.
- **Async/await pattern**: All DB queries use `await`
- **Try-catch blocks**: Consistent error handling with 500 status codes
- **Response format**: `{ success: boolean, message?: string, data?: any, error?: string }`

### Frontend Pages (App Router)
- **Server Components by default**: Add `'use client'` only when needed
- **Data fetching**: Direct API calls via `lib/api.ts` (no React Query)
- **Loading states**: Use React state + conditional rendering
- **Error handling**: Try-catch with user-friendly error messages

### Middleware Chain Order
```typescript
// Correct order (important!)
app.use(helmet());               // Security headers first
app.use(cors());                 // CORS before routes
app.use(express.json());         // Body parsing
app.use(cookieParser());         // Cookie parsing
app.use(rateLimiter);            // Rate limiting
app.use('/api/...', routes);     // Routes last
```

---

## Documentation References

- **Project Status**: `PROJECT_STATUS.md` (complete feature list)
- **Deployment Guide**: `DEPLOY_NOW.md` (step-by-step Railway setup)
- **Testing Checklist**: `TESTING_CHECKLIST.csv` (140+ test cases)
- **Feedback Feature**: `FEEDBACK_FEATURE.md` (implementation details)
- **Local Instructions**: `README.md` (local setup, tech stack)

---

**Last Updated**: January 5, 2026
