import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', ...ALLOWED_IMAGE_TYPES];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024; // 15MB

// Helper function to ensure upload directories exist
const ensureUploadDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Local disk storage for doctor KYC documents
const doctorKYCStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    let subfolder = 'doctor-kyc';

    if (file.fieldname === 'registrationCertificate') {
      subfolder = 'doctor-kyc/registration-certificates';
    } else if (file.fieldname === 'govIdFrontPhoto' || file.fieldname === 'govIdBackPhoto') {
      subfolder = 'doctor-kyc/gov-id-photos';
    } else if (file.fieldname === 'profilePhoto') {
      subfolder = 'doctor-kyc/profile-photos';
    }

    const uploadDir = path.join(process.cwd(), 'uploads', subfolder);
    ensureUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}_${timestamp}${ext}`);
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
  // Government ID and profile photos must be images
  else if (
    file.fieldname === 'govIdFrontPhoto' ||
    file.fieldname === 'govIdBackPhoto' ||
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
  { name: 'govIdFrontPhoto', maxCount: 1 },
  { name: 'govIdBackPhoto', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 },
]);

// Local disk storage for medical reports
const medicalReportStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'reports');
    ensureUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}_${timestamp}${ext}`);
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

// Local disk storage for payment proofs
const paymentProofStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'payment-proofs');
    ensureUploadDir(uploadDir);
    cb(null, uploadDir);
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

// Local disk storage for UPI QR codes
const qrCodeStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'qr-codes');
    ensureUploadDir(uploadDir);
    cb(null, uploadDir);
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

// Local disk storage for patient medical files
const medicalFilesStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'medical-files');
    ensureUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}_${timestamp}${ext}`);
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

// Local disk storage for profile photo update (doctor only)
const profilePhotoStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'profile-photos');
    ensureUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}_${timestamp}${ext}`);
  },
});

// Upload middleware for profile photo update (doctor only)
export const uploadProfilePhoto = multer({
  storage: profilePhotoStorage,
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Profile photo must be an image file (JPG, PNG)'));
    }
  },
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
}).single('profilePhoto');

// Local disk storage for digital signature
const digitalSignatureStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'signatures');
    ensureUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `signature_${uniqueId}_${timestamp}${ext}`);
  },
});

// Upload middleware for digital signature (doctor only)
export const uploadDigitalSignature = multer({
  storage: digitalSignatureStorage,
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Digital signature must be an image file (JPG, PNG)'));
    }
  },
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
}).single('signature');
