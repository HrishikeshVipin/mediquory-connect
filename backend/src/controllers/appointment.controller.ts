import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Doctor Availability Management
export const getAvailability = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).doctor.id;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        availability: true,
        defaultSlotDuration: true,
      },
    });

    res.json({
      success: true,
      data: {
        availability: doctor?.availability || {},
        defaultSlotDuration: doctor?.defaultSlotDuration || 30,
      },
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ success: false, message: 'Failed to get availability' });
  }
};

export const updateAvailability = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).doctor.id;
    const { availability, defaultSlotDuration } = req.body;

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        availability: availability,
        defaultSlotDuration: defaultSlotDuration || 30,
      },
    });

    res.json({
      success: true,
      data: {
        availability: updated.availability,
        defaultSlotDuration: updated.defaultSlotDuration,
      },
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ success: false, message: 'Failed to update availability' });
  }
};

// Patient creates appointment request
export const createAppointmentRequest = async (req: Request, res: Response) => {
  try {
    const patientId = (req as any).patient?.id || (req as any).user?.id;
    const { doctorId, requestedDate, requestedTimePreference, reason, consultationType } = req.body;

    // Validation
    if (!doctorId || !requestedDate) {
      return res.status(400).json({ success: false, message: 'Doctor ID and requested date are required' });
    }

    // Check if doctor exists and is verified
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, status: true, defaultSlotDuration: true },
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    if (doctor.status !== 'VERIFIED') {
      return res.status(400).json({ success: false, message: 'Doctor is not verified' });
    }

    // Create appointment request
    const appointment = await prisma.appointment.create({
      data: {
        doctorId,
        patientId,
        requestedDate: new Date(requestedDate),
        requestedTimePreference: requestedTimePreference || null,
        reason: reason || null,
        consultationType: consultationType || 'VIDEO',
        duration: doctor.defaultSlotDuration,
        status: 'REQUESTED',
      },
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
          },
        },
        patient: {
          select: {
            id: true,
            fullName: true,
            age: true,
            gender: true,
          },
        },
      },
    });

    // TODO: Send notification to doctor
    // await notificationService.createNotification({
    //   recipientType: 'DOCTOR',
    //   recipientId: doctorId,
    //   type: 'APPOINTMENT_REQUESTED',
    //   title: 'New Appointment Request',
    //   message: `${appointment.patient.fullName} requested appointment`,
    // });

    res.json({
      success: true,
      data: appointment,
      message: 'Appointment request submitted successfully',
    });
  } catch (error) {
    console.error('Create appointment request error:', error);
    res.status(500).json({ success: false, message: 'Failed to create appointment request' });
  }
};

// Doctor gets pending requests
export const getPendingRequests = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).doctor.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          doctorId,
          status: 'REQUESTED',
        },
        include: {
          patient: {
            select: {
              id: true,
              fullName: true,
              age: true,
              gender: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: Number(limit),
      }),
      prisma.appointment.count({
        where: {
          doctorId,
          status: 'REQUESTED',
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to get pending requests' });
  }
};

// Doctor gets upcoming confirmed appointments
export const getUpcomingAppointments = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).doctor.id;

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        status: 'CONFIRMED',
        scheduledTime: {
          gte: new Date(),
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            age: true,
            gender: true,
            phone: true,
          },
        },
      },
      orderBy: {
        scheduledTime: 'asc',
      },
    });

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error('Get upcoming appointments error:', error);
    res.status(500).json({ success: false, message: 'Failed to get upcoming appointments' });
  }
};

// Doctor gets past appointments
export const getPastAppointments = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).doctor.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          doctorId,
          status: {
            in: ['COMPLETED', 'CANCELLED', 'REJECTED'],
          },
        },
        include: {
          patient: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: Number(limit),
      }),
      prisma.appointment.count({
        where: {
          doctorId,
          status: {
            in: ['COMPLETED', 'CANCELLED', 'REJECTED'],
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get past appointments error:', error);
    res.status(500).json({ success: false, message: 'Failed to get past appointments' });
  }
};

// Doctor accepts request and confirms specific time
export const acceptRequest = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).doctor.id;
    const { id } = req.params;
    const { scheduledTime, duration, message } = req.body;

    if (!scheduledTime) {
      return res.status(400).json({ success: false, message: 'Scheduled time is required' });
    }

    // Verify appointment belongs to doctor
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.doctorId !== doctorId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (appointment.status !== 'REQUESTED') {
      return res.status(400).json({ success: false, message: 'Appointment is not in requested status' });
    }

    // Update appointment
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        scheduledTime: new Date(scheduledTime),
        duration: duration || appointment.duration,
        status: 'CONFIRMED',
        respondedAt: new Date(),
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // TODO: Send notification to patient
    // await notificationService.createNotification({
    //   recipientType: 'PATIENT',
    //   recipientId: appointment.patientId,
    //   type: 'APPOINTMENT_CONFIRMED',
    //   title: 'Appointment Confirmed',
    //   message: `Your appointment is confirmed for ${scheduledTime}`,
    // });

    res.json({
      success: true,
      data: updated,
      message: 'Appointment confirmed successfully',
    });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept appointment request' });
  }
};

// Doctor proposes alternative time
export const proposeAlternative = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).doctor.id;
    const { id } = req.params;
    const { proposedTime, proposedMessage } = req.body;

    if (!proposedTime) {
      return res.status(400).json({ success: false, message: 'Proposed time is required' });
    }

    // Verify appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.doctorId !== doctorId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Update with proposal
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        proposedTime: new Date(proposedTime),
        proposedMessage: proposedMessage || null,
        status: 'PROPOSED_ALTERNATIVE',
        respondedAt: new Date(),
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // TODO: Send notification to patient

    res.json({
      success: true,
      data: updated,
      message: 'Alternative time proposed successfully',
    });
  } catch (error) {
    console.error('Propose alternative error:', error);
    res.status(500).json({ success: false, message: 'Failed to propose alternative time' });
  }
};

// Doctor rejects request
export const rejectRequest = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).doctor.id;
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    // Verify appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.doctorId !== doctorId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Update with rejection
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        rejectionReason,
        status: 'REJECTED',
        respondedAt: new Date(),
      },
    });

    // TODO: Send notification to patient

    res.json({
      success: true,
      data: updated,
      message: 'Appointment request rejected',
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject appointment request' });
  }
};

// Patient gets all appointments
export const getPatientAppointments = async (req: Request, res: Response) => {
  try {
    const patientId = (req as any).patient?.id || (req as any).user?.id;
    const { status, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { patientId };

    if (status) {
      where.status = { in: (status as string).split(',') };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          doctor: {
            select: {
              id: true,
              fullName: true,
              specialization: true,
              profilePhoto: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: Number(limit),
      }),
      prisma.appointment.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({ success: false, message: 'Failed to get appointments' });
  }
};

// Patient accepts proposed alternative
export const acceptProposal = async (req: Request, res: Response) => {
  try {
    const patientId = (req as any).patient?.id || (req as any).user?.id;
    const { id } = req.params;

    // Verify appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.patientId !== patientId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (appointment.status !== 'PROPOSED_ALTERNATIVE') {
      return res.status(400).json({ success: false, message: 'No proposal to accept' });
    }

    if (!appointment.proposedTime) {
      return res.status(400).json({ success: false, message: 'No proposed time found' });
    }

    // Accept proposal
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        scheduledTime: appointment.proposedTime,
        status: 'CONFIRMED',
      },
    });

    // TODO: Send notification to doctor

    res.json({
      success: true,
      data: updated,
      message: 'Appointment confirmed successfully',
    });
  } catch (error) {
    console.error('Accept proposal error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept proposal' });
  }
};

// Patient declines proposed alternative
export const declineProposal = async (req: Request, res: Response) => {
  try {
    const patientId = (req as any).patient?.id || (req as any).user?.id;
    const { id } = req.params;
    const { message } = req.body;

    // Verify appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.patientId !== patientId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (appointment.status !== 'PROPOSED_ALTERNATIVE') {
      return res.status(400).json({ success: false, message: 'No proposal to decline' });
    }

    // Decline proposal - return to REQUESTED
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'REQUESTED',
        proposedTime: null,
        proposedMessage: null,
      },
    });

    // TODO: Send notification to doctor

    res.json({
      success: true,
      data: updated,
      message: 'Proposal declined',
    });
  } catch (error) {
    console.error('Decline proposal error:', error);
    res.status(500).json({ success: false, message: 'Failed to decline proposal' });
  }
};

// Cancel appointment (either party)
export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).doctor?.id || (req as any).patient?.id || (req as any).user?.id;
    const userType = (req as any).doctor ? 'doctor' : 'patient';
    const { id } = req.params;
    const { cancellationReason } = req.body;

    // Verify appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check authorization
    const isAuthorized =
      (userType === 'doctor' && appointment.doctorId === userId) ||
      (userType === 'patient' && appointment.patientId === userId);

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (appointment.status !== 'CONFIRMED') {
      return res.status(400).json({ success: false, message: 'Only confirmed appointments can be cancelled' });
    }

    // Cancel appointment
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        rejectionReason: cancellationReason || `Cancelled by ${userType}`,
      },
    });

    // TODO: Send notification to other party

    res.json({
      success: true,
      data: updated,
      message: 'Appointment cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel appointment' });
  }
};
