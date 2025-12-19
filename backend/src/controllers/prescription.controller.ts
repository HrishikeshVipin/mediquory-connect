import { Request, Response } from 'express';
import prisma from '../config/database';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Create prescription
export const createPrescription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { consultationId } = req.params;
    const { diagnosis, medications, instructions } = req.body;

    // Verify consultation exists and belongs to doctor
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
            registrationNo: true,
            phone: true,
          },
        },
        patient: {
          select: {
            id: true,
            fullName: true,
            age: true,
            gender: true,
            status: true,
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

    // Block prescription creation for waitlisted patients
    if (consultation.patient.status === 'WAITLISTED') {
      res.status(403).json({
        success: false,
        message: `Cannot create prescription. ${consultation.patient.fullName} is on the waiting list.`,
      });
      return;
    }

    // Check if prescription already exists
    const existingPrescription = await prisma.prescription.findUnique({
      where: { consultationId },
    });

    if (existingPrescription) {
      res.status(400).json({
        success: false,
        message: 'Prescription already exists for this consultation',
      });
      return;
    }

    // Create prescription with atomic serial number generation
    const prescription = await prisma.$transaction(async (tx) => {
      // 1. Increment doctor's serial number atomically
      const updatedDoctor = await tx.doctor.update({
        where: { id: consultation.doctorId },
        data: { lastPrescriptionSerial: { increment: 1 } },
        select: { lastPrescriptionSerial: true },
      });

      // 2. Create prescription with new serial number
      return await tx.prescription.create({
        data: {
          consultationId,
          doctorId: consultation.doctorId,
          serialNumber: updatedDoctor.lastPrescriptionSerial,
          diagnosis,
          medications: JSON.stringify(medications || []),
          instructions: instructions || null,
        },
      });
    });

    // Generate PDF
    const pdfPath = await generatePrescriptionPDF(prescription, consultation, diagnosis, medications, instructions);

    // Update prescription with PDF path
    const updatedPrescription = await prisma.prescription.update({
      where: { id: prescription.id },
      data: { pdfPath },
    });

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: { prescription: updatedPrescription },
    });
  } catch (error: any) {
    console.error('Create prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating prescription',
      error: error.message,
    });
  }
};

// Get prescription by consultation ID
export const getPrescription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { consultationId } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { consultationId },
      include: {
        doctor: {
          select: {
            fullName: true,
            specialization: true,
            registrationNo: true,
          },
        },
      },
    });

    if (!prescription) {
      res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
      return;
    }

    // Parse medications JSON string back to array
    const prescriptionWithParsedData = {
      ...prescription,
      medications: JSON.parse(prescription.medications),
    };

    res.status(200).json({
      success: true,
      data: { prescription: prescriptionWithParsedData },
    });
  } catch (error: any) {
    console.error('Get prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching prescription',
      error: error.message,
    });
  }
};

// Generate prescription PDF
async function generatePrescriptionPDF(
  prescription: any,
  consultation: any,
  diagnosis: string,
  medications: any[],
  instructions: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create uploads/prescriptions directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'prescriptions');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `prescription_${prescription.id}_${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      const relativePath = `uploads/prescriptions/${fileName}`;

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('MEDICAL PRESCRIPTION', { align: 'center' })
        .moveDown();

      // Serial Number (top-right)
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`Prescription #${prescription.serialNumber}`, { align: 'right' })
        .moveDown();

      // Doctor Info
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`Dr. ${consultation.doctor.fullName}`)
        .font('Helvetica')
        .text(consultation.doctor.specialization)
        .text(`Reg. No: ${consultation.doctor.registrationNo}`)
        .text(`Phone: ${consultation.doctor.phone}`)
        .moveDown();

      // Date
      doc
        .fontSize(10)
        .text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' })
        .moveDown();

      // Patient Info
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Patient Information:')
        .font('Helvetica')
        .text(`Name: ${consultation.patient.fullName}`)
        .text(`Age: ${consultation.patient.age || 'N/A'} | Gender: ${consultation.patient.gender || 'N/A'}`)
        .moveDown();

      // Diagnosis
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Diagnosis:')
        .font('Helvetica')
        .text(diagnosis)
        .moveDown();

      // Medications
      if (medications && medications.length > 0) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Medications:')
          .moveDown(0.5);

        medications.forEach((med: any, index: number) => {
          doc
            .font('Helvetica-Bold')
            .text(`${index + 1}. ${med.name}`)
            .font('Helvetica')
            .text(`   Dosage: ${med.dosage}`)
            .text(`   Frequency: ${med.frequency}`)
            .text(`   Duration: ${med.duration}`)
            .moveDown(0.5);
        });
      }

      // Instructions
      if (instructions) {
        doc
          .moveDown()
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Instructions:')
          .font('Helvetica')
          .text(instructions)
          .moveDown();
      }

      // Footer
      doc
        .moveDown(2)
        .fontSize(8)
        .text(`Prescription #${prescription.serialNumber} | Generated on ${new Date().toLocaleString()}`, { align: 'left' })
        .moveDown()
        .fontSize(10)
        .text('_________________________', { align: 'right' })
        .text(`Dr. ${consultation.doctor.fullName}`, { align: 'right' })
        .text('Doctor\'s Signature', { align: 'right' });

      doc.end();

      stream.on('finish', () => {
        resolve(relativePath);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Download prescription PDF
export const downloadPrescription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        consultation: {
          include: {
            paymentConfirmation: true,
          },
        },
      },
    });

    if (!prescription || !prescription.pdfPath) {
      res.status(404).json({
        success: false,
        message: 'Prescription PDF not found',
      });
      return;
    }

    // Check if payment is confirmed
    if (!prescription.consultation.paymentConfirmation?.confirmedByDoctor) {
      res.status(403).json({
        success: false,
        message: 'Prescription can only be downloaded after payment confirmation',
      });
      return;
    }

    const filePath = path.join(process.cwd(), prescription.pdfPath);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: 'Prescription file not found on server',
      });
      return;
    }

    res.download(filePath, `prescription_${prescriptionId}.pdf`);
  } catch (error: any) {
    console.error('Download prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading prescription',
      error: error.message,
    });
  }
};

// Get patient consultation history with prescriptions
export const getPatientConsultationHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const doctorId = (req as any).doctorId; // From auth middleware

    console.log('[DEBUG] Fetching patient history - Doctor:', doctorId, 'Patient:', patientId);

    // Verify patient belongs to this doctor
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      console.log('[ERROR] Patient not found:', patientId);
      res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
      return;
    }

    if (patient.doctorId !== doctorId) {
      console.log('[ERROR] Patient ownership mismatch. Patient doctorId:', patient.doctorId, 'Authenticated doctorId:', doctorId);
      res.status(403).json({
        success: false,
        message: 'Access denied: This patient does not belong to you',
      });
      return;
    }

    // Get all COMPLETED consultations with prescriptions
    const consultations = await prisma.consultation.findMany({
      where: {
        patientId,
        status: 'COMPLETED',
      },
      include: {
        prescription: {
          include: {
            doctor: {
              select: {
                fullName: true,
                specialization: true,
              },
            },
          },
        },
        paymentConfirmation: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter consultations that have prescriptions and parse medications
    const consultationsWithPrescriptions = consultations
      .filter((c) => c.prescription)
      .map((consultation) => ({
        id: consultation.id,
        date: consultation.createdAt,
        completedAt: consultation.completedAt,
        duration: consultation.duration,
        prescription: {
          id: consultation.prescription!.id,
          serialNumber: consultation.prescription!.serialNumber,
          diagnosis: consultation.prescription!.diagnosis,
          medications: JSON.parse(consultation.prescription!.medications),
          instructions: consultation.prescription!.instructions,
          createdAt: consultation.prescription!.createdAt,
          doctor: consultation.prescription!.doctor,
        },
        paymentConfirmed: consultation.paymentConfirmation?.confirmedByDoctor || false,
      }));

    res.status(200).json({
      success: true,
      data: {
        patient: {
          id: patient.id,
          fullName: patient.fullName,
        },
        consultations: consultationsWithPrescriptions,
        count: consultationsWithPrescriptions.length,
      },
    });
  } catch (error: any) {
    console.error('Get patient consultation history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching consultation history',
      error: error.message,
    });
  }
};

// Copy prescription medications for reuse
export const copyPrescriptionMedications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prescriptionId } = req.params;
    const doctorId = (req as any).doctorId; // From auth middleware

    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        consultation: {
          include: {
            patient: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!prescription) {
      res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
      return;
    }

    // Verify prescription belongs to this doctor
    if (prescription.doctorId !== doctorId) {
      res.status(403).json({
        success: false,
        message: 'Access denied: This prescription does not belong to you',
      });
      return;
    }

    // Return medications and diagnosis for copying
    res.status(200).json({
      success: true,
      message: 'Prescription data ready for copying',
      data: {
        prescription: {
          id: prescription.id,
          serialNumber: prescription.serialNumber,
          diagnosis: prescription.diagnosis,
          medications: JSON.parse(prescription.medications),
          instructions: prescription.instructions,
          patientName: prescription.consultation.patient.fullName,
          createdAt: prescription.createdAt,
        },
        note: 'This data can be used to pre-fill a new prescription form',
      },
    });
  } catch (error: any) {
    console.error('Copy prescription medications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error copying prescription',
      error: error.message,
    });
  }
};
