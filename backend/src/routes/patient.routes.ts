import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  createPatient,
  getDoctorPatients,
  getPatientById,
  getPatientByToken,
  selfRegisterPatient,
  getDoctorInfoForRegistration,
  toggleSelfRegistration,
  activatePatient,
  toggleVideoCall,
  deletePatient,
  getCaseSheet,
  updateCaseSheet,
} from '../controllers/patient.controller';
import { createPatientLimiter, patientRegistrationLimiter } from '../middleware/rateLimiter';

const router = Router();

// Doctor routes (require authentication)
// Note: Specific routes must come BEFORE parameterized routes
router.post('/create', auth, createPatientLimiter, createPatient);
router.get('/list', auth, getDoctorPatients);
router.put('/self-registration-toggle', auth, toggleSelfRegistration);
router.put('/:patientId/activate', auth, activatePatient);
router.put('/:patientId/video-call', auth, toggleVideoCall);
router.get('/:patientId/case-sheet', auth, getCaseSheet);
router.put('/:patientId/case-sheet', auth, updateCaseSheet);
router.delete('/:patientId', auth, deletePatient);
router.get('/:patientId', auth, getPatientById);

// Public routes (no auth required)
router.post('/self-register', patientRegistrationLimiter, selfRegisterPatient);
router.get('/doctor/:doctorId/info', getDoctorInfoForRegistration);
router.get('/token/:token', getPatientByToken);

export default router;
