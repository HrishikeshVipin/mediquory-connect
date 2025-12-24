'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import { authApi, subscriptionApi, consultationApi } from '../../../lib/api';
import { connectSocket } from '../../../lib/socket';
import { NotificationProvider } from '../../../context/NotificationContext';
import NotificationBell from '../../../components/NotificationBell';
import AnimatedBackground from '../../../components/AnimatedBackground';
import type { Doctor, SubscriptionInfo } from '../../../types';

export default function DoctorDashboard() {
  const router = useRouter();
  const { isAuthenticated, role, user, clearAuth, initAuth } = useAuthStore();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [unreadChats, setUnreadChats] = useState<any[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || role !== 'DOCTOR')) {
      router.push('/doctor/login');
    }
  }, [isAuthenticated, role, loading, router]);

  // Fetch subscription info
  const fetchSubscriptionInfo = async () => {
    try {
      setSubscriptionLoading(true);
      const response = await subscriptionApi.getMySubscription();
      if (response.success && response.data) {
        setSubscriptionInfo(response.data);
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && role === 'DOCTOR' && user) {
      setDoctor(user as Doctor);
      setLoading(false);
      fetchSubscriptionInfo();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, role, user]);

  // Refetch subscription info when page becomes visible or focused (after payment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && role === 'DOCTOR') {
        console.log('🔄 Page visible - refreshing subscription data');
        fetchSubscriptionInfo();
      }
    };

    const handleFocus = () => {
      if (isAuthenticated && role === 'DOCTOR') {
        console.log('🔄 Window focused - refreshing subscription data');
        fetchSubscriptionInfo();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, role]);

  // Fetch unread chats and set up real-time updates
  useEffect(() => {
    if (!isAuthenticated || role !== 'DOCTOR' || !user?.id) return;

    const fetchUnreadChats = async () => {
      try {
        const response = await consultationApi.getUnreadConsultations();
        if (response.success && response.data) {
          setUnreadChats(response.data.unreadChats);
          setTotalUnread(response.data.totalUnread);
        }
      } catch (error) {
        console.error('Error fetching unread chats:', error);
      }
    };

    fetchUnreadChats();

    // Connect to socket for real-time updates
    const socket = connectSocket();

    // Join doctor's personal room for notifications
    socket.emit('join-doctor-room', { doctorId: user.id });

    // Listen for new unread messages
    socket.on('new-unread-message', (data: any) => {
      console.log('New unread message notification:', data);
      // Refresh unread chats
      fetchUnreadChats();
    });

    return () => {
      socket.off('new-unread-message');
    };
  }, [isAuthenticated, role, user?.id]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'PENDING_VERIFICATION':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'SUSPENDED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const trialDaysLeft = doctor?.trialEndsAt
    ? Math.ceil((new Date(doctor.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const getWarningBannerConfig = () => {
    if (!subscriptionInfo) return null;

    const { warningLevel, message } = subscriptionInfo.status;

    switch (warningLevel) {
      case 'critical':
        return {
          color: 'bg-red-100 border-red-300 text-red-800',
          icon: '🚨',
          title: 'Critical: Very Low Minutes',
          message: message || 'You have very few video minutes remaining. Please purchase more minutes to avoid interruption.'
        };
      case 'low':
        return {
          color: 'bg-orange-100 border-orange-300 text-orange-800',
          icon: '⚠️',
          title: 'Low Video Minutes',
          message: message || 'Your video minutes are running low. Consider purchasing more minutes.'
        };
      case 'expired':
        return {
          color: 'bg-red-100 border-red-300 text-red-800',
          icon: '❌',
          title: 'Subscription Expired',
          message: message || 'Your subscription has expired. Please renew to continue using the platform.'
        };
      default:
        return null;
    }
  };

  const warningConfig = getWarningBannerConfig();

  return (
    <NotificationProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40 pb-20">
        <AnimatedBackground />
        {/* Mobile-Optimized Header */}
        <header className="relative z-10 bg-white/80 backdrop-blur-lg border-b border-cyan-200/50 sticky top-0 shadow-lg shadow-cyan-500/10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Mediquory Connect" className="w-10 h-10" />
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Mediquory Connect</h1>
                <NotificationBell />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-blue-900">Dr. {doctor.fullName}</p>
                  <p className="text-xs text-gray-700">{doctor.specialization}</p>
                </div>
                <Link
                  href="/doctor/account"
                  className="px-3 py-2 sm:px-4 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-medium text-sm transition-all hover:scale-105"
                  title="My Account"
                >
                  <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="hidden sm:inline">My Account</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 sm:px-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-medium text-sm transition-all hover:scale-105"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
        {/* Status Banner */}
        <div className={`rounded-2xl px-3 py-3 mb-3 shadow-lg ${getStatusColor(doctor.status)}`}>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">
              {doctor.status === 'VERIFIED' && '✓'}
              {doctor.status === 'PENDING_VERIFICATION' && '⏳'}
              {doctor.status === 'REJECTED' && '✗'}
              {doctor.status === 'SUSPENDED' && '⚠'}
            </span>
            <div>
              <p className="font-semibold text-xs sm:text-sm">Account Status: {doctor.status.replace(/_/g, ' ')}</p>
              {doctor.status === 'PENDING_VERIFICATION' && (
                <p className="text-xs mt-0.5">Your account is under review</p>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Warning Banner */}
        {warningConfig && (
          <div className={`rounded-2xl px-3 py-3 mb-4 border shadow-lg ${warningConfig.color}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">{warningConfig.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-xs sm:text-sm">{warningConfig.title}</p>
                  <p className="text-xs mt-0.5">{warningConfig.message}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fetchSubscriptionInfo}
                  className="flex-1 sm:flex-none px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-medium text-sm transition-all hover:scale-105"
                  title="Refresh subscription data"
                >
                  🔄 Refresh
                </button>
                <Link
                  href="/doctor/subscription"
                  className="flex-1 sm:flex-none px-4 py-2 bg-white/90 backdrop-blur-lg hover:bg-white text-gray-900 rounded-xl font-medium text-sm transition-all border border-cyan-200/50 text-center hover:scale-105"
                >
                  Manage
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid - Mobile First */}
        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Left Column - Stats */}
          <div className="lg:col-span-2 space-y-3 lg:space-y-4">
            {/* Stats Row - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              {/* Subscription Tier */}
              <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-4 transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-700">Subscription</p>
                      <p className="text-lg font-bold text-blue-900">
                        {subscriptionLoading
                          ? 'Loading...'
                          : (subscriptionInfo?.subscription.tier || doctor?.subscriptionTier || 'TRIAL')
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={fetchSubscriptionInfo}
                    className="text-blue-600 hover:text-blue-800 text-xl transition-all hover:scale-110"
                    title="Refresh subscription data"
                  >
                    🔄
                  </button>
                </div>
                {doctor.subscriptionStatus === 'TRIAL' && trialDaysLeft > 0 && (
                  <p className="text-xs text-primary-600">{trialDaysLeft} days left</p>
                )}
              </div>

              {/* Patients */}
              <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-4 transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-700">Patients</p>
                    <p className="text-lg font-bold text-blue-900">
                      {subscriptionInfo?.usage.patients.used || doctor.patientsCreated} / {subscriptionInfo?.usage.patients.unlimited ? '∞' : (subscriptionInfo?.usage.patients.limit || doctor.patientLimit)}
                    </p>
                  </div>
                </div>
                {subscriptionInfo && !subscriptionInfo.usage.patients.unlimited &&
                 subscriptionInfo.usage.patients.used >= subscriptionInfo.usage.patients.limit && (
                  <p className="text-xs text-red-600">Limit reached</p>
                )}
              </div>

              {/* Video Minutes */}
              <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-4 transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-700">Available Minutes</p>
                    <p className={`text-lg font-bold ${subscriptionInfo?.status.warningLevel === 'critical' ? 'text-red-600' : subscriptionInfo?.status.warningLevel === 'low' ? 'text-orange-600' : 'text-blue-900'}`}>
                      {subscriptionInfo?.usage.videoMinutes.available || 0}
                    </p>
                  </div>
                </div>
                {subscriptionInfo && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div
                      className={`h-1.5 rounded-full ${subscriptionInfo.status.warningLevel === 'critical' ? 'bg-red-500' : subscriptionInfo.status.warningLevel === 'low' ? 'bg-orange-500' : 'bg-green-500'}`}
                      style={{
                        width: `${Math.min(100, (subscriptionInfo.usage.videoMinutes.available / (subscriptionInfo.usage.videoMinutes.subscription + subscriptionInfo.usage.videoMinutes.purchased)) * 100)}%`
                      }}
                    ></div>
                  </div>
                )}
              </div>
            </div>

            {/* Unread Chats Card */}
            {doctor.status === 'VERIFIED' && (
              <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-5 transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-blue-900">
                    💬 Unread Chats {totalUnread > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-blue-600 text-white">
                        {totalUnread}
                      </span>
                    )}
                  </h3>
                  <Link
                    href="/doctor/patients"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View All Patients →
                  </Link>
                </div>

                {unreadChats.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">
                    No unread messages
                  </p>
                ) : (
                  <div className="space-y-3">
                    {unreadChats.map((chat) => (
                      <Link
                        key={chat.consultationId}
                        href={`/doctor/patients/${chat.patient.id}/consult`}
                        className="block p-4 border border-cyan-200/50 rounded-2xl hover:bg-blue-50/50 hover:border-blue-300 transition-all hover:scale-102 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">
                                {chat.patient.fullName}
                              </h4>
                              {chat.patient.status === 'WAITLISTED' && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                  Waitlisted
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {chat.lastMessage?.message || 'New message'}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xs text-gray-500">
                              {chat.lastMessage?.createdAt && new Date(chat.lastMessage.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {chat.unreadCount > 1 && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded-full bg-blue-600 text-white">
                                {chat.unreadCount} new
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            {doctor.status === 'VERIFIED' && (
              <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-5 transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/doctor/patients/new"
                    className="flex items-center gap-3 p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl hover:shadow-md transition-all duration-300 hover:scale-105 hover:-translate-y-1 border border-teal-200/50"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900 text-sm">Create Patient</p>
                      <p className="text-xs text-gray-700">Add new patient</p>
                    </div>
                  </Link>

                  <Link
                    href="/doctor/patients"
                    className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl hover:shadow-md transition-all duration-300 hover:scale-105 hover:-translate-y-1 border border-blue-200/50"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900 text-sm">View Patients</p>
                      <p className="text-xs text-gray-700">Manage patients</p>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Profile Info */}
          <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-5 transition-all duration-300 hover:scale-105 hover:-translate-y-1">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Profile Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-700">Full Name</p>
                <p className="text-sm font-semibold text-blue-900">{doctor.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-700">Email</p>
                <p className="text-sm font-semibold text-blue-900">{doctor.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-700">Phone</p>
                <p className="text-sm font-semibold text-blue-900">{doctor.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-700">Specialization</p>
                <p className="text-sm font-semibold text-blue-900">{doctor.specialization}</p>
              </div>
              <div>
                <p className="text-xs text-gray-700">Registration Type</p>
                <p className="text-sm font-semibold text-blue-900">
                  {doctor.registrationType === 'STATE_MEDICAL_COUNCIL'
                    ? `State Council${doctor.registrationState ? ` (${doctor.registrationState})` : ''}`
                    : 'National Commission'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending/Rejected Messages */}
        {doctor.status === 'PENDING_VERIFICATION' && (
          <div className="mt-6 bg-blue-50/70 backdrop-blur-xl border border-blue-200/50 rounded-2xl shadow-lg p-5">
            <h3 className="text-sm font-bold text-blue-900 mb-2">Verification in Progress</h3>
            <p className="text-sm text-gray-700">Your application is under review. You'll be notified via email once verified (typically 1-2 business days).</p>
          </div>
        )}

        {doctor.status === 'REJECTED' && doctor.rejectionReason && (
          <div className="mt-6 bg-red-50/70 backdrop-blur-xl border border-red-200/50 rounded-2xl shadow-lg p-5">
            <h3 className="text-sm font-bold text-red-900 mb-2">Application Rejected</h3>
            <p className="text-sm text-gray-700 mb-2">{doctor.rejectionReason}</p>
            <p className="text-xs text-gray-600">Please contact support if you need clarification.</p>
          </div>
        )}
      </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-cyan-200/50 shadow-lg lg:hidden z-50">
          <div className="grid grid-cols-4 gap-1 px-2 py-2">
            <Link
              href="/doctor/patients/new"
              className="flex flex-col items-center justify-center py-3 px-1 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-all"
            >
              <svg className="w-6 h-6 text-teal-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs font-medium text-gray-700">New</span>
            </Link>
            <Link
              href="/doctor/patients"
              className="flex flex-col items-center justify-center py-3 px-1 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-all"
            >
              <svg className="w-6 h-6 text-blue-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs font-medium text-gray-700">Patients</span>
            </Link>
            <Link
              href="/doctor/subscription"
              className="flex flex-col items-center justify-center py-3 px-1 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-all"
            >
              <svg className="w-6 h-6 text-purple-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-gray-700">Plans</span>
            </Link>
            <Link
              href="/doctor/account"
              className="flex flex-col items-center justify-center py-3 px-1 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-all"
            >
              <svg className="w-6 h-6 text-cyan-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs font-medium text-gray-700">Account</span>
            </Link>
          </div>
        </nav>
      </div>
    </NotificationProvider>
  );
}
