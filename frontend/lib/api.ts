import axios from 'axios';
import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  PlatformStats,
  Doctor,
  DoctorWithCounts,
  PaginationData,
  SubscriptionPlan,
  SubscriptionInfo,
  MinutePackage,
  ConsultationReview,
  ReviewStatistics,
  Medicine,
  DoctorMedicine,
} from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const role = localStorage.getItem('role');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');

      // Redirect to appropriate login page based on role
      if (role === 'DOCTOR') {
        window.location.href = '/doctor/login';
      } else {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  adminLogin: async (credentials: LoginCredentials) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/admin/login', credentials);
    return data;
  },

  doctorLogin: async (credentials: LoginCredentials) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/doctor/login', credentials);
    return data;
  },

  logout: async () => {
    const { data } = await api.post<ApiResponse<null>>('/auth/logout');
    return data;
  },

  getCurrentUser: async () => {
    const { data } = await api.get<ApiResponse<{ admin?: any; doctor?: any }>>('/auth/me');
    return data;
  },
};

// Admin API
export const adminApi = {
  // Platform stats
  getStats: async () => {
    const { data } = await api.get<ApiResponse<{ stats: PlatformStats }>>('/admin/stats');
    return data;
  },

  // Doctors
  getAllDoctors: async (params?: {
    status?: string;
    subscriptionStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get<ApiResponse<PaginationData<Doctor>>>('/admin/doctors', { params });
    return data;
  },

  getPendingDoctors: async () => {
    const { data } = await api.get<ApiResponse<{ doctors: Doctor[]; count: number }>>('/admin/doctors/pending');
    return data;
  },

  getDoctorById: async (doctorId: string) => {
    const { data } = await api.get<ApiResponse<{ doctor: DoctorWithCounts }>>(`/admin/doctors/${doctorId}`);
    return data;
  },

  // Doctor actions
  verifyDoctor: async (doctorId: string) => {
    const { data } = await api.put<ApiResponse<{ doctor: Doctor }>>(`/admin/doctors/${doctorId}/verify`);
    return data;
  },

  rejectDoctor: async (doctorId: string, rejectionReason: string) => {
    const { data } = await api.put<ApiResponse<{ doctor: Doctor }>>(`/admin/doctors/${doctorId}/reject`, {
      rejectionReason,
    });
    return data;
  },

  suspendDoctor: async (doctorId: string, reason?: string) => {
    const { data } = await api.put<ApiResponse<{ doctor: Doctor }>>(`/admin/doctors/${doctorId}/suspend`, {
      reason,
    });
    return data;
  },

  reactivateDoctor: async (doctorId: string) => {
    const { data } = await api.put<ApiResponse<{ doctor: Doctor }>>(`/admin/doctors/${doctorId}/reactivate`);
    return data;
  },

  updateSubscription: async (
    doctorId: string,
    update: { subscriptionStatus?: string; subscriptionEndsAt?: string }
  ) => {
    const { data } = await api.put<ApiResponse<{ doctor: Doctor }>>(`/admin/doctors/${doctorId}/subscription`, update);
    return data;
  },
};

// Patient API
export const patientApi = {
  // Create new patient (doctor only)
  createPatient: async (patientData: {
    fullName: string;
    phone?: string;
    age?: number;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
  }) => {
    const { data } = await api.post<ApiResponse<{ patient: any; shareableLink: string }>>('/patients/create', patientData);
    return data;
  },

  // Get all patients for logged-in doctor
  getPatients: async (params?: { search?: string; page?: number; limit?: number }) => {
    const { data } = await api.get<ApiResponse<PaginationData<any>>>('/patients/list', { params });
    return data;
  },

  // Get patient details by ID (doctor only)
  getPatientById: async (patientId: string) => {
    const { data } = await api.get<ApiResponse<{ patient: any }>>(`/patients/${patientId}`);
    return data;
  },

  // Get patient by access token (public - no auth)
  getPatientByToken: async (token: string) => {
    const { data } = await api.get<ApiResponse<{ patient: any }>>(`/patients/token/${token}`);
    return data;
  },

  // Self-registration endpoints
  selfRegister: async (data: { doctorId: string; fullName: string; phone: string; age?: number; gender?: string }) => {
    const { data: response } = await api.post<ApiResponse<any>>('/patients/self-register', data);
    return response;
  },

  getDoctorInfo: async (doctorId: string) => {
    const { data } = await api.get<ApiResponse<any>>(`/patients/doctor/${doctorId}/info`);
    return data;
  },

  toggleSelfRegistration: async (enabled: boolean) => {
    const { data } = await api.put<ApiResponse<any>>('/patients/self-registration-toggle', { enabled });
    return data;
  },

  activatePatient: async (patientId: string) => {
    const { data } = await api.put<ApiResponse<{ patient: any }>>(`/patients/${patientId}/activate`);
    return data;
  },

  // Toggle video call for patient
  toggleVideoCall: async (patientId: string, enabled: boolean) => {
    const { data } = await api.put<ApiResponse<{ patient: any }>>(`/patients/${patientId}/video-call`, { enabled });
    return data;
  },

  // Delete patient
  deletePatient: async (patientId: string) => {
    const { data } = await api.delete<ApiResponse<any>>(`/patients/${patientId}`);
    return data;
  },
};

// Consultation API
export const consultationApi = {
  // Start or get active consultation (doctor only)
  startConsultation: async (patientId: string) => {
    const { data } = await api.post<ApiResponse<{
      consultation: any;
      availableMinutes?: number;
      warningLevel?: string;
    }>>('/consultations/start', { patientId });
    return data;
  },

  // Get consultation details
  getConsultation: async (consultationId: string) => {
    const { data } = await api.get<ApiResponse<{ consultation: any }>>(`/consultations/${consultationId}`);
    return data;
  },

  // Get patient consultation by patient token (public)
  getPatientConsultation: async (patientToken: string) => {
    const { data } = await api.get<ApiResponse<{ consultation: any }>>(`/consultations/patient/${patientToken}`);
    return data;
  },

  // Update consultation duration (real-time tracking - for reference only)
  updateDuration: async (consultationId: string, duration: number) => {
    const { data } = await api.put<ApiResponse<{
      duration: number;
    }>>(`/consultations/${consultationId}/duration`, { duration });
    return data;
  },

  // Update video call duration (real-time tracking - for billing)
  updateVideoDuration: async (consultationId: string, videoDuration: number) => {
    const { data } = await api.put<ApiResponse<{
      videoDuration: number;
      currentVideoMinutes: number;
      availableMinutes: number;
      inOvertime: boolean;
      overtimeMinutes: number;
    }>>(`/consultations/${consultationId}/video-duration`, { videoDuration });
    return data;
  },

  // End consultation (doctor only)
  endConsultation: async (consultationId: string, duration?: number, videoDuration?: number) => {
    const { data } = await api.put<ApiResponse<{
      consultation: any;
      minutesUsed?: number;
      totalDuration?: number;
      videoDuration?: number;
    }>>(`/consultations/${consultationId}/end`, { duration, videoDuration });
    return data;
  },

  // Update consultation notes (doctor only)
  updateNotes: async (consultationId: string, notes: { chiefComplaint?: string; doctorNotes?: string }) => {
    const { data } = await api.put<ApiResponse<{ consultation: any }>>(`/consultations/${consultationId}/notes`, notes);
    return data;
  },

  // Get chat history
  getChatHistory: async (consultationId: string, params?: { limit?: number; offset?: number }) => {
    const { data } = await api.get<ApiResponse<{ messages: any[] }>>(`/consultations/${consultationId}/messages`, { params });
    return data;
  },

  // Get video tokens for Agora
  getVideoTokens: async (consultationId: string) => {
    const { data } = await api.get<ApiResponse<{
      channelName: string;
      appId: string;
      doctor: { token: string; uid: number };
      patient: { token: string; uid: number };
    }>>(`/consultations/${consultationId}/video-tokens`);
    return data;
  },

  // Get patient consultation history
  getPatientHistory: async (patientId: string) => {
    const { data } = await api.get<ApiResponse<{ consultations: any[] }>>(`/prescriptions/patient/${patientId}/history`);
    return data;
  },

  // Get unread consultations (doctor only)
  getUnreadConsultations: async () => {
    const { data } = await api.get<ApiResponse<{
      unreadChats: any[];
      totalUnread: number;
    }>>('/consultations/unread');
    return data;
  },

  // Mark consultation messages as read (doctor only)
  markAsRead: async (consultationId: string) => {
    const { data } = await api.put<ApiResponse<null>>(`/consultations/${consultationId}/mark-read`);
    return data;
  },
};

// Subscription API
export const subscriptionApi = {
  // Get all available subscription plans
  getPlans: async () => {
    const { data } = await api.get<ApiResponse<{ plans: SubscriptionPlan[] }>>('/subscription/plans');
    return data;
  },

  // Get current doctor's subscription info
  getMySubscription: async () => {
    const { data } = await api.get<ApiResponse<SubscriptionInfo>>('/subscription/my-subscription');
    return data;
  },

  // Upgrade subscription
  upgradeSubscription: async (planTier: string) => {
    const { data } = await api.post<ApiResponse<{
      subscription: any;
      razorpayOrder?: any;
    }>>('/subscription/upgrade', { tier: planTier });
    return data;
  },

  // Confirm subscription upgrade
  confirmUpgrade: async (
    razorpayPaymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string,
    tier: string
  ) => {
    const { data } = await api.post<ApiResponse<{
      subscription: any;
      plan: SubscriptionPlan;
    }>>('/subscription/confirm-upgrade', {
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      tier
    });
    return data;
  },

  // Get minute packages
  getMinutePackages: async () => {
    const { data } = await api.get<ApiResponse<{ packages: MinutePackage[] }>>('/subscription/minute-packages');
    return data;
  },

  // Purchase extra minutes
  purchaseMinutes: async (minutes: number, price: number) => {
    const { data } = await api.post<ApiResponse<{
      purchase: any;
      razorpayOrder: any;
    }>>('/subscription/purchase-minutes', { minutes, price });
    return data;
  },

  // Confirm minute purchase
  confirmPurchase: async (purchaseId: string, razorpayPaymentId: string, razorpaySignature: string) => {
    const { data } = await api.post<ApiResponse<{
      purchase: any;
      newAvailableMinutes: number;
    }>>('/subscription/confirm-purchase', {
      purchaseId,
      razorpayPaymentId,
      razorpaySignature
    });
    return data;
  },
};

// Review API
export const reviewApi = {
  // Submit review (patient - public)
  submitReview: async (reviewData: {
    consultationId: string;
    rating: number;
    reviewText?: string;
  }) => {
    const { data } = await api.post<ApiResponse<{ review: ConsultationReview }>>('/reviews/submit', reviewData);
    return data;
  },

  // Get doctor's reviews with statistics
  getDoctorReviews: async () => {
    const { data } = await api.get<ApiResponse<{
      reviews: ConsultationReview[];
      stats: ReviewStatistics;
    }>>('/reviews/doctor');
    return data;
  },

  // Get review for specific consultation
  getConsultationReview: async (consultationId: string) => {
    const { data } = await api.get<ApiResponse<{ review: ConsultationReview | null }>>(`/reviews/consultation/${consultationId}`);
    return data;
  },
};

// Medicine API
export const medicineApi = {
  // Admin endpoints
  getAllMedicines: async (params?: { category?: string; isVerified?: boolean; isBanned?: boolean; search?: string }) => {
    const { data } = await api.get<ApiResponse<{ medicines: Medicine[]; count: number }>>('/medicines/admin/all', { params });
    return data;
  },

  createMedicine: async (medicineData: Partial<Medicine>) => {
    const { data } = await api.post<ApiResponse<{ medicine: Medicine }>>('/medicines', medicineData);
    return data;
  },

  verifyMedicine: async (medicineId: string) => {
    const { data } = await api.put<ApiResponse<{ medicine: Medicine }>>(`/medicines/${medicineId}/verify`);
    return data;
  },

  banMedicine: async (medicineId: string, restrictionNotes: string) => {
    const { data } = await api.put<ApiResponse<{ medicine: Medicine }>>(`/medicines/${medicineId}/ban`, { restrictionNotes });
    return data;
  },

  unbanMedicine: async (medicineId: string) => {
    const { data } = await api.put<ApiResponse<{ medicine: Medicine }>>(`/medicines/${medicineId}/unban`);
    return data;
  },

  // Doctor endpoints
  getAvailableMedicines: async (params?: { search?: string; category?: string }) => {
    const { data } = await api.get<ApiResponse<{ medicines: Medicine[]; count: number }>>('/medicines/available', { params });
    return data;
  },

  getMyMedicines: async () => {
    const { data } = await api.get<ApiResponse<{ medicines: DoctorMedicine[]; count: number }>>('/medicines/my-medicines');
    return data;
  },

  addToMyMedicines: async (medicineId: string, personalNotes?: string) => {
    const { data } = await api.post<ApiResponse<{ doctorMedicine: DoctorMedicine }>>('/medicines/my-medicines', { medicineId, personalNotes });
    return data;
  },

  removeFromMyMedicines: async (medicineId: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/medicines/my-medicines/${medicineId}`);
    return data;
  },

  validateMedications: async (medications: any[]) => {
    const { data } = await api.post<ApiResponse<any>>('/medicines/validate', { medications });
    return data;
  },
};

// Extend adminApi
export const adminPlanApi = {
  getAllPlans: async () => {
    const { data } = await api.get<ApiResponse<{ plans: any[]; count: number }>>('/admin/subscription-plans');
    return data;
  },

  createPlan: async (planData: any) => {
    const { data } = await api.post<ApiResponse<{ plan: any }>>('/admin/subscription-plans', planData);
    return data;
  },

  updatePlan: async (planId: string, planData: any) => {
    const { data } = await api.put<ApiResponse<{ plan: any }>>(`/admin/subscription-plans/${planId}`, planData);
    return data;
  },

  deactivatePlan: async (planId: string) => {
    const { data } = await api.put<ApiResponse<{ plan: any }>>(`/admin/subscription-plans/${planId}/deactivate`);
    return data;
  },

  activatePlan: async (planId: string) => {
    const { data } = await api.put<ApiResponse<{ plan: any }>>(`/admin/subscription-plans/${planId}/activate`);
    return data;
  },

  grantFeatures: async (doctorId: string, features: any) => {
    const { data } = await api.put<ApiResponse<any>>(`/admin/doctors/${doctorId}/grant-features`, features);
    return data;
  },

  getPlanHistory: async (tier: string) => {
    const { data } = await api.get<ApiResponse<any>>(`/admin/subscription-plans/${tier}/history`);
    return data;
  },
};

// Prescription history
export const prescriptionHistoryApi = {
  getPatientHistory: async (patientId: string) => {
    const { data } = await api.get<ApiResponse<any>>(`/prescriptions/patient/${patientId}/history`);
    return data;
  },

  copyPrescription: async (prescriptionId: string) => {
    const { data } = await api.get<ApiResponse<any>>(`/prescriptions/${prescriptionId}/copy`);
    return data;
  },
};

// Notification API
export const notificationApi = {
  getNotifications: async (limit?: number) => {
    const { data } = await api.get<ApiResponse<{ notifications: any[] }>>('/notifications', {
      params: { limit },
    });
    return data;
  },

  getUnreadCount: async () => {
    const { data } = await api.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count');
    return data;
  },

  markAsRead: async (notificationId: string) => {
    const { data } = await api.put<ApiResponse<null>>(`/notifications/${notificationId}/read`);
    return data;
  },

  markAllAsRead: async () => {
    const { data } = await api.put<ApiResponse<null>>('/notifications/mark-all-read');
    return data;
  },
};

export default api;
