'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import { authApi } from '../../../lib/api';
import type { Doctor } from '../../../types';

export default function DoctorDashboard() {
  const router = useRouter();
  const { isAuthenticated, role, user, clearAuth, initAuth } = useAuthStore();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || role !== 'DOCTOR')) {
      router.push('/doctor/login');
    }
  }, [isAuthenticated, role, loading, router]);

  useEffect(() => {
    if (isAuthenticated && role === 'DOCTOR' && user) {
      setDoctor(user as Doctor);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, role, user]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      router.push('/doctor/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || role !== 'DOCTOR' || !doctor) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'PENDING_VERIFICATION':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'SUSPENDED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'Your account is verified and active';
      case 'PENDING_VERIFICATION':
        return 'Your account is under review. You will be notified once verified.';
      case 'REJECTED':
        return doctor.rejectionReason || 'Your application was rejected';
      case 'SUSPENDED':
        return 'Your account has been suspended';
      default:
        return status;
    }
  };

  const trialDaysLeft = Math.ceil(
    (new Date(doctor.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-2xl font-bold text-gradient">Bhishak</h1>
                <p className="text-sm text-slate-500">Doctor Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">Dr. {doctor.fullName}</p>
                <p className="text-xs text-slate-500">{doctor.specialization}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, Dr. {doctor.fullName}</h2>
          <p className="text-slate-600">Here's what's happening with your practice today</p>
        </div>

        {/* Verification Status */}
        <div className="mb-6">
          <div className={`rounded-xl p-5 ${getStatusColor(doctor.status)}`}>
            <div className="flex items-center gap-3">
              <div className="text-3xl">
                {doctor.status === 'VERIFIED' && '✓'}
                {doctor.status === 'PENDING_VERIFICATION' && '⏳'}
                {doctor.status === 'REJECTED' && '✗'}
                {doctor.status === 'SUSPENDED' && '⚠'}
              </div>
              <div>
                <h2 className="text-base font-bold mb-1">Account Status</h2>
                <p className="text-sm opacity-90">{getStatusMessage(doctor.status)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Modern Grid */}
        {doctor.status === 'VERIFIED' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-cyan-100 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase">Subscription</h3>
                  <p className="text-2xl font-bold text-slate-900">{doctor.subscriptionStatus}</p>
                </div>
              </div>
              {doctor.subscriptionStatus === 'TRIAL' && (
                <p className="text-sm text-cyan-600 font-medium">
                  {trialDaysLeft > 0 ? `${trialDaysLeft} days remaining` : 'Trial expired'}
                </p>
              )}
            </div>

            <div className="bg-white border border-emerald-100 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase">Patients</h3>
                  <p className="text-2xl font-bold text-slate-900">
                    {doctor.patientsCreated} / {doctor.subscriptionStatus === 'TRIAL' ? '2' : '∞'}
                  </p>
                </div>
              </div>
              {doctor.subscriptionStatus === 'TRIAL' && (
                <p className="text-sm text-emerald-600 font-medium">Trial limit</p>
              )}
            </div>

            <div className="bg-white border border-amber-100 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase">Specialization</h3>
                  <p className="text-xl font-bold text-slate-900">{doctor.specialization}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Full Name</p>
              <p className="text-base font-semibold text-slate-900">{doctor.fullName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email</p>
              <p className="text-base font-semibold text-slate-900">{doctor.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Phone</p>
              <p className="text-base font-semibold text-slate-900">{doctor.phone}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Specialization</p>
              <p className="text-base font-semibold text-slate-900">{doctor.specialization}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Registration Type</p>
              <p className="text-base font-semibold text-slate-900">
                {doctor.registrationType === 'STATE_MEDICAL_COUNCIL'
                  ? `State Medical Council${doctor.registrationState ? ` (${doctor.registrationState})` : ''}`
                  : 'National Medical Commission'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Registration Number</p>
              <p className="text-base font-semibold text-slate-900">{doctor.registrationNo}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {doctor.status === 'VERIFIED' && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/doctor/patients/new"
                className="bg-white border-2 border-cyan-200 rounded-xl p-6 hover:border-cyan-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Create Patient</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Add a new patient to your practice
                </p>
              </Link>

              <Link
                href="/doctor/patients"
                className="bg-white border-2 border-emerald-200 rounded-xl p-6 hover:border-emerald-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">View Patients</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Manage your patient list
                </p>
              </Link>

              <button
                onClick={() => alert('Subscription Management - Coming in Phase 9!\n\nFeatures:\n- View subscription details\n- Upgrade from trial\n- Razorpay payment integration\n- Unlimited patients after subscription')}
                className="bg-white border-2 border-amber-200 rounded-xl p-6 hover:border-amber-400 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Subscription</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Manage your subscription
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Pending Verification Message */}
        {doctor.status === 'PENDING_VERIFICATION' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">What's Next?</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span className="text-slate-700">Our admin team is reviewing your application and documents</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span className="text-slate-700">You will receive an email notification once verification is complete</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span className="text-slate-700">This process typically takes 1-2 business days</span>
              </li>
            </ul>
          </div>
        )}

        {/* Rejected Message */}
        {doctor.status === 'REJECTED' && doctor.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Rejection Reason</h3>
            <p className="text-slate-700 mb-4">{doctor.rejectionReason}</p>
            <p className="text-sm text-slate-600">
              Please contact our support team if you believe this was an error or need clarification.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
