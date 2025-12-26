import { Router } from 'express';
import { verifyToken, isAdmin } from '../middleware/auth';
import {
  getSettings,
  getSettingValue,
  updateSetting,
  createSetting,
  deleteSetting,
} from '../controllers/system-settings.controller';

const router = Router();

// Public endpoint - Get a specific setting value (for feature flags)
router.get('/public/:key', getSettingValue);

// Admin-only endpoints (verifyToken + isAdmin)
router.get('/', verifyToken, isAdmin, getSettings); // Get all settings or specific by query ?key=X
router.post('/', verifyToken, isAdmin, createSetting); // Create new setting
router.put('/:key', verifyToken, isAdmin, updateSetting); // Update setting
router.delete('/:key', verifyToken, isAdmin, deleteSetting); // Delete setting

export default router;
