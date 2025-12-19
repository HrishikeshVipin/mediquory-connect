import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"Bhishak Med" <noreply@bhishak.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  // Template: Doctor Verification
  async sendDoctorVerificationEmail(doctorEmail: string, doctorName: string): Promise<boolean> {
    return this.sendEmail({
      to: doctorEmail,
      subject: '✅ Your Registration has been Approved - Bhishak Med',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Congratulations, Dr. ${doctorName}!</h2>
          <p>Your registration on Bhishak Med has been <strong>approved</strong>.</p>
          <p>You can now:</p>
          <ul>
            <li>Manage your patients</li>
            <li>Conduct video consultations</li>
            <li>Issue prescriptions</li>
          </ul>
          <p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/doctor/login"
               style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
              Login to Dashboard
            </a>
          </p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      `,
    });
  }

  // Template: Doctor Rejection
  async sendDoctorRejectionEmail(doctorEmail: string, doctorName: string, reason: string): Promise<boolean> {
    return this.sendEmail({
      to: doctorEmail,
      subject: '❌ Registration Update - Bhishak Med',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Registration Status Update</h2>
          <p>Dear Dr. ${doctorName},</p>
          <p>We regret to inform you that your registration on Bhishak Med could not be approved at this time.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>You may reapply after addressing the concerns mentioned above.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
            For assistance, please contact our support team.
          </p>
        </div>
      `,
    });
  }

  // Template: New Chat Message
  async sendNewChatNotificationEmail(doctorEmail: string, doctorName: string, patientName: string, message: string): Promise<boolean> {
    return this.sendEmail({
      to: doctorEmail,
      subject: `💬 New Message from ${patientName} - Bhishak Med`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">New Message from Patient</h2>
          <p>Dr. ${doctorName},</p>
          <p>You have received a new message from <strong>${patientName}</strong>:</p>
          <blockquote style="background: #f3f4f6; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0;">
            ${message.substring(0, 200)}${message.length > 200 ? '...' : ''}
          </blockquote>
          <p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/doctor/dashboard"
               style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
              View Message
            </a>
          </p>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();
