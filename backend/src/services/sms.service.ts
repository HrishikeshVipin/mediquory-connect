import axios from 'axios';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';

// MSG91 OTP Service Configuration
const MSG91_OTP_TOKEN = process.env.MSG91_OTP_TOKEN; // OTP Service Token
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID; // Optional: OTP Template ID

// Rate limiting: max 3 OTPs per hour per phone
const OTP_RATE_LIMIT = 3;
const OTP_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes lock after too many attempts

// Generate 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via MSG91 SMS
export async function sendOtp(phone: string): Promise<{ success: boolean; message: string; lockedUntil?: Date }> {
  try {
    // Check if phone is locked due to too many attempts
    const recentOtps = await prisma.patientOtp.findMany({
      where: {
        phone,
        createdAt: {
          gte: new Date(Date.now() - OTP_RATE_WINDOW_MS),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check if locked
    if (recentOtps.length > 0 && recentOtps[0].attempts >= 5) {
      const lockedUntil = new Date(recentOtps[0].createdAt.getTime() + OTP_LOCK_DURATION_MS);
      if (lockedUntil > new Date()) {
        return {
          success: false,
          message: `Too many attempts. Please try again after ${lockedUntil.toLocaleTimeString()}`,
          lockedUntil,
        };
      }
    }

    // Check rate limit
    if (recentOtps.length >= OTP_RATE_LIMIT) {
      return {
        success: false,
        message: `Maximum ${OTP_RATE_LIMIT} OTP requests per hour. Please try again later.`,
      };
    }

    // Generate and hash OTP
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Save OTP to database
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    await prisma.patientOtp.create({
      data: {
        phone,
        otp: hashedOtp,
        expiresAt,
        verified: false,
        attempts: 0,
      },
    });

    // Send OTP via MSG91 Direct SMS API (no template required)
    if (process.env.NODE_ENV === 'production') {
      // Format phone number for MSG91 (needs country code without +)
      const formattedPhone = phone.startsWith('+')
        ? phone.substring(1)
        : phone.startsWith('91')
        ? phone
        : `91${phone}`;

      try {
        // Using MSG91 Direct SMS API - works immediately without template setup
        const smsMessage = `Your Bhishak Med OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;

        // Method 1: Try POST request (recommended)
        const smsResponse = await axios.post(
          'https://api.msg91.com/api/v5/flow/',
          {
            flow_id: '6390c21dd6fc054b7b74a4b0', // Default OTP flow
            sender: 'TXTIND',
            mobiles: formattedPhone,
            VAR1: otp,
            VAR2: '10',
          },
          {
            headers: {
              'authkey': MSG91_OTP_TOKEN,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('✅ MSG91 SMS sent:', smsResponse.data);
      } catch (smsError: any) {
        console.error('❌ MSG91 SMS Error:', smsError.response?.data || smsError.message);

        // Fallback: Try simple GET request method
        try {
          const smsMessage = `Your Bhishak Med OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;
          const fallbackResponse = await axios.get(
            `https://api.msg91.com/api/sendhttp.php`,
            {
              params: {
                authkey: MSG91_OTP_TOKEN,
                mobiles: formattedPhone,
                message: smsMessage,
                sender: 'TXTIND',
                route: '4',
                country: '91',
              },
            }
          );
          console.log('✅ MSG91 SMS sent via fallback:', fallbackResponse.data);
        } catch (fallbackError: any) {
          console.error('❌ MSG91 Fallback Error:', fallbackError.response?.data || fallbackError.message);

          // Log OTP to console as last resort (for testing)
          console.log(`⚠️ FALLBACK - OTP for ${phone}: ${otp} (check MSG91 configuration)`);
        }
      }
    } else {
      // Development mode: log OTP to console
      console.log(`📱 OTP for ${phone}: ${otp} (dev mode - not sent via SMS)`);
    }

    return {
      success: true,
      message: 'OTP sent successfully',
    };
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      message: error.message || 'Failed to send OTP',
    };
  }
}

// Verify OTP
export async function verifyOtp(phone: string, otp: string): Promise<{ success: boolean; message: string }> {
  try {
    // Find most recent non-expired OTP for this phone
    const otpRecord = await prisma.patientOtp.findFirst({
      where: {
        phone,
        expiresAt: {
          gte: new Date(),
        },
        verified: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return {
        success: false,
        message: 'OTP expired or not found. Please request a new OTP.',
      };
    }

    // Check if too many verification attempts
    if (otpRecord.attempts >= 5) {
      return {
        success: false,
        message: 'Too many incorrect attempts. Please request a new OTP.',
      };
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, otpRecord.otp);

    if (!isValid) {
      // Increment attempt counter
      await prisma.patientOtp.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });

      return {
        success: false,
        message: `Invalid OTP. ${5 - otpRecord.attempts - 1} attempts remaining.`,
      };
    }

    // Mark OTP as verified
    await prisma.patientOtp.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: error.message || 'Failed to verify OTP',
    };
  }
}

// Clean up expired OTPs (run as cron job)
export async function cleanupExpiredOtps(): Promise<void> {
  try {
    const deleted = await prisma.patientOtp.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // Older than 24 hours
        ],
      },
    });
    console.log(`🧹 Cleaned up ${deleted.count} expired OTP records`);
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
  }
}
