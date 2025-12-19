import { Request, Response } from 'express';
import prisma from '../config/database';
import { z } from 'zod';

// Validation schema for review submission
const reviewSchema = z.object({
  consultationId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  reviewText: z.string().optional()
});

/**
 * Submit review for a completed consultation (called by patient)
 */
export const submitReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = reviewSchema.parse(req.body);
    const { consultationId, rating, reviewText } = validatedData;

    // Verify consultation exists and is completed
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      select: {
        id: true,
        status: true,
        completedAt: true
      }
    });

    if (!consultation) {
      res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
      return;
    }

    if (consultation.status !== 'COMPLETED') {
      res.status(400).json({
        success: false,
        message: 'Can only review completed consultations'
      });
      return;
    }

    // Check if review already exists
    const existingReview = await prisma.consultationReview.findUnique({
      where: { consultationId }
    });

    if (existingReview) {
      res.status(400).json({
        success: false,
        message: 'Review already submitted for this consultation'
      });
      return;
    }

    // Create review
    const review = await prisma.consultationReview.create({
      data: {
        consultationId,
        rating,
        reviewText
      }
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback!',
      data: { review }
    });
  } catch (error: any) {
    console.error('Submit review error:', error);

    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Invalid input. Rating must be between 1-5.',
        errors: error.errors
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error submitting review',
      error: error.message
    });
  }
};

/**
 * Get all reviews for a doctor (with statistics)
 */
export const getDoctorReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = (req as any).user.id;
    const { limit = 20, offset = 0 } = req.query;

    const reviews = await prisma.consultationReview.findMany({
      where: {
        consultation: {
          doctorId
        }
      },
      include: {
        consultation: {
          select: {
            id: true,
            completedAt: true,
            patient: {
              select: {
                fullName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    // Calculate statistics
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Rating distribution
    const distribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    res.status(200).json({
      success: true,
      data: {
        reviews,
        stats: {
          totalReviews,
          averageRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
          distribution
        }
      }
    });
  } catch (error: any) {
    console.error('Get doctor reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

/**
 * Get review for a specific consultation
 */
export const getConsultationReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { consultationId } = req.params;

    const review = await prisma.consultationReview.findUnique({
      where: { consultationId },
      include: {
        consultation: {
          select: {
            id: true,
            completedAt: true,
            patient: {
              select: {
                fullName: true
              }
            }
          }
        }
      }
    });

    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Review not found for this consultation'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { review }
    });
  } catch (error: any) {
    console.error('Get consultation review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review',
      error: error.message
    });
  }
};
