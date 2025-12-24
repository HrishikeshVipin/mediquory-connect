import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { sendOtp as sendOtpSms, verifyOtp as verifyOtpSms } from '../services/sms.service';
import { PatientAuthRequest } from '../middleware/patient-auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';
const JWT_EXPIRY = '7d'; // Access token valid for 7 days
const REFRESH_TOKEN_EXPIRY = '30d'; // Refresh token valid for 30 days

// Generate JWT tokens
function generateTokens(patient: { id: string; phone: string; fullName: string; accountType: string }) {
  const accessToken = jwt.sign(
    {
      id: patient.id,
      phone: patient.phone,
      fullName: patient.fullName,
      accountType: patient.accountType,
      type: 'patient',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  const refreshToken = jwt.sign(
    {
      id: patient.id,
      type: 'patient',
    },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
}

// Send OTP to phone number
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;

    if (!phone) {
      res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
      return;
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^[6-9]\d{9}$/; // Indian phone numbers
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
      });
      return;
    }

    // Send OTP via SMS service
    const result = await sendOtpSms(phone);

    if (!result.success) {
      res.status(429).json({
        success: false,
        message: result.message,
        lockedUntil: result.lockedUntil,
      });
      return;
    }

    res.json({
      success: true,
      message: 'OTP sent successfully to your phone',
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP',
    });
  }
};

// Verify OTP (without creating account - used for signup flow)
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required',
      });
      return;
    }

    // Verify OTP
    const result = await verifyOtpSms(phone, otp);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    }

    res.json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify OTP',
    });
  }
};

// Patient Signup (after OTP verification)
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp, fullName, age, gender, pin } = req.body;

    // Validate required fields
    if (!phone || !otp || !fullName || !pin) {
      res.status(400).json({
        success: false,
        message: 'Phone, OTP, full name, and PIN are required',
      });
      return;
    }

    // Validate PIN (6 digits)
    if (!/^\d{6}$/.test(pin)) {
      res.status(400).json({
        success: false,
        message: 'PIN must be exactly 6 digits',
      });
      return;
    }

    // Check if OTP was recently verified (within last 10 minutes)
    const recentlyVerifiedOtp = await prisma.patientOtp.findFirst({
      where: {
        phone,
        verified: true,
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000), // Last 10 minutes
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!recentlyVerifiedOtp) {
      res.status(400).json({
        success: false,
        message: 'OTP verification expired. Please verify OTP again.',
      });
      return;
    }

    // Verify the OTP matches
    const isOtpValid = await bcrypt.compare(otp, recentlyVerifiedOtp.otp);
    if (!isOtpValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.',
      });
      return;
    }

    // Check if patient already exists with this phone (APP_ACCOUNT type)
    const existingPatient = await prisma.patient.findFirst({
      where: {
        phone,
        accountType: 'APP_ACCOUNT',
      },
    });

    if (existingPatient) {
      res.status(409).json({
        success: false,
        message: 'An account with this phone number already exists. Please login instead.',
      });
      return;
    }

    // Hash PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    // Create patient account (doctorId is null for self-registered patients)
    // They will be linked to a doctor when they book their first consultation
    const patient = await prisma.patient.create({
      data: {
        phone,
        fullName,
        age: age ? parseInt(age) : null,
        gender: gender || null,
        password: hashedPin,
        phoneVerified: true,
        accountType: 'APP_ACCOUNT',
        createdVia: 'SELF_REGISTERED',
        status: 'ACTIVE',
        // doctorId is optional - will be set when patient books first consultation
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: patient.id,
      phone: patient.phone!,
      fullName: patient.fullName,
      accountType: patient.accountType,
    });

    // Save refresh token
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        refreshToken,
        lastLoginAt: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        patient: {
          id: patient.id,
          phone: patient.phone,
          fullName: patient.fullName,
          age: patient.age,
          gender: patient.gender,
          accountType: patient.accountType,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create account',
    });
  }
};

// Patient Login (with phone + PIN after first signup)
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, pin } = req.body;

    if (!phone || !pin) {
      res.status(400).json({
        success: false,
        message: 'Phone number and PIN are required',
      });
      return;
    }

    // Find patient account
    const patient = await prisma.patient.findFirst({
      where: {
        phone,
        accountType: 'APP_ACCOUNT',
      },
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Account not found. Please sign up first.',
      });
      return;
    }

    // Verify PIN
    if (!patient.password) {
      res.status(400).json({
        success: false,
        message: 'Account not properly set up. Please contact support.',
      });
      return;
    }

    const isValidPin = await bcrypt.compare(pin, patient.password);
    if (!isValidPin) {
      res.status(401).json({
        success: false,
        message: 'Invalid PIN',
      });
      return;
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: patient.id,
      phone: patient.phone!,
      fullName: patient.fullName,
      accountType: patient.accountType,
    });

    // Save refresh token and update last login
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        refreshToken,
        lastLoginAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        patient: {
          id: patient.id,
          phone: patient.phone,
          fullName: patient.fullName,
          age: patient.age,
          gender: patient.gender,
          accountType: patient.accountType,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

// Refresh access token using refresh token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
      return;
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
      id: string;
      type: string;
    };

    if (decoded.type !== 'patient') {
      res.status(403).json({
        success: false,
        message: 'Invalid token type',
      });
      return;
    }

    // Find patient and verify refresh token matches
    const patient = await prisma.patient.findUnique({
      where: { id: decoded.id },
    });

    if (!patient || patient.refreshToken !== refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
      return;
    }

    // Generate new tokens
    const tokens = generateTokens({
      id: patient.id,
      phone: patient.phone!,
      fullName: patient.fullName,
      accountType: patient.accountType,
    });

    // Update refresh token
    await prisma.patient.update({
      where: { id: patient.id },
      data: { refreshToken: tokens.refreshToken },
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Refresh token expired. Please login again.',
      });
      return;
    }

    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to refresh token',
    });
  }
};

// Get patient profile (authenticated)
export const getProfile = async (req: PatientAuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.patient) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    // Get full patient details
    const patient = await prisma.patient.findUnique({
      where: { id: req.patient.id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        age: true,
        gender: true,
        accountType: true,
        phoneVerified: true,
        createdAt: true,
        lastLoginAt: true,
        status: true,
      },
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { patient },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get profile',
    });
  }
};

// Update patient profile (authenticated)
export const updateProfile = async (req: PatientAuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.patient) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    const { fullName, age, gender } = req.body;

    // Update patient
    const updated = await prisma.patient.update({
      where: { id: req.patient.id },
      data: {
        ...(fullName && { fullName }),
        ...(age && { age: parseInt(age) }),
        ...(gender && { gender }),
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        age: true,
        gender: true,
        accountType: true,
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { patient: updated },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile',
    });
  }
};

// Change PIN (authenticated)
export const changePin = async (req: PatientAuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.patient) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin) {
      res.status(400).json({
        success: false,
        message: 'Current PIN and new PIN are required',
      });
      return;
    }

    // Validate new PIN
    if (!/^\d{6}$/.test(newPin)) {
      res.status(400).json({
        success: false,
        message: 'New PIN must be exactly 6 digits',
      });
      return;
    }

    // Get patient with password
    const patient = await prisma.patient.findUnique({
      where: { id: req.patient.id },
    });

    if (!patient || !patient.password) {
      res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
      return;
    }

    // Verify current PIN
    const isValidPin = await bcrypt.compare(currentPin, patient.password);
    if (!isValidPin) {
      res.status(401).json({
        success: false,
        message: 'Current PIN is incorrect',
      });
      return;
    }

    // Hash and save new PIN
    const hashedNewPin = await bcrypt.hash(newPin, 10);
    await prisma.patient.update({
      where: { id: req.patient.id },
      data: { password: hashedNewPin },
    });

    res.json({
      success: true,
      message: 'PIN changed successfully',
    });
  } catch (error: any) {
    console.error('Change PIN error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to change PIN',
    });
  }
};

/**
 * Get all consultations for authenticated patient
 * GET /api/patient-auth/consultations
 */
export const getMyConsultations = async (req: PatientAuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.patient) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    const consultations = await prisma.consultation.findMany({
      where: { patientId: req.patient.id },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        chiefComplaint: true,
        diagnosis: true,
        doctorNotes: true,
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
            profilePhoto: true,
            email: true,
            phone: true,
          },
        },
        prescription: {
          select: {
            id: true,
            diagnosis: true,
            medications: true,
            instructions: true,
            pdfPath: true,
            createdAt: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            reviewText: true,
            createdAt: true,
          },
        },
        paymentConfirmation: {
          select: {
            id: true,
            amount: true,
            confirmedByDoctor: true,
            confirmedAt: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    res.json({
      success: true,
      data: { consultations },
    });
  } catch (error: any) {
    console.error('Get consultations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get consultations',
    });
  }
};

/**
 * Get all medical records for authenticated patient
 * GET /api/patient-auth/medical-records
 */
export const getMyMedicalRecords = async (req: PatientAuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.patient) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    // Get patient with all medical data
    const patient = await prisma.patient.findUnique({
      where: { id: req.patient.id },
      select: {
        id: true,
        fullName: true,
        age: true,
        gender: true,
        // All prescriptions from consultations
        consultations: {
          select: {
            id: true,
            startedAt: true,
            completedAt: true,
            doctor: {
              select: {
                fullName: true,
                specialization: true,
              },
            },
            prescription: {
              select: {
                id: true,
                diagnosis: true,
                medications: true,
                instructions: true,
                pdfPath: true,
                createdAt: true,
              },
            },
          },
          where: {
            prescription: { isNot: null },
          },
          orderBy: { startedAt: 'desc' },
        },
        // Vitals
        vitals: {
          select: {
            id: true,
            weight: true,
            height: true,
            bloodPressure: true,
            temperature: true,
            heartRate: true,
            oxygenLevel: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        // Medical file uploads
        medicalUploads: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            description: true,
            filePath: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        patient: {
          id: patient.id,
          fullName: patient.fullName,
          age: patient.age,
          gender: patient.gender,
        },
        prescriptions: patient.consultations.map((c) => ({
          consultationId: c.id,
          consultationDate: c.startedAt,
          doctor: c.doctor,
          ...c.prescription,
        })),
        vitals: patient.vitals,
        medicalUploads: patient.medicalUploads,
      },
    });
  } catch (error: any) {
    console.error('Get medical records error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get medical records',
    });
  }
};
