# Bhishak Med - Doctor Teleconsultation Platform (MVP)

A comprehensive telemedicine platform where doctors can conduct online consultations with patients via chat and video.

## 🎯 Features

### For Doctors
- 14-day free trial (max 2 patients)
- Subscription via Razorpay after trial
- Create patients and generate unique shareable links
- Conduct consultations via chat and video
- Generate digital prescriptions
- Manual payment confirmation
- UPI payment collection

### For Patients
- No signup required - access via unique link
- Chat with doctor (real-time + async)
- Video consultation
- Upload vitals and medical reports
- Pay doctor directly via UPI
- Download prescription PDF after payment

### For Admins
- Review and verify doctors
- Manage doctor subscriptions
- View platform statistics
- Full control over doctors and subscriptions

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (TypeScript)
- Tailwind CSS
- Socket.io-client (real-time chat)
- Agora Web SDK (video)

**Backend:**
- Express.js (TypeScript)
- Prisma + PostgreSQL
- Socket.io (real-time)
- JWT authentication
- Razorpay (subscriptions)
- Agora (video tokens)
- PDFKit (prescriptions)

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Razorpay account
- Agora account

## 🚀 Local Setup

### 1. Clone and Install

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Database Setup

```bash
# Install PostgreSQL and create database
createdb bhishak_med

# Copy environment file
cd backend
cp .env.example .env

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/bhishak_med"
```

### 3. Configure Environment Variables

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/bhishak_med"
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key

RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_certificate

FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_AGORA_APP_ID=your_app_id
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key
```

### 4. Initialize Database

```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (creates admin user)
npm run prisma:seed
```

**Default Admin Credentials:**
- Email: `admin@bhishakmed.com`
- Password: `admin123`

### 5. Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Admin Panel: http://localhost:3000/admin/login

## 📁 Project Structure

```
bhishak-med/
├── frontend/          # Next.js app
│   ├── app/           # Pages (App Router)
│   ├── components/    # React components
│   ├── lib/           # Utilities
│   ├── hooks/         # Custom hooks
│   └── store/         # State management
│
├── backend/           # Express API
│   ├── src/
│   │   ├── config/    # Database, services config
│   │   ├── middleware/# Auth, validation
│   │   ├── routes/    # API routes
│   │   ├── controllers/# Request handlers
│   │   ├── services/  # Business logic
│   │   ├── socket/    # Socket.io handlers
│   │   └── utils/     # Helper functions
│   ├── prisma/        # Database schema
│   └── uploads/       # Local file storage
```

## 🗄️ Database Models

1. **Admin** - Super admin users
2. **Doctor** - Doctor profiles with KYC
3. **Patient** - Patient records (no auth)
4. **Consultation** - Chat/Video sessions
5. **ChatMessage** - Async messages
6. **Vitals** - Patient vitals data
7. **MedicalUpload** - Patient reports/files
8. **Prescription** - Digital prescriptions
9. **PaymentConfirmation** - Payment tracking

## 🔐 Authentication

- **Admin**: JWT-based login
- **Doctor**: JWT-based login + trial/subscription check
- **Patient**: Unique access token (no signup)

## 🎥 Video Consultation

Uses Agora Web SDK for real-time video. Tokens generated server-side with 1-hour expiry.

## 💳 Payments

**Phase 1 (Current):**
- Patients pay doctors directly via UPI
- Doctor manually confirms payment
- Razorpay only for doctor subscriptions

**Phase 2 (Future):**
- Platform handles all payments
- Automatic commission deduction
- Monthly payouts to doctors

## 📦 Deployment

### VPS Deployment

```bash
# Install dependencies on VPS
sudo apt update
sudo apt install nodejs npm postgresql nginx

# Install PM2
npm install -g pm2

# Clone and setup
git clone your-repo
cd bhishak-med

# Setup database
sudo -u postgres createdb bhishak_med

# Backend
cd backend
npm install
npm run build
npm run prisma:deploy
npm run prisma:seed
pm2 start dist/server.js --name bhishak-backend

# Frontend
cd ../frontend
npm install
npm run build
pm2 start npm --name bhishak-frontend -- start

# Configure Nginx
sudo nano /etc/nginx/sites-available/bhishak
# Setup reverse proxy

# SSL with Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

## 🧪 Testing Flow

1. **Admin**: Login → Verify doctor → Manage subscriptions
2. **Doctor**: Signup → Get verified → Create patient → Share link → Conduct consultation
3. **Patient**: Access link → Chat → Video call → Upload vitals → Pay → Download prescription

## 📝 Development Phases

- ✅ Phase 1: Project setup & database
- 🔄 Phase 2-14: Feature implementation (7 days)

## 🤝 Contributing

This is an MVP. Future phases will add:
- Patient authentication
- Platform payment gateway
- Commission system
- Advanced analytics
- Mobile app

## 📄 License

Private - All Rights Reserved

## 🆘 Support

For setup issues, contact: admin@bhishakmed.com

---

Built with ❤️ by Claude Code
