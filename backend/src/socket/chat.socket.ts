import { Server as SocketIOServer, Socket } from 'socket.io';
import prisma from '../config/database';
import { notificationService } from '../services/notification.service';

export const initializeChatSocket = (io: SocketIOServer) => {
  io.on('connection', (socket: Socket) => {
    console.log('✅ Client connected:', socket.id);

    // Join doctor's personal room for notifications
    socket.on('join-doctor-room', async (data: { doctorId: string }) => {
      try {
        const { doctorId } = data;
        const roomName = `doctor-${doctorId}`;
        socket.join(roomName);
        console.log(`👨‍⚕️ Doctor ${doctorId} joined their personal notification room: ${roomName}`);

        socket.emit('joined-doctor-room', {
          doctorId,
          message: 'Successfully joined doctor notification room',
        });
      } catch (error: any) {
        console.error('Join doctor room error:', error);
        socket.emit('error', {
          message: 'Failed to join doctor room',
          error: error.message,
        });
      }
    });

    // Join admin's personal room for notifications
    socket.on('join-admin-room', async (data: { adminId: string }) => {
      try {
        const { adminId } = data;
        const roomName = `admin-${adminId}`;
        socket.join(roomName);
        console.log(`👤 Admin ${adminId} joined their personal notification room: ${roomName}`);

        socket.emit('joined-admin-room', {
          adminId,
          message: 'Successfully joined admin notification room',
        });
      } catch (error: any) {
        console.error('Join admin room error:', error);
        socket.emit('error', {
          message: 'Failed to join admin room',
          error: error.message,
        });
      }
    });

    // Join consultation room
    socket.on('join-consultation', async (data: { consultationId: string; userType: 'doctor' | 'patient'; userName: string }) => {
      try {
        const { consultationId, userType, userName } = data;

        // Join the room
        socket.join(consultationId);

        console.log(`👤 ${userName} (${userType}) joined consultation: ${consultationId}`);

        // Notify others in the room
        socket.to(consultationId).emit('user-joined', {
          userType,
          userName,
          timestamp: new Date().toISOString(),
        });

        // Send confirmation to the user who joined
        socket.emit('joined-consultation', {
          consultationId,
          message: `Successfully joined consultation`,
        });
      } catch (error: any) {
        console.error('Join consultation error:', error);
        socket.emit('error', {
          message: 'Failed to join consultation',
          error: error.message,
        });
      }
    });

    // Send message
    socket.on('send-message', async (data: {
      consultationId: string;
      senderType: 'doctor' | 'patient';
      senderName: string;
      message: string;
    }) => {
      try {
        const { consultationId, senderType, senderName, message } = data;

        // Save message to database
        const chatMessage = await prisma.chatMessage.create({
          data: {
            consultationId,
            senderType,
            message,
            isRead: false, // Default to unread
          },
        });

        // Get consultation details for notifications
        const consultation = await prisma.consultation.findUnique({
          where: { id: consultationId },
          include: {
            doctor: { select: { id: true, fullName: true, email: true, emailNotifications: true, chatNotifications: true } },
            patient: { select: { id: true, fullName: true } },
          },
        });

        if (consultation) {
          // Update consultation last message tracking
          await prisma.consultation.update({
            where: { id: consultationId },
            data: {
              lastMessageAt: new Date(),
              lastMessageSender: senderType,
              hasUnreadMessages: senderType === 'patient', // Set true if patient sent message
            },
          });

          // Notify doctor if patient sent message
          if (senderType === 'patient' && consultation.doctor.chatNotifications) {
            // Create in-app notification
            await notificationService.createNotification({
              recipientType: 'DOCTOR',
              recipientId: consultation.doctor.id,
              type: 'NEW_CHAT',
              title: `New message from ${consultation.patient.fullName}`,
              message: message.substring(0, 100),
              actionUrl: `/doctor/patients/${consultation.patient.id}/consult`,
              actionText: 'View Chat',
              metadata: {
                doctorName: consultation.doctor.fullName,
                patientName: consultation.patient.fullName,
                message,
              },
              sendEmail: consultation.doctor.emailNotifications,
              recipientEmail: consultation.doctor.email,
            });

            // Emit real-time unread notification
            io.to(`doctor-${consultation.doctor.id}`).emit('new-unread-message', {
              consultationId,
              patientName: consultation.patient.fullName,
              message,
              timestamp: chatMessage.createdAt,
            });
          }

          // Notify patient if doctor replied
          if (senderType === 'doctor') {
            io.to(`patient-${consultation.patient.id}`).emit('doctor-reply-notification', {
              consultationId,
              doctorName: consultation.doctor.fullName,
              message: message.substring(0, 100),
              timestamp: chatMessage.createdAt,
            });
          }
        }

        // Broadcast message to all users in the consultation room
        io.to(consultationId).emit('receive-message', {
          id: chatMessage.id,
          consultationId,
          senderType,
          senderName,
          message,
          createdAt: chatMessage.createdAt,
        });

        console.log(`💬 Message in ${consultationId} from ${senderName} (${senderType}): ${message.substring(0, 50)}...`);
      } catch (error: any) {
        console.error('Send message error:', error);
        socket.emit('error', {
          message: 'Failed to send message',
          error: error.message,
        });
      }
    });

    // Typing indicator
    socket.on('typing', (data: { consultationId: string; userType: 'doctor' | 'patient'; userName: string }) => {
      const { consultationId, userType, userName } = data;
      socket.to(consultationId).emit('user-typing', {
        userType,
        userName,
      });
    });

    // Stop typing indicator
    socket.on('stop-typing', (data: { consultationId: string }) => {
      const { consultationId } = data;
      socket.to(consultationId).emit('user-stop-typing');
    });

    // Leave consultation
    socket.on('leave-consultation', (data: { consultationId: string; userType: 'doctor' | 'patient'; userName: string }) => {
      const { consultationId, userType, userName } = data;
      socket.leave(consultationId);

      console.log(`👋 ${userName} (${userType}) left consultation: ${consultationId}`);

      // Notify others
      socket.to(consultationId).emit('user-left', {
        userType,
        userName,
        timestamp: new Date().toISOString(),
      });
    });

    // End consultation (doctor only)
    socket.on('end-consultation', async (data: { consultationId: string }) => {
      try {
        const { consultationId } = data;

        // Update consultation status
        await prisma.consultation.update({
          where: { id: consultationId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        // Notify all users in the room
        io.to(consultationId).emit('consultation-ended', {
          consultationId,
          timestamp: new Date().toISOString(),
        });

        console.log(`✅ Consultation ended: ${consultationId}`);
      } catch (error: any) {
        console.error('End consultation error:', error);
        socket.emit('error', {
          message: 'Failed to end consultation',
          error: error.message,
        });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });
};
