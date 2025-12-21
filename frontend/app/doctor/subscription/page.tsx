'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { useAuthStore } from '../../../store/authStore';
import { subscriptionApi } from '../../../lib/api';
import type { SubscriptionPlan, SubscriptionInfo, MinutePackage } from '../../../types';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [minutePackages, setMinutePackages] = useState<MinutePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || role !== 'DOCTOR') {
      router.push('/doctor/login');
      return;
    }

    loadSubscriptionData();
  }, [isAuthenticated, role]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);

      const [infoResponse, plansResponse, packagesResponse] = await Promise.all([
        subscriptionApi.getMySubscription(),
        subscriptionApi.getPlans(),
        subscriptionApi.getMinutePackages(),
      ]);

      if (infoResponse.success && infoResponse.data) {
        setSubscriptionInfo(infoResponse.data);
      }
      if (plansResponse.success && plansResponse.data) {
        setPlans(plansResponse.data.plans);
      }
      if (packagesResponse.success && packagesResponse.data) {
        setMinutePackages(packagesResponse.data.packages);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyMinutes = async (packageInfo: MinutePackage) => {
    if (!razorpayLoaded) {
      alert('Payment gateway is loading. Please try again in a moment.');
      return;
    }

    try {
      const response = await subscriptionApi.purchaseMinutes(packageInfo.minutes, packageInfo.price);

      if (response.success && response.data) {
        const { razorpayOrder, purchase } = response.data;

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SAMPLE_KEY',
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'Bhishak Med',
          description: `${packageInfo.minutes} Video Minutes`,
          order_id: razorpayOrder.id,
          handler: async function (response: any) {
            try {
              // Confirm purchase with backend
              const confirmResponse = await subscriptionApi.confirmPurchase(
                purchase.id,
                response.razorpay_payment_id,
                response.razorpay_signature
              );

              if (confirmResponse.success) {
                alert(`Success! ${packageInfo.minutes} minutes added to your account.`);
                loadSubscriptionData(); // Reload data
              } else {
                alert('Payment verification failed. Please contact support.');
              }
            } catch (error) {
              console.error('Error confirming purchase:', error);
              alert('Payment verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
            }
          },
          prefill: {
            name: 'Doctor Name',
            email: 'doctor@example.com',
          },
          theme: {
            color: '#3B82F6',
          },
          modal: {
            ondismiss: function () {
              console.log('Payment cancelled');
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error) {
      console.error('Error purchasing minutes:', error);
      alert('Failed to initiate purchase');
    }
  };

  const handleUpgradePlan = async (planTier: string, planName: string, planPrice: number) => {
    if (!razorpayLoaded) {
      alert('Payment gateway is loading. Please try again in a moment.');
      return;
    }

    if (!confirm(`Upgrade to ${planName} (₹${(planPrice / 100).toFixed(0)}/month)?`)) return;

    try {
      const response = await subscriptionApi.upgradeSubscription(planTier);

      if (response.success && response.data) {
        const { razorpayOrder } = response.data;

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SAMPLE_KEY',
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'Bhishak Med',
          description: `${planName} - Monthly Subscription`,
          order_id: razorpayOrder.id,
          handler: async function (response: any) {
            try {
              // Confirm upgrade with backend
              const confirmResponse = await subscriptionApi.confirmUpgrade(
                response.razorpay_payment_id,
                response.razorpay_order_id,
                response.razorpay_signature,
                planTier
              );

              if (confirmResponse.success) {
                alert(`Success! You've been upgraded to ${planName}. Redirecting to dashboard...`);
                // Small delay to let user see the message, then redirect to dashboard
                setTimeout(() => {
                  window.location.href = '/doctor/dashboard';
                }, 1500);
              } else {
                alert('Payment verification failed. Please contact support.');
              }
            } catch (error) {
              console.error('Error confirming upgrade:', error);
              alert('Payment verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
            }
          },
          prefill: {
            name: 'Doctor Name',
            email: 'doctor@example.com',
          },
          theme: {
            color: '#3B82F6',
          },
          modal: {
            ondismiss: function () {
              console.log('Payment cancelled');
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('Failed to initiate upgrade');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-teal-50">
        <div className="text-lg">Loading subscription details...</div>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'TRIAL': return 'border-gray-300 bg-gray-50';
      case 'BASIC': return 'border-blue-300 bg-blue-50';
      case 'PROFESSIONAL': return 'border-purple-300 bg-purple-50';
      case 'ENTERPRISE': return 'border-amber-300 bg-amber-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                Subscription Management
              </h1>
              <p className="text-xs text-navy-600">Manage your plan and video minutes</p>
            </div>
            <Link
              href="/doctor/dashboard"
              className="px-4 py-2 bg-navy-100 hover:bg-navy-200 text-navy-800 rounded-lg font-medium text-sm transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Current Usage Section */}
        {subscriptionInfo && (
          <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-navy-900 mb-4">Current Usage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patients Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Patients</h3>
                  <span className="text-lg font-bold text-navy-900">
                    {subscriptionInfo.usage.patients.used} / {subscriptionInfo.usage.patients.unlimited ? '∞' : subscriptionInfo.usage.patients.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-teal-500 h-2 rounded-full"
                    style={{
                      width: subscriptionInfo.usage.patients.unlimited
                        ? '100%'
                        : `${Math.min(100, (subscriptionInfo.usage.patients.used / subscriptionInfo.usage.patients.limit) * 100)}%`
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {subscriptionInfo.usage.patients.unlimited
                    ? 'Unlimited patients'
                    : `${subscriptionInfo.usage.patients.limit - subscriptionInfo.usage.patients.used} patients remaining`}
                </p>
              </div>

              {/* Video Minutes Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Video Minutes</h3>
                  <span className={`text-lg font-bold ${subscriptionInfo.status.warningLevel === 'critical' ? 'text-red-600' : subscriptionInfo.status.warningLevel === 'low' ? 'text-orange-600' : 'text-navy-900'}`}>
                    {subscriptionInfo.usage.videoMinutes.available} available
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${subscriptionInfo.status.warningLevel === 'critical' ? 'bg-red-500' : subscriptionInfo.status.warningLevel === 'low' ? 'bg-orange-500' : 'bg-green-500'}`}
                    style={{
                      width: `${Math.min(100, (subscriptionInfo.usage.videoMinutes.available / (subscriptionInfo.usage.videoMinutes.subscription + subscriptionInfo.usage.videoMinutes.purchased)) * 100)}%`
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                  <p>• Subscription: {subscriptionInfo.usage.videoMinutes.subscription} min</p>
                  {subscriptionInfo.usage.videoMinutes.purchased > 0 && (
                    <p>• Purchased: {subscriptionInfo.usage.videoMinutes.purchased} min</p>
                  )}
                  <p>• Used: {subscriptionInfo.usage.videoMinutes.used} min</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buy Extra Minutes Section */}
        <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-navy-900 mb-2">Buy Extra Minutes</h2>
          <p className="text-sm text-gray-600 mb-6">
            One-time purchase. Extra minutes carry over and never expire.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {minutePackages.map((pkg) => (
              <div
                key={pkg.minutes}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-all cursor-pointer"
              >
                <div className="text-center mb-3">
                  <div className="text-3xl font-bold text-navy-900">{pkg.minutes}</div>
                  <div className="text-sm text-gray-600">minutes</div>
                </div>
                <div className="text-center mb-3">
                  <div className="text-2xl font-bold text-blue-600">{pkg.priceDisplay}</div>
                  <div className="text-xs text-gray-600">{pkg.perMinuteCost}/min</div>
                </div>
                {pkg.savings && (
                  <div className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded text-center mb-3">
                    Save {pkg.savings}%
                  </div>
                )}
                <button
                  onClick={() => handleBuyMinutes(pkg)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                >
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Plans Section */}
        <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-navy-900 mb-2">Subscription Plans</h2>
          <p className="text-sm text-gray-600 mb-6">
            Monthly subscription with patient limits and video minutes quota.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const isCurrent = subscriptionInfo?.subscription.tier === plan.tier;
              const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
              const suggestedFor = plan.suggestedFor ? (typeof plan.suggestedFor === 'string' ? JSON.parse(plan.suggestedFor) : plan.suggestedFor) : [];

              return (
                <div
                  key={plan.tier}
                  className={`border-2 rounded-lg p-5 ${getTierColor(plan.tier)} ${isCurrent ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
                >
                  {isCurrent && (
                    <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                      CURRENT PLAN
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-navy-900 mb-1">{plan.name}</h3>
                  <div className="text-3xl font-bold text-navy-900 mb-4">
                    {plan.price === 0 ? 'Free' : `₹${(plan.price / 100).toFixed(0)}`}
                    {plan.price > 0 && <span className="text-sm font-normal text-gray-600">/month</span>}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">✓</span>
                      <span>{plan.patientLimit === -1 ? 'Unlimited' : plan.patientLimit} patients</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">✓</span>
                      <span>{plan.monthlyVideoMinutes} video minutes</span>
                    </div>
                    {features
                      .filter((f: string) =>
                        !f.toLowerCase().includes('patient') &&
                        !f.toLowerCase().includes('video minute') &&
                        !f.toLowerCase().includes('trial period')
                      )
                      .map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="text-green-600">✓</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                  </div>

                  {suggestedFor.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-gray-700 mb-1">Best for:</div>
                      <div className="text-xs text-gray-600">
                        {suggestedFor.join(', ')}
                      </div>
                    </div>
                  )}

                  {!isCurrent && plan.tier !== 'TRIAL' && (
                    <button
                      onClick={() => handleUpgradePlan(plan.tier, plan.name, plan.price)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    >
                      Upgrade to {plan.tier}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm">Test Mode</h3>
          <p className="text-xs text-blue-800">
            Payment gateway is in TEST mode. Use Razorpay test cards for payments. No real money will be charged.
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Test Card: 4111 1111 1111 1111 | CVV: Any 3 digits | Expiry: Any future date
          </p>
        </div>
      </main>

      {/* Razorpay Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
        onError={() => {
          console.error('Failed to load Razorpay SDK');
          alert('Payment gateway failed to load. Please refresh the page.');
        }}
      />
    </div>
  );
}
