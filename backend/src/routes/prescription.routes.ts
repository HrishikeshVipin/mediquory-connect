import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  createPrescription,
  getPrescription,
  downloadPrescription,
  getPatientConsultationHistory,
  copyPrescriptionMedications,
} from '../controllers/prescription.controller';
import { prescriptionLimiter } from '../middleware/rateLimiter';

const router = Router();

// Doctor routes
router.post('/:consultationId', auth, prescriptionLimiter, createPrescription);
router.get('/:consultationId', getPrescription);
router.get('/:prescriptionId/download', downloadPrescription);
router.get('/patient/:patientId/history', auth, getPatientConsultationHistory);
router.get('/:prescriptionId/copy', auth, copyPrescriptionMedications);

export default router;
