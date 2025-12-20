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

  // Video call timer and subscription tracking (ONLY video time counts)
  const [videoDuration, setVideoDuration] = useState(0); // in seconds - ONLY video call time
  const [videoStartTime, setVideoStartTime] = useState<number | null>(null); // When video started
  const [inOvertime, setInOvertime] = useState(false);
  const [overtimeMinutes, setOvertimeMinutes] = useState(0);
  const [showMinuteWarning, setShowMinuteWarning] = useState(false);
  const [availableMinutes, setAvailableMinutes] = useState<number | null>(null);
  const [warningLevel, setWarningLevel] = useState<string | null>(null);

  // Tab state and history data
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [consultationHistory, setConsultationHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || role !== 'DOCTOR') {
      router.push('/doctor/login');
      return;
    }

    if (patientId && user) {
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
  }, [patientId, isAuthenticated, role, user]);

  useEffect(() => {
    if (consultation && !joined && user) {
      initializeSocket();
    }
  }, [consultation, joined, user]);

  // Auto-mark messages as read when doctor opens consultation
  useEffect(() => {
    if (consultation?.id) {
      consultationApi.markAsRead(consultation.id).catch((error) => {
        console.error('Error marking messages as read:', error);
      });
    }
  }, [consultation?.id]);

  const startOrGetConsultation = async () => {
    try {
      setLoading(true);

      // Reset socket connection state for new consultation
      setJoined(false);
      if (socket) {
        disconnectSocket();
        setSocket(null);
      }

      const response = await consultationApi.startConsultation(patientId);

      if (response.success && response.data) {
        const consult = response.data.consultation;
        setConsultation(consult);
        setNotes({
          chiefComplaint: consult.chiefComplaint || '',
          doctorNotes: consult.doctorNotes || '',
        });

        // Check for minute warnings
        if (response.data.availableMinutes !== undefined) {
          setAvailableMinutes(response.data.availableMinutes);
        }
        if (response.data.warningLevel) {
          setWarningLevel(response.data.warningLevel);
          // Show warning modal if low or critical
          if (response.data.warningLevel === 'low' || response.data.warningLevel === 'critical') {
            setShowMinuteWarning(true);
          }
          // Redirect if expired/no minutes
          if (response.data.warningLevel === 'expired' || response.data.availableMinutes === 0) {
            alert('No video minutes remaining. Please purchase more minutes to start consultations.');
            router.push('/doctor/subscription');
            return;
          }
        }
      }
    } catch (error: any) {
      console.error('Error starting consultation:', error);
      if (error.response?.status === 403) {
        alert(error.response?.data?.message || 'Cannot start consultation. Please check your subscription.');
        router.push('/doctor/subscription');
      } else {
        alert('Failed to start consultation');
      }
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

  // VIDEO TIMER ONLY - runs only when video is active
  useEffect(() => {
    if (!isVideoActive || !videoStartTime || !consultation || consultation.status === 'COMPLETED') return;

    const timerInterval = setInterval(() => {
      const now = new Date().getTime();
      const elapsedSeconds = Math.floor((now - videoStartTime) / 1000);
      setVideoDuration(elapsedSeconds);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [isVideoActive, videoStartTime, consultation]);

  // Update backend with VIDEO duration every 30 seconds (only when video is active)
  useEffect(() => {
    if (!consultation || consultation.status === 'COMPLETED' || !isVideoActive || videoDuration === 0) return;

    const updateInterval = setInterval(async () => {
      try {
        const response = await consultationApi.updateVideoDuration(consultation.id, videoDuration);
        if (response.success && response.data) {
          setInOvertime(response.data.inOvertime);
          setOvertimeMinutes(response.data.overtimeMinutes);
          setAvailableMinutes(response.data.availableMinutes);
        }
      } catch (error) {
        console.error('Error updating video duration:', error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(updateInterval);
  }, [consultation, videoDuration, isVideoActive]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const endConsultation = async () => {
    if (!confirm('Are you sure you want to end this consultation?')) return;

    try {
      // End consultation with ONLY video duration (no total time)
      await consultationApi.endConsultation(consultation!.id, undefined, videoDuration);

      if (socket) {
        socket.emit('end-consultation', { consultationId: consultation!.id });
      }

      if (inOvertime) {
        alert(`Consultation ended. You used ${overtimeMinutes} minutes over your available video quota. Please recharge to continue.`);
      } else {
        alert('Consultation ended successfully');
      }
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
        setVideoStartTime(new Date().getTime()); // Start video timer
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
    // Video timer automatically stops when isVideoActive becomes false
  };

  const fetchConsultationHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await consultationApi.getPatientHistory(patientId);
      if (response.success && response.data) {
        setConsultationHistory(response.data.consultations || []);
      }
    } catch (error) {
      console.error('Error fetching consultation history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch history when switching to history tab
  useEffect(() => {
    if (activeTab === 'history' && consultationHistory.length === 0) {
      fetchConsultationHistory();
    }
  }, [activeTab]);

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
      {/* Low Minutes Warning Modal */}
      {showMinuteWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {warningLevel === 'critical' ? 'Critical: Very Low Minutes' : 'Low Video Minutes'}
                </h3>
                <p className="text-sm text-gray-700">
                  You have only <strong>{availableMinutes} minutes</strong> remaining. The consultation can continue even if you run out, but you'll need to recharge before starting new consultations.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => router.push('/doctor/subscription')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Buy More Minutes
              </button>
              <button
                onClick={() => setShowMinuteWarning(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-3">
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
            <div className="flex items-center gap-4">
              {/* Video Timer Display - Only shows when video is active */}
              {isVideoActive && (
                <div className={`px-4 py-2 rounded-lg font-mono text-lg font-bold ${inOvertime ? 'bg-red-100 text-red-800 border-2 border-red-300' : 'bg-blue-100 text-blue-800'}`}>
                  {inOvertime && <span className="text-red-600 text-sm mr-2">⚠️ OVERTIME</span>}
                  <span className="text-xs mr-2">VIDEO:</span>
                  {formatDuration(videoDuration)}
                </div>
              )}
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
          </div>

          {/* Overtime Warning Banner */}
          {inOvertime && (
            <div className="bg-red-100 border border-red-300 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚨</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-red-900">Overtime: +{overtimeMinutes} minutes over quota</p>
                  <p className="text-xs text-red-800">You can complete this consultation, but please recharge before starting new ones.</p>
                </div>
                <Link
                  href="/doctor/subscription"
                  className="px-4 py-2 bg-white text-red-900 rounded hover:bg-red-50 font-medium text-sm"
                >
                  Buy Minutes
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('current')}
                className={`${
                  activeTab === 'current'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                📋 Current Consultation
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                📚 Consultation History
              </button>
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Section - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'current' ? (
              <>
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
              </>
            ) : (
              /* History View */
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Consultation History</h2>
                  <p className="text-sm text-gray-600 mt-1">Past consultations with {consultation.patient?.fullName}</p>
                </div>
                <div className="p-6">
                  {loadingHistory ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                      <p className="text-gray-600">Loading history...</p>
                    </div>
                  ) : consultationHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="text-6xl mb-4 block">📋</span>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Previous Consultations</h3>
                      <p className="text-gray-600">This is the first consultation with this patient.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {consultationHistory.map((pastConsult: any) => (
                        <div key={pastConsult.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                          {/* Consultation Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {new Date(pastConsult.completedAt || pastConsult.startedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {new Date(pastConsult.completedAt || pastConsult.startedAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              {pastConsult.videoDuration > 0 && (
                                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                                  📹 {Math.ceil(pastConsult.videoDuration / 60)} min video
                                </span>
                              )}
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                pastConsult.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {pastConsult.status}
                              </span>
                            </div>
                          </div>

                          {/* Chief Complaint & Notes */}
                          {(pastConsult.chiefComplaint || pastConsult.doctorNotes) && (
                            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-100">
                              {pastConsult.chiefComplaint && (
                                <div className="mb-2">
                                  <h4 className="text-xs font-semibold text-blue-900 mb-1">Chief Complaint:</h4>
                                  <p className="text-sm text-blue-800">{pastConsult.chiefComplaint}</p>
                                </div>
                              )}
                              {pastConsult.doctorNotes && (
                                <div>
                                  <h4 className="text-xs font-semibold text-blue-900 mb-1">Doctor's Notes:</h4>
                                  <p className="text-sm text-blue-800">{pastConsult.doctorNotes}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Prescription */}
                          {pastConsult.prescription && (
                            <div className="mb-4">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <span>💊</span> Prescription
                              </h4>
                              <div className="pl-6 space-y-3">
                                <div>
                                  <p className="text-sm text-gray-600 font-medium">Diagnosis:</p>
                                  <p className="text-sm text-gray-900">{pastConsult.prescription.diagnosis}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 font-medium mb-2">Medications:</p>
                                  <div className="space-y-2">
                                    {JSON.parse(pastConsult.prescription.medications).map((med: any, idx: number) => (
                                      <div key={idx} className="bg-gray-50 p-2 rounded text-xs border border-gray-200">
                                        <p className="font-semibold text-gray-900">{idx + 1}. {med.name}</p>
                                        <p className="text-gray-600">
                                          {med.dosage} • {med.frequency} • {med.duration}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {pastConsult.prescription.instructions && (
                                  <div>
                                    <p className="text-sm text-gray-600 font-medium">Instructions:</p>
                                    <p className="text-sm text-gray-900">{pastConsult.prescription.instructions}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Payment Status */}
                          {pastConsult.paymentConfirmation && (
                            <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                              <p className="text-sm font-semibold text-green-900 flex items-center gap-2">
                                <span>✓</span> Payment Confirmed
                              </p>
                              <p className="text-xs text-green-700 mt-1">
                                Amount: ₹{pastConsult.paymentConfirmation.amount} •
                                Confirmed on {new Date(pastConsult.paymentConfirmation.confirmedAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
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
