import express from 'express';
import {
  createMedicine,
  getAllMedicines,
  verifyMedicine,
  banMedicine,
  unbanMedicine,
  getDoctorAvailableMedicines,
  addToMyMedicines,
  getMyMedicines,
  removeFromMyMedicines,
  validatePrescriptionMedications,
} from '../controllers/medicine.controller';
import { auth } from '../middleware/auth';

const router = express.Router();

/**
 * ADMIN ROUTES
 */

/**
 * @route   POST /api/medicines
 * @desc    Create a new medicine
 * @access  Admin only
 */
router.post('/', auth, createMedicine);

/**
 * @route   GET /api/medicines/admin/all
 * @desc    Get all medicines with filters
 * @access  Admin only
 */
router.get('/admin/all', auth, getAllMedicines);

/**
 * @route   PUT /api/medicines/:medicineId/verify
 * @desc    Verify a medicine
 * @access  Admin only
 */
router.put('/:medicineId/verify', auth, verifyMedicine);

/**
 * @route   PUT /api/medicines/:medicineId/ban
 * @desc    Ban a medicine
 * @access  Admin only
 */
router.put('/:medicineId/ban', auth, banMedicine);

/**
 * @route   PUT /api/medicines/:medicineId/unban
 * @desc    Unban a medicine
 * @access  Admin only
 */
router.put('/:medicineId/unban', auth, unbanMedicine);

/**
 * DOCTOR ROUTES
 */

/**
 * @route   GET /api/medicines/available
 * @desc    Get available medicines filtered by doctor's specialization
 * @access  Doctor only
 */
router.get('/available', auth, getDoctorAvailableMedicines);

/**
 * @route   GET /api/medicines/my-medicines
 * @desc    Get doctor's personal medicine list
 * @access  Doctor only
 */
router.get('/my-medicines', auth, getMyMedicines);

/**
 * @route   POST /api/medicines/my-medicines
 * @desc    Add medicine to doctor's personal list
 * @access  Doctor only
 */
router.post('/my-medicines', auth, addToMyMedicines);

/**
 * @route   DELETE /api/medicines/my-medicines/:medicineId
 * @desc    Remove medicine from doctor's personal list
 * @access  Doctor only
 */
router.delete('/my-medicines/:medicineId', auth, removeFromMyMedicines);

/**
 * @route   POST /api/medicines/validate
 * @desc    Validate prescription medications (check for banned medicines)
 * @access  Doctor only
 */
router.post('/validate', auth, validatePrescriptionMedications);

export default router;
