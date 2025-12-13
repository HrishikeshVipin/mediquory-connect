'use client';

import { useState } from 'react';

interface FileUploadProps {
  patientId: string;
  accessToken: string;
  onSuccess?: () => void;
}

export default function FileUpload({ patientId, accessToken, onSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file to upload' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);
      formData.append('accessToken', accessToken);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/patients/${patientId}/files`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'File uploaded successfully!' });
        setFile(null);
        setDescription('');
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        if (onSuccess) onSuccess();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to upload file' });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage({ type: 'error', text: 'An error occurred while uploading file' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Medical Reports</h3>

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
            Select File
          </label>
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            accept="image/*,.pdf"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Accepted formats: Images (JPG, PNG) and PDF files
          </p>
        </div>

        {file && (
          <div className="p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Selected file:</span> {file.name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Size: {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description of the report or document..."
          />
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Uploading...' : 'Upload File'}
        </button>
      </form>
    </div>
  );
}
