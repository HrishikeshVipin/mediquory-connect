import { Server as SocketIOServer, Socket } from 'socket.io';
import prisma from '../config/database';

export const initializeChatSocket = (io: SocketIOServer) => {
  io.on('connection', (socket: Socket) => {
    console.log('✅ Client connected:', socket.id);

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
          },
        });

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
