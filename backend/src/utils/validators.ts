import { z } from 'zod';

// Indian states for State Medical Council
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu & Kashmir',
  'Ladakh',
  'Puducherry',
  'Chandigarh',
  'Andaman and Nicobar Islands',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep',
] as const;

// Registration type enum
export const REGISTRATION_TYPE = {
  STATE: 'STATE_MEDICAL_COUNCIL',
  NATIONAL: 'NATIONAL_MEDICAL_COMMISSION',
} as const;

// Doctor signup validation schema
export const doctorSignupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  specialization: z.string().min(2, 'Specialization is required'),
  registrationType: z.enum([REGISTRATION_TYPE.STATE, REGISTRATION_TYPE.NATIONAL]),
  registrationNo: z.string().min(5, 'Registration number is required'),
  registrationState: z.string().optional(),
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$/, 'Aadhaar number must be exactly 12 digits'),
  upiId: z.string().optional(),
});

// Validation to ensure registrationState is provided if registrationType is STATE
export const validateDoctorSignup = (data: z.infer<typeof doctorSignupSchema>) => {
  if (data.registrationType === REGISTRATION_TYPE.STATE) {
    if (!data.registrationState || data.registrationState.trim() === '') {
      throw new Error('Registration state is required for State Medical Council');
    }
    if (!INDIAN_STATES.includes(data.registrationState as any)) {
      throw new Error('Invalid state selected');
    }
  }
  return true;
};

// Doctor login validation schema
export const doctorLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Admin login validation schema (same as doctor for MVP)
export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Patient creation validation schema
export const patientCreateSchema = z.object({
  fullName: z.string().min(2, 'Patient name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number').optional(),
  age: z.number().int().min(0).max(150).optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
});

// Vitals validation schema
export const vitalsSchema = z.object({
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  bloodPressure: z.string().regex(/^\d{2,3}\/\d{2,3}$/, 'Blood pressure format: 120/80').optional(),
  temperature: z.number().min(30).max(45).optional(),
  heartRate: z.number().int().min(30).max(250).optional(),
  oxygenLevel: z.number().int().min(0).max(100).optional(),
  notes: z.string().optional(),
});

// Prescription creation validation schema
export const prescriptionSchema = z.object({
  diagnosis: z.string().min(5, 'Diagnosis is required'),
  medications: z.array(
    z.object({
      name: z.string().min(1, 'Medication name is required'),
      dosage: z.string().min(1, 'Dosage is required'),
      frequency: z.string().min(1, 'Frequency is required'),
      duration: z.string().min(1, 'Duration is required'),
    })
  ).min(1, 'At least one medication is required'),
  instructions: z.string().optional(),
});

// Payment confirmation validation schema
export const paymentConfirmationSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  confirmedByDoctor: z.boolean(),
});

// Doctor verification (admin action) validation schema
export const doctorVerificationSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
});

// Validate rejection reason is provided when rejecting
export const validateDoctorVerification = (data: z.infer<typeof doctorVerificationSchema>) => {
  if (data.action === 'reject') {
    if (!data.rejectionReason || data.rejectionReason.trim() === '') {
      throw new Error('Rejection reason is required when rejecting a doctor');
    }
  }
  return true;
};

// Helper function to format Aadhaar number for display (masked)
export const maskAadhaar = (aadhaar: string): string => {
  if (aadhaar.length !== 12) return aadhaar;
  return `XXXX-XXXX-${aadhaar.substring(8)}`;
};

// Helper function to validate file uploads
export const validateFileUploads = (files: {
  registrationCertificate?: Express.Multer.File[];
  aadhaarFrontPhoto?: Express.Multer.File[];
  aadhaarBackPhoto?: Express.Multer.File[];
  profilePhoto?: Express.Multer.File[];
}) => {
  const errors: string[] = [];

  if (!files.registrationCertificate || files.registrationCertificate.length === 0) {
    errors.push('Registration certificate is required');
  }

  if (!files.aadhaarFrontPhoto || files.aadhaarFrontPhoto.length === 0) {
    errors.push('Aadhaar front photo is required');
  }

  if (!files.aadhaarBackPhoto || files.aadhaarBackPhoto.length === 0) {
    errors.push('Aadhaar back photo is required');
  }

  if (!files.profilePhoto || files.profilePhoto.length === 0) {
    errors.push('Profile photo is required');
  }

  return errors;
};
