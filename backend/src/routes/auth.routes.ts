import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import {
  doctorSignup,
  doctorLogin,
  adminLogin,
  logout,
  getCurrentUser,
} from '../controllers/auth.controller';
import { uploadDoctorKYC } from '../middleware/upload';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Multer error handler middleware
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum file size is 10MB for images and 15MB for documents.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }
  next(err);
};

// Doctor routes
router.post('/doctor/signup', uploadDoctorKYC, handleMulterError, doctorSignup);
router.post('/doctor/login', doctorLogin);

// Admin routes
router.post('/admin/login', adminLogin);

// Common routes
router.post('/logout', logout);
router.get('/me', verifyToken, getCurrentUser);

export default router;
