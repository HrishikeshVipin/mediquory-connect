'use client';

import { useState, useEffect } from 'react';

interface PaymentSectionProps {
  consultationId: string;
  doctorName: string;
  doctorUpiId?: string;
  doctorQrCode?: string;
  prescriptionId?: string;
}

export default function PaymentSection({
  consultationId,
  doctorName,
  doctorUpiId,
  doctorQrCode,
  prescriptionId,
}: PaymentSectionProps) {
  const [amount, setAmount] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [paymentStatus, setPaymentStatus] = useState<any>(null);

  useEffect(() => {
    fetchPaymentStatus();

    // Auto-refresh every 10 seconds to check payment confirmation status
    const interval = setInterval(() => {
      fetchPaymentStatus();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [consultationId]);

  const fetchPaymentStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payments/${consultationId}/status`
      );
      const data = await response.json();
      if (data.success && data.data.payment) {
        setPaymentStatus(data.data.payment);
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      setMessage({ type: 'error', text: 'Please enter payment amount' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('amount', amount);
      if (proofFile) {
        formData.append('paymentProof', proofFile);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payments/${consultationId}/proof`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: 'Payment details submitted! Waiting for doctor confirmation.',
        });
        fetchPaymentStatus();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit payment details' });
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      setMessage({ type: 'error', text: 'An error occurred while submitting payment details' });
    } finally {
      setLoading(false);
    }
  };

  const downloadPrescription = async () => {
    if (!prescriptionId) return;

    try {
      window.open(
        `${process.env.NEXT_PUBLIC_API_URL}/prescriptions/${prescriptionId}/download`,
        '_blank'
      );
    } catch (error) {
      console.error('Error downloading prescription:', error);
    }
  };

  const isPaymentConfirmed = paymentStatus?.confirmedByDoctor;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment & Prescription</h3>

      {paymentStatus && (
        <div
          className={`mb-4 p-3 rounded ${
            isPaymentConfirmed
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
          }`}
        >
          {isPaymentConfirmed
            ? '✓ Payment confirmed by doctor'
            : 'Payment submitted - Awaiting doctor confirmation'}
        </div>
      )}

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

      {!isPaymentConfirmed && (
        <>
          <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Doctor's Payment Details</h4>
            {doctorUpiId && (
              <p className="text-sm text-blue-800 mb-1">
                <span className="font-medium">UPI ID:</span> {doctorUpiId}
              </p>
            )}
            {doctorQrCode && (
              <div className="mt-3">
                <p className="text-sm font-medium text-blue-900 mb-2">Scan QR Code:</p>
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${doctorQrCode.replace(/\\/g, '/')}`}
                  alt="UPI QR Code"
                  className="w-48 h-48 object-contain border border-blue-300 rounded"
                />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Amount (₹) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount paid"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Proof (Optional)
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Upload screenshot of payment</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Payment Details'}
            </button>
          </form>
        </>
      )}

      {prescriptionId && isPaymentConfirmed && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={downloadPrescription}
            className="w-full px-4 py-2 rounded-md transition-colors bg-green-600 text-white hover:bg-green-700"
          >
            📄 Download Prescription
          </button>
          <p className="mt-2 text-xs text-green-600 text-center font-medium">
            ✓ Payment confirmed - Prescription is ready
          </p>
        </div>
      )}

      {prescriptionId && !isPaymentConfirmed && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-blue-600 text-xl mr-3">ℹ️</span>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Prescription Available</h4>
                <p className="text-sm text-blue-700">
                  Your prescription has been generated by the doctor. Please complete the payment and wait for doctor confirmation to download it.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
