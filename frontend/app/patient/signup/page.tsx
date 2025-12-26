'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { patientAuth } from '@/lib/api';
import { usePatientAuth } from '@/store/patientAuthStore';
import Link from 'next/link';
import AnimatedBackground from '@/components/AnimatedBackground';

export default function PatientSignup() {
  const router = useRouter();
  const { setAuth } = usePatientAuth();

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

  // Form state
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Profile
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Step 1: Send OTP to phone
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate phone
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }

    setLoading(true);
    try {
      await patientAuth.sendOtp(phone);
      setOtpSent(true);
      setStep(2);

      // Start 60-second resend timer
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await patientAuth.verifyOtp(phone, otp);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete signup with profile + PIN
  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await patientAuth.signup(
        phone,
        otp,
        fullName,
        age ? parseInt(age) : 0,
        gender,
        pin
      );

      if (response.success && response.data) {
        // Save auth data
        setAuth({
          patient: response.data.patient,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        });

        // Redirect to patient dashboard
        router.push('/patient/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setError('');
    setLoading(true);
    try {
      await patientAuth.sendOtp(phone);

      // Restart timer
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo and Branding */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block group">
              <img
                src="/logo.png"
                alt="Mediquory Connect"
                className="w-32 h-auto mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-xl"
              />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 via-cyan-600 to-blue-900 bg-clip-text text-transparent">
                MEDIQUORY CONNECT
              </h1>
            </Link>
          </div>

          {/* Glassmorphic Card */}
          <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl p-8 shadow-2xl shadow-cyan-500/10 hover:bg-white/80 hover:border-cyan-400/60 transition-all duration-300">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-blue-900 mb-2">Create Account</h2>
              <p className="text-gray-600">Join Mediquory Connect as a Patient</p>
            </div>

            {/* Progress Steps */}
            <div className="flex justify-between mb-8">
              <div className={`flex-1 text-center transition-all duration-300 ${step >= 1 ? 'text-cyan-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center font-semibold transition-all duration-300 ${step >= 1 ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30' : 'bg-gray-200'}`}>
                  {step > 1 ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    '1'
                  )}
                </div>
                <p className="text-xs mt-2 font-medium">Phone</p>
              </div>
              <div className={`flex-1 border-t-2 mx-2 mt-5 transition-colors ${step >= 2 ? 'border-cyan-500' : 'border-gray-300'}`} />
              <div className={`flex-1 text-center transition-all duration-300 ${step >= 2 ? 'text-cyan-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center font-semibold transition-all duration-300 ${step >= 2 ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30' : 'bg-gray-200'}`}>
                  {step > 2 ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    '2'
                  )}
                </div>
                <p className="text-xs mt-2 font-medium">OTP</p>
              </div>
              <div className={`flex-1 border-t-2 mx-2 mt-5 transition-colors ${step >= 3 ? 'border-cyan-500' : 'border-gray-300'}`} />
              <div className={`flex-1 text-center transition-all duration-300 ${step >= 3 ? 'text-cyan-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center font-semibold transition-all duration-300 ${step >= 3 ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30' : 'bg-gray-200'}`}>
                  3
                </div>
                <p className="text-xs mt-2 font-medium">Profile</p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Step 1: Phone Number */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Phone Number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-cyan-200/50 bg-white/50 backdrop-blur-sm text-gray-700 font-medium">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="flex-1 px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-r-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      required
                      maxLength={10}
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">We'll send you an OTP to verify your number</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.length !== 10}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-center text-2xl tracking-widest text-gray-900 placeholder-gray-400"
                    required
                    maxLength={6}
                    autoFocus
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    OTP sent to +91-{phone}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Verify OTP'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                  className="w-full text-cyan-600 hover:text-cyan-700 py-2 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-gray-600 hover:text-cyan-600 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Change Phone Number
                </button>
              </form>
            )}

            {/* Step 3: Profile & PIN */}
            {step === 3 && (
              <form onSubmit={handleCompleteSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    required
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Age (Optional)
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="30"
                      className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      min="1"
                      max="120"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Gender (Optional)
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Create 6-Digit PIN *
                  </label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-center text-2xl tracking-widest text-gray-900 placeholder-gray-400"
                    required
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-600 mt-2">You'll use this PIN to login next time</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Confirm PIN *
                  </label>
                  <input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-center text-2xl tracking-widest text-gray-900 placeholder-gray-400"
                    required
                    maxLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !fullName.trim() || pin.length !== 6 || pin !== confirmPin}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            )}

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/patient/login" className="text-cyan-600 hover:text-cyan-700 font-medium transition-colors">
                Login
              </Link>
            </div>
          </div>

          {/* Back to Home Link */}
          <div className="mt-6 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-cyan-600 font-medium transition-colors group">
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
