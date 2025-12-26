'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePatientAuth } from '@/store/patientAuthStore';
import { doctorDiscovery } from '@/lib/api';
import Link from 'next/link';
import AnimatedBackground from '@/components/AnimatedBackground';

interface Doctor {
  id: string;
  fullName: string;
  specialization: string;
  doctorType: string;
  yearsExperience?: number;
  consultationFee?: number;
  bio?: string;
  profilePhoto?: string;
  isOnline: boolean;
  totalReviews: number;
  averageRating?: number;
  languagesSpoken?: string[];
}

export default function DoctorSearchPage() {
  const router = useRouter();
  const { isAuthenticated } = usePatientAuth();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if patient signup is enabled
  useEffect(() => {
    const checkPatientSignupEnabled = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/system-settings/public/ENABLE_PATIENT_SIGNUP`);
        const data = await response.json();
        const isEnabled = data.success && data.data?.value === true;

        if (!isEnabled) {
          router.replace('/patient/coming-soon');
        }
      } catch (error) {
        console.error('Failed to check patient signup setting:', error);
      }
    };

    checkPatientSignupEnabled();
  }, [router]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    doctorType: '',
    specialization: '',
    isOnline: false,
    sortBy: 'rating',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [specializations, setSpecializations] = useState<string[]>([]);

  // Check if patient signup is enabled
  useEffect(() => {
    const isPatientSignupEnabled = process.env.NEXT_PUBLIC_ENABLE_PATIENT_SIGNUP === 'true';
    if (!isPatientSignupEnabled) {
      router.replace('/patient/coming-soon');
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/patient/login');
      return;
    }

    fetchSpecializations();
    fetchDoctors();
  }, [isAuthenticated, filters, page]);

  const fetchSpecializations = async () => {
    try {
      const response = await doctorDiscovery.getSpecializations();
      if (response.success && response.data) {
        setSpecializations(response.data.specializations);
      }
    } catch (error) {
      console.error('Failed to fetch specializations:', error);
    }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await doctorDiscovery.search({
        search: searchTerm || undefined,
        doctorType: filters.doctorType || undefined,
        specialization: filters.specialization || undefined,
        isOnline: filters.isOnline || undefined,
        sortBy: filters.sortBy,
        page,
        limit: 12,
      });

      if (response.success && response.data) {
        setDoctors(response.data.doctors);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchDoctors();
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`w-4 h-4 ${i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    return stars;
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
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Find Doctors</h1>
                <p className="text-xs text-gray-600">Search by specialization or type</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-4 sm:p-6 mb-6">
          {/* Search Bar */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name or specialization..."
                className="w-full pl-12 pr-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <svg className="w-5 h-5 text-cyan-600 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
            >
              Search
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              value={filters.doctorType}
              onChange={(e) => setFilters({ ...filters, doctorType: e.target.value })}
              className="px-4 py-2 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">All Types</option>
              <option value="ALLOPATHY">Allopathy</option>
              <option value="AYURVEDA">Ayurveda</option>
              <option value="HOMEOPATHY">Homeopathy</option>
            </select>

            <select
              value={filters.specialization}
              onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
              className="px-4 py-2 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">All Specializations</option>
              {specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="px-4 py-2 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="rating">Highest Rated</option>
              <option value="experience">Most Experienced</option>
              <option value="fee">Lowest Fee</option>
              <option value="name">Name (A-Z)</option>
            </select>

            <label className="flex items-center gap-2 px-4 py-2 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl cursor-pointer hover:bg-white/70 transition-all">
              <input
                type="checkbox"
                checked={filters.isOnline}
                onChange={(e) => setFilters({ ...filters, isOnline: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-900 font-medium">Online Only</span>
            </label>
          </div>
        </div>

        {/* Results Count */}
        {!loading && (
          <p className="text-sm font-medium text-gray-700 mb-4">
            Found <span className="text-blue-600 font-bold">{doctors.length}</span> {doctors.length === 1 ? 'doctor' : 'doctors'}
          </p>
        )}

        {/* Doctors Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Searching for doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
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
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-900 font-bold mb-2">No doctors found</p>
            <p className="text-sm text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <Link
                key={doctor.id}
                href={`/patient/doctors/${doctor.id}`}
                className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg shadow-cyan-500/10 border border-cyan-200/50 p-6 hover:shadow-xl hover:shadow-cyan-500/20 transition-all hover:scale-105 group"
              >
                {/* Doctor Avatar */}
                <div className="flex items-start gap-4 mb-4">
                  {doctor.profilePhoto ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}${doctor.profilePhoto}`}
                      alt={doctor.fullName}
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0 shadow-md border-2 border-cyan-200"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                      <svg
                        className="w-8 h-8 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                      {doctor.fullName}
                    </h3>
                    <p className="text-sm text-gray-700 font-medium">{doctor.specialization}</p>
                    <span className="inline-block mt-1 text-xs bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-3 py-1 rounded-full font-medium shadow-sm">
                      {doctor.doctorType}
                    </span>
                  </div>
                  {doctor.isOnline && (
                    <span className="flex-shrink-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-md animate-pulse"></span>
                  )}
                </div>

                {/* Rating */}
                {doctor.totalReviews > 0 && (
                  <div className="flex items-center gap-2 mb-3 bg-yellow-50/50 rounded-xl px-3 py-2">
                    <div className="flex">{renderStars(doctor.averageRating || 0)}</div>
                    <span className="text-sm font-bold text-gray-900">
                      {doctor.averageRating?.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-600">
                      ({doctor.totalReviews} {doctor.totalReviews === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}

                {/* Experience & Fee */}
                <div className="flex items-center justify-between text-sm mb-3 bg-blue-50/50 rounded-xl px-3 py-2">
                  {doctor.yearsExperience && (
                    <span className="text-gray-800 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {doctor.yearsExperience} {doctor.yearsExperience === 1 ? 'year' : 'years'}
                    </span>
                  )}
                  {doctor.consultationFee && (
                    <span className="font-bold text-green-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      ₹{(doctor.consultationFee / 100).toFixed(0)}
                    </span>
                  )}
                </div>

                {/* Languages */}
                {doctor.languagesSpoken && doctor.languagesSpoken.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {doctor.languagesSpoken.slice(0, 3).map((lang, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-cyan-50 text-cyan-700 px-2.5 py-1 rounded-lg font-medium border border-cyan-200"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bio */}
                {doctor.bio && (
                  <p className="text-sm text-gray-700 line-clamp-2 mb-4 italic">{doctor.bio}</p>
                )}

                {/* CTA Button */}
                <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white py-2.5 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-blue-500/30">
                  View Profile
                </button>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-5 py-2.5 bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-600 hover:text-white hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 font-medium text-gray-900 shadow-md disabled:hover:scale-100"
            >
              Previous
            </button>
            <span className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-5 py-2.5 bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-600 hover:text-white hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 font-medium text-gray-900 shadow-md disabled:hover:scale-100"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
