'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import type { Doctor, PaginationData } from '../../../types';

export default function AllDoctorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, role, initAuth } = useAuthStore();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pagination, setPagination] = useState<PaginationData<Doctor>['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState(searchParams?.get('status') || '');
  const [subscriptionFilter, setSubscriptionFilter] = useState(searchParams?.get('subscription') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');
  const [currentPage, setCurrentPage] = useState(Number(searchParams?.get('page')) || 1);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || role !== 'ADMIN')) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, role, loading, router]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const params: any = {
          page: currentPage,
          limit: 10,
        };
        if (statusFilter) params.status = statusFilter;
        if (subscriptionFilter) params.subscriptionStatus = subscriptionFilter;
        if (searchQuery) params.search = searchQuery;

        const response = await adminApi.getAllDoctors(params);
        if (response.success && response.data) {
          setDoctors(response.data.doctors || []);
          setPagination(response.data.pagination);
        }
      } catch (err: any) {
        console.error('Failed to fetch doctors:', err);
        setError(err.response?.data?.message || 'Failed to load doctors');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && role === 'ADMIN') {
      fetchDoctors();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, role, statusFilter, subscriptionFilter, searchQuery, currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  if (loading && doctors.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || role !== 'ADMIN') {
    return null;
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING_VERIFICATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      VERIFIED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Verified' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      SUSPENDED: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Suspended' },
    };
    return badges[status as keyof typeof badges] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
  };

  const getSubscriptionBadge = (status: string) => {
    const badges = {
      TRIAL: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Trial' },
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      EXPIRED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expired' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
    };
    return badges[status as keyof typeof badges] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All Doctors</h1>
              <p className="text-sm text-gray-600 mt-1">
                {pagination ? `${pagination.total} total doctors` : 'Loading...'}
              </p>
            </div>
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING_VERIFICATION">Pending Verification</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              {/* Subscription Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subscription Status
                </label>
                <select
                  value={subscriptionFilter}
                  onChange={(e) => {
                    setSubscriptionFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Subscriptions</option>
                  <option value="TRIAL">Trial</option>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(e);
                    }
                  }}
                  placeholder="Name, email, phone..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('');
                  setSubscriptionFilter('');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Clear All
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Doctors Table */}
        {doctors.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Doctors Found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {doctors.map((doctor) => {
                    const statusBadge = getStatusBadge(doctor.status);
                    const subBadge = getSubscriptionBadge(doctor.subscriptionStatus);

                    return (
                      <tr key={doctor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{doctor.fullName}</div>
                            <div className="text-sm text-gray-500">{doctor.specialization}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{doctor.email}</div>
                          <div className="text-sm text-gray-500">{doctor.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${subBadge.bg} ${subBadge.text}`}>
                            {subBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(doctor.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Link
                            href={`/admin/doctors/${doctor.id}`}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            View Details →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
