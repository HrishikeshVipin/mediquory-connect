'use client';

import { useEffect, useState } from 'react';
import { patientApi } from '../lib/api';

interface MedicalFile {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  description?: string;
  createdAt: string;
}

interface PatientFilesViewProps {
  patientId: string;
  refreshTrigger?: number;
}

export default function PatientFilesView({ patientId, refreshTrigger }: PatientFilesViewProps) {
  const [files, setFiles] = useState<MedicalFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<MedicalFile | null>(null);

  useEffect(() => {
    fetchFiles();
  }, [patientId, refreshTrigger]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await patientApi.getPatientFiles(patientId);
      if (response.success && response.data) {
        setFiles(response.data.files);
      }
    } catch (err: any) {
      console.error('Error fetching files:', err);
      setError(err.response?.data?.message || 'Failed to load medical files');
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = (filePath: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}/${filePath.replace(/\\/g, '/')}`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    return '📎';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-gray-600">Loading medical files...</p>
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

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl mb-4 block">📁</span>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Medical Files</h3>
        <p className="text-gray-600">Patient hasn't uploaded any medical files yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Medical Files ({files.length})</h3>
        <button
          onClick={fetchFiles}
          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
            onClick={() => setSelectedFile(file)}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl flex-shrink-0">{getFileIcon(file.fileType)}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">{file.fileName}</h4>
                {file.description && (
                  <p className="text-sm text-gray-600 mt-1">{file.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Uploaded {new Date(file.createdAt).toLocaleString()}
                </p>
              </div>
              <a
                href={getFileUrl(file.filePath)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* File Preview Modal */}
      {selectedFile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedFile(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedFile.fileName}</h3>
                <p className="text-sm text-gray-600">{selectedFile.description}</p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              {selectedFile.fileType.startsWith('image/') ? (
                <img
                  src={getFileUrl(selectedFile.filePath)}
                  alt={selectedFile.fileName}
                  className="max-w-full h-auto rounded-lg"
                />
              ) : selectedFile.fileType === 'application/pdf' ? (
                <iframe
                  src={getFileUrl(selectedFile.filePath)}
                  className="w-full h-[70vh] rounded-lg"
                  title={selectedFile.fileName}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                  <a
                    href={getFileUrl(selectedFile.filePath)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
