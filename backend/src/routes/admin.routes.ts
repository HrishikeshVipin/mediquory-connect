import { Router } from 'express';
import {
  getPlatformStats,
  getAllDoctors,
  getPendingDoctors,
  getDoctorById,
  verifyDoctor,
  rejectDoctor,
  suspendDoctor,
  reactivateDoctor,
  updateDoctorSubscription,
} from '../controllers/admin.controller';
import { verifyToken, isAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(verifyToken, isAdmin);

// Platform statistics
router.get('/stats', getPlatformStats);

// Doctor management
router.get('/doctors', getAllDoctors);
router.get('/doctors/pending', getPendingDoctors);
router.get('/doctors/:doctorId', getDoctorById);

// Doctor verification
router.put('/doctors/:doctorId/verify', verifyDoctor);
router.put('/doctors/:doctorId/reject', rejectDoctor);
router.put('/doctors/:doctorId/suspend', suspendDoctor);
router.put('/doctors/:doctorId/reactivate', reactivateDoctor);

// Subscription management
router.put('/doctors/:doctorId/subscription', updateDoctorSubscription);

export default router;
