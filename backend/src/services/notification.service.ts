import prisma from '../config/database';
import { emailService } from './email.service';
import type { Server as SocketIOServer } from 'socket.io';

interface CreateNotificationData {
  recipientType: 'DOCTOR' | 'ADMIN' | 'PATIENT';
  recipientId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
  sendEmail?: boolean;
  recipientEmail?: string;
}

class NotificationService {
  private io: SocketIOServer | null = null;

  setSocketIO(io: SocketIOServer) {
    this.io = io;
  }

  async createNotification(data: CreateNotificationData) {
    // Save to database
    const notification = await prisma.notification.create({
      data: {
        recipientType: data.recipientType,
        recipientId: data.recipientId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        actionText: data.actionText,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });

    // Send real-time notification via Socket.io
    if (this.io) {
      const roomName = `${data.recipientType.toLowerCase()}-${data.recipientId}`;
      this.io.to(roomName).emit('notification', {
        id: notification.id,
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        actionText: data.actionText,
        createdAt: notification.createdAt,
      });
    }

    // Send email if requested
    if (data.sendEmail && data.recipientEmail) {
      await this.sendEmailByType(data);

      // Update notification to mark email as sent
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          emailSent: true,
          emailSentAt: new Date(),
        },
      });
    }

    return notification;
  }

  private async sendEmailByType(data: CreateNotificationData) {
    try {
      switch (data.type) {
        case 'DOCTOR_VERIFIED':
          const doctorName = data.metadata?.doctorName || 'Doctor';
          await emailService.sendDoctorVerificationEmail(data.recipientEmail!, doctorName);
          break;

        case 'DOCTOR_REJECTED':
          const rejectedDoctorName = data.metadata?.doctorName || 'Doctor';
          const reason = data.metadata?.reason || 'No reason provided';
          await emailService.sendDoctorRejectionEmail(data.recipientEmail!, rejectedDoctorName, reason);
          break;

        case 'NEW_CHAT':
          const chatDoctorName = data.metadata?.doctorName || 'Doctor';
          const patientName = data.metadata?.patientName || 'Patient';
          const message = data.metadata?.message || '';
          await emailService.sendNewChatNotificationEmail(data.recipientEmail!, chatDoctorName, patientName, message);
          break;

        default:
          console.log('No email template for notification type:', data.type);
      }
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  // Get notifications for user
  async getNotifications(recipientType: string, recipientId: string, limit: number = 20) {
    return prisma.notification.findMany({
      where: {
        recipientType,
        recipientId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  // Mark all notifications as read for user
  async markAllAsRead(recipientType: string, recipientId: string) {
    return prisma.notification.updateMany({
      where: {
        recipientType,
        recipientId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  // Get unread count
  async getUnreadCount(recipientType: string, recipientId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        recipientType,
        recipientId,
        isRead: false,
      },
    });
  }
}

export const notificationService = new NotificationService();
