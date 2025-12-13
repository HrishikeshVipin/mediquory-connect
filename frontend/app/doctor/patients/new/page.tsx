'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { patientApi } from '../../../../lib/api';

const patientSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional(),
  age: z.number().min(0).max(150).optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', '']).optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

export default function CreatePatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareableLink, setShareableLink] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  const onSubmit = async (data: PatientFormData) => {
    try {
      setLoading(true);
      setError('');

      // Convert empty strings to undefined
      const patientData: any = {
        fullName: data.fullName,
      };

      if (data.phone) patientData.phone = data.phone;
      if (data.age && data.age !== '') patientData.age = Number(data.age);
      if (data.gender && data.gender !== '') patientData.gender = data.gender;

      const response = await patientApi.createPatient(patientData);

      if (response.success && response.data) {
        setShareableLink(response.data.shareableLink);
        setShowSuccess(true);
        reset();
      }
    } catch (err: any) {
      console.error('Create patient error:', err);

      if (err.response?.data?.trialLimitReached) {
        setError('Trial limit reached! You can create maximum 2 patients during trial. Please subscribe to create more patients.');
      } else if (err.response?.data?.trialExpired) {
        setError('Your trial period has expired. Please subscribe to continue creating patients.');
      } else if (err.response?.data?.subscriptionExpired) {
        setError('Your subscription has expired. Please renew to create patients.');
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to create patient';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableLink);
    alert('Link copied to clipboard!');
  };

  if (showSuccess && shareableLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Created Successfully!</h2>
            <p className="text-gray-600">Share the link below with your patient</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Access Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareableLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white font-mono text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-2">Important Notes:</h3>
            <ul className="space-y-1 text-sm text-yellow-800">
              <li>• Share this link only with your patient</li>
              <li>• Patient can access their consultation using this link</li>
              <li>• No signup required for patients</li>
              <li>• Link never expires</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setShowSuccess(false);
                setShareableLink('');
              }}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Create Another Patient
            </button>
            <Link
              href="/doctor/dashboard"
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-center"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Patient</h1>
            <p className="text-sm text-gray-600">Add a new patient to your practice</p>
          </div>
          <Link
            href="/doctor/dashboard"
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('fullName')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter patient's full name"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age (Optional)
              </label>
              <input
                type="number"
                {...register('age', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter age"
                min="0"
                max="150"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender (Optional)
              </label>
              <select
                {...register('gender')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• A unique shareable link will be generated for this patient</li>
                <li>• Patient can access consultations using this link</li>
                <li>• No signup or login required for patients</li>
                <li>• You can share the link via WhatsApp, SMS, or email</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Creating Patient...' : 'Create Patient & Generate Link'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
