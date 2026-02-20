import { Request, Response } from 'express';
import prisma from '../config/database';
import { decrypt } from '../utils/encryption';
import { maskAadhaar } from '../utils/encryption';
import { createAdminAccessLog } from '../middleware/audit.middleware';

/**
 * Admin Reveal Aadhaar Controller
 *
 * Security Feature: Masked Aadhaar with 15-Second Reveal
 * - Aadhaar is always masked by default (XXXX-XXXX-1234)
 * - Admin can click "View for 15 sec" button
 * - This endpoint decrypts and returns full Aadhaar
 * - Frontend shows countdown timer (15...14...13...)
 * - Auto-masks after 15 seconds
 * - Every reveal is logged in AdminAccessLog
 */

/**
 * Reveal Aadhaar for verification (15-second window)
 * POST /api/admin/reveal-aadhaar/:doctorId
 * Body: { reason, reasonDetails }
 */
export const revealAadhaar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;
    const { reason, reasonDetails } = req.body;

    // Get admin info from authenticateUser middleware
    const adminFromToken = (req as any).user;

    if (!adminFromToken || (adminFromToken.role !== 'ADMIN' && adminFromToken.role !== 'SUPER_ADMIN')) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    // Fetch full admin record from database to get actual role
    const admin = await prisma.admin.findUnique({
      where: { id: adminFromToken.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
      return;
    }

    // Validate reason (REQUIRED for compliance)
    const validReasons = ['LEGAL_REQUEST', 'DISPUTE_RESOLUTION', 'QUALITY_AUDIT', 'TECHNICAL_SUPPORT', 'USER_REQUEST', 'VERIFICATION'];
    if (!reason || !validReasons.includes(reason)) {
      res.status(400).json({
        success: false,
        message: 'Reason is required',
        validReasons,
      });
      return;
    }

    // Fetch doctor with encrypted Aadhaar
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true, // Need status for contextual access
        governmentIdNumber: true, // Encrypted
      },
    });

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    // CONTEXTUAL ACCESS CONTROL: Regular admins can only reveal during verification
    if (admin.role !== 'SUPER_ADMIN') {
      if (doctor.status !== 'PENDING_VERIFICATION') {
        res.status(403).json({
          success: false,
          message: 'Regular admins can only reveal Aadhaar for doctors pending verification. Contact a Super Admin for access to verified/rejected/suspended doctors.',
        });
        return;
      }
    }

    // Decrypt Government ID number
    const decryptedAadhaar = decrypt(doctor.governmentIdNumber);

    // Log admin access (CRITICAL for compliance)
    await createAdminAccessLog(req, {
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.fullName,
      accessType: 'DOCTOR_VIEW',
      resourceType: 'DOCTOR',
      resourceId: doctor.id,
      reason: reason as any,
      reasonDetails: reasonDetails || `Revealed Aadhaar for doctor: ${doctor.fullName}`,
      action: 'VIEW',
    });

    console.log(`🔓 Admin ${admin.fullName} (${admin.email}) revealed Aadhaar for doctor ${doctor.fullName} - Reason: ${reason}`);

    // Return decrypted Aadhaar with expiry timestamp
    const expiryTimestamp = Date.now() + 15000; // 15 seconds from now

    res.status(200).json({
      success: true,
      message: 'Aadhaar revealed for 15 seconds',
      data: {
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        aadhaarNumber: decryptedAadhaar, // FULL NUMBER (unmasked)
        expiresAt: expiryTimestamp,
        validFor: 15, // seconds
      },
    });
  } catch (error: any) {
    console.error('Reveal Aadhaar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reveal Aadhaar',
      error: error.message,
    });
  }
};

/**
 * Reveal UPI ID for verification (15-second window)
 * POST /api/admin/reveal-upi/:doctorId
 * Body: { reason, reasonDetails }
 */
export const revealUpiId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;
    const { reason, reasonDetails } = req.body;

    // Get admin info from token
    const adminFromToken = (req as any).user;

    if (!adminFromToken || (adminFromToken.role !== 'ADMIN' && adminFromToken.role !== 'SUPER_ADMIN')) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    // Fetch full admin record from database to get actual role
    const admin = await prisma.admin.findUnique({
      where: { id: adminFromToken.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
      return;
    }

    // Validate reason
    const validReasons = ['LEGAL_REQUEST', 'DISPUTE_RESOLUTION', 'QUALITY_AUDIT', 'TECHNICAL_SUPPORT', 'USER_REQUEST', 'VERIFICATION'];
    if (!reason || !validReasons.includes(reason)) {
      res.status(400).json({
        success: false,
        message: 'Reason is required',
        validReasons,
      });
      return;
    }

    // Fetch doctor with encrypted UPI ID
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true, // Need status for contextual access
        upiId: true, // Encrypted
      },
    });

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    if (!doctor.upiId) {
      res.status(404).json({
        success: false,
        message: 'Doctor has not set UPI ID',
      });
      return;
    }

    // CONTEXTUAL ACCESS CONTROL: Regular admins can only reveal during verification
    if (admin.role !== 'SUPER_ADMIN') {
      if (doctor.status !== 'PENDING_VERIFICATION') {
        res.status(403).json({
          success: false,
          message: 'Regular admins can only reveal UPI ID for doctors pending verification. Contact a Super Admin for access to verified/rejected/suspended doctors.',
        });
        return;
      }
    }

    // Decrypt UPI ID
    const decryptedUpiId = decrypt(doctor.upiId);

    // Log admin access
    await createAdminAccessLog(req, {
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.fullName,
      accessType: 'DOCTOR_VIEW',
      resourceType: 'DOCTOR',
      resourceId: doctor.id,
      reason: reason as any,
      reasonDetails: reasonDetails || `Revealed UPI ID for doctor: ${doctor.fullName}`,
      action: 'VIEW',
    });

    console.log(`🔓 Admin ${admin.fullName} revealed UPI ID for doctor ${doctor.fullName} - Reason: ${reason}`);

    // Return decrypted UPI ID with expiry timestamp
    const expiryTimestamp = Date.now() + 15000; // 15 seconds from now

    res.status(200).json({
      success: true,
      message: 'UPI ID revealed for 15 seconds',
      data: {
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        upiId: decryptedUpiId, // FULL UPI ID
        expiresAt: expiryTimestamp,
        validFor: 15, // seconds
      },
    });
  } catch (error: any) {
    console.error('Reveal UPI ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reveal UPI ID',
      error: error.message,
    });
  }
};

export default {
  revealAadhaar,
  revealUpiId,
};
