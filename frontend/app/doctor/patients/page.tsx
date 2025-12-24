'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import { patientApi } from '@/lib/api';
import AnimatedBackground from '../../../components/AnimatedBackground';

interface Patient {
  id: string;
  fullName: string;
  phone?: string;
  age?: number;
  gender?: string;
  accessToken: string;
  shareableLink: string;
  createdAt: string;
  createdVia: string;
  status: string;
  videoCallEnabled: boolean;
  _count: {
    consultations: number;
  };
}

export default function PatientsListPage() {
  const router = useRouter();
  const { isAuthenticated, role, initAuth, user } = useAuthStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'MANUAL' | 'SELF_REGISTERED'>('ALL');
  const [stats, setStats] = useState({ total: 0, manual: 0, selfRegistered: 0, active: 0, waitlisted: 0 });
  const [allowSelfRegistration, setAllowSelfRegistration] = useState(true);
  const [copiedRegistrationLink, setCopiedRegistrationLink] = useState(false);
  const [managingPatient, setManagingPatient] = useState<Patient | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || role !== 'DOCTOR')) {
      router.push('/doctor/login');
    }
  }, [isAuthenticated, role, loading, router]);

  useEffect(() => {
    if (isAuthenticated && role === 'DOCTOR') {
      fetchPatients();
    }
  }, [isAuthenticated, role, filter]);

  const fetchPatients = async () => {
    try {
      const params: any = { search };
      if (filter !== 'ALL') {
        params.createdVia = filter;
      }
      const response = await patientApi.getPatients(params);
      if (response.success && response.data) {
        setPatients(response.data.patients || []);
        setStats(response.data.stats || { total: 0, manual: 0, selfRegistered: 0, active: 0, waitlisted: 0 });
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivatePatient = async (patientId: string) => {
    try {
      const response = await patientApi.activatePatient(patientId);
      if (response.success) {
        alert('Patient activated successfully!');
        setManagingPatient(null);
        fetchPatients();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to activate patient');
    }
  };

  const handleToggleVideo = async (patientId: string, enabled: boolean) => {
    try {
      const response = await patientApi.toggleVideoCall(patientId, enabled);
      if (response.success) {
        alert(`Video call ${enabled ? 'enabled' : 'disabled'} successfully!`);
        fetchPatients();
        // Update the managing patient state
        if (managingPatient) {
          setManagingPatient({ ...managingPatient, videoCallEnabled: enabled });
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to toggle video call');
    }
  };

  const handleDeletePatient = async () => {
    if (!managingPatient) return;

    try {
      const response = await patientApi.deletePatient(managingPatient.id);
      if (response.success) {
        alert('Patient deleted successfully!');
        setShowDeleteConfirm(false);
        setManagingPatient(null);
        fetchPatients();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete patient');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients();
  };

  const copyLink = (link: string, patientId: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(patientId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyRegistrationLink = () => {
    const registrationLink = `${window.location.origin}/join/${user?.id}`;
    navigator.clipboard.writeText(registrationLink);
    setCopiedRegistrationLink(true);
    setTimeout(() => setCopiedRegistrationLink(false), 2000);
  };

  const handleToggleSelfRegistration = async (enabled: boolean) => {
    try {
      const response = await patientApi.toggleSelfRegistration(enabled);
      if (response.success) {
        setAllowSelfRegistration(enabled);
        alert(response.message);
      }
    } catch (error: any) {
      console.error('Error toggling self-registration:', error);
      alert(error.response?.data?.message || 'Failed to update setting');
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

  if (!isAuthenticated || role !== 'DOCTOR') {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40">
      <AnimatedBackground />

      <header className="relative z-10 bg-white/80 backdrop-blur-lg border-b border-cyan-200/50 sticky top-0 shadow-lg shadow-cyan-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Mediquory Connect" className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">My Patients</h1>
              <p className="text-sm text-gray-600">Manage your patient list</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/doctor/patients/new"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-medium transition-all hover:scale-105"
            >
              + Create New Patient
            </Link>
            <Link
              href="/doctor/dashboard"
              className="px-4 py-2 bg-white/70 border border-cyan-200/50 text-blue-900 rounded-xl font-medium hover:bg-white transition-all"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Registration Link Section */}
        <div className="mb-6 bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Patient Self-Registration Link
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Share this link on your social media or website to let patients register under you directly:
          </p>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/join/${user?.id}`}
              className="flex-1 px-4 py-3 bg-white/50 backdrop-blur-sm border border-cyan-200/50 rounded-xl text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              onClick={copyRegistrationLink}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105 ${
                copiedRegistrationLink
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700'
              }`}
            >
              {copiedRegistrationLink ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowSelfRegistration}
                onChange={(e) => handleToggleSelfRegistration(e.target.checked)}
                className="rounded border-cyan-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-sm text-gray-700 font-medium">Enable self-registration</span>
            </label>
          </div>
          <p className="text-xs text-gray-500">
            When enabled, new patients can register using this link. They'll count toward your subscription limit.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-6 hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-gray-600">Total Patients</h4>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{stats.total}</p>
          </div>
          <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-6 hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-gray-600">Manual</h4>
            </div>
            <p className="text-3xl font-bold text-blue-900">{stats.manual}</p>
            <p className="text-xs text-gray-500 mt-2">
              {stats.total > 0 ? Math.round((stats.manual / stats.total) * 100) : 0}% of total
            </p>
          </div>
          <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-6 hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-gray-600">Self-Registered</h4>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{stats.selfRegistered}</p>
            <p className="text-xs text-gray-500 mt-2">
              {stats.total > 0 ? Math.round((stats.selfRegistered / stats.total) * 100) : 0}% of total
            </p>
          </div>
          <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-6 hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-gray-600">Waitlisted</h4>
            </div>
            <p className="text-3xl font-bold text-orange-600">{stats.waitlisted}</p>
            <p className="text-xs text-gray-500 mt-2">Awaiting activation</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or phone..."
                className="w-full pl-12 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-cyan-200/50 rounded-xl text-blue-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg shadow-cyan-500/30"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  fetchPatients();
                }}
                className="px-4 py-3 bg-white/70 border border-cyan-200/50 text-gray-700 rounded-xl font-medium hover:bg-white transition-all"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-blue-900">Filter by:</span>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 ${
              filter === 'ALL'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-white/70 backdrop-blur-sm border border-cyan-200/50 text-blue-900 hover:bg-white'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('MANUAL')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 ${
              filter === 'MANUAL'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-white/70 backdrop-blur-sm border border-cyan-200/50 text-blue-900 hover:bg-white'
            }`}
          >
            Manual ({stats.manual})
          </button>
          <button
            onClick={() => setFilter('SELF_REGISTERED')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 ${
              filter === 'SELF_REGISTERED'
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white/70 backdrop-blur-sm border border-cyan-200/50 text-emerald-700 hover:bg-white'
            }`}
          >
            Self-Registered ({stats.selfRegistered})
          </button>
        </div>

        {/* Patients List */}
        {patients.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-blue-900 mb-2">No Patients Yet</h3>
            <p className="text-gray-600 mb-6">
              {search
                ? 'No patients found matching your search.'
                : 'Create your first patient to get started.'}
            </p>
            {!search && (
              <Link
                href="/doctor/patients/new"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg shadow-cyan-500/30"
              >
                Create First Patient
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-lg shadow-cyan-500/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-cyan-200/30">
              <thead className="bg-gradient-to-r from-blue-50/80 to-cyan-50/80 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Demographics
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Consultations
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-cyan-200/30">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-white/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-sm font-semibold text-blue-900">{patient.fullName}</div>
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            patient.createdVia === 'SELF_REGISTERED'
                              ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200'
                              : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {patient.createdVia === 'SELF_REGISTERED' ? 'Self-Registered' : 'Manual'}
                        </span>
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            patient.status === 'WAITLISTED'
                              ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200'
                              : 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {patient.status === 'WAITLISTED' ? 'Waitlisted' : 'Active'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-blue-900 font-medium">{patient.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {patient.age && `${patient.age}y`}
                        {patient.age && patient.gender && ' • '}
                        {patient.gender}
                        {!patient.age && !patient.gender && 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-cyan-600">{patient._count.consultations}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {new Date(patient.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setManagingPatient(patient)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-700 transition-all hover:scale-105 shadow-md"
                        >
                          Manage
                        </button>
                        <Link
                          href={`/doctor/patients/${patient.id}/consult`}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-green-700 transition-all hover:scale-105 shadow-md"
                        >
                          Consult
                        </Link>
                        <button
                          onClick={() => copyLink(patient.shareableLink, patient.id)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 shadow-md ${
                            copiedId === patient.id
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                              : 'bg-white/70 border border-cyan-200/50 text-blue-900 hover:bg-white'
                          }`}
                        >
                          {copiedId === patient.id ? 'Copied!' : 'Copy Link'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </main>

      {/* Manage Patient Modal */}
      {managingPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl border border-cyan-200/50 rounded-3xl shadow-2xl shadow-cyan-500/20 max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Manage Patient</h2>
              <button
                onClick={() => setManagingPatient(null)}
                className="text-gray-500 hover:text-gray-700 text-3xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Patient Info */}
              <div className="bg-gradient-to-r from-blue-50/80 to-cyan-50/80 backdrop-blur-sm rounded-2xl p-4 border border-cyan-200/30">
                <p className="font-bold text-blue-900 text-lg">{managingPatient.fullName}</p>
                <p className="text-sm text-gray-600 mt-1">{managingPatient.phone}</p>
                <div className="flex gap-2 mt-3">
                  <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                    managingPatient.status === 'WAITLISTED'
                      ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200'
                      : 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {managingPatient.status === 'WAITLISTED' ? 'Waitlisted' : 'Active'}
                  </span>
                </div>
              </div>

              {/* Activate Button */}
              {managingPatient.status === 'WAITLISTED' && (
                <button
                  onClick={() => handleActivatePatient(managingPatient.id)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-emerald-500/30"
                >
                  Activate Patient
                </button>
              )}

              {/* Video Call Toggle */}
              <div className="bg-white/70 backdrop-blur-sm border border-cyan-200/50 rounded-2xl p-4">
                <div className="flex justify-between items-center gap-3">
                  <div>
                    <p className="font-semibold text-blue-900">Video Call Access</p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {managingPatient.videoCallEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleVideo(managingPatient.id, !managingPatient.videoCallEnabled)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all hover:scale-105 shadow-md ${
                      managingPatient.videoCallEnabled
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white hover:from-amber-600 hover:to-yellow-700'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700'
                    }`}
                  >
                    {managingPatient.videoCallEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-red-500/30"
              >
                Delete Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && managingPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl border border-red-200/50 rounded-3xl shadow-2xl shadow-red-500/20 max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-600">Confirm Delete</h2>
            </div>
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete <strong className="text-blue-900">{managingPatient.fullName}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 mt-4">
              <p className="text-sm text-red-800 font-medium">
                This will permanently delete all patient data including:
              </p>
              <ul className="text-sm text-red-700 mt-2 ml-4 list-disc space-y-1">
                <li>Consultation history</li>
                <li>Prescriptions</li>
                <li>Vitals records</li>
                <li>Uploaded files</li>
              </ul>
              <p className="text-sm text-red-800 font-bold mt-3">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-white/70 border border-cyan-200/50 text-gray-800 rounded-xl hover:bg-white font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePatient}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-red-500/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
