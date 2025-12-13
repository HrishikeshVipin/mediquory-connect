import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  startConsultation,
  getConsultation,
  getPatientConsultation,
  endConsultation,
  saveChatMessage,
  getChatHistory,
  updateConsultationNotes,
  generateVideoTokens,
} from '../controllers/consultation.controller';

const router = Router();

// Doctor routes (require authentication)
router.post('/start', auth, startConsultation);
router.get('/:consultationId', getConsultation);
router.put('/:consultationId/end', auth, endConsultation);
router.put('/:consultationId/notes', auth, updateConsultationNotes);

// Video consultation routes (public - anyone with consultation ID can join)
router.get('/:consultationId/video-tokens', generateVideoTokens);

// Chat routes
router.post('/message', saveChatMessage);
router.get('/:consultationId/messages', getChatHistory);

// Patient routes (public - accessed via token in frontend)
router.get('/patient/:patientToken', getPatientConsultation);

export default router;
