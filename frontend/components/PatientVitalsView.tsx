'use client';

import { useEffect, useState } from 'react';
import { patientApi } from '../lib/api';

interface Vitals {
  id: string;
  weight?: number;
  height?: number;
  bloodPressure?: string;
  temperature?: number;
  heartRate?: number;
  oxygenLevel?: number;
  notes?: string;
  createdAt: string;
}

interface PatientVitalsViewProps {
  patientId: string;
  refreshTrigger?: number;
}

export default function PatientVitalsView({ patientId, refreshTrigger }: PatientVitalsViewProps) {
  const [vitals, setVitals] = useState<Vitals[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVitals();
  }, [patientId, refreshTrigger]);

  const fetchVitals = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await patientApi.getPatientVitals(patientId);
      if (response.success && response.data) {
        setVitals(response.data.vitals);
      }
    } catch (err: any) {
      console.error('Error fetching vitals:', err);
      setError(err.response?.data?.message || 'Failed to load vitals');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-gray-600">Loading vitals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (vitals.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl mb-4 block">📊</span>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vitals Recorded</h3>
        <p className="text-gray-600">Patient hasn't submitted any vitals yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Patient Vitals History</h3>
        <button
          onClick={fetchVitals}
          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {vitals.map((vital) => (
        <div key={vital.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">
              {new Date(vital.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {vital.weight && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚖️</span>
                <div>
                  <p className="text-xs text-gray-600">Weight</p>
                  <p className="font-semibold text-gray-900">{vital.weight} kg</p>
                </div>
              </div>
            )}

            {vital.height && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">📏</span>
                <div>
                  <p className="text-xs text-gray-600">Height</p>
                  <p className="font-semibold text-gray-900">{vital.height} cm</p>
                </div>
              </div>
            )}

            {vital.bloodPressure && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">💉</span>
                <div>
                  <p className="text-xs text-gray-600">Blood Pressure</p>
                  <p className="font-semibold text-gray-900">{vital.bloodPressure}</p>
                </div>
              </div>
            )}

            {vital.temperature && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌡️</span>
                <div>
                  <p className="text-xs text-gray-600">Temperature</p>
                  <p className="font-semibold text-gray-900">{vital.temperature}°C</p>
                </div>
              </div>
            )}

            {vital.heartRate && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">❤️</span>
                <div>
                  <p className="text-xs text-gray-600">Heart Rate</p>
                  <p className="font-semibold text-gray-900">{vital.heartRate} bpm</p>
                </div>
              </div>
            )}

            {vital.oxygenLevel && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🫁</span>
                <div>
                  <p className="text-xs text-gray-600">Oxygen Level</p>
                  <p className="font-semibold text-gray-900">{vital.oxygenLevel}%</p>
                </div>
              </div>
            )}
          </div>

          {vital.notes && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Notes:</p>
              <p className="text-sm text-gray-800">{vital.notes}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
