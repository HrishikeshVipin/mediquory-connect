'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';

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

  const nextStep = async () => {
    setError(''); // Clear any previous errors
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
      // Check if all required files are uploaded
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

      // Validate files are present before submitting
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

      // Always append files (we've already validated they exist)
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

      // If it's a validation error from backend, show specific field errors
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        setError(`Validation errors: ${errors.map((e: any) => e.message || e).join(', ')}`);
      } else {
        setError(errorMessage);
      }

      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Registration</h1>
          <p className="text-gray-600 mb-8">Join Bhishak Med - Complete your profile to get started</p>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep >= step
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 5 && (
                    <div
                      className={`w-16 h-1 ${
                        currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-600">Basic</span>
              <span className="text-xs text-gray-600">Registration</span>
              <span className="text-xs text-gray-600">Aadhaar</span>
              <span className="text-xs text-gray-600">Documents</span>
              <span className="text-xs text-gray-600">Payment</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    {...register('fullName')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dr. John Doe"
                  />
                  {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="doctor@example.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    {...register('password')}
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Minimum 8 characters"
                  />
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="9876543210"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <input
                    {...register('specialization')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Cardiologist, Dermatologist"
                  />
                  {errors.specialization && <p className="mt-1 text-sm text-red-600">{errors.specialization.message}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Registration Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Medical Registration</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration Type</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        {...register('registrationType')}
                        type="radio"
                        value="STATE_MEDICAL_COUNCIL"
                        className="mr-2"
                      />
                      <span>State Medical Council</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register('registrationType')}
                        type="radio"
                        value="NATIONAL_MEDICAL_COMMISSION"
                        className="mr-2"
                      />
                      <span>National Medical Commission (NMC)</span>
                    </label>
                  </div>
                  {errors.registrationType && <p className="mt-1 text-sm text-red-600">{errors.registrationType.message}</p>}
                </div>

                {registrationType === 'STATE_MEDICAL_COUNCIL' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <select
                      {...register('registrationState')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    {errors.registrationState && <p className="mt-1 text-sm text-red-600">{errors.registrationState.message}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                  <input
                    {...register('registrationNo')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your registration number"
                  />
                  {errors.registrationNo && <p className="mt-1 text-sm text-red-600">{errors.registrationNo.message}</p>}
                </div>
              </div>
            )}

            {/* Step 3: Aadhaar */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Aadhaar Verification</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
                  <input
                    {...register('aadhaarNumber')}
                    type="text"
                    maxLength={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123456789012"
                  />
                  {errors.aadhaarNumber && <p className="mt-1 text-sm text-red-600">{errors.aadhaarNumber.message}</p>}
                  <p className="mt-1 text-sm text-gray-500">Your Aadhaar will be used for identity verification</p>
                </div>
              </div>
            )}

            {/* Step 4: Documents */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Upload Documents</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Maximum file size is 10MB per image and 15MB for PDF documents.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical Registration Certificate <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('registrationCertificate')}
                    type="file"
                    accept="image/*,.pdf"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">PDF or Image (Max 15MB for PDF, 10MB for images)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhaar Front Photo <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('aadhaarFrontPhoto')}
                    type="file"
                    accept="image/*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">Clear photo of front side (Max 10MB)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhaar Back Photo <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('aadhaarBackPhoto')}
                    type="file"
                    accept="image/*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">Clear photo of back side (Max 10MB)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Photo <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('profilePhoto')}
                    type="file"
                    accept="image/*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">Professional photo (Max 10MB)</p>
                </div>
              </div>
            )}

            {/* Step 5: Payment Setup (Optional) */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Payment Setup (Optional)</h2>
                <p className="text-gray-600 mb-4">Set up your UPI ID to receive payments from patients</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                  <input
                    {...register('upiId')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="yourname@upi"
                  />
                  <p className="mt-1 text-sm text-gray-500">You can add this later from your profile</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={loading}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
              )}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="ml-auto px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already registered?{' '}
              <a href="/doctor/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Login here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
