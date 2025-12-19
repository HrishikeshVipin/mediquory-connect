import { Request, Response } from 'express';
import prisma from '../config/database';
import { doctorVerificationSchema, validateDoctorVerification, maskAadhaar } from '../utils/validators';
import { notificationService } from '../services/notification.service';

// Get platform statistics
export const getPlatformStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalDoctors,
      verifiedDoctors,
      pendingDoctors,
      rejectedDoctors,
      suspendedDoctors,
      totalPatients,
      totalConsultations,
      activeDoctors,
    ] = await Promise.all([
      prisma.doctor.count(),
      prisma.doctor.count({ where: { status: 'VERIFIED' } }),
      prisma.doctor.count({ where: { status: 'PENDING_VERIFICATION' } }),
      prisma.doctor.count({ where: { status: 'REJECTED' } }),
      prisma.doctor.count({ where: { status: 'SUSPENDED' } }),
      prisma.patient.count(),
      prisma.consultation.count(),
      prisma.doctor.count({
        where: {
          status: 'VERIFIED',
          subscriptionStatus: {
            in: ['TRIAL', 'ACTIVE'],
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          doctors: {
            total: totalDoctors,
            verified: verifiedDoctors,
            pending: pendingDoctors,
            rejected: rejectedDoctors,
            suspended: suspendedDoctors,
            active: activeDoctors,
          },
          patients: totalPatients,
          consultations: totalConsultations,
        },
      },
    });
  } catch (error: any) {
    console.error('Get platform stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching platform statistics',
      error: error.message,
    });
  }
};

// Get all doctors with filters
export const getAllDoctors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, subscriptionStatus, search, page = 1, limit = 10 } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (subscriptionStatus) {
      where.subscriptionStatus = subscriptionStatus;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search as string } },
        { email: { contains: search as string } },
        { phone: { contains: search as string } },
        { registrationNo: { contains: search as string } },
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          specialization: true,
          registrationType: true,
          registrationNo: true,
          registrationState: true,
          status: true,
          subscriptionStatus: true,
          trialEndsAt: true,
          subscriptionEndsAt: true,
          patientsCreated: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.doctor.count({ where }),
    ]);

    res.status(200).json({
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
    console.error('Get all doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctors',
      error: error.message,
    });
  }
};

// Get pending doctors (for verification)
export const getPendingDoctors = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { status: 'PENDING_VERIFICATION' },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        specialization: true,
        registrationType: true,
        registrationNo: true,
        registrationState: true,
        aadhaarNumber: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mask Aadhaar numbers
    const doctorsWithMaskedAadhaar = doctors.map((doctor) => ({
      ...doctor,
      aadhaarNumber: maskAadhaar(doctor.aadhaarNumber),
    }));

    res.status(200).json({
      success: true,
      data: {
        doctors: doctorsWithMaskedAadhaar,
        count: doctors.length,
      },
    });
  } catch (error: any) {
    console.error('Get pending doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending doctors',
      error: error.message,
    });
  }
};

// Get doctor details by ID (with full info including documents)
export const getDoctorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        specialization: true,
        registrationType: true,
        registrationNo: true,
        registrationState: true,
        aadhaarNumber: true,
        registrationCertificate: true,
        aadhaarFrontPhoto: true,
        aadhaarBackPhoto: true,
        profilePhoto: true,
        status: true,
        rejectionReason: true,
        upiId: true,
        qrCodeImage: true,
        trialStartDate: true,
        trialEndsAt: true,
        patientsCreated: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        razorpaySubscriptionId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            patients: true,
            consultations: true,
            prescriptions: true,
          },
        },
      },
    });

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    // Return doctor details with full Aadhaar (admin needs it for verification)
    res.status(200).json({
      success: true,
      data: { doctor },
    });
  } catch (error: any) {
    console.error('Get doctor by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor details',
      error: error.message,
    });
  }
};

// Verify doctor (approve)
export const verifyDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, status: true, email: true, fullName: true },
    });

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    if (doctor.status === 'VERIFIED') {
      res.status(400).json({
        success: false,
        message: 'Doctor is already verified',
      });
      return;
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        status: 'VERIFIED',
        rejectionReason: null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        emailNotifications: true,
        updatedAt: true,
      },
    });

    // Send notification to doctor
    await notificationService.createNotification({
      recipientType: 'DOCTOR',
      recipientId: updatedDoctor.id,
      type: 'DOCTOR_VERIFIED',
      title: '✅ Registration Approved',
      message: 'Your registration has been approved. You can now start using Bhishak Med.',
      actionUrl: '/doctor/dashboard',
      actionText: 'Go to Dashboard',
      metadata: { doctorName: updatedDoctor.fullName },
      sendEmail: updatedDoctor.emailNotifications,
      recipientEmail: updatedDoctor.email,
    });

    res.status(200).json({
      success: true,
      message: 'Doctor verified successfully',
      data: { doctor: updatedDoctor },
    });
  } catch (error: any) {
    console.error('Verify doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying doctor',
      error: error.message,
    });
  }
};

// Reject doctor
export const rejectDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;
    const validatedData = doctorVerificationSchema.parse({
      action: 'reject',
      ...req.body,
    });

    validateDoctorVerification(validatedData);

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, status: true, email: true, fullName: true },
    });

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        status: 'REJECTED',
        rejectionReason: validatedData.rejectionReason,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        rejectionReason: true,
        emailNotifications: true,
        updatedAt: true,
      },
    });

    // Send notification to doctor
    await notificationService.createNotification({
      recipientType: 'DOCTOR',
      recipientId: updatedDoctor.id,
      type: 'DOCTOR_REJECTED',
      title: '❌ Registration Update',
      message: `Your registration was not approved. Reason: ${validatedData.rejectionReason}`,
      metadata: { doctorName: updatedDoctor.fullName, reason: validatedData.rejectionReason },
      sendEmail: updatedDoctor.emailNotifications,
      recipientEmail: updatedDoctor.email,
    });

    res.status(200).json({
      success: true,
      message: 'Doctor rejected',
      data: { doctor: updatedDoctor },
    });
  } catch (error: any) {
    console.error('Reject doctor error:', error);

    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error rejecting doctor',
        error: error.message,
      });
    }
  }
};

// Suspend doctor
export const suspendDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;
    const { reason } = req.body;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, status: true, email: true, fullName: true },
    });

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        status: 'SUSPENDED',
        rejectionReason: reason || 'Account suspended by admin',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        rejectionReason: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Doctor suspended',
      data: { doctor: updatedDoctor },
    });
  } catch (error: any) {
    console.error('Suspend doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error suspending doctor',
      error: error.message,
    });
  }
};

// Reactivate doctor
export const reactivateDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, status: true, email: true, fullName: true },
    });

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    if (doctor.status !== 'SUSPENDED') {
      res.status(400).json({
        success: false,
        message: 'Only suspended doctors can be reactivated',
      });
      return;
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        status: 'VERIFIED',
        rejectionReason: null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Doctor reactivated successfully',
      data: { doctor: updatedDoctor },
    });
  } catch (error: any) {
    console.error('Reactivate doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reactivating doctor',
      error: error.message,
    });
  }
};

// Update doctor subscription manually
export const updateDoctorSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;
    const { subscriptionStatus, subscriptionEndsAt } = req.body;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, email: true, fullName: true },
    });

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    const updateData: any = {};

    if (subscriptionStatus) {
      updateData.subscriptionStatus = subscriptionStatus;
    }

    if (subscriptionEndsAt) {
      updateData.subscriptionEndsAt = new Date(subscriptionEndsAt);
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      data: { doctor: updatedDoctor },
    });
  } catch (error: any) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating subscription',
      error: error.message,
    });
  }
};
