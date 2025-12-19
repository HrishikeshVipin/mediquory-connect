import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  startConsultation,
  getConsultation,
  getPatientConsultation,
  endConsultation,
  updateConsultationDuration,
  updateVideoDuration,
  saveChatMessage,
  getChatHistory,
  updateConsultationNotes,
  generateVideoTokens,
  markMessagesAsRead,
  getUnreadConsultations,
} from '../controllers/consultation.controller';

const router = Router();

// Doctor routes (require authentication)
// Note: Specific routes must come BEFORE parameterized routes
router.post('/start', auth, startConsultation);
router.get('/unread', auth, getUnreadConsultations); // Get consultations with unread messages
router.get('/:consultationId', getConsultation);
router.put('/:consultationId/duration', updateConsultationDuration); // Real-time total duration updates (reference only)
router.put('/:consultationId/video-duration', updateVideoDuration); // Real-time VIDEO duration updates (for billing)
router.put('/:consultationId/end', auth, endConsultation);
router.put('/:consultationId/notes', auth, updateConsultationNotes);
router.put('/:consultationId/mark-read', auth, markMessagesAsRead); // Mark patient messages as read

// Video consultation routes (public - anyone with consultation ID can join)
router.get('/:consultationId/video-tokens', generateVideoTokens);

// Chat routes
router.post('/message', saveChatMessage);
router.get('/:consultationId/messages', getChatHistory);

// Patient routes (public - accessed via token in frontend)
router.get('/patient/:patientToken', getPatientConsultation);

export default router;
