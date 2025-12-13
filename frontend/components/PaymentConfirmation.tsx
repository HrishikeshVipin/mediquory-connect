'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface PaymentConfirmationProps {
  consultationId: string;
  onPaymentConfirmed?: () => void;
}

export default function PaymentConfirmation({ consultationId, onPaymentConfirmed }: PaymentConfirmationProps) {
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchPaymentStatus();

    // Auto-refresh every 10 seconds to check for new payment submissions
    const interval = setInterval(() => {
      fetchPaymentStatus();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [consultationId]);

  const fetchPaymentStatus = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/payments/${consultationId}/status`
      );

      if (response.data.success && response.data.data.payment) {
        setPaymentData(response.data.data.payment);
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async () => {
    if (!confirm('Are you sure you want to confirm this payment?')) return;

    try {
      setConfirming(true);
      setMessage({ type: '', text: '' });

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/payments/${consultationId}/confirm`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: 'Payment confirmed successfully!',
        });
        fetchPaymentStatus();
        if (onPaymentConfirmed) {
          onPaymentConfirmed();
        }
      }
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to confirm payment',
      });
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">No payment received yet</p>
          <p className="text-xs mt-2">Payment details will appear here once the patient submits them</p>
        </div>
      </div>
    );
  }

  const isConfirmed = paymentData.confirmedByDoctor;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>

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

      <div
        className={`mb-4 p-4 rounded border ${
          isConfirmed
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isConfirmed
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {isConfirmed ? '✓ Confirmed' : '⏳ Pending Confirmation'}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold text-gray-900">₹{paymentData.amount}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Submitted:</span>
            <span className="text-gray-900">
              {new Date(paymentData.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {isConfirmed && paymentData.confirmedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Confirmed:</span>
              <span className="text-gray-900">
                {new Date(paymentData.confirmedAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {paymentData.proofImagePath && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Proof:
          </label>
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${paymentData.proofImagePath.replace(/\\/g, '/')}`}
            alt="Payment proof"
            className="w-full max-w-md border border-gray-300 rounded"
            onError={(e) => {
              e.currentTarget.src = '';
              e.currentTarget.alt = 'Failed to load payment proof';
              e.currentTarget.className = 'w-full max-w-md border border-gray-300 rounded p-4 text-center text-gray-500';
            }}
          />
        </div>
      )}

      {!isConfirmed && (
        <button
          onClick={confirmPayment}
          disabled={confirming}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {confirming ? 'Confirming...' : 'Confirm Payment Received'}
        </button>
      )}

      {isConfirmed && (
        <div className="text-center text-sm text-green-700 font-medium">
          ✓ You have confirmed receiving this payment
        </div>
      )}
    </div>
  );
}
