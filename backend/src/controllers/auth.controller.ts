import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken } from '../middleware/auth';
import {
  doctorSignupSchema,
  doctorLoginSchema,
  adminLoginSchema,
  validateDoctorSignup,
  validateFileUploads,
} from '../utils/validators';
import { notificationService } from '../services/notification.service';

// Doctor Signup
export const doctorSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse and validate request body
    const validatedData = doctorSignupSchema.parse(req.body);

    // Additional validation for state requirement
    validateDoctorSignup(validatedData);

    // Validate file uploads
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const fileErrors = validateFileUploads({
      registrationCertificate: files.registrationCertificate,
      aadhaarFrontPhoto: files.aadhaarFrontPhoto,
      aadhaarBackPhoto: files.aadhaarBackPhoto,
      profilePhoto: files.profilePhoto,
    });

    if (fileErrors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'File upload validation failed',
        errors: fileErrors,
      });
      return;
    }

    // Check if email already exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { email: validatedData.email },
    });

    if (existingDoctor) {
      res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create doctor record
    const doctor = await prisma.doctor.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        fullName: validatedData.fullName,
        phone: validatedData.phone,
        specialization: validatedData.specialization,
        registrationType: validatedData.registrationType,
        registrationNo: validatedData.registrationNo,
        registrationState: validatedData.registrationState || null,
        aadhaarNumber: validatedData.aadhaarNumber,
        registrationCertificate: files.registrationCertificate[0].path,
        aadhaarFrontPhoto: files.aadhaarFrontPhoto[0].path,
        aadhaarBackPhoto: files.aadhaarBackPhoto[0].path,
        profilePhoto: files.profilePhoto[0].path,
        upiId: validatedData.upiId || null,
        trialEndsAt,
        status: 'PENDING_VERIFICATION',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        specialization: true,
        status: true,
        createdAt: true,
      },
    });

    // Notify all admins about new doctor registration
    const admins = await prisma.admin.findMany({
      select: { id: true, email: true },
    });

    for (const admin of admins) {
      await notificationService.createNotification({
        recipientType: 'ADMIN',
        recipientId: admin.id,
        type: 'PENDING_DOCTOR',
        title: '👨‍⚕️ New Doctor Registration',
        message: `Dr. ${doctor.fullName} (${validatedData.specialization}) has registered and is awaiting verification.`,
        actionUrl: `/admin/doctors/${doctor.id}`,
        actionText: 'Review Application',
        metadata: {
          doctorId: doctor.id,
          doctorName: doctor.fullName,
          specialization: validatedData.specialization,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your application is under review. You will be notified once verified.',
      data: {
        doctor: {
          id: doctor.id,
          email: doctor.email,
          fullName: doctor.fullName,
          status: doctor.status,
        },
      },
    });
  } catch (error: any) {
    console.error('Doctor signup error:', error);

    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message,
      });
    }
  }
};

// Doctor Login
export const doctorLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = doctorLoginSchema.parse(req.body);

    // Find doctor by email
    const doctor = await prisma.doctor.findUnique({
      where: { email: validatedData.email },
    });

    if (!doctor) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, doctor.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check doctor status
    if (doctor.status === 'PENDING_VERIFICATION') {
      res.status(403).json({
        success: false,
        message: 'Your account is pending verification. Please wait for admin approval.',
        status: doctor.status,
      });
      return;
    }

    if (doctor.status === 'REJECTED') {
      res.status(403).json({
        success: false,
        message: `Your account was rejected. Reason: ${doctor.rejectionReason || 'Not specified'}`,
        status: doctor.status,
        rejectionReason: doctor.rejectionReason,
      });
      return;
    }

    if (doctor.status === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
        status: doctor.status,
      });
      return;
    }

    // Generate JWT token
    const token = generateToken({
      id: doctor.id,
      email: doctor.email,
      role: 'DOCTOR',
      status: doctor.status,
    });

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
    });

    // Check trial/subscription status
    const now = new Date();
    const trialExpired = doctor.subscriptionStatus === 'TRIAL' && doctor.trialEndsAt < now;
    const subscriptionActive = doctor.subscriptionStatus === 'ACTIVE';

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        doctor: {
          id: doctor.id,
          email: doctor.email,
          fullName: doctor.fullName,
          phone: doctor.phone,
          specialization: doctor.specialization,
          status: doctor.status,
          subscriptionStatus: doctor.subscriptionStatus,
          trialEndsAt: doctor.trialEndsAt,
          patientsCreated: doctor.patientsCreated,
          trialExpired,
          subscriptionActive,
        },
      },
    });
  } catch (error: any) {
    console.error('Doctor login error:', error);

    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message,
      });
    }
  }
};

// Admin Login
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = adminLoginSchema.parse(req.body);

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email: validatedData.email },
    });

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, admin.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate JWT token
    const token = generateToken({
      id: admin.id,
      email: admin.email,
      role: 'ADMIN',
    });

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
    });

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
        },
      },
    });
  } catch (error: any) {
    console.error('Admin login error:', error);

    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message,
      });
    }
  }
};

// Logout (clear cookie)
export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('token');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// Get current user info
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          specialization: true,
          status: true,
          subscriptionStatus: true,
          trialEndsAt: true,
          subscriptionEndsAt: true,
          patientsCreated: true,
          upiId: true,
          qrCodeImage: true,
          createdAt: true,
        },
      });

      res.status(200).json({
        success: true,
        data: { doctor },
      });
    } else if (req.user.role === 'ADMIN') {
      const admin = await prisma.admin.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          createdAt: true,
        },
      });

      res.status(200).json({
        success: true,
        data: { admin },
      });
    }
  } catch (error: any) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message,
    });
  }
};
