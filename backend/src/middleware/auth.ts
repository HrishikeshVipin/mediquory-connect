import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

// Extend Express Request type to include user and doctorId
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'DOCTOR' | 'ADMIN';
        status?: string;
      };
      doctorId?: string;
      adminId?: string;
    }
  }
}

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token
export const generateToken = (payload: {
  id: string;
  email: string;
  role: 'DOCTOR' | 'ADMIN';
  status?: string;
}): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Verify JWT token middleware
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from cookie or Authorization header
    let token: string | undefined;

    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.',
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: 'DOCTOR' | 'ADMIN';
      status?: string;
    };

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
      });
    } else if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Authentication error',
        error: error.message,
      });
    }
  }
};

// Middleware to check if user is a doctor
export const isDoctor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'DOCTOR') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Doctor role required.',
    });
    return;
  }

  // Check if doctor is verified
  const doctor = await prisma.doctor.findUnique({
    where: { id: req.user.id },
    select: { status: true },
  });

  if (!doctor) {
    res.status(404).json({
      success: false,
      message: 'Doctor not found',
    });
    return;
  }

  if (doctor.status !== 'VERIFIED') {
    res.status(403).json({
      success: false,
      message: `Access denied. Your account status: ${doctor.status}`,
    });
    return;
  }

  // Add doctorId to request for easy access in controllers
  (req as any).doctorId = req.user.id;

  next();
};

// Middleware to check if user is an admin
export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.',
    });
    return;
  }

  // Add adminId to request for easy access in controllers
  (req as any).adminId = req.user.id;

  next();
};

// Middleware to validate patient access token
export const validatePatientToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accessToken } = req.params;

    if (!accessToken) {
      res.status(400).json({
        success: false,
        message: 'Patient access token is required',
      });
      return;
    }

    // Validate token exists in database
    const patient = await prisma.patient.findUnique({
      where: { accessToken },
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
            phone: true,
            upiId: true,
            qrCodeImage: true,
          },
        },
      },
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Invalid patient access link',
      });
      return;
    }

    // Attach patient info to request
    req.user = {
      id: patient.id,
      email: patient.doctor.id, // Store doctor ID for consultation
      role: 'DOCTOR', // Using existing role type
      status: 'PATIENT', // Custom status to identify as patient
    };

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error validating patient token',
      error: error.message,
    });
  }
};

// Middleware to check doctor trial status
export const checkTrialStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user || req.user.role !== 'DOCTOR') {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.user.id },
      select: {
        trialEndsAt: true,
        subscriptionStatus: true,
        patientsCreated: true,
      },
    });

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    const now = new Date();

    // Check if trial has expired and no active subscription
    if (
      doctor.subscriptionStatus === 'TRIAL' &&
      doctor.trialEndsAt < now
    ) {
      res.status(403).json({
        success: false,
        message: 'Your trial period has expired. Please subscribe to continue.',
        trialExpired: true,
      });
      return;
    }

    // Check if trial patient limit reached
    if (
      doctor.subscriptionStatus === 'TRIAL' &&
      doctor.patientsCreated >= 2
    ) {
      res.status(403).json({
        success: false,
        message: 'Trial patient limit (2) reached. Please subscribe to add more patients.',
        trialLimitReached: true,
      });
      return;
    }

    // Check if subscription has expired
    if (
      doctor.subscriptionStatus === 'EXPIRED' ||
      doctor.subscriptionStatus === 'CANCELLED'
    ) {
      res.status(403).json({
        success: false,
        message: 'Your subscription has expired. Please renew to continue.',
        subscriptionExpired: true,
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error checking trial status',
      error: error.message,
    });
  }
};

// Combined middleware for doctor authentication (verify token + check is doctor)
export const auth = [verifyToken, isDoctor];
