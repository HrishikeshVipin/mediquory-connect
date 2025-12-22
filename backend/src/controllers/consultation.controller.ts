import { Request, Response } from 'express';
import prisma from '../config/database';
import { z } from 'zod';
import { generateConsultationTokens } from '../services/agora.service';

// Create or get active consultation
export const startConsultation = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = (req as any).user.id;
    const { patientId } = req.body;

    if (!patientId) {
      res.status(400).json({
        success: false,
        message: 'Patient ID is required',
      });
      return;
    }

    // Get doctor with subscription info
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        subscriptionStatus: true,
        subscriptionTier: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        monthlyVideoMinutes: true,
        purchasedMinutes: true,
        totalMinutesUsed: true,
      },
    });

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    // Check subscription status
    const now = new Date();
    if (doctor.subscriptionStatus === 'TRIAL') {
      const trialEnd = new Date(doctor.trialEndsAt);
      if (now > trialEnd) {
        res.status(403).json({
          success: false,
          message: 'Trial period expired. Please subscribe to continue consultations.',
          trialExpired: true,
        });
        return;
      }
    } else if (doctor.subscriptionStatus === 'EXPIRED' || doctor.subscriptionStatus === 'CANCELLED') {
      res.status(403).json({
        success: false,
        message: 'Subscription expired. Please renew to start consultations.',
        subscriptionExpired: true,
      });
      return;
    }

    // Check available video minutes (for information only - chat is always available)
    const availableMinutes =
      (doctor.monthlyVideoMinutes + doctor.purchasedMinutes) - doctor.totalMinutesUsed;

    // Verify patient belongs to this doctor
    // Note: Waitlisted patients CAN chat (limited features only)
    // Feature restrictions enforced at feature level (video, prescriptions, vitals)
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        doctorId: doctorId,
      },
      select: { id: true, status: true, fullName: true, doctorId: true, videoCallEnabled: true },
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient not found or does not belong to you',
      });
      return;
    }

    // Check if there's already an active consultation
    let consultation = await prisma.consultation.findFirst({
      where: {
        patientId: patientId,
        doctorId: doctorId,
        status: 'ACTIVE',
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            age: true,
            gender: true,
          },
        },
        chatMessages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
        prescription: true,
      },
    });

    // If no active consultation, create one
    if (!consultation) {
      consultation = await prisma.consultation.create({
        data: {
          patientId: patientId,
          doctorId: doctorId,
          status: 'ACTIVE',
        },
        include: {
          patient: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              age: true,
              gender: true,
            },
          },
          chatMessages: true,
          prescription: true,
        },
      });
    }

    // Parse medications JSON if prescription exists
    if (consultation.prescription && consultation.prescription.medications) {
      consultation.prescription.medications = JSON.parse(consultation.prescription.medications as any);
    }

    // Determine warning level based on available minutes
    let warningLevel: 'none' | 'low' | 'critical' = 'none';
    if (availableMinutes <= 50) {
      warningLevel = 'critical';
    } else if (availableMinutes <= 100) {
      warningLevel = 'low';
    }

    res.status(200).json({
      success: true,
      data: {
        consultation,
        availableMinutes,
        warningLevel,
      },
    });
  } catch (error: any) {
    console.error('Start consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting consultation',
      error: error.message,
    });
  }
};

// Get consultation details
export const getConsultation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { consultationId } = req.params;

    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            age: true,
            gender: true,
          },
        },
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
            profilePhoto: true,
          },
        },
        chatMessages: {
          orderBy: { createdAt: 'asc' },
        },
        prescription: true,
        paymentConfirmation: true,
      },
    });

    if (!consultation) {
      res.status(404).json({
        success: false,
        message: 'Consultation not found',
      });
      return;
    }

    // Parse medications JSON if prescription exists
    if (consultation.prescription && consultation.prescription.medications) {
      consultation.prescription.medications = JSON.parse(consultation.prescription.medications as any);
    }

    res.status(200).json({
      success: true,
      data: { consultation },
    });
  } catch (error: any) {
    console.error('Get consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching consultation',
      error: error.message,
    });
  }
};

// Get active consultation by patient token
export const getPatientConsultation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientToken } = req.params;

    // Find patient by token
    const patient = await prisma.patient.findUnique({
      where: { accessToken: patientToken },
      select: { id: true, doctorId: true, status: true, fullName: true },
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Invalid patient access token',
      });
      return;
    }

    // Get or create active consultation
    let consultation = await prisma.consultation.findFirst({
      where: {
        patientId: patient.id,
        status: 'ACTIVE',
      },
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
            profilePhoto: true,
            upiId: true,
            qrCodeImage: true,
          },
        },
        chatMessages: {
          orderBy: { createdAt: 'asc' },
        },
        prescription: true,
        paymentConfirmation: true,
      },
    });

    // Create new consultation if none exists
    if (!consultation) {
      // Check if patient has a doctor (link-based patients)
      if (!patient.doctorId) {
        res.status(400).json({
          success: false,
          message: 'This patient account is not linked to a doctor. Please use the patient app to book a consultation.',
        });
        return;
      }

      consultation = await prisma.consultation.create({
        data: {
          patientId: patient.id,
          doctorId: patient.doctorId,
          status: 'ACTIVE',
        },
        include: {
          doctor: {
            select: {
              id: true,
              fullName: true,
              specialization: true,
              profilePhoto: true,
              upiId: true,
              qrCodeImage: true,
            },
          },
          chatMessages: true,
          prescription: true,
          paymentConfirmation: true,
        },
      });
    }

    // Parse medications JSON if prescription exists
    if (consultation?.prescription && consultation.prescription.medications) {
      consultation.prescription.medications = JSON.parse(consultation.prescription.medications as any);
    }

    res.status(200).json({
      success: true,
      data: {
        consultation: {
          ...consultation,
          patient: {
            status: patient.status,
            fullName: patient.fullName,
          }
        }
      },
    });
  } catch (error: any) {
    console.error('Get patient consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching consultation',
      error: error.message,
    });
  }
};

// Update consultation duration in real-time (called every 30 seconds from frontend)
// NOTE: This is for reference only - billing is based on video duration
export const updateConsultationDuration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { consultationId } = req.params;
    const { duration } = req.body; // Duration in seconds

    if (!duration || typeof duration !== 'number') {
      res.status(400).json({
        success: false,
        message: 'Duration (in seconds) is required',
      });
      return;
    }

    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      res.status(404).json({
        success: false,
        message: 'Consultation not found',
      });
      return;
    }

    // Update total consultation duration (for reference only)
    await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        duration,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        duration,
      },
    });
  } catch (error: any) {
    console.error('Update consultation duration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating consultation duration',
      error: error.message,
    });
  }
};

// Update video call duration in real-time (ONLY video time counts toward billing)
export const updateVideoDuration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { consultationId } = req.params;
    const { videoDuration } = req.body; // Video duration in seconds

    if (videoDuration === undefined || typeof videoDuration !== 'number') {
      res.status(400).json({
        success: false,
        message: 'Video duration (in seconds) is required',
      });
      return;
    }

    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        doctor: {
          select: {
            id: true,
            monthlyVideoMinutes: true,
            purchasedMinutes: true,
            totalMinutesUsed: true,
          },
        },
      },
    });

    if (!consultation) {
      res.status(404).json({
        success: false,
        message: 'Consultation not found',
      });
      return;
    }

    // Calculate available minutes
    const availableMinutes =
      (consultation.doctor.monthlyVideoMinutes + consultation.doctor.purchasedMinutes) -
      consultation.doctor.totalMinutesUsed;

    const currentVideoMinutes = Math.ceil(videoDuration / 60);

    // Check if in overtime
    const inOvertime = currentVideoMinutes > availableMinutes;
    const overtimeMinutes = inOvertime ? currentVideoMinutes - availableMinutes : 0;

    // Update video duration and overtime status
    await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        videoDuration,
        wentOvertime: inOvertime,
        overtimeMinutes,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        videoDuration,
        currentVideoMinutes,
        availableMinutes,
        inOvertime,
        overtimeMinutes,
      },
    });
  } catch (error: any) {
    console.error('Update video duration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating video duration',
      error: error.message,
    });
  }
};

// End consultation and update doctor's total minutes used
// IMPORTANT: Only VIDEO duration counts toward billing
export const endConsultation = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = (req as any).user.id;
    const { consultationId } = req.params;
    const { duration, videoDuration } = req.body; // Total duration and video duration in seconds

    const consultation = await prisma.consultation.findFirst({
      where: {
        id: consultationId,
        doctorId: doctorId,
      },
    });

    if (!consultation) {
      res.status(404).json({
        success: false,
        message: 'Consultation not found or access denied',
      });
      return;
    }

    // Calculate video minutes used (ONLY video time counts toward billing)
    // Use provided videoDuration or fall back to stored videoDuration
    const finalVideoDuration = videoDuration ?? consultation.videoDuration ?? 0;
    const videoMinutesUsed = Math.ceil(finalVideoDuration / 60);

    // Update consultation status and durations
    const updatedConsultation = await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        duration: duration || consultation.duration || 0, // Total time (for reference)
        videoDuration: finalVideoDuration, // Video time (for billing)
      },
    });

    // Update doctor's total minutes used (ONLY video minutes)
    if (videoMinutesUsed > 0) {
      await prisma.doctor.update({
        where: { id: doctorId },
        data: {
          totalMinutesUsed: {
            increment: videoMinutesUsed,
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Consultation ended successfully',
      data: {
        consultation: updatedConsultation,
        minutesUsed: videoMinutesUsed, // Video minutes only
        totalDuration: updatedConsultation.duration,
        videoDuration: finalVideoDuration,
      },
    });
  } catch (error: any) {
    console.error('End consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending consultation',
      error: error.message,
    });
  }
};

// Save chat message
export const saveChatMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { consultationId, senderType, message } = req.body;

    if (!consultationId || !senderType || !message) {
      res.status(400).json({
        success: false,
        message: 'Consultation ID, sender type, and message are required',
      });
      return;
    }

    const chatMessage = await prisma.chatMessage.create({
      data: {
        consultationId,
        senderType,
        message,
        isRead: false, // Default to unread
      },
    });

    // Update consultation last message tracking
    await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        lastMessageAt: new Date(),
        lastMessageSender: senderType,
        hasUnreadMessages: senderType === 'patient', // Set true if patient sent message
      },
    });

    res.status(201).json({
      success: true,
      data: { message: chatMessage },
    });
  } catch (error: any) {
    console.error('Save chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving message',
      error: error.message,
    });
  }
};

// Get chat history
export const getChatHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { consultationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await prisma.chatMessage.findMany({
      where: { consultationId },
      orderBy: { createdAt: 'asc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.status(200).json({
      success: true,
      data: { messages },
    });
  } catch (error: any) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat history',
      error: error.message,
    });
  }
};

// Update consultation notes (doctor only)
export const updateConsultationNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = (req as any).user.id;
    const { consultationId } = req.params;
    const { chiefComplaint, doctorNotes } = req.body;

    const consultation = await prisma.consultation.findFirst({
      where: {
        id: consultationId,
        doctorId: doctorId,
      },
    });

    if (!consultation) {
      res.status(404).json({
        success: false,
        message: 'Consultation not found or access denied',
      });
      return;
    }

    const updatedConsultation = await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        chiefComplaint,
        doctorNotes,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Notes updated successfully',
      data: { consultation: updatedConsultation },
    });
  } catch (error: any) {
    console.error('Update consultation notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notes',
      error: error.message,
    });
  }
};

// Generate Agora tokens for video consultation
export const generateVideoTokens = async (req: Request, res: Response): Promise<void> => {
  try {
    const { consultationId } = req.params;

    // Verify consultation exists
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      select: {
        id: true,
        status: true,
        agoraChannelName: true,
        agoraDoctorToken: true,
        agoraPatientToken: true,
        patient: {
          select: {
            status: true,
            fullName: true,
            videoCallEnabled: true,
          },
        },
      },
    });

    if (!consultation) {
      res.status(404).json({
        success: false,
        message: 'Consultation not found',
      });
      return;
    }

    // Block waitlisted patients from video calls
    if (consultation.patient.status === 'WAITLISTED') {
      res.status(403).json({
        success: false,
        message: `Video call not available. ${consultation.patient.fullName} is on the waiting list. Please activate them first.`,
      });
      return;
    }

    // Check if video is enabled for this patient
    if (!consultation.patient.videoCallEnabled) {
      res.status(403).json({
        success: false,
        message: 'Video call is not enabled for this patient.',
      });
      return;
    }

    if (consultation.status !== 'ACTIVE') {
      res.status(400).json({
        success: false,
        message: 'Consultation is not active',
      });
      return;
    }

    // Check if tokens already exist and are still valid
    if (consultation.agoraChannelName && consultation.agoraDoctorToken && consultation.agoraPatientToken) {
      // Return existing tokens
      const [doctorUid, patientUid] = consultation.agoraChannelName.split('_').slice(-2).map(Number);

      res.status(200).json({
        success: true,
        data: {
          channelName: consultationId,
          appId: process.env.AGORA_APP_ID,
          doctor: {
            token: consultation.agoraDoctorToken,
            uid: doctorUid || 1000000,
          },
          patient: {
            token: consultation.agoraPatientToken,
            uid: patientUid || 2000000,
          },
        },
      });
      return;
    }

    // Generate new Agora tokens
    const tokens = generateConsultationTokens(consultationId);

    // Save tokens to database
    await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        agoraChannelName: `${consultationId}_${tokens.doctor.uid}_${tokens.patient.uid}`,
        agoraDoctorToken: tokens.doctor.token,
        agoraPatientToken: tokens.patient.token,
      },
    });

    res.status(200).json({
      success: true,
      data: tokens,
    });
  } catch (error: any) {
    console.error('Generate video tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating video tokens',
      error: error.message,
    });
  }
};

/**
 * Mark messages as read for a consultation
 * PUT /api/consultations/:consultationId/mark-read
 * Doctor only (marks patient messages as read)
 */
export const markMessagesAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { consultationId } = req.params;
    const doctorId = (req as any).user.id;

    // Verify consultation belongs to doctor
    const consultation = await prisma.consultation.findFirst({
      where: {
        id: consultationId,
        doctor: { id: doctorId },
      },
    });

    if (!consultation) {
      res.status(404).json({
        success: false,
        message: 'Consultation not found',
      });
      return;
    }

    // Mark all patient messages as read
    await prisma.chatMessage.updateMany({
      where: {
        consultationId,
        senderType: 'patient',
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Update consultation unread flag
    await prisma.consultation.update({
      where: { id: consultationId },
      data: { hasUnreadMessages: false },
    });

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error: any) {
    console.error('Mark messages read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read',
      error: error.message,
    });
  }
};

/**
 * Get consultations with unread messages for doctor
 * GET /api/consultations/unread
 * Doctor only
 */
export const getUnreadConsultations = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = (req as any).user.id;

    const consultations = await prisma.consultation.findMany({
      where: {
        doctor: { id: doctorId },
        hasUnreadMessages: true,
        status: 'ACTIVE',  // Only active consultations
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            status: true,
          },
        },
        chatMessages: {
          where: {
            senderType: 'patient',
            isRead: false,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,  // Get last unread message
          select: {
            id: true,
            message: true,
            createdAt: true,
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    const unreadChats = consultations.map(consultation => ({
      consultationId: consultation.id,
      patient: consultation.patient,
      lastMessage: consultation.chatMessages[0],
      unreadCount: consultation.chatMessages.length,
    }));

    res.status(200).json({
      success: true,
      data: {
        unreadChats,
        totalUnread: unreadChats.length,
      },
    });
  } catch (error: any) {
    console.error('Get unread consultations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread consultations',
      error: error.message,
    });
  }
};
