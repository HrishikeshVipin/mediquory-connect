import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all subscription plans with subscriber counts
 * GET /api/admin/subscription-plans
 * Admin only
 */
export const getAllPlans = async (req: Request, res: Response) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: {
            doctorSubscriptions: true,
          },
        },
      },
      orderBy: {
        price: 'asc',
      },
    });

    // Get current active subscriber count for each plan
    const plansWithStats = await Promise.all(
      plans.map(async (plan) => {
        const activeDoctors = await prisma.doctor.count({
          where: {
            subscriptionTier: plan.tier,
            subscriptionStatus: 'ACTIVE',
          },
        });

        return {
          ...plan,
          subscriberCount: activeDoctors,
          totalSubscriptions: plan._count.doctorSubscriptions,
        };
      })
    );

    res.json({
      success: true,
      data: {
        plans: plansWithStats,
        count: plansWithStats.length,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription plans',
    });
  }
};

/**
 * Create a new subscription plan
 * POST /api/admin/subscription-plans
 * Admin only
 */
export const createPlan = async (req: Request, res: Response) => {
  try {
    const {
      tier,
      name,
      price,
      patientLimit,
      monthlyVideoMinutes,
      features,
      suggestedFor,
      avgConsultationTime,
      modificationNotes,
    } = req.body;
    const adminId = (req as any).userId; // From auth middleware

    // Validate required fields
    if (!tier || !name || price === undefined || !patientLimit || !monthlyVideoMinutes) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: tier, name, price, patientLimit, monthlyVideoMinutes',
      });
    }

    // Check if plan with this tier already exists
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { tier },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: `A plan with tier "${tier}" already exists`,
      });
    }

    // Create new plan
    const plan = await prisma.subscriptionPlan.create({
      data: {
        tier,
        name,
        price,
        patientLimit,
        monthlyVideoMinutes,
        features: JSON.stringify(features || []),
        suggestedFor: suggestedFor ? JSON.stringify(suggestedFor) : null,
        avgConsultationTime,
        active: true,
        version: 1,
        effectiveFrom: new Date(),
        lastModifiedBy: adminId,
        modificationNotes: modificationNotes || 'Initial plan creation',
      },
    });

    res.status(201).json({
      success: true,
      message: `Subscription plan "${name}" created successfully`,
      data: { plan },
    });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription plan',
    });
  }
};

/**
 * Update a subscription plan
 * PUT /api/admin/subscription-plans/:planId
 * Admin only
 */
export const updatePlan = async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const {
      name,
      price,
      patientLimit,
      monthlyVideoMinutes,
      features,
      suggestedFor,
      avgConsultationTime,
      modificationNotes,
    } = req.body;
    const adminId = (req as any).userId; // From auth middleware

    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found',
      });
    }

    // Determine if we need to increment version
    // Increment if pricing or core features change
    let shouldIncrementVersion = false;

    if (
      price !== undefined && price !== existingPlan.price ||
      patientLimit !== undefined && patientLimit !== existingPlan.patientLimit ||
      monthlyVideoMinutes !== undefined && monthlyVideoMinutes !== existingPlan.monthlyVideoMinutes
    ) {
      shouldIncrementVersion = true;
    }

    // Update plan
    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: {
        name: name || existingPlan.name,
        price: price !== undefined ? price : existingPlan.price,
        patientLimit: patientLimit !== undefined ? patientLimit : existingPlan.patientLimit,
        monthlyVideoMinutes: monthlyVideoMinutes !== undefined ? monthlyVideoMinutes : existingPlan.monthlyVideoMinutes,
        features: features ? JSON.stringify(features) : existingPlan.features,
        suggestedFor: suggestedFor ? JSON.stringify(suggestedFor) : existingPlan.suggestedFor,
        avgConsultationTime: avgConsultationTime !== undefined ? avgConsultationTime : existingPlan.avgConsultationTime,
        version: shouldIncrementVersion ? existingPlan.version + 1 : existingPlan.version,
        effectiveFrom: shouldIncrementVersion ? new Date() : existingPlan.effectiveFrom,
        lastModifiedBy: adminId,
        modificationNotes: modificationNotes || (shouldIncrementVersion ? 'Plan updated with version increment' : 'Plan details updated'),
      },
    });

    res.json({
      success: true,
      message: `Subscription plan "${updatedPlan.name}" updated successfully${shouldIncrementVersion ? ' (version incremented)' : ''}`,
      data: {
        plan: updatedPlan,
        versionIncremented: shouldIncrementVersion,
      },
    });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update subscription plan',
    });
  }
};

/**
 * Deactivate a subscription plan
 * PUT /api/admin/subscription-plans/:planId/deactivate
 * Admin only
 */
export const deactivatePlan = async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found',
      });
    }

    if (!plan.active) {
      return res.status(400).json({
        success: false,
        error: 'Plan is already deactivated',
      });
    }

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: { active: false },
    });

    // Count active subscribers
    const activeSubscribers = await prisma.doctor.count({
      where: {
        subscriptionTier: plan.tier,
        subscriptionStatus: 'ACTIVE',
      },
    });

    res.json({
      success: true,
      message: `Subscription plan "${updatedPlan.name}" deactivated successfully`,
      data: {
        plan: updatedPlan,
        activeSubscribers,
        note: 'Existing subscriptions will continue until renewal',
      },
    });
  } catch (error) {
    console.error('Error deactivating subscription plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate subscription plan',
    });
  }
};

/**
 * Activate a subscription plan
 * PUT /api/admin/subscription-plans/:planId/activate
 * Admin only
 */
export const activatePlan = async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found',
      });
    }

    if (plan.active) {
      return res.status(400).json({
        success: false,
        error: 'Plan is already active',
      });
    }

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: { active: true },
    });

    res.json({
      success: true,
      message: `Subscription plan "${updatedPlan.name}" activated successfully`,
      data: { plan: updatedPlan },
    });
  } catch (error) {
    console.error('Error activating subscription plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate subscription plan',
    });
  }
};

/**
 * Grant features to a specific doctor (manual override)
 * PUT /api/admin/doctors/:doctorId/grant-features
 * Admin only
 */
export const grantFeaturesToDoctor = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const { patientLimit, monthlyVideoMinutes, extensionNotes } = req.body;

    if (!patientLimit && !monthlyVideoMinutes) {
      return res.status(400).json({
        success: false,
        error: 'At least one feature (patientLimit or monthlyVideoMinutes) must be provided',
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
      });
    }

    // Update doctor features
    const updateData: any = {};

    if (patientLimit !== undefined) {
      updateData.patientLimit = patientLimit;
    }

    if (monthlyVideoMinutes !== undefined) {
      updateData.monthlyVideoMinutes = monthlyVideoMinutes;
      updateData.totalMinutesUsed = 0; // Reset usage when granting new minutes
      updateData.lastResetDate = new Date();
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: updateData,
    });

    res.json({
      success: true,
      message: `Features granted to Dr. ${updatedDoctor.fullName}`,
      data: {
        doctor: {
          id: updatedDoctor.id,
          fullName: updatedDoctor.fullName,
          email: updatedDoctor.email,
          patientLimit: updatedDoctor.patientLimit,
          monthlyVideoMinutes: updatedDoctor.monthlyVideoMinutes,
        },
        granted: {
          patientLimit: patientLimit !== undefined,
          monthlyVideoMinutes: monthlyVideoMinutes !== undefined,
        },
        notes: extensionNotes || 'Manual feature grant by admin',
      },
    });
  } catch (error) {
    console.error('Error granting features to doctor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to grant features to doctor',
    });
  }
};

/**
 * Get plan version history with subscriber list
 * GET /api/admin/subscription-plans/:tier/history
 * Admin only
 */
export const getPlanHistory = async (req: Request, res: Response) => {
  try {
    const { tier } = req.params;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { tier },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found',
      });
    }

    // Get all subscription history for this tier
    const subscriptions = await prisma.doctorSubscriptionHistory.findMany({
      where: { tier },
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    // Get currently active subscribers
    const activeSubscribers = await prisma.doctor.findMany({
      where: {
        subscriptionTier: tier,
        subscriptionStatus: 'ACTIVE',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        subscriptionEndsAt: true,
        patientLimit: true,
        monthlyVideoMinutes: true,
      },
    });

    res.json({
      success: true,
      data: {
        currentPlan: plan,
        activeSubscribers: {
          count: activeSubscribers.length,
          doctors: activeSubscribers,
        },
        subscriptionHistory: {
          count: subscriptions.length,
          subscriptions,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching plan history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plan history',
    });
  }
};

/**
 * Fix subscription tier inconsistencies
 * POST /api/admin/subscription-plans/fix-inconsistencies
 * Admin only
 *
 * This endpoint checks if doctor's limits match their tier and fixes any mismatches
 */
export const fixSubscriptionInconsistencies = async (req: Request, res: Response) => {
  try {
    // Get all subscription plans
    const plans = await prisma.subscriptionPlan.findMany();
    const plansByTier = Object.fromEntries(plans.map(p => [p.tier, p]));

    // Get all doctors
    const doctors = await prisma.doctor.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        patientLimit: true,
        monthlyVideoMinutes: true,
      },
    });

    const inconsistencies: any[] = [];
    const fixes: any[] = [];

    for (const doctor of doctors) {
      const currentTierPlan = plansByTier[doctor.subscriptionTier];

      if (!currentTierPlan) continue;

      // Check if limits match the tier
      const limitsMatch =
        doctor.patientLimit === currentTierPlan.patientLimit &&
        doctor.monthlyVideoMinutes === currentTierPlan.monthlyVideoMinutes;

      if (!limitsMatch) {
        // Find which tier the current limits belong to
        let matchingTier = null;
        for (const [tier, plan] of Object.entries(plansByTier)) {
          if (
            plan.patientLimit === doctor.patientLimit &&
            plan.monthlyVideoMinutes === doctor.monthlyVideoMinutes
          ) {
            matchingTier = tier;
            break;
          }
        }

        inconsistencies.push({
          doctor: {
            id: doctor.id,
            fullName: doctor.fullName,
            email: doctor.email,
          },
          issue: {
            currentTier: doctor.subscriptionTier,
            currentLimits: {
              patientLimit: doctor.patientLimit,
              monthlyVideoMinutes: doctor.monthlyVideoMinutes,
            },
            expectedLimits: {
              patientLimit: currentTierPlan.patientLimit,
              monthlyVideoMinutes: currentTierPlan.monthlyVideoMinutes,
            },
            matchingTier,
          },
        });

        // Auto-fix: Update tier to match limits
        if (matchingTier) {
          await prisma.doctor.update({
            where: { id: doctor.id },
            data: { subscriptionTier: matchingTier },
          });

          fixes.push({
            doctorId: doctor.id,
            doctorEmail: doctor.email,
            action: `Updated tier from ${doctor.subscriptionTier} to ${matchingTier}`,
            reason: 'Limits matched different tier',
          });
        }
      }
    }

    res.json({
      success: true,
      message: `Found ${inconsistencies.length} inconsistencies, fixed ${fixes.length}`,
      data: {
        inconsistenciesFound: inconsistencies.length,
        fixesApplied: fixes.length,
        details: {
          inconsistencies,
          fixes,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fixing subscription inconsistencies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix subscription inconsistencies',
      details: error.message,
    });
  }
};
