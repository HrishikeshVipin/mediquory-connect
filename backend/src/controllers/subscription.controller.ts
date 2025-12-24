import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../config/database';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SAMPLE_KEY',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'SAMPLE_SECRET',
});

/**
 * Test Razorpay configuration
 */
export const testRazorpayConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || 'NOT_SET';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'NOT_SET';

    const config = {
      keyIdSet: keyId !== 'NOT_SET' && keyId !== 'rzp_test_SAMPLE_KEY',
      keySecretSet: keySecret !== 'NOT_SET' && keySecret !== 'SAMPLE_SECRET',
      keyIdPrefix: keyId.substring(0, 8),
      isTestMode: keyId.startsWith('rzp_test_'),
      isLiveMode: keyId.startsWith('rzp_live_'),
    };

    res.status(200).json({
      success: true,
      message: 'Razorpay configuration check',
      data: { config }
    });
  } catch (error: any) {
    console.error('Test Razorpay config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing Razorpay config',
      error: error.message
    });
  }
};

/**
 * Get doctor's raw subscription data (for debugging)
 */
export const getDebugSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = (req as any).user.id;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
        patientLimit: true,
        patientsCreated: true,
        monthlyVideoMinutes: true,
        purchasedMinutes: true,
        totalMinutesUsed: true,
        lastResetDate: true,
        currentSubscriptionHistoryId: true,
      }
    });

    res.status(200).json({
      success: true,
      message: 'Debug subscription data',
      data: { doctor }
    });
  } catch (error: any) {
    console.error('Get debug subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching debug data',
      error: error.message
    });
  }
};

/**
 * Get all available subscription plans
 */
export const getSubscriptionPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { price: 'asc' }
    });

    res.status(200).json({
      success: true,
      data: { plans }
    });
  } catch (error: any) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription plans',
      error: error.message
    });
  }
};

/**
 * Get current doctor's subscription info with usage stats
 */
export const getMySubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = (req as any).user.id;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
        patientsCreated: true,
        patientLimit: true,
        monthlyVideoMinutes: true,
        purchasedMinutes: true,
        totalMinutesUsed: true,
        lastResetDate: true
      }
    });

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
      return;
    }

    // Calculate available minutes
    const totalMinutes = doctor.monthlyVideoMinutes + doctor.purchasedMinutes;
    const availableMinutes = totalMinutes - doctor.totalMinutesUsed;
    const usagePercent = Math.round((doctor.totalMinutesUsed / totalMinutes) * 100);

    // Determine warning level and status
    let canStartConsultation = true;
    let statusMessage = '';
    let warningLevel: 'none' | 'low' | 'critical' | 'expired' = 'none';

    // Check subscription validity
    if (doctor.subscriptionStatus === 'TRIAL') {
      const now = new Date();
      const trialEnd = new Date(doctor.trialEndsAt);
      if (now > trialEnd) {
        canStartConsultation = false;
        statusMessage = 'Trial expired. Please subscribe to continue.';
        warningLevel = 'expired';
      } else {
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 3) {
          statusMessage = `Trial ending in ${daysLeft} days`;
          warningLevel = 'critical';
        }
      }
    } else if (doctor.subscriptionStatus === 'EXPIRED' || doctor.subscriptionStatus === 'CANCELLED') {
      canStartConsultation = false;
      statusMessage = 'Subscription expired. Please renew to continue consultations.';
      warningLevel = 'expired';
    }

    // Check video minutes
    if (availableMinutes <= 0 && canStartConsultation) {
      canStartConsultation = false;
      statusMessage = 'No video minutes remaining. Please purchase more minutes.';
      warningLevel = 'expired';
    } else if (availableMinutes <= 15 && availableMinutes > 0) {
      if (warningLevel !== 'expired') {
        statusMessage = `Only ${availableMinutes} minutes remaining`;
        warningLevel = 'critical';
      }
    } else if (availableMinutes <= 30 && availableMinutes > 15) {
      if (warningLevel === 'none') {
        statusMessage = `${availableMinutes} minutes remaining`;
        warningLevel = 'low';
      }
    }

    res.status(200).json({
      success: true,
      data: {
        subscription: doctor,
        usage: {
          patients: {
            used: doctor.patientsCreated,
            limit: doctor.patientLimit,
            unlimited: doctor.subscriptionTier === 'ENTERPRISE'
          },
          videoMinutes: {
            subscription: doctor.monthlyVideoMinutes,
            purchased: doctor.purchasedMinutes,
            total: totalMinutes,
            used: doctor.totalMinutesUsed,
            available: availableMinutes,
            usagePercent
          }
        },
        status: {
          canStartConsultation,
          message: statusMessage,
          warningLevel
        }
      }
    });
  } catch (error: any) {
    console.error('Get my subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription info',
      error: error.message
    });
  }
};

/**
 * Upgrade subscription to a paid tier
 */
export const upgradeSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = (req as any).user.id;
    const { tier } = req.body;

    console.log('🔄 Upgrade subscription request:', { doctorId, tier });

    // Validate tier
    const validTiers = ['BASIC', 'PROFESSIONAL', 'ENTERPRISE'];
    if (!validTiers.includes(tier)) {
      res.status(400).json({
        success: false,
        message: 'Invalid subscription tier. Must be BASIC, PROFESSIONAL, or ENTERPRISE.'
      });
      return;
    }

    // Get plan details
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { tier }
    });

    if (!plan) {
      res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
      return;
    }

    console.log('📋 Plan found:', { tier: plan.tier, price: plan.price });

    // Check Razorpay configuration
    const keyId = process.env.RAZORPAY_KEY_ID || 'NOT_SET';
    if (keyId === 'NOT_SET' || keyId === 'rzp_test_SAMPLE_KEY') {
      console.error('❌ Razorpay not configured properly');
      res.status(500).json({
        success: false,
        message: 'Payment gateway not configured. Please contact support.',
        error: 'RAZORPAY_NOT_CONFIGURED'
      });
      return;
    }

    console.log('💳 Creating Razorpay order...');

    // Create short receipt (max 40 chars for Razorpay)
    // Format: sub_<first8charsOfId>_<timestamp>
    const shortId = doctorId.substring(0, 8);
    const receipt = `sub_${shortId}_${Date.now()}`;

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: plan.price, // amount in paise
      currency: 'INR',
      receipt,
      notes: {
        doctorId,
        planTier: tier,
        planName: plan.name,
        type: 'subscription_upgrade',
      },
    });

    console.log('✅ Razorpay order created:', razorpayOrder.id);

    res.status(200).json({
      success: true,
      message: `Upgrade to ${plan.name} initiated`,
      data: {
        plan,
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
      },
    });
  } catch (error: any) {
    console.error('❌ Upgrade subscription error:', {
      message: error.message,
      description: error.error?.description,
      code: error.error?.code,
      statusCode: error.statusCode,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error upgrading subscription. Please check Razorpay configuration.',
      error: error.message,
      details: error.error?.description || 'Razorpay API error'
    });
  }
};

/**
 * Get available minute purchase packages
 */
export const getMinutePackages = async (req: Request, res: Response): Promise<void> => {
  try {
    // Define available minute packages
    const packages = [
      {
        minutes: 100,
        price: 9900,
        priceDisplay: '₹99',
        perMinuteCost: '₹0.99'
      },
      {
        minutes: 300,
        price: 24900,
        priceDisplay: '₹249',
        perMinuteCost: '₹0.83',
        savings: '16%'
      },
      {
        minutes: 500,
        price: 39900,
        priceDisplay: '₹399',
        perMinuteCost: '₹0.80',
        savings: '20%'
      },
      {
        minutes: 1000,
        price: 69900,
        priceDisplay: '₹699',
        perMinuteCost: '₹0.70',
        savings: '30%'
      }
    ];

    res.status(200).json({
      success: true,
      data: { packages }
    });
  } catch (error: any) {
    console.error('Get minute packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching minute packages',
      error: error.message
    });
  }
};

/**
 * Purchase extra video minutes
 */
export const purchaseMinutes = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = (req as any).user.id;
    const { minutes, price } = req.body;

    // Validate package
    const validPackages = [
      { minutes: 100, price: 9900 },
      { minutes: 300, price: 24900 },
      { minutes: 500, price: 39900 },
      { minutes: 1000, price: 69900 }
    ];

    const packageValid = validPackages.some(
      pkg => pkg.minutes === minutes && pkg.price === price
    );

    if (!packageValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid package. Please select a valid minute package.'
      });
      return;
    }

    // Create purchase record
    const purchase = await prisma.minutePurchase.create({
      data: {
        doctorId,
        minutes,
        price,
        paymentStatus: 'PENDING'
      }
    });

    // Create short receipt (max 40 chars for Razorpay)
    // Format: min_<first8charsOfId>_<timestamp>
    const shortPurchaseId = purchase.id.substring(0, 8);
    const receipt = `min_${shortPurchaseId}_${Date.now()}`;

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: price, // amount in paise
      currency: 'INR',
      receipt,
      notes: {
        doctorId,
        purchaseId: purchase.id,
        minutes,
        type: 'minute_purchase',
      },
    });

    // Update purchase with Razorpay order ID
    await prisma.minutePurchase.update({
      where: { id: purchase.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    res.status(201).json({
      success: true,
      message: 'Purchase initiated',
      data: {
        purchase: {
          id: purchase.id,
          minutes,
          price,
        },
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
      }
    });
  } catch (error: any) {
    console.error('Purchase minutes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error initiating minute purchase',
      error: error.message
    });
  }
};

/**
 * Confirm minute purchase after payment
 */
export const confirmMinutePurchase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { purchaseId, razorpayPaymentId, razorpaySignature } = req.body;

    const purchase = await prisma.minutePurchase.findUnique({
      where: { id: purchaseId }
    });

    if (!purchase) {
      res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
      return;
    }

    if (!purchase.razorpayOrderId) {
      res.status(400).json({
        success: false,
        message: 'Invalid purchase - no order ID found'
      });
      return;
    }

    // Verify Razorpay payment signature
    const body = purchase.razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'SAMPLE_SECRET')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature - payment verification failed'
      });
      return;
    }

    // Update purchase status
    await prisma.minutePurchase.update({
      where: { id: purchaseId },
      data: {
        paymentStatus: 'COMPLETED',
        razorpayPaymentId
      }
    });

    // Add minutes to doctor's account
    const updatedDoctor = await prisma.doctor.update({
      where: { id: purchase.doctorId },
      data: {
        purchasedMinutes: {
          increment: purchase.minutes
        }
      },
      select: {
        purchasedMinutes: true,
        monthlyVideoMinutes: true,
        totalMinutesUsed: true,
      }
    });

    const newAvailableMinutes =
      (updatedDoctor.monthlyVideoMinutes + updatedDoctor.purchasedMinutes) - updatedDoctor.totalMinutesUsed;

    res.status(200).json({
      success: true,
      message: `${purchase.minutes} minutes added to your account successfully!`,
      data: {
        purchase,
        newAvailableMinutes
      }
    });
  } catch (error: any) {
    console.error('Confirm minute purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming minute purchase',
      error: error.message
    });
  }
};

/**
 * Razorpay Webhook Handler
 * Receives payment notifications from Razorpay and processes them
 */
export const handleRazorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verify webhook signature
    const webhookSignature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'SAMPLE_WEBHOOK_SECRET';

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      console.error('❌ Invalid webhook signature');
      res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
      return;
    }

    const event = req.body.event;
    const payload = req.body.payload.payment.entity;

    console.log(`📥 Webhook received: ${event}`);

    // Handle payment.captured event
    if (event === 'payment.captured') {
      const notes = payload.notes;

      // Handle minute purchase
      if (notes.type === 'minute_purchase') {
        const purchaseId = notes.purchaseId;

        // Check if already processed
        const existingPurchase = await prisma.minutePurchase.findUnique({
          where: { id: purchaseId }
        });

        if (existingPurchase?.paymentStatus === 'COMPLETED') {
          console.log('⚠️ Purchase already processed:', purchaseId);
          res.status(200).json({ success: true, message: 'Already processed' });
          return;
        }

        // Update purchase status
        await prisma.minutePurchase.update({
          where: { id: purchaseId },
          data: {
            paymentStatus: 'COMPLETED',
            razorpayPaymentId: payload.id
          }
        });

        // Add minutes to doctor's account
        await prisma.doctor.update({
          where: { id: notes.doctorId },
          data: {
            purchasedMinutes: {
              increment: parseInt(notes.minutes)
            }
          }
        });

        console.log(`✅ Minute purchase confirmed: ${notes.minutes} minutes for doctor ${notes.doctorId}`);
      }

      // Handle subscription upgrade
      else if (notes.type === 'subscription_upgrade') {
        const doctorId = notes.doctorId;
        const planTier = notes.planTier;

        // Get plan details
        const plan = await prisma.subscriptionPlan.findUnique({
          where: { tier: planTier }
        });

        if (!plan) {
          console.error('❌ Plan not found:', planTier);
          res.status(400).json({ success: false, message: 'Plan not found' });
          return;
        }

        // Update doctor's subscription
        const subscriptionEndDate = new Date();
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

        await prisma.doctor.update({
          where: { id: doctorId },
          data: {
            subscriptionTier: planTier,
            subscriptionStatus: 'ACTIVE',
            subscriptionEndsAt: subscriptionEndDate,
            patientLimit: plan.patientLimit,
            monthlyVideoMinutes: plan.monthlyVideoMinutes,
            totalMinutesUsed: 0, // Reset usage on upgrade
            lastResetDate: new Date()
          }
        });

        console.log(`✅ Subscription upgraded: ${planTier} for doctor ${doctorId}`);
      }
    }

    // Handle payment.failed event
    else if (event === 'payment.failed') {
      const notes = payload.notes;

      if (notes.type === 'minute_purchase' && notes.purchaseId) {
        await prisma.minutePurchase.update({
          where: { id: notes.purchaseId },
          data: { paymentStatus: 'FAILED' }
        });
        console.log(`❌ Minute purchase failed: ${notes.purchaseId}`);
      }
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('❌ Webhook handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
};

/**
 * Confirm subscription upgrade after payment
 */
export const confirmSubscriptionUpgrade = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = (req as any).user.id;
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, tier } = req.body;

    console.log('🔐 Confirm subscription upgrade request:', {
      doctorId,
      tier,
      razorpayPaymentId,
      razorpayOrderId
    });

    // Verify payment signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'SAMPLE_SECRET')
      .update(body.toString())
      .digest('hex');

    console.log('🔍 Signature verification:', {
      expected: expectedSignature.substring(0, 10) + '...',
      received: razorpaySignature.substring(0, 10) + '...',
      match: expectedSignature === razorpaySignature
    });

    if (expectedSignature !== razorpaySignature) {
      console.error('❌ Signature verification failed');
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
      return;
    }

    // Get plan details
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { tier }
    });

    if (!plan) {
      res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
      return;
    }

    // Update doctor's subscription with history
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    const result = await prisma.$transaction(async (tx) => {
      // Create subscription history
      const history = await tx.doctorSubscriptionHistory.create({
        data: {
          doctorId,
          planId: plan.id,
          tier: plan.tier,
          pricePaid: plan.price,
          patientLimit: plan.patientLimit,
          monthlyVideoMinutes: plan.monthlyVideoMinutes,
          features: plan.features,
          startedAt: new Date(),
          endsAt: subscriptionEndDate,
          razorpayPaymentId,
          status: 'ACTIVE',
        },
      });

      // Update doctor
      const doctor = await tx.doctor.update({
        where: { id: doctorId },
        data: {
          subscriptionTier: tier,
          subscriptionStatus: 'ACTIVE',
          subscriptionEndsAt: subscriptionEndDate,
          patientLimit: plan.patientLimit,
          monthlyVideoMinutes: plan.monthlyVideoMinutes,
          totalMinutesUsed: 0,
          lastResetDate: new Date(),
          currentSubscriptionHistoryId: history.id,
        },
        select: {
          subscriptionTier: true,
          subscriptionStatus: true,
          subscriptionEndsAt: true,
          patientLimit: true,
          monthlyVideoMinutes: true,
        },
      });

      return { doctor, history };
    });

    const updatedDoctor = result.doctor;

    console.log('✅ Subscription upgrade confirmed successfully:', {
      doctorId,
      tier: updatedDoctor.subscriptionTier,
      status: updatedDoctor.subscriptionStatus,
      patientLimit: updatedDoctor.patientLimit,
      videoMinutes: updatedDoctor.monthlyVideoMinutes,
      endsAt: updatedDoctor.subscriptionEndsAt
    });

    res.status(200).json({
      success: true,
      message: `Successfully upgraded to ${plan.name}!`,
      data: {
        subscription: updatedDoctor,
        plan
      }
    });
  } catch (error: any) {
    console.error('❌ Confirm subscription upgrade error:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming subscription upgrade',
      error: error.message
    });
  }
};

/**
 * Reset monthly quotas (Cron job function)
 * Should be called monthly to reset doctor video minutes
 */
export const resetMonthlyQuotas = async (): Promise<number> => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const result = await prisma.doctor.updateMany({
      where: {
        lastResetDate: { lt: oneMonthAgo },
        subscriptionStatus: 'ACTIVE'
      },
      data: {
        totalMinutesUsed: 0,
        lastResetDate: new Date()
        // purchasedMinutes NOT reset - they carry over
      }
    });

    console.log(`✅ Reset monthly quotas for ${result.count} doctors`);
    return result.count;
  } catch (error) {
    console.error('❌ Error resetting monthly quotas:', error);
    throw error;
  }
};
