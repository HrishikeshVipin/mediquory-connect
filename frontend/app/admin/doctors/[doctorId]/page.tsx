'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import type { DoctorWithCounts } from '../../../../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

export default function DoctorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const doctorId = params?.doctorId as string;
  const { isAuthenticated, role, initAuth } = useAuthStore();
  const [doctor, setDoctor] = useState<DoctorWithCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || role !== 'ADMIN')) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, role, loading, router]);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await adminApi.getDoctorById(doctorId);
        if (response.success && response.data) {
          setDoctor(response.data.doctor);
        }
      } catch (err: any) {
        console.error('Failed to fetch doctor:', err);
        setError(err.response?.data?.message || 'Failed to load doctor details');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && role === 'ADMIN' && doctorId) {
      fetchDoctor();
    } else if (!doctorId) {
      setError('Doctor ID is required');
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, role, doctorId]);

  const handleVerify = async () => {
    if (!doctor || !window.confirm('Are you sure you want to verify this doctor?')) return;

    try {
      setActionLoading(true);
      const response = await adminApi.verifyDoctor(doctor.id);
      if (response.success) {
        alert('Doctor verified successfully!');
        router.push('/admin/doctors/pending');
      }
    } catch (err: any) {
      console.error('Failed to verify doctor:', err);
      alert(err.response?.data?.message || 'Failed to verify doctor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!doctor || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      const response = await adminApi.rejectDoctor(doctor.id, rejectionReason);
      if (response.success) {
        alert('Doctor rejected successfully!');
        router.push('/admin/doctors/pending');
      }
    } catch (err: any) {
      console.error('Failed to reject doctor:', err);
      alert(err.response?.data?.message || 'Failed to reject doctor');
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
      setRejectionReason('');
    }
  };

  const handleSuspend = async () => {
    if (!doctor || !window.confirm('Are you sure you want to suspend this doctor?')) return;

    try {
      setActionLoading(true);
      const response = await adminApi.suspendDoctor(doctor.id);
      if (response.success) {
        alert('Doctor suspended successfully!');
        window.location.reload();
      }
    } catch (err: any) {
      console.error('Failed to suspend doctor:', err);
      alert(err.response?.data?.message || 'Failed to suspend doctor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!doctor || !window.confirm('Are you sure you want to reactivate this doctor?')) return;

    try {
      setActionLoading(true);
      const response = await adminApi.reactivateDoctor(doctor.id);
      if (response.success) {
        alert('Doctor reactivated successfully!');
        window.location.reload();
      }
    } catch (err: any) {
      console.error('Failed to reactivate doctor:', err);
      alert(err.response?.data?.message || 'Failed to reactivate doctor');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || role !== 'ADMIN') {
    return null;
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md">
          <div className="text-red-600 text-5xl mb-4 text-center">⚠</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">Error</h3>
          <p className="text-gray-600 text-center mb-4">{error || 'Doctor not found'}</p>
          <Link
            href="/admin/doctors/pending"
            className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Pending Doctors
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800',
      VERIFIED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      SUSPENDED: 'bg-orange-100 text-orange-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Doctor Verification</h1>
              <p className="text-sm text-gray-600 mt-1">{doctor.fullName}</p>
            </div>
            <Link
              href="/admin/doctors/pending"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to List
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Badge */}
        <div className="mb-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(doctor.status)}`}>
            {doctor.status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoField label="Full Name" value={doctor.fullName} />
              <InfoField label="Email" value={doctor.email} />
              <InfoField label="Phone" value={doctor.phone} />
              <InfoField label="Specialization" value={doctor.specialization} />
              <InfoField
                label="Registration Type"
                value={
                  doctor.registrationType === 'STATE_MEDICAL_COUNCIL'
                    ? `State Medical Council${doctor.registrationState ? ` (${doctor.registrationState})` : ''}`
                    : 'National Medical Commission'
                }
              />
              <InfoField label="Registration Number" value={doctor.registrationNo} />
              <InfoField
                label="Aadhaar Number"
                value={doctor.aadhaarNumber || 'Not provided'}
                mono
              />
              <InfoField label="Submitted On" value={formatDate(doctor.createdAt)} />
            </div>

            {doctor._count && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Platform Activity</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{doctor._count.patients}</p>
                    <p className="text-sm text-gray-600">Patients</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{doctor._count.consultations}</p>
                    <p className="text-sm text-gray-600">Consultations</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{doctor._count.prescriptions}</p>
                    <p className="text-sm text-gray-600">Prescriptions</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Subscription Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoField label="Subscription Status" value={doctor.subscriptionStatus} />
              <InfoField label="Patients Created" value={`${doctor.patientsCreated} / ${doctor.subscriptionStatus === 'TRIAL' ? '2' : '∞'}`} />
              <InfoField label="Trial Ends At" value={formatDate(doctor.trialEndsAt)} />
              {doctor.subscriptionEndsAt && (
                <InfoField label="Subscription Ends At" value={formatDate(doctor.subscriptionEndsAt)} />
              )}
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Uploaded Documents</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DocumentViewer
                title="Profile Photo"
                path={doctor.profilePhoto}
                type="image"
              />
              <DocumentViewer
                title="Registration Certificate"
                path={doctor.registrationCertificate}
                type="document"
              />
              <DocumentViewer
                title="Aadhaar Front Photo"
                path={doctor.aadhaarFrontPhoto}
                type="image"
              />
              <DocumentViewer
                title="Aadhaar Back Photo"
                path={doctor.aadhaarBackPhoto}
                type="image"
              />
            </div>
          </div>
        </div>

        {/* UPI Info */}
        {doctor.upiId && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label="UPI ID" value={doctor.upiId} mono />
                {doctor.qrCodeImage && (
                  <DocumentViewer
                    title="QR Code"
                    path={doctor.qrCodeImage}
                    type="image"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rejection Reason */}
        {doctor.status === 'REJECTED' && doctor.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Rejection Reason</h3>
            <p className="text-red-700">{doctor.rejectionReason}</p>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              {doctor.status === 'PENDING_VERIFICATION' && (
                <>
                  <button
                    onClick={handleVerify}
                    disabled={actionLoading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    ✓ Verify Doctor
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    ✗ Reject Doctor
                  </button>
                </>
              )}

              {doctor.status === 'VERIFIED' && (
                <button
                  onClick={handleSuspend}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Suspend Doctor
                </button>
              )}

              {doctor.status === 'SUSPENDED' && (
                <button
                  onClick={handleReactivate}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Reactivate Doctor
                </button>
              )}

              {doctor.status === 'REJECTED' && (
                <button
                  onClick={handleVerify}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Verify Doctor (Override Rejection)
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Doctor</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this doctor's application. This will be shown to the doctor.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={4}
              placeholder="e.g., Invalid registration certificate, Aadhaar photos unclear, etc."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface InfoFieldProps {
  label: string;
  value: string | number;
  mono?: boolean;
}

function InfoField({ label, value, mono }: InfoFieldProps) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-base font-medium text-gray-900 ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}

interface DocumentViewerProps {
  title: string;
  path?: string | null;
  type: 'image' | 'document';
}

function DocumentViewer({ title, path, type }: DocumentViewerProps) {
  if (!path) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <p className="text-xs text-gray-400 mt-1">Not uploaded</p>
      </div>
    );
  }

  const fullUrl = `${BASE_URL}/${path}`;

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
        <p className="text-xs font-medium text-gray-700">{title}</p>
      </div>
      <div className="p-3">
        {type === 'image' ? (
          <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="block">
            <img
              src={fullUrl}
              alt={title}
              className="w-full h-32 object-cover bg-gray-100 rounded cursor-pointer hover:opacity-90 transition"
            />
            <p className="text-xs text-center text-blue-600 mt-2">Click to view full size</p>
          </a>
        ) : (
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center py-4 text-blue-600 hover:text-blue-700"
          >
            <div className="text-2xl mb-1">📄</div>
            <div className="text-xs font-medium">View Document</div>
          </a>
        )}
      </div>
    </div>
  );
}
