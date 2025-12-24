'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePatientAuth } from '@/store/patientAuthStore';
import { patientAuth } from '@/lib/api';
import Link from 'next/link';
import AnimatedBackground from '@/components/AnimatedBackground';

interface Consultation {
  id: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  chiefComplaint?: string;
  doctorNotes?: string;
  doctor: {
    id: string;
    fullName: string;
    specialization: string;
    profilePhoto?: string;
  };
  prescription?: {
    id: string;
    diagnosis: string;
    medications: any;
    pdfPath?: string;
  };
  review?: {
    id: string;
    rating: number;
    reviewText: string;
  };
  paymentConfirmation?: {
    amount: number;
    confirmedByDoctor: boolean;
  };
}

export default function MyConsultationsPage() {
  const router = useRouter();
  const { isAuthenticated } = usePatientAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/patient/login');
      return;
    }

    fetchConsultations();
  }, [isAuthenticated]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const response = await patientAuth.getMyConsultations();
      if (response.success && response.data) {
        setConsultations(response.data.consultations);
      }
    } catch (error) {
      console.error('Failed to fetch consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConsultations = consultations.filter((c) => {
    if (filter === 'completed') return c.status === 'COMPLETED';
    if (filter === 'pending') return c.status !== 'COMPLETED';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40 relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-lg border-b border-cyan-200/50 sticky top-0 shadow-lg shadow-cyan-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/patient/dashboard">
                <button className="p-2 hover:bg-cyan-50 rounded-xl transition-all hover:scale-105">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </Link>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">My Consultations</h1>
                <p className="text-xs text-gray-600">View your consultation history</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
                  : 'bg-white/50 text-gray-700 hover:bg-white/80'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === 'completed'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
                  : 'bg-white/50 text-gray-700 hover:bg-white/80'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === 'pending'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
                  : 'bg-white/50 text-gray-700 hover:bg-white/80'
              }`}
            >
              Pending
            </button>
          </div>
        </div>

        {/* Consultations List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Loading consultations...</p>
          </div>
        ) : filteredConsultations.length === 0 ? (
          <div className="text-center py-12 bg-white/70 backdrop-blur-xl rounded-3xl border border-cyan-200/50 shadow-lg shadow-cyan-500/10">
            <svg
              className="w-16 h-16 text-cyan-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-900 font-bold mb-2">No consultations found</p>
            <p className="text-sm text-gray-600 mb-4">You haven't had any consultations yet</p>
            <Link
              href="/patient/doctors"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
            >
              Find a Doctor
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConsultations.map((consultation) => (
              <div
                key={consultation.id}
                className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl p-6 shadow-lg shadow-cyan-500/10 hover:shadow-xl hover:shadow-cyan-500/20 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{consultation.doctor.fullName}</h3>
                      <p className="text-sm text-gray-600">{consultation.doctor.specialization}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(consultation.startedAt)}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(consultation.status)}`}>
                    {consultation.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Chief Complaint */}
                {consultation.chiefComplaint && (
                  <div className="mb-3 bg-blue-50/50 rounded-xl p-3">
                    <p className="text-xs text-gray-600 font-medium mb-1">Chief Complaint</p>
                    <p className="text-sm text-gray-900">{consultation.chiefComplaint}</p>
                  </div>
                )}

                {/* Doctor Notes */}
                {consultation.doctorNotes && (
                  <div className="mb-3 bg-green-50/50 rounded-xl p-3">
                    <p className="text-xs text-gray-600 font-medium mb-1">Doctor Notes</p>
                    <p className="text-sm text-gray-900">{consultation.doctorNotes}</p>
                  </div>
                )}

                {/* Prescription */}
                {consultation.prescription && (
                  <div className="mb-3 bg-purple-50/50 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 font-medium mb-1">Prescription Available</p>
                        <p className="text-sm text-gray-900">{consultation.prescription.diagnosis}</p>
                      </div>
                      {consultation.prescription.pdfPath && (
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL}${consultation.prescription.pdfPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Download PDF
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Review */}
                {consultation.review && (
                  <div className="mb-3 bg-yellow-50/50 rounded-xl p-3">
                    <p className="text-xs text-gray-600 font-medium mb-1">Your Review</p>
                    <div className="flex items-center gap-2 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < consultation.review!.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm text-gray-900">{consultation.review.reviewText}</p>
                  </div>
                )}

                {/* Payment Status */}
                {consultation.paymentConfirmation && (
                  <div className="flex items-center justify-between bg-green-50/50 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-green-700 font-semibold">
                        Payment {consultation.paymentConfirmation.confirmedByDoctor ? 'Confirmed' : 'Pending'}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-green-700">₹{(consultation.paymentConfirmation.amount / 100).toFixed(2)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
