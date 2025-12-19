import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

/**
 * Middleware to check if doctor has an active subscription
 * Blocks interactions if subscription is expired, but allows viewing data
 */
export const requireActiveSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const doctorId = (req as any).user?.id;

    if (!doctorId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        subscriptionStatus: true,
        subscriptionTier: true,
        trialEndsAt: true,
        subscriptionEndsAt: true
      }
    });

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
      return;
    }

    // Check if subscription is valid
    const now = new Date();
    let isValid = false;

    if (doctor.subscriptionStatus === 'TRIAL') {
      const trialEnd = new Date(doctor.trialEndsAt);
      isValid = now <= trialEnd;
    } else if (doctor.subscriptionStatus === 'ACTIVE') {
      isValid = true;
      // Optional: Also check subscriptionEndsAt if set
      if (doctor.subscriptionEndsAt) {
        const subscriptionEnd = new Date(doctor.subscriptionEndsAt);
        isValid = now <= subscriptionEnd;
      }
    }

    if (!isValid) {
      res.status(403).json({
        success: false,
        message: 'Subscription expired. You can view patient data but cannot start consultations or interact with patients. Please renew your subscription.',
        subscriptionExpired: true,
        viewOnlyMode: true
      });
      return;
    }

    // Subscription is valid, proceed
    next();
  } catch (error: any) {
    console.error('Subscription check middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking subscription status',
      error: error.message
    });
  }
};

/**
 * Middleware to check if doctor has available video minutes
 * Shows warning but doesn't block (allows consultation to start)
 */
export const checkVideoMinutes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const doctorId = (req as any).user?.id;

    if (!doctorId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        monthlyVideoMinutes: true,
        purchasedMinutes: true,
        totalMinutesUsed: true
      }
    });

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
      return;
    }

    const availableMinutes =
      (doctor.monthlyVideoMinutes + doctor.purchasedMinutes) -
      doctor.totalMinutesUsed;

    if (availableMinutes <= 0) {
      res.status(403).json({
        success: false,
        message: 'No video minutes remaining. Please purchase more minutes to start consultations.',
        noMinutesRemaining: true,
        availableMinutes: 0
      });
      return;
    }

    // Attach available minutes to request for use in controller
    (req as any).availableMinutes = availableMinutes;
    next();
  } catch (error: any) {
    console.error('Video minutes check middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking video minutes',
      error: error.message
    });
  }
};
