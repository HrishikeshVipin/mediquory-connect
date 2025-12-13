import { Router } from 'express';
import { auth } from '../middleware/auth';
import { uploadPaymentProof as uploadPaymentProofMiddleware } from '../middleware/upload';
import {
  uploadPaymentProof,
  confirmPayment,
  getPaymentStatus,
} from '../controllers/payment.controller';

const router = Router();

// Patient routes (public - accessed via token)
router.post('/:consultationId/proof', uploadPaymentProofMiddleware, uploadPaymentProof);
router.get('/:consultationId/status', getPaymentStatus);

// Doctor routes (require authentication)
router.post('/:consultationId/confirm', auth, confirmPayment);

export default router;
