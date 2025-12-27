import type { Server as SocketIOServer } from 'socket.io';

/**
 * Socket Service for real-time updates
 * Handles non-notification socket events like patient status changes
 */
class SocketService {
  private io: SocketIOServer | null = null;

  setSocketIO(io: SocketIOServer) {
    this.io = io;
    console.log('✅ SocketService initialized');
  }

  /**
   * Emit patient status update to doctor's consultation room
   */
  emitPatientStatusUpdate(consultationId: string, patientData: any) {
    if (this.io) {
      console.log(`📡 Emitting patient-status-updated to consultation: ${consultationId}`);
      this.io.to(consultationId).emit('patient-status-updated', {
        patient: patientData,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Emit patient data refresh (for any patient updates)
   */
  emitPatientDataRefresh(consultationId: string, patientData: any) {
    if (this.io) {
      console.log(`📡 Emitting patient-data-refresh to consultation: ${consultationId}`);
      this.io.to(consultationId).emit('patient-data-refresh', {
        patient: patientData,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Notify about consultation updates
   */
  emitConsultationUpdate(consultationId: string, updateType: string, data: any) {
    if (this.io) {
      console.log(`📡 Emitting consultation-updated (${updateType}) to: ${consultationId}`);
      this.io.to(consultationId).emit('consultation-updated', {
        type: updateType,
        data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Emit prescription created/updated event
   */
  emitPrescriptionUpdate(consultationId: string, prescription: any) {
    if (this.io) {
      console.log(`📡 Emitting prescription-updated to consultation: ${consultationId}`);
      this.io.to(consultationId).emit('prescription-updated', {
        prescription,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Emit payment made event (patient paid)
   */
  emitPaymentMade(consultationId: string, payment: any) {
    if (this.io) {
      console.log(`📡 Emitting payment-made to consultation: ${consultationId}`);
      this.io.to(consultationId).emit('payment-made', {
        payment,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Emit payment confirmed event (doctor confirmed)
   */
  emitPaymentConfirmed(consultationId: string, payment: any) {
    if (this.io) {
      console.log(`📡 Emitting payment-confirmed to consultation: ${consultationId}`);
      this.io.to(consultationId).emit('payment-confirmed', {
        payment,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Emit consultation completed event
   */
  emitConsultationCompleted(consultationId: string, consultation: any) {
    if (this.io) {
      console.log(`📡 Emitting consultation-completed to: ${consultationId}`);
      this.io.to(consultationId).emit('consultation-completed', {
        consultation,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export const socketService = new SocketService();
