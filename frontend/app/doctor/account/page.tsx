'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import { authApi, appointmentApi } from '../../../lib/api';
import AnimatedBackground from '../../../components/AnimatedBackground';
import type { Doctor, DoctorAvailability } from '../../../types';

export default function DoctorAccountPage() {
  const router = useRouter();
  const { isAuthenticated, role, user, clearAuth, initAuth } = useAuthStore();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Bio editing
  const [bio, setBio] = useState('');
  const [bioSaved, setBioSaved] = useState(false);

  // Signature upload
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string>('');
  const [signatureUploading, setSignatureUploading] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);

  // Phone change
  const [showPhoneChange, setShowPhoneChange] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Email change
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Consultation availability
  const [availability, setAvailability] = useState<DoctorAvailability>({});
  const [defaultSlotDuration, setDefaultSlotDuration] = useState(30);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [availabilitySaved, setAvailabilitySaved] = useState(false);

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
      setBio((user as Doctor).bio || '');
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, role, user]);

  // Load consultation availability
  useEffect(() => {
    const loadAvailability = async () => {
      if (isAuthenticated && role === 'DOCTOR') {
        try {
          const response = await appointmentApi.getAvailability();
          if (response.success && response.data) {
            setAvailability(response.data.availability || {});
            setDefaultSlotDuration(response.data.defaultSlotDuration || 30);
          }
        } catch (error) {
          console.error('Failed to load availability:', error);
        }
      }
    };
    loadAvailability();
  }, [isAuthenticated, role]);

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

  const handleBioSave = async () => {
    try {
      setSaving(true);
      // TODO: Call API to update bio
      // await doctorApi.updateBio(bio);
      setBioSaved(true);
      setTimeout(() => setBioSaved(false), 3000);
    } catch (error) {
      console.error('Bio save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }

      setSignatureFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = async () => {
    if (!signatureFile) return;

    try {
      setSignatureUploading(true);
      // TODO: Call API to upload signature
      // const formData = new FormData();
      // formData.append('signature', signatureFile);
      // await doctorApi.uploadSignature(formData);
      setSignatureSaved(true);
      setTimeout(() => setSignatureSaved(false), 3000);
    } catch (error) {
      console.error('Signature upload error:', error);
    } finally {
      setSignatureUploading(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    try {
      setPhoneError('');
      // TODO: Call API to send OTP to new phone
      // await doctorApi.sendPhoneChangeOtp(newPhone);
      setPhoneOtpSent(true);
    } catch (error: any) {
      setPhoneError(error.message || 'Failed to send OTP');
    }
  };

  const handleVerifyPhoneOtp = async () => {
    try {
      setPhoneError('');
      // TODO: Call API to verify OTP and update phone
      // await doctorApi.verifyPhoneChangeOtp(newPhone, phoneOtp);
      setShowPhoneChange(false);
      setPhoneOtpSent(false);
      setNewPhone('');
      setPhoneOtp('');
    } catch (error: any) {
      setPhoneError(error.message || 'Invalid OTP');
    }
  };

  const handleSendEmailOtp = async () => {
    try {
      setEmailError('');
      // TODO: Call API to send OTP to new email
      // await doctorApi.sendEmailChangeOtp(newEmail);
      setEmailOtpSent(true);
    } catch (error: any) {
      setEmailError(error.message || 'Failed to send OTP');
    }
  };

  const handleVerifyEmailOtp = async () => {
    try {
      setEmailError('');
      // TODO: Call API to verify OTP and update email
      // await doctorApi.verifyEmailChangeOtp(newEmail, emailOtp);
      setShowEmailChange(false);
      setEmailOtpSent(false);
      setNewEmail('');
      setEmailOtp('');
    } catch (error: any) {
      setEmailError(error.message || 'Invalid OTP');
    }
  };

  const handleAvailabilityChange = (day: string, field: 'enabled' | 'start' | 'end', value: boolean | string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        enabled: field === 'enabled' ? (value as boolean) : (prev[day as keyof DoctorAvailability]?.enabled || false),
        start: field === 'start' ? (value as string) : (prev[day as keyof DoctorAvailability]?.start || '09:00'),
        end: field === 'end' ? (value as string) : (prev[day as keyof DoctorAvailability]?.end || '17:00'),
      }
    }));
    setAvailabilitySaved(false);
  };

  const handleSaveAvailability = async () => {
    try {
      setAvailabilitySaving(true);
      const response = await appointmentApi.updateAvailability({
        availability,
        defaultSlotDuration,
      });
      if (response.success) {
        setAvailabilitySaved(true);
        setTimeout(() => setAvailabilitySaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save availability:', error);
    } finally {
      setAvailabilitySaving(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40">
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-lg text-blue-900">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || role !== 'DOCTOR' || !doctor) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40 pb-20">
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-lg border-b border-cyan-200/50 sticky top-0 shadow-lg shadow-cyan-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Mediquory Connect" className="w-10 h-10" />
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Account Settings
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/doctor/dashboard"
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
              >
                ← Back to Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-medium text-sm transition-all hover:scale-105"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Overview Card */}
        <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {doctor.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-blue-900">Dr. {doctor.fullName}</h2>
              <p className="text-gray-600">{doctor.specialization}</p>
              <p className="text-sm text-cyan-600">Reg. No: {doctor.registrationNo}</p>
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-6 mb-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4">Contact Information</h3>

          {/* Phone Number */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-gray-600 font-medium">Phone Number</p>
                <p className="text-lg font-semibold text-blue-900">{doctor.phone}</p>
              </div>
              <button
                onClick={() => setShowPhoneChange(!showPhoneChange)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-medium text-sm transition-all hover:scale-105"
              >
                Change Phone
              </button>
            </div>

            {showPhoneChange && (
              <div className="mt-4 p-4 bg-cyan-50/50 backdrop-blur-sm rounded-2xl border border-cyan-200/50">
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Enter new phone number"
                  className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 mb-3"
                  disabled={phoneOtpSent}
                />

                {phoneOtpSent && (
                  <input
                    type="text"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    placeholder="Enter OTP"
                    className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 mb-3"
                  />
                )}

                {phoneError && (
                  <p className="text-sm text-red-600 mb-3">{phoneError}</p>
                )}

                <div className="flex gap-2">
                  {!phoneOtpSent ? (
                    <button
                      onClick={handleSendPhoneOtp}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-medium text-sm transition-all"
                    >
                      Send OTP
                    </button>
                  ) : (
                    <button
                      onClick={handleVerifyPhoneOtp}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium text-sm transition-all"
                    >
                      Verify & Update
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowPhoneChange(false);
                      setPhoneOtpSent(false);
                      setNewPhone('');
                      setPhoneOtp('');
                      setPhoneError('');
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-gray-600 font-medium">Email Address</p>
                <p className="text-lg font-semibold text-blue-900">{doctor.email}</p>
              </div>
              <button
                onClick={() => setShowEmailChange(!showEmailChange)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-medium text-sm transition-all hover:scale-105"
              >
                Change Email
              </button>
            </div>

            {showEmailChange && (
              <div className="mt-4 p-4 bg-cyan-50/50 backdrop-blur-sm rounded-2xl border border-cyan-200/50">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email address"
                  className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 mb-3"
                  disabled={emailOtpSent}
                />

                {emailOtpSent && (
                  <input
                    type="text"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    placeholder="Enter OTP"
                    className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 mb-3"
                  />
                )}

                {emailError && (
                  <p className="text-sm text-red-600 mb-3">{emailError}</p>
                )}

                <div className="flex gap-2">
                  {!emailOtpSent ? (
                    <button
                      onClick={handleSendEmailOtp}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-medium text-sm transition-all"
                    >
                      Send OTP
                    </button>
                  ) : (
                    <button
                      onClick={handleVerifyEmailOtp}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium text-sm transition-all"
                    >
                      Verify & Update
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowEmailChange(false);
                      setEmailOtpSent(false);
                      setNewEmail('');
                      setEmailOtp('');
                      setEmailError('');
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Professional Bio Card */}
        <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-blue-900">Professional Bio</h3>
            {bioSaved && (
              <span className="text-sm text-green-600 font-medium">✓ Saved</span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-4">
            This bio will be visible to patients when they view your profile. Share your expertise, experience, and approach to patient care.
          </p>

          <textarea
            value={bio}
            onChange={(e) => {
              setBio(e.target.value);
              setBioSaved(false);
            }}
            placeholder="Write about your medical expertise, years of experience, specializations, approach to patient care, etc."
            className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none mb-4"
            rows={8}
          />

          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              {bio.length} characters
            </p>
            <button
              onClick={handleBioSave}
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-medium text-sm transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Bio'}
            </button>
          </div>
        </div>

        {/* Signature Upload Card */}
        <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-blue-900">Digital Signature</h3>
            {signatureSaved && (
              <span className="text-sm text-green-600 font-medium">✓ Uploaded</span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Upload your signature image to be included in prescriptions. Recommended size: 200x80 pixels (PNG or JPG).
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div>
              <label className="block mb-2">
                <span className="text-sm font-medium text-gray-700">Upload Signature</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureChange}
                  className="mt-2 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-xl file:border-0
                    file:text-sm file:font-semibold
                    file:bg-gradient-to-r file:from-blue-500 file:to-cyan-600
                    file:text-white file:cursor-pointer
                    hover:file:from-blue-600 hover:file:to-cyan-700
                    file:transition-all"
                />
              </label>

              {signatureFile && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Selected: {signatureFile.name}
                  </p>
                  <button
                    onClick={handleSignatureUpload}
                    disabled={signatureUploading}
                    className="w-full px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium text-sm transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {signatureUploading ? 'Uploading...' : 'Upload Signature'}
                  </button>
                </div>
              )}
            </div>

            {/* Preview Section */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
              <div className="border-2 border-dashed border-cyan-200 rounded-xl p-4 bg-gray-50 min-h-[120px] flex items-center justify-center">
                {signaturePreview ? (
                  <img
                    src={signaturePreview}
                    alt="Signature preview"
                    className="max-h-20 max-w-full object-contain"
                  />
                ) : (
                  <p className="text-sm text-gray-400">
                    No signature uploaded
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This signature will appear on all prescriptions you generate
              </p>
            </div>
          </div>
        </div>

        {/* Consultation Availability Card */}
        <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-blue-900">Consultation Availability</h3>
            {availabilitySaved && (
              <span className="text-sm text-green-600 font-medium">✓ Saved</span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Set your general availability schedule. This helps patients understand when you're typically available for consultations.
          </p>

          {/* Default Slot Duration */}
          <div className="mb-6 p-4 bg-cyan-50/50 backdrop-blur-sm rounded-2xl border border-cyan-200/50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Consultation Duration
            </label>
            <select
              value={defaultSlotDuration}
              onChange={(e) => {
                setDefaultSlotDuration(Number(e.target.value));
                setAvailabilitySaved(false);
              }}
              className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              This is the typical duration for your consultations
            </p>
          </div>

          {/* Weekly Schedule */}
          <div className="space-y-4 mb-6">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
              const dayData = availability[day as keyof DoctorAvailability];
              const isEnabled = dayData?.enabled || false;
              const startTime = dayData?.start || '09:00';
              const endTime = dayData?.end || '17:00';

              return (
                <div key={day} className="p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-cyan-200/50">
                  <div className="flex items-center gap-4 mb-3">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => handleAvailabilityChange(day, 'enabled', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm font-semibold text-gray-700 capitalize w-24">
                      {day}
                    </label>

                    {isEnabled && (
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">From:</span>
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                            className="px-3 py-2 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">To:</span>
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                            className="px-3 py-2 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
                          />
                        </div>
                      </div>
                    )}

                    {!isEnabled && (
                      <span className="text-sm text-gray-400 italic">Not available</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Patients can request appointments based on your availability
            </p>
            <button
              onClick={handleSaveAvailability}
              disabled={availabilitySaving}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-medium text-sm transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {availabilitySaving ? 'Saving...' : 'Save Availability'}
            </button>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-6 mt-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4">Account Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Registration Type</p>
              <p className="text-sm font-semibold text-blue-900">
                {doctor.registrationType === 'STATE_MEDICAL_COUNCIL'
                  ? `State Council${doctor.registrationState ? ` (${doctor.registrationState})` : ''}`
                  : 'National Commission'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Account Status</p>
              <p className="text-sm font-semibold text-blue-900">{doctor.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Subscription Tier</p>
              <p className="text-sm font-semibold text-blue-900 mb-2">{doctor.subscriptionTier}</p>
              <Link
                href="/doctor/subscription"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg font-medium text-xs transition-all hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage Subscription
              </Link>
            </div>
            <div>
              <p className="text-sm text-gray-600">Account Created</p>
              <p className="text-sm font-semibold text-blue-900">
                {new Date(doctor.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
