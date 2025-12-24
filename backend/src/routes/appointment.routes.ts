import express from 'express';
import {
  getAvailability,
  updateAvailability,
  createAppointmentRequest,
  getPendingRequests,
  getUpcomingAppointments,
  getPastAppointments,
  acceptRequest,
  proposeAlternative,
  rejectRequest,
  getPatientAppointments,
  acceptProposal,
  declineProposal,
  cancelAppointment,
} from '../controllers/appointment.controller';
import { authenticateDoctor } from '../middleware/auth';
import { authenticatePatient } from '../middleware/patient-auth';

const router = express.Router();

// Doctor Availability Routes
router.get('/doctors/availability', authenticateDoctor, getAvailability);
router.put('/doctors/availability', authenticateDoctor, updateAvailability);

// Doctor Appointment Management Routes
router.get('/requests', authenticateDoctor, getPendingRequests);
router.get('/upcoming', authenticateDoctor, getUpcomingAppointments);
router.get('/history', authenticateDoctor, getPastAppointments);
router.post('/:id/accept', authenticateDoctor, acceptRequest);
router.post('/:id/propose-alternative', authenticateDoctor, proposeAlternative);
router.post('/:id/reject', authenticateDoctor, rejectRequest);

// Patient Appointment Management Routes
router.post('/patient/request', authenticatePatient, createAppointmentRequest);
router.get('/patient', authenticatePatient, getPatientAppointments);
router.post('/patient/:id/accept-proposal', authenticatePatient, acceptProposal);
router.post('/patient/:id/decline-proposal', authenticatePatient, declineProposal);

// Shared Routes (both doctor and patient can cancel)
router.put('/:id/cancel', cancelAppointment);

export default router;
