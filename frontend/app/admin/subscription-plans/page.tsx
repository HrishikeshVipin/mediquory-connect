'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminPlanApi } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import type { SubscriptionPlan } from '../../../types';

interface PlanFormData {
  tier: string;
  name: string;
  price: number;
  patientLimit: number;
  monthlyVideoMinutes: number;
  features: string[];
  suggestedFor: string[];
  avgConsultationTime: number;
  active: boolean;
}

export default function AdminSubscriptionPlansPage() {
  const router = useRouter();
  const { isAuthenticated, role, initAuth } = useAuthStore();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({
    tier: '',
    name: '',
    price: 0,
    patientLimit: 0,
    monthlyVideoMinutes: 0,
    features: [''],
    suggestedFor: [''],
    avgConsultationTime: 15,
    active: true,
  });
  const [formLoading, setFormLoading] = useState(false);

  // Auth check
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || role !== 'ADMIN')) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, role, loading, router]);

  // Fetch plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await adminPlanApi.getAllPlans();
        if (response.success && response.data) {
          // Parse features JSON string to array
          const parsedPlans = response.data.plans.map((plan: any) => ({
            ...plan,
            features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
          }));
          setPlans(parsedPlans);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && role === 'ADMIN') {
      fetchPlans();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, role]);

  const handleToggleActive = async (planId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await adminPlanApi.deactivatePlan(planId);
      } else {
        await adminPlanApi.activatePlan(planId);
      }
      // Refresh plans
      const response = await adminPlanApi.getAllPlans();
      if (response.success) {
        // Parse features JSON string to array
        const parsedPlans = response.data.plans.map((plan: any) => ({
          ...plan,
          features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
        }));
        setPlans(parsedPlans);
      }
    } catch (error) {
      console.error('Error toggling plan status:', error);
      alert('Failed to update plan status');
    }
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      tier: '',
      name: '',
      price: 0,
      patientLimit: 0,
      monthlyVideoMinutes: 0,
      features: [''],
      suggestedFor: [''],
      avgConsultationTime: 15,
      active: true,
    });
    setShowModal(true);
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      tier: plan.tier,
      name: plan.name,
      price: plan.price,
      patientLimit: plan.patientLimit,
      monthlyVideoMinutes: plan.monthlyVideoMinutes,
      features: plan.features || [''],
      suggestedFor: typeof plan.suggestedFor === 'string' ? JSON.parse(plan.suggestedFor) : (plan.suggestedFor || ['']),
      avgConsultationTime: plan.avgConsultationTime || 15,
      active: plan.active,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPlan(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const payload = {
        ...formData,
        features: JSON.stringify(formData.features.filter(f => f.trim())),
        suggestedFor: JSON.stringify(formData.suggestedFor.filter(s => s.trim())),
      };

      if (editingPlan) {
        await adminPlanApi.updatePlan(editingPlan.id, payload);
        alert('Plan updated successfully!');
      } else {
        await adminPlanApi.createPlan(payload);
        alert('Plan created successfully!');
      }

      // Refresh plans
      const response = await adminPlanApi.getAllPlans();
      if (response.success) {
        const parsedPlans = response.data.plans.map((plan: any) => ({
          ...plan,
          features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
        }));
        setPlans(parsedPlans);
      }

      closeModal();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      alert(error.response?.data?.message || 'Failed to save plan');
    } finally {
      setFormLoading(false);
    }
  };

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const addSuggestion = () => {
    setFormData(prev => ({ ...prev, suggestedFor: [...prev.suggestedFor, ''] }));
  };

  const removeSuggestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      suggestedFor: prev.suggestedFor.filter((_, i) => i !== index),
    }));
  };

  const updateSuggestion = (index: number, value: string) => {
    const newSuggestions = [...formData.suggestedFor];
    newSuggestions[index] = value;
    setFormData(prev => ({ ...prev, suggestedFor: newSuggestions }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin/dashboard" className="text-sm text-blue-600 hover:underline mb-2 block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
              <p className="text-gray-600 mt-1">Manage subscription tiers and pricing</p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium shadow-md transition"
            >
              + Create New Plan
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Plans</h3>
            <p className="text-3xl font-bold text-gray-900">{plans.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Active Plans</h3>
            <p className="text-3xl font-bold text-green-600">
              {plans.filter(p => p.active).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Inactive Plans</h3>
            <p className="text-3xl font-bold text-gray-600">
              {plans.filter(p => !p.active).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Revenue Potential</h3>
            <p className="text-3xl font-bold text-blue-600">
              ₹{plans.filter(p => p.active).reduce((sum, p) => sum + (p.price / 100), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Plans Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient Limit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Video Minutes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {plan.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{plan.name}</td>
                  <td className="px-6 py-4 text-gray-900">₹{(plan.price / 100).toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-900">
                    {plan.patientLimit === -1 ? '∞ Unlimited' : plan.patientLimit}
                  </td>
                  <td className="px-6 py-4 text-gray-900">{plan.monthlyVideoMinutes} min</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      plan.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {plan.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => openEditModal(plan)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(plan.id, plan.active)}
                      className={`text-sm font-medium ${
                        plan.active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                      }`}
                    >
                      {plan.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {plans.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No subscription plans found
            </div>
          )}
        </div>

        {/* Features List */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  plan.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {plan.tier}
                </span>
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-4">₹{(plan.price / 100).toLocaleString()}</p>
              <ul className="space-y-2 text-sm text-gray-600">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleFormSubmit}>
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                  </h2>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-4 space-y-4">
                  {/* Tier */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tier <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.tier}
                      onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={!!editingPlan}
                    >
                      <option value="">Select tier</option>
                      <option value="TRIAL">TRIAL</option>
                      <option value="BASIC">BASIC</option>
                      <option value="PROFESSIONAL">PROFESSIONAL</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plan Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Professional Plan"
                      required
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (in paise) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 249900 (for ₹2,499)"
                      required
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Display: ₹{(formData.price / 100).toLocaleString()}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Patient Limit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Patient Limit <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.patientLimit}
                        onChange={(e) => setFormData({ ...formData, patientLimit: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 50 or -1 for unlimited"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Use -1 for unlimited</p>
                    </div>

                    {/* Monthly Video Minutes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Video Minutes <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.monthlyVideoMinutes}
                        onChange={(e) => setFormData({ ...formData, monthlyVideoMinutes: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 500"
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Average Consultation Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Average Consultation Time (minutes) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.avgConsultationTime}
                      onChange={(e) => setFormData({ ...formData, avgConsultationTime: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 25"
                      required
                      min="1"
                    />
                  </div>

                  {/* Features */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Features <span className="text-red-500">*</span>
                    </label>
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 50 patients"
                        />
                        {formData.features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addFeature}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Feature
                    </button>
                  </div>

                  {/* Suggested For */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Suggested For
                    </label>
                    {formData.suggestedFor.map((suggestion, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={suggestion}
                          onChange={(e) => updateSuggestion(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Solo practitioners"
                        />
                        {formData.suggestedFor.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSuggestion(index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSuggestion}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Suggestion
                    </button>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                      Plan is active
                    </label>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50"
                    disabled={formLoading}
                  >
                    {formLoading ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
