import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * ADMIN FUNCTIONS
 */

/**
 * Create a new medicine
 * POST /api/medicines
 * Admin only
 */
export const createMedicine = async (req: Request, res: Response) => {
  try {
    const {
      name,
      category,
      genericName,
      manufacturer,
      dosageForms,
      commonStrengths,
      restrictionNotes,
    } = req.body;

    // Validate required fields
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        error: 'Medicine name and category are required',
      });
    }

    // Validate category
    const validCategories = ['AYURVEDA', 'HOMEOPATHY', 'ALLOPATHY', 'UNANI', 'SIDDHA', 'GENERAL'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      });
    }

    // Check for duplicate medicine (name + category)
    const existing = await prisma.medicine.findFirst({
      where: { name, category },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Medicine "${name}" already exists in category "${category}"`,
      });
    }

    // Create medicine
    const medicine = await prisma.medicine.create({
      data: {
        name,
        category,
        genericName,
        manufacturer,
        dosageForms: dosageForms ? JSON.stringify(dosageForms) : null,
        commonStrengths: commonStrengths ? JSON.stringify(commonStrengths) : null,
        restrictionNotes,
        isVerified: false, // Admin needs to verify
        isBanned: false,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Medicine created successfully',
      data: { medicine },
    });
  } catch (error) {
    console.error('Error creating medicine:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create medicine',
    });
  }
};

/**
 * Get all medicines with filters
 * GET /api/medicines/admin/all
 * Admin only
 */
export const getAllMedicines = async (req: Request, res: Response) => {
  try {
    const { category, isVerified, isBanned, search } = req.query;

    // Build where clause
    const where: any = {};

    if (category) {
      where.category = category as string;
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    if (isBanned !== undefined) {
      where.isBanned = isBanned === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { genericName: { contains: search as string, mode: 'insensitive' } },
        { manufacturer: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const medicines = await prisma.medicine.findMany({
      where,
      orderBy: [
        { isVerified: 'desc' },
        { isBanned: 'asc' },
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: { medicines, count: medicines.length },
    });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch medicines',
    });
  }
};

/**
 * Verify a medicine
 * PUT /api/medicines/:medicineId/verify
 * Admin only
 */
export const verifyMedicine = async (req: Request, res: Response) => {
  try {
    const { medicineId } = req.params;
    const adminId = (req as any).userId; // From auth middleware

    const medicine = await prisma.medicine.findUnique({
      where: { id: medicineId },
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        error: 'Medicine not found',
      });
    }

    if (medicine.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Medicine is already verified',
      });
    }

    const updatedMedicine = await prisma.medicine.update({
      where: { id: medicineId },
      data: {
        isVerified: true,
        verifiedBy: adminId,
        verifiedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: `Medicine "${updatedMedicine.name}" verified successfully`,
      data: { medicine: updatedMedicine },
    });
  } catch (error) {
    console.error('Error verifying medicine:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify medicine',
    });
  }
};

/**
 * Ban a medicine
 * PUT /api/medicines/:medicineId/ban
 * Admin only
 */
export const banMedicine = async (req: Request, res: Response) => {
  try {
    const { medicineId } = req.params;
    const { restrictionNotes } = req.body;

    if (!restrictionNotes) {
      return res.status(400).json({
        success: false,
        error: 'Restriction notes are required when banning a medicine',
      });
    }

    const medicine = await prisma.medicine.findUnique({
      where: { id: medicineId },
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        error: 'Medicine not found',
      });
    }

    if (medicine.isBanned) {
      return res.status(400).json({
        success: false,
        error: 'Medicine is already banned',
      });
    }

    const updatedMedicine = await prisma.medicine.update({
      where: { id: medicineId },
      data: {
        isBanned: true,
        restrictionNotes,
      },
    });

    res.json({
      success: true,
      message: `Medicine "${updatedMedicine.name}" has been banned`,
      data: { medicine: updatedMedicine },
    });
  } catch (error) {
    console.error('Error banning medicine:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to ban medicine',
    });
  }
};

/**
 * Unban a medicine
 * PUT /api/medicines/:medicineId/unban
 * Admin only
 */
export const unbanMedicine = async (req: Request, res: Response) => {
  try {
    const { medicineId } = req.params;

    const medicine = await prisma.medicine.findUnique({
      where: { id: medicineId },
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        error: 'Medicine not found',
      });
    }

    if (!medicine.isBanned) {
      return res.status(400).json({
        success: false,
        error: 'Medicine is not currently banned',
      });
    }

    const updatedMedicine = await prisma.medicine.update({
      where: { id: medicineId },
      data: {
        isBanned: false,
        restrictionNotes: null,
      },
    });

    res.json({
      success: true,
      message: `Medicine "${updatedMedicine.name}" has been unbanned`,
      data: { medicine: updatedMedicine },
    });
  } catch (error) {
    console.error('Error unbanning medicine:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unban medicine',
    });
  }
};

/**
 * DOCTOR FUNCTIONS
 */

/**
 * Get available medicines for doctor (verified, not banned, filtered by specialization)
 * GET /api/medicines/available
 * Doctor only
 */
export const getDoctorAvailableMedicines = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).doctorId; // From auth middleware
    const { search, category } = req.query;

    // Get doctor's specialization
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { specialization: true },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
      });
    }

    // Map specialization to allowed categories
    const categoryMap: { [key: string]: string[] } = {
      'Ayurveda': ['AYURVEDA', 'GENERAL'],
      'Homeopathy': ['HOMEOPATHY', 'GENERAL'],
      'Allopathy': ['ALLOPATHY', 'GENERAL'],
      'Unani': ['UNANI', 'GENERAL'],
      'Siddha': ['SIDDHA', 'GENERAL'],
    };

    // Get allowed categories for this doctor
    let allowedCategories: string[] = [];
    for (const [spec, cats] of Object.entries(categoryMap)) {
      if (doctor.specialization.toLowerCase().includes(spec.toLowerCase())) {
        allowedCategories = cats;
        break;
      }
    }

    // Default to all categories if specialization not mapped
    if (allowedCategories.length === 0) {
      allowedCategories = ['AYURVEDA', 'HOMEOPATHY', 'ALLOPATHY', 'UNANI', 'SIDDHA', 'GENERAL'];
    }

    // Build where clause
    const where: any = {
      isVerified: true,
      isBanned: false,
      category: { in: allowedCategories },
    };

    if (category) {
      where.category = category as string;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { genericName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const medicines = await prisma.medicine.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: {
        medicines,
        count: medicines.length,
        allowedCategories,
      },
    });
  } catch (error) {
    console.error('Error fetching available medicines:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch medicines',
    });
  }
};

/**
 * Get doctor's personal medicine list
 * GET /api/medicines/my-medicines
 * Doctor only
 */
export const getMyMedicines = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).doctorId; // From auth middleware
    const { search } = req.query;

    const where: any = {
      doctorId,
      medicine: {
        isBanned: false, // Don't show banned medicines in personal list
      },
    };

    if (search) {
      where.medicine = {
        ...where.medicine,
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { genericName: { contains: search as string, mode: 'insensitive' } },
        ],
      };
    }

    const doctorMedicines = await prisma.doctorMedicine.findMany({
      where,
      include: {
        medicine: true,
      },
      orderBy: [
        { usageCount: 'desc' }, // Most used first
        { addedAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: {
        medicines: doctorMedicines,
        count: doctorMedicines.length,
      },
    });
  } catch (error) {
    console.error('Error fetching personal medicines:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch personal medicines',
    });
  }
};

/**
 * Add medicine to doctor's personal list
 * POST /api/medicines/my-medicines
 * Doctor only
 */
export const addToMyMedicines = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).doctorId; // From auth middleware
    const { medicineId, personalNotes } = req.body;

    if (!medicineId) {
      return res.status(400).json({
        success: false,
        error: 'Medicine ID is required',
      });
    }

    // Check if medicine exists and is not banned
    const medicine = await prisma.medicine.findUnique({
      where: { id: medicineId },
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        error: 'Medicine not found',
      });
    }

    if (medicine.isBanned) {
      return res.status(403).json({
        success: false,
        error: `Cannot add banned medicine: ${medicine.restrictionNotes || 'This medicine has been banned'}`,
      });
    }

    if (!medicine.isVerified) {
      return res.status(403).json({
        success: false,
        error: 'Cannot add unverified medicine. Please wait for admin verification.',
      });
    }

    // Check if already in personal list
    const existing = await prisma.doctorMedicine.findUnique({
      where: {
        doctorId_medicineId: {
          doctorId,
          medicineId,
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Medicine already in your personal list',
      });
    }

    // Add to personal list
    const doctorMedicine = await prisma.doctorMedicine.create({
      data: {
        doctorId,
        medicineId,
        personalNotes,
        usageCount: 0,
      },
      include: {
        medicine: true,
      },
    });

    res.status(201).json({
      success: true,
      message: `Medicine "${medicine.name}" added to your personal list`,
      data: { doctorMedicine },
    });
  } catch (error) {
    console.error('Error adding medicine to personal list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add medicine to personal list',
    });
  }
};

/**
 * Remove medicine from doctor's personal list
 * DELETE /api/medicines/my-medicines/:medicineId
 * Doctor only
 */
export const removeFromMyMedicines = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).doctorId; // From auth middleware
    const { medicineId } = req.params;

    const doctorMedicine = await prisma.doctorMedicine.findUnique({
      where: {
        doctorId_medicineId: {
          doctorId,
          medicineId,
        },
      },
      include: {
        medicine: true,
      },
    });

    if (!doctorMedicine) {
      return res.status(404).json({
        success: false,
        error: 'Medicine not found in your personal list',
      });
    }

    await prisma.doctorMedicine.delete({
      where: {
        id: doctorMedicine.id,
      },
    });

    res.json({
      success: true,
      message: `Medicine "${doctorMedicine.medicine.name}" removed from your personal list`,
    });
  } catch (error) {
    console.error('Error removing medicine from personal list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove medicine from personal list',
    });
  }
};

/**
 * Validate prescription medications (check for banned medicines)
 * POST /api/medicines/validate
 * Doctor only
 */
export const validatePrescriptionMedications = async (req: Request, res: Response) => {
  try {
    const { medications } = req.body;

    if (!Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Medications array is required',
      });
    }

    // Extract medicine names from medications array
    const medicineNames = medications.map((med: any) => med.name);

    // Check for banned medicines
    const bannedMedicines = await prisma.medicine.findMany({
      where: {
        name: { in: medicineNames },
        isBanned: true,
      },
    });

    if (bannedMedicines.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Prescription contains banned medicines',
        data: {
          bannedMedicines: bannedMedicines.map((med) => ({
            name: med.name,
            category: med.category,
            restrictionNotes: med.restrictionNotes,
          })),
        },
      });
    }

    // Increment usage count for medicines in doctor's personal list
    const doctorId = (req as any).doctorId;
    for (const medName of medicineNames) {
      const medicine = await prisma.medicine.findFirst({
        where: { name: medName },
      });

      if (medicine) {
        // Check if in doctor's personal list
        const doctorMedicine = await prisma.doctorMedicine.findUnique({
          where: {
            doctorId_medicineId: {
              doctorId,
              medicineId: medicine.id,
            },
          },
        });

        if (doctorMedicine) {
          // Increment usage count
          await prisma.doctorMedicine.update({
            where: { id: doctorMedicine.id },
            data: { usageCount: { increment: 1 } },
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'All medications are valid',
    });
  } catch (error) {
    console.error('Error validating medications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate medications',
    });
  }
};
