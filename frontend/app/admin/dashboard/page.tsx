'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, authApi } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import type { PlatformStats } from '../../../types';

export default function AdminDashboard() {
  const router = useRouter();
  const { isAuthenticated, role, user, clearAuth, initAuth } = useAuthStore();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || role !== 'ADMIN')) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, role, loading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminApi.getStats();
        if (response.success && response.data) {
          setStats(response.data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && role === 'ADMIN') {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, role]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      router.push('/admin/login');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {user?.fullName || 'Admin'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Doctors"
            value={stats?.doctors.total || 0}
            color="blue"
          />
          <StatsCard
            title="Verified Doctors"
            value={stats?.doctors.verified || 0}
            color="green"
          />
          <StatsCard
            title="Pending Verification"
            value={stats?.doctors.pending || 0}
            color="yellow"
            link="/admin/doctors/pending"
          />
          <StatsCard
            title="Active Doctors"
            value={stats?.doctors.active || 0}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Rejected"
            value={stats?.doctors.rejected || 0}
            color="red"
          />
          <StatsCard
            title="Suspended"
            value={stats?.doctors.suspended || 0}
            color="orange"
          />
          <StatsCard
            title="Total Patients"
            value={stats?.patients || 0}
            color="indigo"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/doctors/pending"
              className="p-4 border-2 border-yellow-300 rounded-lg hover:bg-yellow-50 transition"
            >
              <h3 className="font-semibold text-yellow-800">Pending Verification</h3>
              <p className="text-sm text-gray-600 mt-1">
                Review {stats?.doctors.pending || 0} pending doctors
              </p>
            </Link>

            <Link
              href="/admin/doctors"
              className="p-4 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition"
            >
              <h3 className="font-semibold text-blue-800">All Doctors</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage all {stats?.doctors.total || 0} doctors
              </p>
            </Link>

            <Link
              href="/admin/subscriptions"
              className="p-4 border-2 border-purple-300 rounded-lg hover:bg-purple-50 transition"
            >
              <h3 className="font-semibold text-purple-800">Subscriptions</h3>
              <p className="text-sm text-gray-600 mt-1">Manage subscriptions</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  color: string;
  link?: string;
}

function StatsCard({ title, value, color, link }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    indigo: 'bg-indigo-500',
  };

  const content = (
    <>
      <div className={`${colorClasses[color as keyof typeof colorClasses]} text-white px-4 py-5 rounded-t-lg`}>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="bg-white px-4 py-6 rounded-b-lg">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </>
  );

  if (link) {
    return (
      <Link href={link} className="block hover:shadow-lg transition-shadow rounded-lg">
        {content}
      </Link>
    );
  }

  return <div className="rounded-lg shadow">{content}</div>;
}
