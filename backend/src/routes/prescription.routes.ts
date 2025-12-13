import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  createPrescription,
  getPrescription,
  downloadPrescription,
} from '../controllers/prescription.controller';

const router = Router();

// Doctor routes (require authentication)
router.post('/:consultationId', auth, createPrescription);
router.get('/:consultationId', getPrescription);
router.get('/:prescriptionId/download', downloadPrescription);

export default router;
