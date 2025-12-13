'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../../../store/authStore';
import { consultationApi, patientApi } from '../../../../../lib/api';
import { connectSocket, disconnectSocket } from '../../../../../lib/socket';
import ChatBox from '../../../../../components/ChatBox';
import VideoRoom from '../../../../../components/VideoRoom';
import PrescriptionForm from '../../../../../components/PrescriptionForm';
import PaymentConfirmation from '../../../../../components/PaymentConfirmation';
import type { Socket } from 'socket.io-client';

interface Consultation {
  id: string;
  status: string;
  startedAt: string;
  patient: {
    id: string;
    fullName: string;
    phone?: string;
    age?: number;
    gender?: string;
  };
  chatMessages: any[];
  prescription?: {
    id: string;
    diagnosis: string;
    medications: any[];
    instructions?: string;
  };
}

export default function DoctorConsultationPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  const { isAuthenticated, role, user } = useAuthStore();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [joined, setJoined] = useState(false);
  const [notes, setNotes] = useState({ chiefComplaint: '', doctorNotes: '' });
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [videoTokens, setVideoTokens] = useState<any>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || role !== 'DOCTOR') {
      router.push('/doctor/login');
      return;
    }

    if (patientId) {
      startOrGetConsultation();
    }

    return () => {
      if (socket && consultation) {
        socket.emit('leave-consultation', {
          consultationId: consultation.id,
          userType: 'doctor',
          userName: user?.fullName || 'Doctor',
        });
        disconnectSocket();
      }
    };
  }, [patientId, isAuthenticated, role]);

  useEffect(() => {
    if (consultation && !joined && user) {
      initializeSocket();
    }
  }, [consultation, joined, user]);

  const startOrGetConsultation = async () => {
    try {
      setLoading(true);

      const response = await consultationApi.startConsultation(patientId);

      if (response.success && response.data) {
        const consult = response.data.consultation;
        setConsultation(consult);
        setNotes({
          chiefComplaint: consult.chiefComplaint || '',
          doctorNotes: consult.doctorNotes || '',
        });
      }
    } catch (error) {
      console.error('Error starting consultation:', error);
      alert('Failed to start consultation');
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
        userType: 'doctor',
        userName: user!.fullName,
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

  const saveNotes = async () => {
    try {
      await consultationApi.updateNotes(consultation!.id, notes);
      alert('Notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    }
  };

  const endConsultation = async () => {
    if (!confirm('Are you sure you want to end this consultation?')) return;

    try {
      await consultationApi.endConsultation(consultation!.id);

      if (socket) {
        socket.emit('end-consultation', { consultationId: consultation!.id });
      }

      alert('Consultation ended successfully');
      router.push('/doctor/patients');
    } catch (error) {
      console.error('Error ending consultation:', error);
      alert('Failed to end consultation');
    }
  };

  const startVideoCall = async () => {
    try {
      setLoadingVideo(true);
      const response = await consultationApi.getVideoTokens(consultation!.id);

      if (response.success && response.data) {
        setVideoTokens(response.data);
        setIsVideoActive(true);
      }
    } catch (error) {
      console.error('Error starting video call:', error);
      alert('Failed to start video call');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!consultation || !consultation.patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Failed to load consultation</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Consultation with {consultation.patient?.fullName || 'Patient'}
            </h1>
            <p className="text-sm text-gray-600">
              {consultation.patient?.age && `${consultation.patient.age}y`}
              {consultation.patient?.age && consultation.patient?.gender && ' • '}
              {consultation.patient?.gender}
              {consultation.patient?.phone && ` • ${consultation.patient.phone}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={endConsultation}
              disabled={consultation.status === 'COMPLETED'}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              End Consultation
            </button>
            <Link
              href="/doctor/patients"
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              Back to Patients
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat/Video Section - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Section */}
            {isVideoActive && videoTokens ? (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Video Consultation</h2>
                </div>
                <div className="p-6">
                  <VideoRoom
                    appId={videoTokens.appId}
                    channel={videoTokens.channelName}
                    token={videoTokens.doctor.token}
                    uid={videoTokens.doctor.uid}
                    userType="doctor"
                    userName={user?.fullName || 'Doctor'}
                    onLeave={handleVideoLeave}
                  />
                </div>
              </div>
            ) : null}

            {/* Chat Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Chat Consultation</h2>
              </div>
              <div className="p-6">
                {socket && joined ? (
                  <ChatBox
                    socket={socket}
                    consultationId={consultation.id}
                    userType="doctor"
                    userName={user?.fullName || 'Doctor'}
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
          </div>

          {/* Notes Section - 1/3 width */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Consultation Notes</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chief Complaint
                  </label>
                  <textarea
                    value={notes.chiefComplaint}
                    onChange={(e) => setNotes({ ...notes, chiefComplaint: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Patient's main concern..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doctor's Notes
                  </label>
                  <textarea
                    value={notes.doctorNotes}
                    onChange={(e) => setNotes({ ...notes, doctorNotes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={6}
                    placeholder="Clinical notes, observations, treatment plan..."
                  />
                </div>

                <button
                  onClick={saveNotes}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Notes
                </button>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Quick Actions</h3>
                  <div className="space-y-2">
                    {!isVideoActive ? (
                      <button
                        onClick={startVideoCall}
                        disabled={loadingVideo}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed"
                      >
                        {loadingVideo ? 'Starting Video...' : 'Start Video Call'}
                      </button>
                    ) : (
                      <button
                        onClick={handleVideoLeave}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Leave Video Call
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Prescription Section */}
            {!consultation.prescription ? (
              <div className="bg-white rounded-lg shadow mt-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Generate Prescription</h2>
                </div>
                <div className="p-6">
                  <PrescriptionForm
                    consultationId={consultation.id}
                    onSuccess={startOrGetConsultation}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow mt-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Prescription Generated</h2>
                </div>
                <div className="p-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <span className="text-green-600 text-2xl mr-3">✓</span>
                      <div>
                        <h3 className="font-semibold text-green-900">Prescription Created Successfully</h3>
                        <p className="text-sm text-green-700">The patient can download the prescription after payment confirmation.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Diagnosis:</h4>
                      <p className="text-gray-700">{consultation.prescription.diagnosis}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Medications:</h4>
                      <div className="space-y-2">
                        {consultation.prescription.medications.map((med: any, index: number) => (
                          <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200">
                            <p className="font-medium text-gray-900">{index + 1}. {med.name}</p>
                            <p className="text-sm text-gray-600">Dosage: {med.dosage}</p>
                            <p className="text-sm text-gray-600">Frequency: {med.frequency}</p>
                            <p className="text-sm text-gray-600">Duration: {med.duration}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {consultation.prescription.instructions && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Instructions:</h4>
                        <p className="text-gray-700">{consultation.prescription.instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Confirmation */}
            <div className="mt-6">
              <PaymentConfirmation
                consultationId={consultation.id}
                onPaymentConfirmed={startOrGetConsultation}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
