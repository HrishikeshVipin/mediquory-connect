'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import { adminApi } from '../../../lib/api';
import type { Doctor } from '../../../types';

export default function SubscriptionsPage() {
  const router = useRouter();
  const { isAuthenticated, role, initAuth } = useAuthStore();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || role !== 'ADMIN')) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, role, loading, router]);

  useEffect(() => {
    if (isAuthenticated && role === 'ADMIN') {
      fetchDoctors();
    }
  }, [isAuthenticated, role]);

  const fetchDoctors = async () => {
    try {
      const response = await adminApi.getAllDoctors({ status: 'VERIFIED' });
      if (response.success && response.data) {
        setDoctors(response.data);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || role !== 'ADMIN') {
    return null;
  }

  const filteredDoctors = doctors.filter((doctor) => {
    if (filter === 'all') return true;
    return doctor.subscriptionStatus === filter.toUpperCase();
  });

  const trialCount = doctors.filter((d) => d.subscriptionStatus === 'TRIAL').length;
  const activeCount = doctors.filter((d) => d.subscriptionStatus === 'ACTIVE').length;
  const expiredCount = doctors.filter((d) => d.subscriptionStatus === 'EXPIRED').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
            <p className="text-sm text-gray-600">Manage doctor subscriptions and trial periods</p>
          </div>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">Total Subscriptions</p>
            <p className="text-3xl font-bold text-gray-900">{doctors.length}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow p-6">
            <p className="text-sm text-yellow-700 mb-1">Trial</p>
            <p className="text-3xl font-bold text-yellow-900">{trialCount}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg shadow p-6">
            <p className="text-sm text-green-700 mb-1">Active</p>
            <p className="text-3xl font-bold text-green-900">{activeCount}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6">
            <p className="text-sm text-red-700 mb-1">Expired</p>
            <p className="text-3xl font-bold text-red-900">{expiredCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All ({doctors.length})
            </button>
            <button
              onClick={() => setFilter('trial')}
              className={`px-4 py-2 rounded ${
                filter === 'trial'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Trial ({trialCount})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded ${
                filter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 rounded ${
                filter === 'expired'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Expired ({expiredCount})
            </button>
          </div>
        </div>

        {/* Doctors Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trial/Subscription Ends
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Razorpay ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No doctors found
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doctor) => {
                  const daysLeft = Math.ceil(
                    (new Date(doctor.trialEndsAt).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  );

                  return (
                    <tr key={doctor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {doctor.fullName}
                          </div>
                          <div className="text-sm text-gray-500">{doctor.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doctor.specialization}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            doctor.subscriptionStatus === 'TRIAL'
                              ? 'bg-yellow-100 text-yellow-800'
                              : doctor.subscriptionStatus === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {doctor.subscriptionStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doctor.patientsCreated}
                        {doctor.subscriptionStatus === 'TRIAL' && ' / 2'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doctor.subscriptionStatus === 'TRIAL' ? (
                          <span className={daysLeft > 0 ? 'text-gray-900' : 'text-red-600 font-semibold'}>
                            {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                          </span>
                        ) : doctor.subscriptionEndsAt ? (
                          new Date(doctor.subscriptionEndsAt).toLocaleDateString()
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {doctor.razorpaySubscriptionId || 'N/A'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
