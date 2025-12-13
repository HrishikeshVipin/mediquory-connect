'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import type { Doctor } from '../../../../types';

export default function PendingDoctorsPage() {
  const router = useRouter();
  const { isAuthenticated, role, initAuth } = useAuthStore();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || role !== 'ADMIN')) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, role, loading, router]);

  useEffect(() => {
    const fetchPendingDoctors = async () => {
      try {
        const response = await adminApi.getPendingDoctors();
        if (response.success && response.data) {
          setDoctors(response.data.doctors);
        }
      } catch (err: any) {
        console.error('Failed to fetch pending doctors:', err);
        setError(err.response?.data?.message || 'Failed to load pending doctors');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && role === 'ADMIN') {
      fetchPendingDoctors();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, role]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pending Verifications</h1>
              <p className="text-sm text-gray-600 mt-1">
                {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} awaiting verification
              </p>
            </div>
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {doctors.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-5xl mb-4">✓</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">No pending doctor verifications at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface DoctorCardProps {
  doctor: Doctor;
}

function DoctorCard({ doctor }: DoctorCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <span className="text-xl font-semibold text-yellow-700">
                  {doctor.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{doctor.fullName}</h3>
                <p className="text-sm text-gray-600">{doctor.specialization}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{doctor.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-900">{doctor.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Registration Type</p>
                <p className="text-sm font-medium text-gray-900">
                  {doctor.registrationType === 'STATE_MEDICAL_COUNCIL'
                    ? `State Medical Council${doctor.registrationState ? ` (${doctor.registrationState})` : ''}`
                    : 'National Medical Commission'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Registration Number</p>
                <p className="text-sm font-medium text-gray-900">{doctor.registrationNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Aadhaar</p>
                <p className="text-sm font-medium text-gray-900 font-mono">
                  {doctor.aadhaarNumber
                    ? `XXXX-XXXX-${doctor.aadhaarNumber.substring(8)}`
                    : 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Submitted</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(doctor.createdAt)}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {doctor.registrationCertificate && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Registration Certificate ✓
                </span>
              )}
              {doctor.aadhaarFrontPhoto && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Aadhaar Front ✓
                </span>
              )}
              {doctor.aadhaarBackPhoto && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Aadhaar Back ✓
                </span>
              )}
              {doctor.profilePhoto && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Profile Photo ✓
                </span>
              )}
            </div>
          </div>

          <div className="ml-6">
            <Link
              href={`/admin/doctors/${doctor.id}`}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Review →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
