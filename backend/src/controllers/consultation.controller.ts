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

    // Verify patient belongs to this doctor
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        doctorId: doctorId,
      },
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient not found or access denied',
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

    res.status(200).json({
      success: true,
      data: { consultation },
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
      select: { id: true, doctorId: true },
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
    if (consultation.prescription && consultation.prescription.medications) {
      consultation.prescription.medications = JSON.parse(consultation.prescription.medications as any);
    }

    res.status(200).json({
      success: true,
      data: { consultation },
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

// End consultation
export const endConsultation = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = (req as any).user.id;
    const { consultationId } = req.params;

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
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Consultation ended successfully',
      data: { consultation: updatedConsultation },
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
        agoraPatientToken: true
      },
    });

    if (!consultation) {
      res.status(404).json({
        success: false,
        message: 'Consultation not found',
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
