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

    // Create prescription
    const prescription = await prisma.prescription.create({
      data: {
        consultationId,
        doctorId: consultation.doctorId,
        diagnosis,
        medications: JSON.stringify(medications || []),
        instructions: instructions || null,
      },
    });

    // Generate PDF
    const pdfPath = await generatePrescriptionPDF(prescription.id, consultation, diagnosis, medications, instructions);

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
  prescriptionId: string,
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

      const fileName = `prescription_${prescriptionId}_${Date.now()}.pdf`;
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
