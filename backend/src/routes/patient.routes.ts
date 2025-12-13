import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  createPatient,
  getDoctorPatients,
  getPatientById,
  getPatientByToken,
} from '../controllers/patient.controller';

const router = Router();

// Doctor routes (require authentication)
router.post('/create', auth, createPatient);
router.get('/list', auth, getDoctorPatients);
router.get('/:patientId', auth, getPatientById);

// Public route - patient access by token (no auth required)
router.get('/token/:token', getPatientByToken);

export default router;
