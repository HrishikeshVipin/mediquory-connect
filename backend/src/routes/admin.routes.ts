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
import {
  getAllPlans,
  createPlan,
  updatePlan,
  deactivatePlan,
  activatePlan,
  grantFeaturesToDoctor,
  getPlanHistory,
  fixSubscriptionInconsistencies,
} from '../controllers/subscriptionPlanAdmin.controller';
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

// Subscription plan management
router.get('/subscription-plans', getAllPlans);
router.post('/subscription-plans', createPlan);
router.put('/subscription-plans/:planId', updatePlan);
router.put('/subscription-plans/:planId/deactivate', deactivatePlan);
router.put('/subscription-plans/:planId/activate', activatePlan);
router.put('/doctors/:doctorId/grant-features', grantFeaturesToDoctor);
router.get('/subscription-plans/:tier/history', getPlanHistory);
router.post('/subscription-plans/fix-inconsistencies', fixSubscriptionInconsistencies);

export default router;
