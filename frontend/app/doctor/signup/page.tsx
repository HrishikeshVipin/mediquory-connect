'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import Link from 'next/link';
import AnimatedBackground from '@/components/AnimatedBackground';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Indian states list
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const signupSchema = z.object({
  // Step 1: Basic Info
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  specialization: z.string().min(2, 'Specialization is required'),

  // Step 2: Registration Details
  registrationType: z.enum(['STATE_MEDICAL_COUNCIL', 'NATIONAL_MEDICAL_COMMISSION']),
  registrationNo: z.string().min(5, 'Registration number is required'),
  registrationState: z.string().optional(),

  // Step 3: Aadhaar
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits'),

  // Step 4: Documents
  registrationCertificate: z.any(),
  aadhaarFrontPhoto: z.any(),
  aadhaarBackPhoto: z.any(),
  profilePhoto: z.any(),

  // Step 5: Payment (optional)
  upiId: z.string().optional(),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function DoctorSignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  const registrationType = watch('registrationType');

  const nextStep = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setError('');
    let fieldsToValidate: any[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ['fullName', 'email', 'password', 'phone', 'specialization'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['registrationType', 'registrationNo'];
      if (registrationType === 'STATE_MEDICAL_COUNCIL') {
        fieldsToValidate.push('registrationState');
      }
    } else if (currentStep === 3) {
      fieldsToValidate = ['aadhaarNumber'];
    } else if (currentStep === 4) {
      const formData = watch();
      const missingFiles = [];
      if (!formData.registrationCertificate?.[0]) missingFiles.push('Registration Certificate');
      if (!formData.aadhaarFrontPhoto?.[0]) missingFiles.push('Aadhaar Front Photo');
      if (!formData.aadhaarBackPhoto?.[0]) missingFiles.push('Aadhaar Back Photo');
      if (!formData.profilePhoto?.[0]) missingFiles.push('Profile Photo');

      if (missingFiles.length > 0) {
        setError(`Please upload: ${missingFiles.join(', ')}`);
        return;
      }
    }

    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setError('Please fix the validation errors before proceeding');
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const onSubmit = async (data: SignupFormData) => {
    try {
      setLoading(true);
      setError('');

      const missingFiles = [];
      if (!data.registrationCertificate?.[0]) missingFiles.push('Registration Certificate');
      if (!data.aadhaarFrontPhoto?.[0]) missingFiles.push('Aadhaar Front Photo');
      if (!data.aadhaarBackPhoto?.[0]) missingFiles.push('Aadhaar Back Photo');
      if (!data.profilePhoto?.[0]) missingFiles.push('Profile Photo');

      if (missingFiles.length > 0) {
        setError(`Missing required files: ${missingFiles.join(', ')}`);
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const formData = new FormData();
      formData.append('fullName', data.fullName);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('phone', data.phone);
      formData.append('specialization', data.specialization);
      formData.append('registrationType', data.registrationType);
      formData.append('registrationNo', data.registrationNo);
      if (data.registrationState) {
        formData.append('registrationState', data.registrationState);
      }
      formData.append('aadhaarNumber', data.aadhaarNumber);

      formData.append('registrationCertificate', data.registrationCertificate[0]);
      formData.append('aadhaarFrontPhoto', data.aadhaarFrontPhoto[0]);
      formData.append('aadhaarBackPhoto', data.aadhaarBackPhoto[0]);
      formData.append('profilePhoto', data.profilePhoto[0]);

      if (data.upiId) {
        formData.append('upiId', data.upiId);
      }

      await axios.post(`${API_URL}/auth/doctor/signup`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Registration successful! Your application is under review. You will be notified once verified.');
      router.push('/doctor/login');
    } catch (err: any) {
      console.error('Signup error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Signup failed. Please try again.';

      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        setError(`Validation errors: ${errors.map((e: any) => e.message || e).join(', ')}`);
      } else {
        setError(errorMessage);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Basic', 'Registration', 'Aadhaar', 'Documents', 'Payment'];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl">
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
              <h2 className="text-3xl font-bold text-blue-900 mb-2">Doctor Registration</h2>
              <p className="text-gray-600">Join Mediquory Connect - Complete your profile to get started</p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4, 5].map((step, idx) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all duration-300 ${
                          currentStep >= step
                            ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {currentStep > step ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          step
                        )}
                      </div>
                      <span className="text-xs mt-2 font-medium text-gray-600">{stepLabels[idx]}</span>
                    </div>
                    {step < 5 && (
                      <div
                        className={`h-1 flex-1 transition-colors ${
                          currentStep > step ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && currentStep < 5) {
                  e.preventDefault();
                }
              }}
            >
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-900 mb-4">Basic Information</h3>

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">Full Name</label>
                    <input
                      {...register('fullName')}
                      type="text"
                      className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      placeholder="Dr. John Doe"
                      autoFocus
                    />
                    {errors.fullName && <p className="mt-2 text-sm text-red-600 font-medium">{errors.fullName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">Email</label>
                    <input
                      {...register('email')}
                      type="email"
                      className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      placeholder="doctor@example.com"
                    />
                    {errors.email && <p className="mt-2 text-sm text-red-600 font-medium">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">Password</label>
                    <input
                      {...register('password')}
                      type="password"
                      className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      placeholder="Minimum 8 characters"
                    />
                    {errors.password && <p className="mt-2 text-sm text-red-600 font-medium">{errors.password.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">Phone Number</label>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      placeholder="9876543210"
                    />
                    {errors.phone && <p className="mt-2 text-sm text-red-600 font-medium">{errors.phone.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">Specialization</label>
                    <input
                      {...register('specialization')}
                      type="text"
                      className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      placeholder="e.g., Cardiologist, Dermatologist"
                    />
                    {errors.specialization && <p className="mt-2 text-sm text-red-600 font-medium">{errors.specialization.message}</p>}
                  </div>
                </div>
              )}

              {/* Step 2: Registration Details */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-900 mb-4">Medical Registration</h3>

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-3">Registration Type</label>
                    <div className="space-y-3">
                      <label className="flex items-center p-4 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl cursor-pointer hover:border-blue-400/60 transition-colors">
                        <input
                          {...register('registrationType')}
                          type="radio"
                          value="STATE_MEDICAL_COUNCIL"
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-900 font-medium">State Medical Council</span>
                      </label>
                      <label className="flex items-center p-4 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl cursor-pointer hover:border-blue-400/60 transition-colors">
                        <input
                          {...register('registrationType')}
                          type="radio"
                          value="NATIONAL_MEDICAL_COMMISSION"
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-900 font-medium">National Medical Commission (NMC)</span>
                      </label>
                    </div>
                    {errors.registrationType && <p className="mt-2 text-sm text-red-600 font-medium">{errors.registrationType.message}</p>}
                  </div>

                  {registrationType === 'STATE_MEDICAL_COUNCIL' && (
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-2">State</label>
                      <select
                        {...register('registrationState')}
                        className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      {errors.registrationState && <p className="mt-2 text-sm text-red-600 font-medium">{errors.registrationState.message}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">Registration Number</label>
                    <input
                      {...register('registrationNo')}
                      type="text"
                      className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      placeholder="Enter your registration number"
                    />
                    {errors.registrationNo && <p className="mt-2 text-sm text-red-600 font-medium">{errors.registrationNo.message}</p>}
                  </div>
                </div>
              )}

              {/* Step 3: Aadhaar */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-900 mb-4">Aadhaar Verification</h3>

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">Aadhaar Number</label>
                    <input
                      {...register('aadhaarNumber')}
                      type="text"
                      maxLength={12}
                      className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      placeholder="123456789012"
                      autoFocus
                    />
                    {errors.aadhaarNumber && <p className="mt-2 text-sm text-red-600 font-medium">{errors.aadhaarNumber.message}</p>}
                    <p className="mt-2 text-sm text-gray-600">Your Aadhaar will be used for identity verification</p>
                  </div>
                </div>
              )}

              {/* Step 4: Documents */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-900 mb-4">Upload Documents</h3>
                  <div className="p-4 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 backdrop-blur-sm rounded-xl border border-blue-200/50 mb-4">
                    <p className="text-sm text-blue-900">
                      <strong>Note:</strong> Maximum file size is 10MB per image and 15MB for PDF documents.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Medical Registration Certificate <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('registrationCertificate')}
                      type="file"
                      accept="image/*,.pdf"
                      className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-blue-500 file:to-cyan-600 file:text-white file:font-medium hover:file:from-blue-600 hover:file:to-cyan-700 file:cursor-pointer"
                    />
                    <p className="mt-2 text-sm text-gray-600">PDF or Image (Max 15MB for PDF, 10MB for images)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Aadhaar Front Photo <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('aadhaarFrontPhoto')}
                      type="file"
                      accept="image/*"
                      className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-blue-500 file:to-cyan-600 file:text-white file:font-medium hover:file:from-blue-600 hover:file:to-cyan-700 file:cursor-pointer"
                    />
                    <p className="mt-2 text-sm text-gray-600">Clear photo of front side (Max 10MB)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Aadhaar Back Photo <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('aadhaarBackPhoto')}
                      type="file"
                      accept="image/*"
                      className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-blue-500 file:to-cyan-600 file:text-white file:font-medium hover:file:from-blue-600 hover:file:to-cyan-700 file:cursor-pointer"
                    />
                    <p className="mt-2 text-sm text-gray-600">Clear photo of back side (Max 10MB)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Profile Photo <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('profilePhoto')}
                      type="file"
                      accept="image/*"
                      className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-blue-500 file:to-cyan-600 file:text-white file:font-medium hover:file:from-blue-600 hover:file:to-cyan-700 file:cursor-pointer"
                    />
                    <p className="mt-2 text-sm text-gray-600">Professional photo (Max 10MB)</p>
                  </div>
                </div>
              )}

              {/* Step 5: Payment Setup */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-900 mb-4">Payment Setup (Optional)</h3>
                  <p className="text-gray-600 mb-4">Set up your UPI ID to receive payments from patients</p>

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">UPI ID</label>
                    <input
                      {...register('upiId')}
                      type="text"
                      className="w-full px-4 py-3 border border-cyan-200/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      placeholder="yourname@upi"
                      autoFocus
                    />
                    <p className="mt-2 text-sm text-gray-600">You can add this later from your profile</p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between gap-4">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={loading}
                    className="px-6 py-3 bg-white/80 hover:bg-white text-gray-700 hover:text-blue-600 font-medium rounded-xl border border-cyan-200/50 hover:border-blue-400/60 transition-all duration-300 disabled:opacity-50"
                  >
                    Previous
                  </button>
                )}

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="ml-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="ml-auto px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-gray-600">
              Already registered?{' '}
              <Link href="/doctor/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Login here
              </Link>
            </div>
          </div>

          {/* Back to Home Link */}
          <div className="mt-6 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors group">
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
