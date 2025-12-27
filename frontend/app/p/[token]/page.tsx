'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { consultationApi } from '../../../lib/api';
import { connectSocket, disconnectSocket, getSocket } from '../../../lib/socket';
import ChatBox from '../../../components/ChatBox';
import VideoRoom from '../../../components/VideoRoom';
import VitalsForm from '../../../components/VitalsForm';
import FileUpload from '../../../components/FileUpload';
import PaymentSection from '../../../components/PaymentSection';
import type { Socket } from 'socket.io-client';

interface Consultation {
  id: string;
  status: string;
  startedAt: string;
  doctor: {
    id: string;
    fullName: string;
    specialization: string;
    profilePhoto?: string;
    upiId?: string;
    qrCodeImage?: string;
  };
  patient?: {
    status?: string;
    fullName?: string;
  };
  chatMessages: any[];
  prescription?: {
    id: string;
  };
}

export default function PatientAccessPage() {
  const params = useParams();
  const token = params.token as string;
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [joined, setJoined] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [videoTokens, setVideoTokens] = useState<any>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  // Online presence and call states
  const [isDoctorOnline, setIsDoctorOnline] = useState(false);
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState<{ doctorName: string } | null>(null);

  // Prescription notification modal
  const [showPrescriptionNotification, setShowPrescriptionNotification] = useState(false);

  useEffect(() => {
    if (token) {
      fetchConsultation();
    }

    return () => {
      if (socket && consultation) {
        socket.emit('leave-consultation', {
          consultationId: consultation.id,
          userType: 'patient',
          userName: 'Patient',
        });
        disconnectSocket();
      }
    };
  }, [token]);

  useEffect(() => {
    if (consultation && !joined) {
      initializeSocket();
    }
  }, [consultation, joined]);

  const fetchConsultation = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await consultationApi.getPatientConsultation(token);

      if (response.success && response.data) {
        setConsultation(response.data.consultation);
      }
    } catch (err: any) {
      console.error('Error fetching consultation:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load consultation. Please check the link.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = () => {
    const newSocket = connectSocket();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to chat server');

      // Join consultation room
      newSocket.emit('join-consultation', {
        consultationId: consultation!.id,
        userType: 'patient',
        userName: 'Patient',
      });
    });

    newSocket.on('joined-consultation', () => {
      console.log('Joined consultation room');
      setJoined(true);

      // Notify that patient is online
      newSocket.emit('user-online-in-consultation', {
        consultationId: consultation!.id,
        userType: 'patient',
      });
    });

    // Listen for doctor's online/offline status
    newSocket.on('user-status-changed', (data: { userType: string; isOnline: boolean }) => {
      if (data.userType === 'doctor') {
        console.log('Doctor status changed:', data.isOnline ? 'Online' : 'Offline');
        setIsDoctorOnline(data.isOnline);
      }
    });

    // Listen for incoming video call from doctor
    newSocket.on('incoming-video-call', (data: { doctorName: string }) => {
      console.log('📹 Incoming video call from:', data.doctorName);
      setIncomingCallData({ doctorName: data.doctorName });
      setShowIncomingCall(true);

      // Play notification sound if possible
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.log('Could not play sound:', e));
      } catch (e) {
        console.log('Audio not available');
      }
    });

    // Listen for new messages and update consultation state
    newSocket.on('receive-message', (message: any) => {
      setConsultation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          chatMessages: [...prev.chatMessages, message],
        };
      });
    });

    // Listen for prescription updates (doctor created prescription)
    newSocket.on('prescription-updated', (data: { prescription: any; timestamp: string }) => {
      console.log('📡 Prescription updated:', data.prescription);
      setConsultation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          prescription: data.prescription,
        };
      });
      // Show prescription notification modal
      setShowPrescriptionNotification(true);
      // Refresh to show payment section
      fetchConsultation();
    });

    // Listen for payment made by patient (shouldn't happen, but for completeness)
    newSocket.on('payment-made', (data: { payment: any; timestamp: string }) => {
      console.log('📡 Payment made:', data.payment);
      // Refresh consultation
      fetchConsultation();
    });

    // Listen for payment confirmed by doctor
    newSocket.on('payment-confirmed', (data: { payment: any; timestamp: string }) => {
      console.log('📡 Payment confirmed by doctor:', data.payment);
      // Update consultation state
      setConsultation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'COMPLETED',
        };
      });
      // Refresh to show download prescription button
      fetchConsultation();
    });

    // Listen for consultation completed
    newSocket.on('consultation-completed', (data: { consultation: any; timestamp: string }) => {
      console.log('📡 Consultation completed:', data.consultation);
      setConsultation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'COMPLETED',
        };
      });
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Cleanup listeners on unmount
    return () => {
      // Notify offline before leaving
      if (consultation) {
        newSocket.emit('user-offline-in-consultation', {
          consultationId: consultation.id,
          userType: 'patient',
        });
      }
      newSocket.off('receive-message');
      newSocket.off('user-status-changed');
      newSocket.off('incoming-video-call');
      newSocket.off('prescription-updated');
      newSocket.off('payment-made');
      newSocket.off('payment-confirmed');
      newSocket.off('consultation-completed');
    };
  };

  const joinVideoCall = async () => {
    try {
      setLoadingVideo(true);
      const response = await consultationApi.getVideoTokens(consultation!.id);

      if (response.success && response.data) {
        setVideoTokens(response.data);
        setIsVideoActive(true);
      }
    } catch (error) {
      console.error('Error joining video call:', error);
      alert('Failed to join video call');
    } finally {
      setLoadingVideo(false);
    }
  };

  const handleVideoLeave = () => {
    setIsVideoActive(false);
    setVideoTokens(null);
  };

  const handleAcceptCall = async () => {
    if (!socket || !consultation) return;

    setShowIncomingCall(false);

    // Notify doctor that patient accepted
    socket.emit('accept-video-call', {
      consultationId: consultation.id,
      patientName: 'Patient',
    });

    // Join the video call
    await joinVideoCall();
  };

  const handleDeclineCall = () => {
    if (!socket || !consultation) return;

    setShowIncomingCall(false);
    setIncomingCallData(null);

    // Notify doctor that patient declined
    socket.emit('decline-video-call', {
      consultationId: consultation.id,
      patientName: 'Patient',
      reason: 'Patient declined the call',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-600">Loading your consultation portal...</p>
        </div>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-6">
            {error || 'The patient link you are trying to access is invalid or has been removed.'}
          </p>
          <p className="text-sm text-gray-500">
            Please check the link provided by your doctor and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Patient Consultation Portal
              </h1>
              <p className="text-sm text-gray-600">Chat with your doctor in real-time</p>
            </div>
            <div className="text-4xl">🏥</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Waitlist Status Message */}
        {consultation.patient?.status === 'WAITLISTED' && (
          <div className="mb-6 bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⏳</span>
              <h3 className="font-bold text-orange-900">You're on the Waiting List</h3>
            </div>
            <p className="text-orange-800 text-sm mb-2">
              You can chat with Dr. {consultation.doctor.fullName}, but full consultation features
              (video call, prescriptions) will be available once the doctor activates your account.
            </p>
            <div className="flex items-center gap-2 bg-orange-100 border border-orange-300 rounded-lg px-3 py-2 mt-3">
              <svg className="w-5 h-5 text-orange-700 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-orange-900 text-xs font-semibold">
                ⚠️ Chat limit: You and the doctor can each send up to 10 messages while on the waitlist.
              </p>
            </div>
          </div>
        )}

        {/* Doctor Information */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Doctor</h2>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-4">
              {consultation.doctor.profilePhoto ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${consultation.doctor.profilePhoto.replace(/\\/g, '/')}`}
                  alt={consultation.doctor.fullName}
                  className="w-20 h-20 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center ${consultation.doctor.profilePhoto ? 'hidden' : ''}`}>
                <span className="text-2xl">👨‍⚕️</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900">Dr. {consultation.doctor.fullName}</h3>
                  {isDoctorOnline ? (
                    <span className="flex items-center gap-1 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      Offline
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{consultation.doctor.specialization}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Video Section */}
        {isVideoActive && videoTokens ? (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Video Consultation</h2>
            </div>
            <div className="p-6">
              <VideoRoom
                appId={videoTokens.appId}
                channel={videoTokens.channelName}
                token={videoTokens.patient.token}
                uid={videoTokens.patient.uid}
                userType="patient"
                userName="Patient"
                onLeave={handleVideoLeave}
              />
            </div>
          </div>
        ) : null}

        {/* Chat Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Consultation Chat</h2>
            {consultation.patient?.status !== 'WAITLISTED' && isVideoActive && (
              <button
                onClick={handleVideoLeave}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
              >
                Leave Video Call
              </button>
            )}
          </div>
          <div className="p-6">
            {socket && joined ? (
              <ChatBox
                socket={socket}
                consultationId={consultation.id}
                userType="patient"
                userName="Patient"
                initialMessages={consultation.chatMessages || []}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p>Connecting to chat...</p>
              </div>
            )}
          </div>
        </div>

        {/* Vitals and File Upload Section - Only for Active Patients */}
        {consultation.patient?.status !== 'WAITLISTED' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <VitalsForm
              patientId={consultation.id}
              accessToken={token}
            />
            <FileUpload
              patientId={consultation.id}
              accessToken={token}
            />
          </div>
        )}

        {/* Payment & Prescription Section - Only for Active Patients */}
        {consultation.patient?.status !== 'WAITLISTED' && consultation.prescription && (
          <div id="payment-section" className="mb-6 scroll-mt-20">
            <PaymentSection
              consultationId={consultation.id}
              doctorName={consultation.doctor.fullName}
              doctorUpiId={consultation.doctor.upiId}
              doctorQrCode={consultation.doctor.qrCodeImage}
              prescriptionId={consultation.prescription.id}
            />
          </div>
        )}

        {/* Important Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">📌 Important Information</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Save this link for future consultations</li>
            <li>• You can access this portal anytime using the same link</li>
            <li>• Your messages are securely stored</li>
            <li>• Contact your doctor directly for emergencies</li>
          </ul>
        </div>
      </main>

      {/* Prescription Notification Modal - Senior Friendly */}
      {showPrescriptionNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-lg w-full shadow-2xl">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mb-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Prescription Ready!
              </h2>
              <p className="text-lg sm:text-xl text-gray-700 mb-8 leading-relaxed">
                Your doctor has created your prescription.<br />
                <span className="font-semibold text-blue-600">Please scroll down to make payment</span> and download your prescription.
              </p>

              <button
                onClick={() => {
                  setShowPrescriptionNotification(false);
                  // Scroll to payment section
                  setTimeout(() => {
                    const paymentSection = document.getElementById('payment-section');
                    if (paymentSection) {
                      paymentSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }, 300);
                }}
                className="w-full py-5 sm:py-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xl sm:text-2xl font-bold rounded-2xl transition-all shadow-lg"
              >
                OK, Show Payment Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Video Call Modal - Senior Friendly */}
      {showIncomingCall && incomingCallData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-lg w-full shadow-2xl">
            <div className="text-center">
              {/* Call Icon - Static, no animations */}
              <div className="mb-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                Incoming Video Call
              </h2>
              <p className="text-lg sm:text-xl text-gray-700 mb-8">
                <span className="font-semibold text-blue-600">{incomingCallData.doctorName}</span> is calling you
              </p>

              {/* Large, easy-to-tap buttons for aged patients */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleDeclineCall}
                  className="flex-1 py-5 sm:py-6 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-xl sm:text-2xl font-bold rounded-2xl transition-colors shadow-lg flex items-center justify-center gap-3"
                >
                  <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Decline
                </button>
                <button
                  onClick={handleAcceptCall}
                  className="flex-1 py-5 sm:py-6 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-xl sm:text-2xl font-bold rounded-2xl transition-colors shadow-lg flex items-center justify-center gap-3"
                >
                  <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  Accept Call
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
