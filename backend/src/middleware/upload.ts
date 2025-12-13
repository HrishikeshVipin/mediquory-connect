import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', ...ALLOWED_IMAGE_TYPES];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024; // 15MB

// Storage configuration for doctor KYC documents
const doctorKYCStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    let folder = 'uploads/doctor-kyc/';

    if (file.fieldname === 'registrationCertificate') {
      folder += 'registration-certificates';
    } else if (file.fieldname === 'aadhaarFrontPhoto' || file.fieldname === 'aadhaarBackPhoto') {
      folder += 'aadhaar-photos';
    } else if (file.fieldname === 'profilePhoto') {
      folder += 'profile-photos';
    }

    cb(null, folder);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const sanitizedOriginalName = file.originalname
      .replace(/[^a-zA-Z0-9.]/g, '_')
      .substring(0, 50);

    cb(null, `${uniqueId}_${timestamp}_${sanitizedOriginalName}`);
  },
});

// File filter for doctor KYC documents
const doctorKYCFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Registration certificate can be PDF or image
  if (file.fieldname === 'registrationCertificate') {
    if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Registration certificate must be a PDF or image file (JPG, PNG)'));
    }
  }
  // Aadhaar and profile photos must be images
  else if (
    file.fieldname === 'aadhaarFrontPhoto' ||
    file.fieldname === 'aadhaarBackPhoto' ||
    file.fieldname === 'profilePhoto'
  ) {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`${file.fieldname} must be an image file (JPG, PNG)`));
    }
  } else {
    cb(new Error('Unexpected field'));
  }
};

// Upload middleware for doctor signup
export const uploadDoctorKYC = multer({
  storage: doctorKYCStorage,
  fileFilter: doctorKYCFileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
}).fields([
  { name: 'registrationCertificate', maxCount: 1 },
  { name: 'aadhaarFrontPhoto', maxCount: 1 },
  { name: 'aadhaarBackPhoto', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 },
]);

// Storage configuration for medical reports
const medicalReportStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, 'uploads/reports');
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const sanitizedOriginalName = file.originalname
      .replace(/[^a-zA-Z0-9.]/g, '_')
      .substring(0, 50);

    cb(null, `${uniqueId}_${timestamp}_${sanitizedOriginalName}`);
  },
});

// File filter for medical reports
const medicalReportFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Medical report must be a PDF or image file (JPG, PNG)'));
  }
};

// Upload middleware for medical reports
export const uploadMedicalReport = multer({
  storage: medicalReportStorage,
  fileFilter: medicalReportFileFilter,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
  },
}).single('medicalReport');

// Storage configuration for payment proofs
const paymentProofStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, 'uploads/payment-proofs');
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);

    cb(null, `payment_${uniqueId}_${timestamp}${ext}`);
  },
});

// File filter for payment proofs
const paymentProofFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Payment proof must be an image file (JPG, PNG)'));
  }
};

// Upload middleware for payment proofs
export const uploadPaymentProof = multer({
  storage: paymentProofStorage,
  fileFilter: paymentProofFileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
}).single('paymentProof');

// Storage configuration for UPI QR codes
const qrCodeStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, 'uploads/qr-codes');
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);

    cb(null, `qr_${uniqueId}_${timestamp}${ext}`);
  },
});

// Upload middleware for QR codes
export const uploadQRCode = multer({
  storage: qrCodeStorage,
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('QR code must be an image file (JPG, PNG)'));
    }
  },
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
}).single('qrCode');

// Storage configuration for patient medical files
const medicalFilesStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, 'uploads/medical-files');
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const sanitizedOriginalName = file.originalname
      .replace(/[^a-zA-Z0-9.]/g, '_')
      .substring(0, 50);

    cb(null, `${uniqueId}_${timestamp}_${sanitizedOriginalName}`);
  },
});

// Upload middleware for patient medical files
export const uploadMedicalFiles = multer({
  storage: medicalFilesStorage,
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File must be a PDF or image (JPG, PNG)'));
    }
  },
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
  },
});
