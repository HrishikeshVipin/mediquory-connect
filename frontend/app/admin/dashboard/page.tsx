'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, authApi } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { connectSocket } from '../../../lib/socket';
import { NotificationProvider } from '../../../context/NotificationContext';
import NotificationBell from '../../../components/NotificationBell';
import AnimatedBackground from '../../../components/AnimatedBackground';
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

      // Connect to socket for real-time updates
      const socket = connectSocket();
      socket.emit('join-admin-room', { adminId: user?.id });

      // Listen for new doctor registration notifications
      socket.on('notification', (notification: any) => {
        if (notification.type === 'PENDING_DOCTOR') {
          // Refresh stats when new doctor registers
          fetchStats();
        }
      });

      return () => {
        socket.off('notification');
      };
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, role, user?.id]);

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
      <div className="relative min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40">
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-lg text-blue-900">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || role !== 'ADMIN') {
    return null;
  }

  return (
    <NotificationProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40">
        <AnimatedBackground />
        {/* Header */}
        <header className="relative z-10 bg-white/80 backdrop-blur-lg border-b border-cyan-200/50 shadow-lg shadow-cyan-500/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Mediquory Connect" className="w-10 h-10" />
              <div>
                <h1 className="text-2xl font-bold text-blue-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-700">Welcome, {user?.fullName || 'Admin'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl transition-all hover:scale-105"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/doctors/pending"
              className="p-4 border-2 border-yellow-300/50 rounded-2xl hover:bg-yellow-50/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
            >
              <h3 className="font-semibold text-yellow-800">Pending Verification</h3>
              <p className="text-sm text-gray-700 mt-1">
                Review {stats?.doctors.pending || 0} pending doctors
              </p>
            </Link>

            <Link
              href="/admin/doctors"
              className="p-4 border-2 border-blue-300/50 rounded-2xl hover:bg-blue-50/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
            >
              <h3 className="font-semibold text-blue-800">All Doctors</h3>
              <p className="text-sm text-gray-700 mt-1">
                Manage all {stats?.doctors.total || 0} doctors
              </p>
            </Link>

            <Link
              href="/admin/subscriptions"
              className="p-4 border-2 border-purple-300/50 rounded-2xl hover:bg-purple-50/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
            >
              <h3 className="font-semibold text-purple-800">Subscriptions</h3>
              <p className="text-sm text-gray-700 mt-1">Manage subscriptions</p>
            </Link>

            <Link
              href="/admin/subscription-plans"
              className="p-4 border-2 border-green-300/50 rounded-2xl hover:bg-green-50/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
            >
              <h3 className="font-semibold text-green-800">Subscription Plans</h3>
              <p className="text-sm text-gray-700 mt-1">Manage pricing and features</p>
            </Link>
          </div>
        </div>
      </main>
      </div>
    </NotificationProvider>
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
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  const content = (
    <>
      <div className={`bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} text-white px-4 py-5 rounded-t-3xl`}>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="bg-white/70 backdrop-blur-xl px-4 py-6 rounded-b-3xl border-x border-b border-cyan-200/50">
        <p className="text-3xl font-bold text-blue-900">{value}</p>
      </div>
    </>
  );

  if (link) {
    return (
      <Link href={link} className="block hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 rounded-3xl shadow-lg shadow-cyan-500/10">
        {content}
      </Link>
    );
  }

  return <div className="rounded-3xl shadow-lg shadow-cyan-500/10 transition-all duration-300 hover:scale-105 hover:-translate-y-1">{content}</div>;
}
