import express from 'express';
import {
  submitReview,
  getDoctorReviews,
  getConsultationReview,
} from '../controllers/review.controller';
import { auth } from '../middleware/auth';

const router = express.Router();

/**
 * @route   POST /api/reviews/submit
 * @desc    Submit review for a completed consultation (called by patient)
 * @access  Public (patients use consultation access token)
 */
router.post('/submit', submitReview);

/**
 * @route   GET /api/reviews/doctor
 * @desc    Get all reviews for the authenticated doctor with statistics
 * @access  Doctor
 */
router.get('/doctor', auth, getDoctorReviews);

/**
 * @route   GET /api/reviews/consultation/:consultationId
 * @desc    Get review for a specific consultation
 * @access  Doctor
 */
router.get('/consultation/:consultationId', auth, getConsultationReview);

export default router;
