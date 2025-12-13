'use client';

import { useState } from 'react';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface PrescriptionFormProps {
  consultationId: string;
  onSuccess?: () => void;
}

export default function PrescriptionForm({ consultationId, onSuccess }: PrescriptionFormProps) {
  const [formData, setFormData] = useState({
    diagnosis: '',
    instructions: '',
  });
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', frequency: '', duration: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validate
    if (!formData.diagnosis.trim()) {
      setMessage({ type: 'error', text: 'Please enter diagnosis' });
      setLoading(false);
      return;
    }

    const validMeds = medications.filter(m => m.name.trim());
    if (validMeds.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one medication' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/prescriptions/${consultationId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            diagnosis: formData.diagnosis,
            medications: validMeds,
            instructions: formData.instructions,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Prescription generated successfully!' });
        if (onSuccess) onSuccess();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to generate prescription' });
      }
    } catch (error) {
      console.error('Error generating prescription:', error);
      setMessage({ type: 'error', text: 'An error occurred while generating prescription' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Prescription</h3>

      {message.text && (
        <div
          className={`mb-4 p-3 rounded ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Diagnosis *
          </label>
          <textarea
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter diagnosis..."
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Medications *
            </label>
            <button
              type="button"
              onClick={addMedication}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add Medication
            </button>
          </div>

          {medications.map((med, index) => (
            <div key={index} className="mb-3 p-3 border border-gray-200 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Medication {index + 1}</span>
                {medications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedication(index)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={med.name}
                  onChange={(e) => updateMedication(index, 'name', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Medicine name"
                />
                <input
                  type="text"
                  value={med.dosage}
                  onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dosage (e.g., 500mg)"
                />
                <input
                  type="text"
                  value={med.frequency}
                  onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Frequency (e.g., Twice daily)"
                />
                <input
                  type="text"
                  value={med.duration}
                  onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Duration (e.g., 7 days)"
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Instructions
          </label>
          <textarea
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any special instructions for the patient..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generating...' : 'Generate Prescription'}
        </button>
      </form>
    </div>
  );
}
