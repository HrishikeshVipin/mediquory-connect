import { Request, Response } from 'express';
import prisma from '../config/database';

// Create or update patient vitals
export const saveVitals = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const { weight, height, bloodPressure, temperature, heartRate, oxygenLevel, notes } = req.body;

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient not found',
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
    const { patientId } = req.params;

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
    const { patientId } = req.params;
    const { description } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
      return;
    }

    // Save file info to database
    const medicalUpload = await prisma.medicalUpload.create({
      data: {
        patientId,
        filePath: file.path,
        fileType: file.mimetype,
        fileName: file.originalname,
        description: description || null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: { file: medicalUpload },
    });
  } catch (error: any) {
    console.error('Upload medical file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message,
    });
  }
};

// Get patient medical files
export const getMedicalFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

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
