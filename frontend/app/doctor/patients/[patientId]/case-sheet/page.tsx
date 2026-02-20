'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../../../store/authStore';
import { patientApi } from '../../../../../lib/api';
import AnimatedBackground from '../../../../../components/AnimatedBackground';
import NotificationBell from '../../../../../components/NotificationBell';

interface PatientInfo {
  id: string;
  fullName: string;
  age?: number;
  gender?: string;
  phone?: string;
  createdAt: string;
}

interface PatientHistory {
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
  pastSurgeries?: string;
  familyHistory?: string;
  currentMedications?: string;
  smoking?: string;
  alcohol?: string;
  occupation?: string;
}

interface Visit {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: string;
  chiefComplaint?: string;
  doctorNotes?: string;
  prescription?: {
    id: string;
    diagnosis: string;
    medications: { name: string; dosage: string; frequency: string; duration: string }[];
    instructions?: string;
  } | null;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const SMOKING_OPTIONS = ['Never', 'Former', 'Current'];
const ALCOHOL_OPTIONS = ['Never', 'Occasional', 'Regular'];

export default function CaseSheetPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  const { isAuthenticated, role, initialized, initAuth } = useAuthStore();

  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [history, setHistory] = useState<PatientHistory>({});
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated || role !== 'DOCTOR') {
      router.push('/doctor/login');
      return;
    }
    fetchCaseSheet();
  }, [initialized, isAuthenticated, role, patientId]);

  const fetchCaseSheet = async () => {
    try {
      setLoading(true);
      const response = await patientApi.getCaseSheet(patientId);
      if (response.success && response.data) {
        setPatient(response.data.patient);
        setHistory(response.data.history || {});
        setVisits(response.data.visits || []);
      }
    } catch (error: any) {
      console.error('Error fetching case sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError('');
      setSaveSuccess(false);
      await patientApi.updateCaseSheet(patientId, history as Record<string, string>);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      setSaveError(error.response?.data?.message || 'Failed to save history');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40">
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-lg text-blue-900">Loading case sheet...</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40">
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-lg text-red-600">Failed to load case sheet</div>
        </div>
      </div>
    );
  }

  const patientSince = new Date(patient.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40">
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-lg border-b border-cyan-200/50 shadow-lg shadow-cyan-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-blue-900">Case Sheet</h1>
                <p className="text-sm text-gray-700">{patient.fullName}</p>
              </div>
              <NotificationBell />
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/doctor/patients/${patientId}/consult`}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl transition-all hover:scale-105 text-sm"
              >
                Open Consultation
              </Link>
              <Link
                href="/doctor/patients"
                className="px-4 py-2 text-gray-700 hover:bg-cyan-50/50 rounded-xl border border-cyan-200/50 transition-all hover:scale-105 text-sm"
              >
                Back to Patients
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Section 1 — Patient Demographics */}
        <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-6">
          <h2 className="text-lg font-bold text-blue-900 mb-4">Patient Information</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Full Name</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{patient.fullName}</p>
            </div>
            {patient.age && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Age</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{patient.age} years</p>
              </div>
            )}
            {patient.gender && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Gender</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{patient.gender}</p>
              </div>
            )}
            {patient.phone && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{patient.phone}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Patient Since</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{patientSince}</p>
            </div>
          </div>
        </div>

        {/* Section 2 — Patient History (editable) */}
        <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-blue-900">Clinical Background</h2>
            <div className="flex items-center gap-3">
              {saveSuccess && (
                <span className="text-sm text-green-600 font-medium">Saved successfully</span>
              )}
              {saveError && (
                <span className="text-sm text-red-600">{saveError}</span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl transition-all hover:scale-105 text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {saving ? 'Saving...' : 'Save History'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Blood Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
              <select
                value={history.bloodGroup || ''}
                onChange={(e) => setHistory({ ...history, bloodGroup: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Not specified</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
              <input
                type="text"
                value={history.occupation || ''}
                onChange={(e) => setHistory({ ...history, occupation: e.target.value || undefined })}
                placeholder="e.g. Teacher, Farmer, Software Engineer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Smoking */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Smoking</label>
              <select
                value={history.smoking || ''}
                onChange={(e) => setHistory({ ...history, smoking: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Not specified</option>
                {SMOKING_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Alcohol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alcohol Use</label>
              <select
                value={history.alcohol || ''}
                onChange={(e) => setHistory({ ...history, alcohol: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Not specified</option>
                {ALCOHOL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Allergies */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
              <textarea
                value={history.allergies || ''}
                onChange={(e) => setHistory({ ...history, allergies: e.target.value || undefined })}
                placeholder="e.g. Penicillin, Sulfa drugs, Aspirin"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Chronic Conditions */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Chronic Conditions</label>
              <textarea
                value={history.chronicConditions || ''}
                onChange={(e) => setHistory({ ...history, chronicConditions: e.target.value || undefined })}
                placeholder="e.g. Diabetes Type 2, Hypertension, Asthma"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Current Medications (pre-treatment) */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Medications <span className="text-gray-400 font-normal">(before treatment)</span>
              </label>
              <textarea
                value={history.currentMedications || ''}
                onChange={(e) => setHistory({ ...history, currentMedications: e.target.value || undefined })}
                placeholder="e.g. Metformin 500mg, Atenolol 25mg"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Past Surgeries */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Past Surgeries / Procedures</label>
              <textarea
                value={history.pastSurgeries || ''}
                onChange={(e) => setHistory({ ...history, pastSurgeries: e.target.value || undefined })}
                placeholder="e.g. Appendectomy 2015, ACL repair 2019"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Family History */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Family History</label>
              <textarea
                value={history.familyHistory || ''}
                onChange={(e) => setHistory({ ...history, familyHistory: e.target.value || undefined })}
                placeholder="e.g. Father — Heart disease, Mother — Diabetes"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 3 — Visit Timeline */}
        <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-6">
          <h2 className="text-lg font-bold text-blue-900 mb-5">
            Visit Timeline
            <span className="ml-2 text-sm font-normal text-gray-500">({visits.length} visit{visits.length !== 1 ? 's' : ''})</span>
          </h2>

          {visits.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-5xl mb-3 block">📋</span>
              <p className="text-gray-500">No consultations recorded yet.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-cyan-200" />

              <div className="space-y-6 pl-12">
                {visits.map((visit, index) => {
                  const visitDate = new Date(visit.startedAt);
                  const dateLabel = visitDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                  const timeLabel = visitDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div key={visit.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-8 top-3 w-3 h-3 rounded-full bg-cyan-500 border-2 border-white shadow" />

                      <div className="border border-cyan-200/50 rounded-2xl p-4 bg-white/50 hover:shadow-md transition-all">
                        {/* Visit header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">{dateLabel}</p>
                            <p className="text-xs text-gray-500">{timeLabel}</p>
                          </div>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            visit.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : visit.status === 'ACTIVE'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {visit.status}
                          </span>
                        </div>

                        {/* Chief Complaint & Notes */}
                        {(visit.chiefComplaint || visit.doctorNotes) && (
                          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            {visit.chiefComplaint && (
                              <div className="mb-1.5">
                                <span className="text-xs font-semibold text-blue-900">Chief Complaint: </span>
                                <span className="text-sm text-blue-800">{visit.chiefComplaint}</span>
                              </div>
                            )}
                            {visit.doctorNotes && (
                              <div>
                                <span className="text-xs font-semibold text-blue-900">Doctor's Notes: </span>
                                <span className="text-sm text-blue-800">{visit.doctorNotes}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Prescription */}
                        {visit.prescription ? (
                          <div className="mt-2">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm">💊</span>
                              <span className="text-sm font-semibold text-gray-900">
                                Diagnosis: <span className="font-normal">{visit.prescription.diagnosis}</span>
                              </span>
                            </div>
                            {visit.prescription.medications && visit.prescription.medications.length > 0 && (
                              <div className="pl-5 space-y-1 mb-2">
                                {visit.prescription.medications.map((med, i) => (
                                  <div key={i} className="text-xs text-gray-700 bg-gray-50 rounded px-2 py-1 border border-gray-100">
                                    <span className="font-medium">{med.name}</span>
                                    {' — '}
                                    {med.dosage} · {med.frequency} · {med.duration}
                                  </div>
                                ))}
                              </div>
                            )}
                            {visit.prescription.instructions && (
                              <p className="text-xs text-gray-600 pl-5">
                                <span className="font-medium">Instructions: </span>
                                {visit.prescription.instructions}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic mt-2">No prescription issued</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
