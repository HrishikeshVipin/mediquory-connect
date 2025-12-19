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
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });
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
            <p className="text-orange-800 text-sm">
              You can chat with Dr. {consultation.doctor.fullName}, but full consultation features
              (video call, prescriptions) will be available once the doctor activates your account.
            </p>
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
                <h3 className="text-xl font-bold text-gray-900">Dr. {consultation.doctor.fullName}</h3>
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
            {consultation.patient?.status !== 'WAITLISTED' && (
              !isVideoActive ? (
                <button
                  onClick={joinVideoCall}
                  disabled={loadingVideo}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {loadingVideo ? 'Joining Video...' : '📹 Join Video Call'}
                </button>
              ) : (
                <button
                  onClick={handleVideoLeave}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                >
                  Leave Video Call
                </button>
              )
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
          <div className="mb-6">
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
    </div>
  );
}
