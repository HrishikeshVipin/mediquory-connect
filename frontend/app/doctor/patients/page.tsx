'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import { patientApi } from '@/lib/api';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || role !== 'DOCTOR') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Patients</h1>
            <p className="text-sm text-gray-600">Manage your patient list</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/doctor/patients/new"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Create New Patient
            </Link>
            <Link
              href="/doctor/dashboard"
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Registration Link Section */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient Self-Registration Link</h3>
          <p className="text-sm text-gray-600 mb-3">
            Share this link on your social media or website to let patients register under you directly:
          </p>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/join/${user?.id}`}
              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={copyRegistrationLink}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                copiedRegistrationLink
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copiedRegistrationLink ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowSelfRegistration}
                onChange={(e) => handleToggleSelfRegistration(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Enable self-registration</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            When enabled, new patients can register using this link. They'll count toward your subscription limit.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-1">Total Patients</h4>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-1">Manual Creation</h4>
            <p className="text-2xl font-bold text-blue-600">{stats.manual}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total > 0 ? Math.round((stats.manual / stats.total) * 100) : 0}% of total
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-1">Self-Registered</h4>
            <p className="text-2xl font-bold text-green-600">{stats.selfRegistered}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total > 0 ? Math.round((stats.selfRegistered / stats.total) * 100) : 0}% of total
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-1">Waitlisted</h4>
            <p className="text-2xl font-bold text-orange-600">{stats.waitlisted}</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting activation</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter by:</span>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'ALL'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('MANUAL')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'MANUAL'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Manual ({stats.manual})
          </button>
          <button
            onClick={() => setFilter('SELF_REGISTERED')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'SELF_REGISTERED'
                ? 'bg-green-600 text-white'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            Self-Registered ({stats.selfRegistered})
          </button>
        </div>

        {/* Patients List */}
        {patients.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Patients Yet</h3>
            <p className="text-gray-600 mb-6">
              {search
                ? 'No patients found matching your search.'
                : 'Create your first patient to get started.'}
            </p>
            {!search && (
              <Link
                href="/doctor/patients/new"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create First Patient
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Demographics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consultations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900">{patient.fullName}</div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            patient.createdVia === 'SELF_REGISTERED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {patient.createdVia === 'SELF_REGISTERED' ? '🔗 Self-Registered' : '👤 Manual'}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            patient.status === 'WAITLISTED'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {patient.status === 'WAITLISTED' ? '⏳ Waitlisted' : '✓ Active'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.age && `${patient.age}y`}
                        {patient.age && patient.gender && ' • '}
                        {patient.gender}
                        {!patient.age && !patient.gender && 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient._count.consultations}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(patient.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setManagingPatient(patient)}
                          className="px-3 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                        >
                          Manage
                        </button>
                        <Link
                          href={`/doctor/patients/${patient.id}/consult`}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                        >
                          Consult
                        </Link>
                        <button
                          onClick={() => copyLink(patient.shareableLink, patient.id)}
                          className={`px-3 py-1 rounded ${
                            copiedId === patient.id
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {copiedId === patient.id ? '✓ Copied' : 'Copy Link'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Manage Patient Modal */}
      {managingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Manage Patient</h2>
              <button
                onClick={() => setManagingPatient(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Patient Info */}
              <div className="bg-gray-50 rounded p-4">
                <p className="font-semibold text-gray-900">{managingPatient.fullName}</p>
                <p className="text-sm text-gray-600">{managingPatient.phone}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    managingPatient.status === 'WAITLISTED'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {managingPatient.status === 'WAITLISTED' ? '⏳ Waitlisted' : '✓ Active'}
                  </span>
                </div>
              </div>

              {/* Activate Button */}
              {managingPatient.status === 'WAITLISTED' && (
                <button
                  onClick={() => handleActivatePatient(managingPatient.id)}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  ✓ Activate Patient
                </button>
              )}

              {/* Video Call Toggle */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">Video Call Access</p>
                    <p className="text-sm text-gray-600">
                      {managingPatient.videoCallEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleVideo(managingPatient.id, !managingPatient.videoCallEnabled)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      managingPatient.videoCallEnabled
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    {managingPatient.videoCallEnabled ? '📹 Disable Video' : '📹 Enable Video'}
                  </button>
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                🗑️ Delete Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && managingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Confirm Delete</h2>
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete <strong>{managingPatient.fullName}</strong>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              This will permanently delete all patient data including:
              consultation history, prescriptions, vitals, and uploaded files.
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePatient}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
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
