import { Request, Response } from 'express';
import path from 'path';
import prisma from '../config/database';

// Create or update patient vitals
export const saveVitals = async (req: Request, res: Response): Promise<void> => {
  try {
    // Use patientId from middleware (validated via access token), not from URL params
    const patientId = (req as any).patientId;
    const { weight, height, bloodPressure, temperature, heartRate, oxygenLevel, notes } = req.body;

    if (!patientId) {
      res.status(401).json({
        success: false,
        message: 'Patient authentication required',
      });
      return;
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        status: true,
        fullName: true,
        doctorId: true,
      },
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
      return;
    }

    // Block vitals recording for waitlisted patients
    if (patient.status === 'WAITLISTED') {
      res.status(403).json({
        success: false,
        message: 'Cannot record vitals for waitlisted patients.',
      });
      return;
    }

    // Create new vitals record
    const vitals = await prisma.vitals.create({
      data: {
        patientId,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        bloodPressure: bloodPressure || null,
        temperature: temperature ? parseFloat(temperature) : null,
        heartRate: heartRate ? parseInt(heartRate) : null,
        oxygenLevel: oxygenLevel ? parseInt(oxygenLevel) : null,
        notes: notes || null,
      },
    });

    // Emit real-time notification to doctor
    const io = (req as any).io;
    if (io && patient.doctorId) {
      io.to(`doctor-${patient.doctorId}`).emit('vitals-uploaded', {
        patientId,
        patientName: patient.fullName,
        timestamp: new Date(),
      });
    }

    res.status(201).json({
      success: true,
      message: 'Vitals saved successfully',
      data: { vitals },
    });
  } catch (error: any) {
    console.error('Save vitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving vitals',
      error: error.message,
    });
  }
};

// Get patient vitals history
export const getVitalsHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if request is from doctor (has doctorId) or patient (has patientId from middleware)
    const patientId = (req as any).patientId || req.params.patientId;

    if (!patientId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const vitals = await prisma.vitals.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: { vitals },
    });
  } catch (error: any) {
    console.error('Get vitals history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vitals history',
      error: error.message,
    });
  }
};

// Upload medical files
export const uploadMedicalFile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Use patientId from middleware (validated via access token), not from URL params
    const patientId = (req as any).patientId;
    const { description } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!patientId) {
      res.status(401).json({
        success: false,
        message: 'Patient authentication required',
      });
      return;
    }

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
      return;
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        fullName: true,
        doctorId: true,
      },
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
      return;
    }

    // Save all file info to database (convert absolute paths to relative)
    const uploadedFiles = await Promise.all(
      files.map((file, index) =>
        prisma.medicalUpload.create({
          data: {
            patientId,
            filePath: path.relative(process.cwd(), file.path).replace(/\\/g, '/'),
            fileType: file.mimetype,
            fileName: file.originalname,
            description: description || `Medical record page ${index + 1}`,
          },
        })
      )
    );

    // Emit real-time notification to doctor
    const io = (req as any).io;
    if (io && patient.doctorId) {
      io.to(`doctor-${patient.doctorId}`).emit('medical-records-uploaded', {
        patientId,
        patientName: patient.fullName,
        fileCount: uploadedFiles.length,
        timestamp: new Date(),
      });
    }

    res.status(201).json({
      success: true,
      message: `${files.length} file(s) uploaded successfully`,
      data: { files: uploadedFiles },
    });
  } catch (error: any) {
    console.error('Upload medical file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading files',
      error: error.message,
    });
  }
};

// Get patient medical files
export const getMedicalFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if request is from doctor (has doctorId) or patient (has patientId from middleware)
    const patientId = (req as any).patientId || req.params.patientId;

    if (!patientId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const files = await prisma.medicalUpload.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: { files },
    });
  } catch (error: any) {
    console.error('Get medical files error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching medical files',
      error: error.message,
    });
  }
};
