'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePatientAuth } from '@/store/patientAuthStore';
import Link from 'next/link';
import AnimatedBackground from '@/components/AnimatedBackground';
import { appointmentApi } from '@/lib/api';
import type { DoctorAvailability, TimePreference } from '@/types';

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
  email?: string;
  phone?: string;
}

interface Review {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function DoctorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = usePatientAuth();
  const doctorId = params.doctorId as string;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<DoctorAvailability | null>(null);

  // Appointment request form
  const [requestedDate, setRequestedDate] = useState('');
  const [timePreference, setTimePreference] = useState<TimePreference>('MORNING');
  const [reason, setReason] = useState('');
  const [consultationType, setConsultationType] = useState<'VIDEO' | 'CHAT' | 'BOTH'>('VIDEO');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/patient/login');
      return;
    }

    fetchDoctorProfile();
  }, [isAuthenticated, doctorId]);

  const fetchDoctorProfile = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call to get doctor public profile
      // const response = await doctorApi.getPublicProfile(doctorId);

      // For now, using mock data
      setTimeout(() => {
        setDoctor({
          id: doctorId,
          fullName: 'Dr. Sample Doctor',
          specialization: 'Cardiology',
          doctorType: 'ALLOPATHY',
          yearsExperience: 15,
          consultationFee: 50000, // in paise
          bio: 'Experienced cardiologist specializing in preventive cardiology and heart disease management. Committed to providing personalized care to all patients.',
          isOnline: true,
          totalReviews: 127,
          averageRating: 4.8,
          languagesSpoken: ['English', 'Hindi', 'Malayalam'],
          email: 'doctor@example.com',
          phone: '+91 98765 43210',
        });

        // Mock availability data
        setAvailability({
          monday: { enabled: true, start: '09:00', end: '17:00' },
          tuesday: { enabled: true, start: '09:00', end: '17:00' },
          wednesday: { enabled: true, start: '09:00', end: '17:00' },
          thursday: { enabled: true, start: '09:00', end: '17:00' },
          friday: { enabled: true, start: '09:00', end: '17:00' },
          saturday: { enabled: false, start: '09:00', end: '17:00' },
          sunday: { enabled: false, start: '09:00', end: '17:00' },
        });

        setReviews([
          {
            id: '1',
            patientName: 'John D.',
            rating: 5,
            comment: 'Excellent doctor! Very thorough and caring.',
            createdAt: '2025-12-15',
          },
          {
            id: '2',
            patientName: 'Sarah M.',
            rating: 4,
            comment: 'Good consultation, helpful advice.',
            createdAt: '2025-12-10',
          },
        ]);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to fetch doctor profile:', error);
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`w-5 h-5 ${i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    return stars;
  };

  const getRatingBreakdown = () => {
    // Mock data - in real app, this would come from backend
    return [
      { stars: 5, count: 85, percentage: 67 },
      { stars: 4, count: 30, percentage: 24 },
      { stars: 3, count: 8, percentage: 6 },
      { stars: 2, count: 3, percentage: 2 },
      { stars: 1, count: 1, percentage: 1 },
    ];
  };

  const handleRequestAppointment = async () => {
    if (!requestedDate || !reason.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await appointmentApi.requestAppointment({
        doctorId,
        requestedDate,
        requestedTimePreference: timePreference,
        reason,
        consultationType,
      });

      if (response.success) {
        alert('Appointment request submitted successfully! The doctor will review and respond soon.');
        // Reset form
        setRequestedDate('');
        setTimePreference('MORNING');
        setReason('');
        setConsultationType('VIDEO');

        // Optionally redirect to appointments page
        // router.push('/patient/appointments');
      } else {
        alert(response.message || 'Failed to submit appointment request');
      }
    } catch (error: any) {
      console.error('Failed to request appointment:', error);
      alert(error.message || 'Failed to submit appointment request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading doctor profile...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 font-bold text-xl mb-2">Doctor not found</p>
          <Link href="/patient/doctors" className="text-blue-600 hover:underline">
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40 relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-lg border-b border-cyan-200/50 sticky top-0 shadow-lg shadow-cyan-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/patient/doctors">
                <button className="p-2 hover:bg-cyan-50 rounded-xl transition-all hover:scale-105">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </Link>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Doctor Profile</h1>
                <p className="text-xs text-gray-600">Book your appointment</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Doctor Info & Reviews */}
          <div className="lg:col-span-2 space-y-6">
            {/* Doctor Profile Card */}
            <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-6">
              <div className="flex items-start gap-6 mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{doctor.fullName}</h2>
                      <p className="text-lg text-gray-700 font-medium">{doctor.specialization}</p>
                    </div>
                    {doctor.isOnline && (
                      <span className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Online
                      </span>
                    )}
                  </div>
                  <span className="inline-block bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-sm mb-3">
                    {doctor.doctorType}
                  </span>

                  {/* Rating */}
                  {doctor.totalReviews > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex">{renderStars(doctor.averageRating || 0)}</div>
                      <span className="text-lg font-bold text-gray-900">
                        {doctor.averageRating?.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-600">
                        ({doctor.totalReviews} reviews)
                      </span>
                    </div>
                  )}

                  {/* Experience & Fee */}
                  <div className="flex items-center gap-6 text-sm mb-3">
                    {doctor.yearsExperience && (
                      <span className="flex items-center gap-2 text-gray-800 font-medium">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {doctor.yearsExperience} years experience
                      </span>
                    )}
                    {doctor.consultationFee && (
                      <span className="flex items-center gap-2 font-bold text-green-600 text-lg">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        ₹{(doctor.consultationFee / 100).toFixed(0)} consultation
                      </span>
                    )}
                  </div>

                  {/* Languages */}
                  {doctor.languagesSpoken && doctor.languagesSpoken.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-sm text-gray-700 font-medium">Languages:</span>
                      {doctor.languagesSpoken.map((lang, idx) => (
                        <span
                          key={idx}
                          className="text-sm bg-cyan-50 text-cyan-700 px-3 py-1 rounded-lg font-medium border border-cyan-200"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              {doctor.bio && (
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200/50">
                  <h3 className="text-sm font-bold text-blue-900 mb-2">About</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{doctor.bio}</p>
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Patient Reviews</h3>

              {/* Rating Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Overall Rating */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 text-center">
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                    {doctor.averageRating?.toFixed(1)}
                  </div>
                  <div className="flex justify-center mb-2">{renderStars(doctor.averageRating || 0)}</div>
                  <p className="text-sm text-gray-600">{doctor.totalReviews} total reviews</p>
                </div>

                {/* Rating Distribution */}
                <div className="space-y-2">
                  {getRatingBreakdown().map((item) => (
                    <div key={item.stars} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 w-8">{item.stars}★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-600 h-full rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Reviews */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900">Recent Reviews</h4>
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-xl p-4 border border-cyan-200/50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{review.patientName}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Booking */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Request Appointment</h3>

              <p className="text-sm text-gray-600 mb-4">
                Submit an appointment request and the doctor will confirm the exact time.
              </p>

              {/* Doctor's General Availability */}
              {availability && (
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200/50 mb-4">
                  <h4 className="text-sm font-bold text-blue-900 mb-2">General Availability</h4>
                  <div className="space-y-1 text-xs text-gray-700">
                    {Object.entries(availability).map(([day, schedule]) => (
                      schedule.enabled && (
                        <p key={day}>
                          <span className="font-medium capitalize">{day}:</span> {schedule.start} - {schedule.end}
                        </p>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Date Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Preferred Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              {/* Time Preference */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">Time Preference</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['MORNING', 'AFTERNOON', 'EVENING'] as TimePreference[]).map((pref) => (
                    <button
                      key={pref}
                      onClick={() => setTimePreference(pref)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        timePreference === pref
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md'
                          : 'bg-white border border-cyan-200/50 text-gray-900 hover:bg-cyan-50'
                      }`}
                    >
                      {pref.charAt(0) + pref.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Consultation Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">Consultation Type</label>
                <select
                  value={consultationType}
                  onChange={(e) => setConsultationType(e.target.value as 'VIDEO' | 'CHAT' | 'BOTH')}
                  className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="VIDEO">Video Consultation</option>
                  <option value="CHAT">Chat Only</option>
                  <option value="BOTH">Video + Chat</option>
                </select>
              </div>

              {/* Reason for Appointment */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Reason for Appointment <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please describe your symptoms or reason for consultation..."
                  rows={4}
                  className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
                />
              </div>

              {/* Estimated Fee */}
              {doctor.consultationFee && (
                <div className="bg-green-50/50 rounded-xl p-3 border border-green-200/50 mb-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Estimated Fee:</span> <span className="text-green-600 font-bold">₹{(doctor.consultationFee / 100).toFixed(0)}</span>
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleRequestAppointment}
                disabled={!requestedDate || !reason.trim() || submitting}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {submitting ? 'Submitting...' : 'Request Appointment'}
              </button>

              <p className="text-xs text-gray-600 text-center mt-3">
                The doctor will review your request and confirm the exact time
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
