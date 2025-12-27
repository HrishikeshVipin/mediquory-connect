import { Request, Response } from 'express';
import prisma from '../config/database';
import { socketService } from '../services/socket.service';

// Upload payment proof (patient)
export const uploadPaymentProof = async (req: Request, res: Response): Promise<void> => {
  try {
    const { consultationId } = req.params;
    const { amount } = req.body;
    const file = req.file;

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

    // Create or update payment confirmation
    const payment = await prisma.paymentConfirmation.upsert({
      where: { consultationId },
      update: {
        amount: parseFloat(amount),
        proofImagePath: file?.path || null,
      },
      create: {
        consultationId,
        amount: parseFloat(amount),
        proofImagePath: file?.path || null,
        confirmedByDoctor: false,
      },
    });

    // Emit real-time event to consultation room (notify doctor)
    socketService.emitPaymentMade(consultationId, {
      id: payment.id,
      amount: payment.amount,
      proofImagePath: payment.proofImagePath,
      confirmedByDoctor: payment.confirmedByDoctor,
      createdAt: payment.createdAt,
    });

    res.status(200).json({
      success: true,
      message: 'Payment proof uploaded successfully',
      data: { payment },
    });
  } catch (error: any) {
    console.error('Upload payment proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading payment proof',
      error: error.message,
    });
  }
};

// Confirm payment (doctor)
export const confirmPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { consultationId } = req.params;

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

    // Update payment confirmation
    const payment = await prisma.paymentConfirmation.update({
      where: { consultationId },
      data: {
        confirmedByDoctor: true,
        confirmedAt: new Date(),
      },
    });

    // Update consultation status to completed
    await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Emit real-time event to consultation room (notify patient)
    socketService.emitPaymentConfirmed(consultationId, {
      id: payment.id,
      amount: payment.amount,
      confirmedByDoctor: payment.confirmedByDoctor,
      confirmedAt: payment.confirmedAt,
    });

    // Emit consultation completed event
    socketService.emitConsultationCompleted(consultationId, {
      id: consultationId,
      status: 'COMPLETED',
    });

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      data: { payment },
    });
  } catch (error: any) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming payment',
      error: error.message,
    });
  }
};

// Get payment status
export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { consultationId } = req.params;

    const payment = await prisma.paymentConfirmation.findUnique({
      where: { consultationId },
    });

    res.status(200).json({
      success: true,
      data: { payment },
    });
  } catch (error: any) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment status',
      error: error.message,
    });
  }
};
