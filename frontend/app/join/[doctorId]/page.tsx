'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { patientApi } from '@/lib/api';

export default function PatientSelfRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.doctorId as string;

  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    age: '',
    gender: '',
  });

  // Fetch doctor info
  useEffect(() => {
    const fetchDoctorInfo = async () => {
      try {
        const response = await patientApi.getDoctorInfo(doctorId);
        if (response.success) {
          setDoctor(response.data.doctor);
        } else {
          setError('Doctor not found');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load doctor information');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorInfo();
  }, [doctorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await patientApi.selfRegister({
        doctorId,
        fullName: formData.fullName,
        phone: formData.phone,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender || undefined,
      });

      if (response.success) {
        // Show success message with patient access link
        alert(
          `Successfully registered!\n\nYour access link:\n${response.data.patientAccessLink}\n\nPlease save this link to access your consultation portal.`
        );

        // Redirect to patient portal
        const token = response.data.patientAccessLink.split('/p/')[1];
        router.push(`/p/${token}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8">
        {/* Doctor Info */}
        <div className="text-center mb-6">
          {doctor.profilePhoto && (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/${doctor.profilePhoto}`}
              alt={doctor.fullName}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-blue-100"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.fullName)}&size=96&background=3b82f6&color=fff`;
              }}
            />
          )}
          <h1 className="text-2xl font-bold text-gray-900">Dr. {doctor.fullName}</h1>
          <p className="text-gray-600">{doctor.specialization}</p>
          <p className="text-sm text-gray-500 mt-2">{doctor.patientCount} patients</p>
        </div>

        {!doctor.isAcceptingPatients ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-yellow-600 text-4xl mb-2">⚠️</div>
            <p className="text-yellow-800 font-medium">
              This doctor is not currently accepting new patients. Please contact them directly.
            </p>
            {doctor.phone && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-700 font-medium">Contact Information:</p>
                <p className="text-gray-600">📱 {doctor.phone}</p>
                {doctor.email && <p className="text-gray-600">✉️ {doctor.email}</p>}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Register as a Patient</h2>
              <p className="text-sm text-gray-600">
                Fill in your details to register under Dr. {doctor.fullName}
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Age"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {submitting ? 'Registering...' : 'Register Now'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By registering, you'll receive a unique access link to consult with Dr. {doctor.fullName}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
