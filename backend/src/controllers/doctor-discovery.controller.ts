import { Request, Response } from 'express';
import prisma from '../config/database';

// Search doctors with filters (public endpoint - no auth required)
export const searchDoctors = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search, // Search in name, specialization
      doctorType, // "ALLOPATHY" | "AYURVEDA" | "HOMEOPATHY"
      specialization,
      isOnline, // "true" | "false"
      minFee,
      maxFee,
      minRating,
      sortBy, // "rating" | "experience" | "fee" | "name"
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: any = {
      status: 'VERIFIED', // Only show verified doctors
    };

    // Text search in name and specialization
    if (search) {
      where.OR = [
        { fullName: { contains: search as string, mode: 'insensitive' } },
        { specialization: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Filter by doctor type
    if (doctorType) {
      where.doctorType = doctorType;
    }

    // Filter by specialization (exact match)
    if (specialization) {
      where.specialization = { contains: specialization as string, mode: 'insensitive' };
    }

    // Filter by online status
    if (isOnline === 'true') {
      where.isOnline = true;
    }

    // Filter by consultation fee range
    if (minFee || maxFee) {
      where.consultationFee = {};
      if (minFee) {
        where.consultationFee.gte = parseInt(minFee as string);
      }
      if (maxFee) {
        where.consultationFee.lte = parseInt(maxFee as string);
      }
    }

    // Filter by minimum rating
    if (minRating) {
      where.averageRating = {
        gte: parseFloat(minRating as string),
      };
    }

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' }; // Default: newest first

    if (sortBy === 'rating') {
      orderBy = [{ averageRating: 'desc' }, { totalReviews: 'desc' }];
    } else if (sortBy === 'experience') {
      orderBy = { yearsExperience: 'desc' };
    } else if (sortBy === 'fee') {
      orderBy = { consultationFee: 'asc' };
    } else if (sortBy === 'name') {
      orderBy = { fullName: 'asc' };
    }

    // Fetch doctors
    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          specialization: true,
          doctorType: true,
          subspecialty: true,
          languagesSpoken: true,
          yearsExperience: true,
          consultationFee: true,
          bio: true,
          profilePhoto: true,
          registrationType: true,
          registrationState: true,
          isOnline: true,
          lastSeen: true,
          totalReviews: true,
          averageRating: true,
          createdAt: true,
        },
      }),
      prisma.doctor.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        doctors,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    console.error('Search doctors error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search doctors',
    });
  }
};

// Get public doctor profile with reviews
export const getDoctorPublicProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;

    // Fetch doctor with reviews
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        specialization: true,
        doctorType: true,
        subspecialty: true,
        languagesSpoken: true,
        yearsExperience: true,
        consultationFee: true,
        bio: true,
        profilePhoto: true,
        registrationType: true,
        registrationState: true,
        registrationNo: true,
        isOnline: true,
        lastSeen: true,
        availability: true,
        totalReviews: true,
        averageRating: true,
        createdAt: true,
      },
    });

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    // Check if doctor is verified
    const fullDoctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { status: true },
    });

    if (fullDoctor?.status !== 'VERIFIED') {
      res.status(403).json({
        success: false,
        message: 'Doctor profile not available',
      });
      return;
    }

    // Fetch recent reviews (with consultation details)
    const reviews = await prisma.consultationReview.findMany({
      where: {
        consultation: {
          doctorId,
        },
      },
      include: {
        consultation: {
          select: {
            patient: {
              select: {
                fullName: true,
              },
            },
            completedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    // Calculate rating distribution
    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    res.json({
      success: true,
      data: {
        doctor,
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          reviewText: r.reviewText,
          patientName: r.consultation.patient.fullName,
          createdAt: r.createdAt,
        })),
        ratingDistribution,
      },
    });
  } catch (error: any) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get doctor profile',
    });
  }
};

// Update doctor online status (doctor only - requires auth)
export const updateOnlineStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isOnline } = req.body;
    const doctorId = (req as any).doctor?.id; // Assuming doctor auth middleware

    if (!doctorId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    if (typeof isOnline !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'isOnline must be a boolean',
      });
      return;
    }

    // Update doctor status
    const doctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        isOnline,
        lastSeen: new Date(),
      },
      select: {
        id: true,
        fullName: true,
        isOnline: true,
        lastSeen: true,
      },
    });

    res.json({
      success: true,
      message: `Status updated to ${isOnline ? 'online' : 'offline'}`,
      data: { doctor },
    });
  } catch (error: any) {
    console.error('Update online status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update status',
    });
  }
};

// Update doctor profile (doctor only - requires auth)
export const updateDoctorProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = (req as any).doctor?.id;

    if (!doctorId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    const {
      doctorType,
      subspecialty,
      languagesSpoken,
      yearsExperience,
      consultationFee,
      bio,
      availability,
    } = req.body;

    // Validate doctor type if provided
    if (doctorType && !['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY'].includes(doctorType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid doctor type. Must be ALLOPATHY, AYURVEDA, or HOMEOPATHY',
      });
      return;
    }

    // Update doctor profile
    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        ...(doctorType && { doctorType }),
        ...(subspecialty && { subspecialty }),
        ...(languagesSpoken && { languagesSpoken }),
        ...(yearsExperience && { yearsExperience: parseInt(yearsExperience) }),
        ...(consultationFee && { consultationFee: parseInt(consultationFee) }),
        ...(bio && { bio }),
        ...(availability && { availability }),
        profileComplete: true, // Mark as complete when they update
      },
      select: {
        id: true,
        fullName: true,
        specialization: true,
        doctorType: true,
        subspecialty: true,
        languagesSpoken: true,
        yearsExperience: true,
        consultationFee: true,
        bio: true,
        availability: true,
        profileComplete: true,
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { doctor: updated },
    });
  } catch (error: any) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile',
    });
  }
};

// Get available specializations (for dropdown/autocomplete)
export const getSpecializations = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get unique specializations from verified doctors
    const doctors = await prisma.doctor.findMany({
      where: {
        status: 'VERIFIED',
      },
      select: {
        specialization: true,
      },
      distinct: ['specialization'],
    });

    const specializations = doctors
      .map((d) => d.specialization)
      .filter((s) => s && s.trim().length > 0)
      .sort();

    res.json({
      success: true,
      data: { specializations },
    });
  } catch (error: any) {
    console.error('Get specializations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get specializations',
    });
  }
};
