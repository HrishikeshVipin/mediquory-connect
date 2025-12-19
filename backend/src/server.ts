import express, { Application, Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import prisma from './config/database';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import patientRoutes from './routes/patient.routes';
import consultationRoutes from './routes/consultation.routes';
import vitalsRoutes from './routes/vitals.routes';
import prescriptionRoutes from './routes/prescription.routes';
import paymentRoutes from './routes/payment.routes';
import subscriptionRoutes from './routes/subscription.routes';
import reviewRoutes from './routes/review.routes';
import medicineRoutes from './routes/medicine.routes';
import notificationRoutes from './routes/notification.routes';
import { initializeChatSocket } from './socket/chat.socket';
import { notificationService } from './services/notification.service';
import { apiLimiter } from './middleware/rateLimiter';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();
const httpServer = createServer(app);

// CORS configuration - allow multiple origins (including network access)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://172.25.48.1:3000', // WSL network
  'http://192.168.0.241:3000', // Actual WiFi network IP for mobile access
  'http://192.168.0.1:3000', // Router IP range
  'http://192.168.1.1:3000', // Alternative router range
];

// Initialize Socket.io
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);

// Serve static files (uploads) with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static('uploads'));

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Bhishak Med API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api', vitalsRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/notifications', notificationRoutes);

// Test database connection
app.get('/api/test-db', async (req: Request, res: Response) => {
  try {
    await prisma.$connect();
    const adminCount = await prisma.admin.count();
    const doctorCount = await prisma.doctor.count();
    const patientCount = await prisma.patient.count();

    res.json({
      status: 'connected',
      message: 'Database connection successful',
      stats: {
        admins: adminCount,
        doctors: doctorCount,
        patients: patientCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

// Initialize Socket.io chat handler
initializeChatSocket(io);

// Initialize notification service with Socket.io
notificationService.setSocketIO(io);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// Start server
const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

httpServer.listen(PORT, HOST, () => {
  console.log('🚀 Server started successfully!');
  console.log(`📡 API running on: http://localhost:${PORT}`);
  console.log(`📱 Network access (WiFi): http://192.168.0.241:${PORT}`);
  console.log(`📱 Network access (WSL): http://172.25.48.1:${PORT}`);
  console.log(`🔌 Socket.io ready on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
  console.log('\n✨ Bhishak Med Backend is ready!\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
// Force restart
// restart
