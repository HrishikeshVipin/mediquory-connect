'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePatientAuth } from '@/store/patientAuthStore';
import Link from 'next/link';
import AnimatedBackground from '@/components/AnimatedBackground';

export default function PatientDashboard() {
  const router = useRouter();
  const { patient, isAuthenticated, logout } = usePatientAuth();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/patient/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/patient/login');
  };

  if (!isAuthenticated || !patient) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40">
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-200 border-t-cyan-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 border-b border-cyan-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Mediquory Connect"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-900 via-cyan-600 to-blue-900 bg-clip-text text-transparent">
                  Mediquory Connect
                </h1>
                <p className="text-xs text-gray-600 font-medium">Patient Portal</p>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-white/80 backdrop-blur-sm rounded-xl transition-colors border border-cyan-200/50"
              >
                <svg
                  className="w-6 h-6 text-blue-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-cyan-200/50 z-20">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50/80 rounded-xl font-medium transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-xl shadow-cyan-500/20">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Welcome back, {patient.fullName}!
          </h2>
          <p className="text-cyan-100 mb-4">
            {patient.age && patient.gender
              ? `${patient.age} years, ${patient.gender}`
              : 'Complete your profile for better care'}
          </p>
          <div className="flex items-center gap-2 text-cyan-100">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            <span className="text-sm font-medium">+91-{patient.phone}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {/* Find Doctors */}
          <Link
            href="/patient/doctors"
            className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl p-6 hover:bg-white/80 hover:border-cyan-400/60 hover:scale-105 hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-cyan-500/10 hover:shadow-2xl hover:shadow-cyan-500/20 group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-blue-900 mb-1">Find Doctors</h3>
            <p className="text-sm text-gray-600">
              Search by specialization, type, or rating
            </p>
          </Link>

          {/* My Consultations */}
          <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl p-6 shadow-lg shadow-cyan-500/10">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
              <svg
                className="w-6 h-6 text-white"
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
            </div>
            <h3 className="text-lg font-bold text-blue-900 mb-1">My Consultations</h3>
            <p className="text-sm text-gray-600">View past and upcoming appointments</p>
            <p className="text-xs text-cyan-600 mt-2 italic font-medium">Coming soon...</p>
          </div>

          {/* Health Records */}
          <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl p-6 shadow-lg shadow-cyan-500/10">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-blue-900 mb-1">Health Records</h3>
            <p className="text-sm text-gray-600">Upload and manage your medical reports</p>
            <p className="text-xs text-cyan-600 mt-2 italic font-medium">Coming soon...</p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* How it Works */}
          <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl p-6 shadow-lg shadow-cyan-500/10">
            <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-cyan-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              How It Works
            </h3>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                  1
                </span>
                <p className="text-sm text-gray-700">Search for doctors by specialization or type</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                  2
                </span>
                <p className="text-sm text-gray-700">Book a consultation with available doctors</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                  3
                </span>
                <p className="text-sm text-gray-700">
                  Get diagnosis, prescription, and follow-up care
                </p>
              </li>
            </ol>
          </div>

          {/* Profile Info */}
          <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl p-6 shadow-lg shadow-cyan-500/10">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Your Profile</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-cyan-200/50">
                <span className="text-sm text-gray-600 font-medium">Name</span>
                <span className="text-sm font-semibold text-blue-900">{patient.fullName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-cyan-200/50">
                <span className="text-sm text-gray-600 font-medium">Phone</span>
                <span className="text-sm font-semibold text-blue-900">+91-{patient.phone}</span>
              </div>
              {patient.age && (
                <div className="flex justify-between items-center py-2 border-b border-cyan-200/50">
                  <span className="text-sm text-gray-600 font-medium">Age</span>
                  <span className="text-sm font-semibold text-blue-900">{patient.age} years</span>
                </div>
              )}
              {patient.gender && (
                <div className="flex justify-between items-center py-2 border-b border-cyan-200/50">
                  <span className="text-sm text-gray-600 font-medium">Gender</span>
                  <span className="text-sm font-semibold text-blue-900">{patient.gender}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 font-medium">Account Type</span>
                <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-full font-semibold shadow-md">
                  {patient.accountType === 'APP_ACCOUNT' ? 'Registered' : 'Guest'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-cyan-200/50 shadow-lg lg:hidden z-50">
        <div className="grid grid-cols-3 gap-1 px-2 py-2">
          <Link
            href="/patient/dashboard"
            className="flex flex-col items-center justify-center py-2 px-3 text-cyan-600 bg-cyan-50 rounded-xl font-medium"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-xs mt-1 font-semibold">Home</span>
          </Link>

          <Link
            href="/patient/doctors"
            className="flex flex-col items-center justify-center py-2 px-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-xs mt-1 font-medium">Find Doctors</span>
          </Link>

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex flex-col items-center justify-center py-2 px-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <span className="text-xs mt-1 font-medium">Menu</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
