import express from 'express';
import {
  getSubscriptionPlans,
  getMySubscription,
  upgradeSubscription,
  getMinutePackages,
  purchaseMinutes,
  confirmMinutePurchase,
  confirmSubscriptionUpgrade,
  handleRazorpayWebhook,
} from '../controllers/subscription.controller';
import { auth } from '../middleware/auth';

const router = express.Router();

/**
 * @route   GET /api/subscription/plans
 * @desc    Get all available subscription plans
 * @access  Public (or Doctor authenticated)
 */
router.get('/plans', getSubscriptionPlans);

/**
 * @route   GET /api/subscription/my-subscription
 * @desc    Get current doctor's subscription info with usage stats
 * @access  Doctor
 */
router.get('/my-subscription', auth, getMySubscription);

/**
 * @route   POST /api/subscription/upgrade
 * @desc    Upgrade subscription to a paid tier
 * @access  Doctor
 */
router.post('/upgrade', auth, upgradeSubscription);

/**
 * @route   POST /api/subscription/confirm-upgrade
 * @desc    Confirm subscription upgrade after payment
 * @access  Doctor
 */
router.post('/confirm-upgrade', auth, confirmSubscriptionUpgrade);

/**
 * @route   GET /api/subscription/minute-packages
 * @desc    Get available minute purchase packages
 * @access  Public (or Doctor authenticated)
 */
router.get('/minute-packages', getMinutePackages);

/**
 * @route   POST /api/subscription/purchase-minutes
 * @desc    Purchase extra video minutes
 * @access  Doctor
 */
router.post('/purchase-minutes', auth, purchaseMinutes);

/**
 * @route   POST /api/subscription/confirm-purchase
 * @desc    Confirm minute purchase after payment
 * @access  Doctor
 */
router.post('/confirm-purchase', auth, confirmMinutePurchase);

/**
 * @route   POST /api/subscription/webhook
 * @desc    Razorpay webhook handler for payment notifications
 * @access  Public (Razorpay only - signature verified)
 */
router.post('/webhook', handleRazorpayWebhook);

export default router;
