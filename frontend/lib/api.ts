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
  Admin,
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
  // Check for doctor token
  let token = localStorage.getItem('token');

  // If no doctor token, check for patient token
  if (!token) {
    try {
      const patientAuthStorage = localStorage.getItem('patient-auth-storage');
      if (patientAuthStorage) {
        const patientAuth = JSON.parse(patientAuthStorage);
        token = patientAuth.state?.accessToken;
      }
    } catch (error) {
      console.error('Failed to parse patient auth storage:', error);
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Never automatically redirect on 401 errors
    // Errors will be handled by individual components
    // Only manual logout or explicit session timeout should redirect
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

  // Reveal sensitive data (15-second window)
  revealAadhaar: async (doctorId: string, reason: string, reasonDetails?: string) => {
    const { data } = await api.post<ApiResponse<{
      doctorId: string;
      doctorName: string;
      aadhaarNumber: string;
      expiresAt: number;
      validFor: number;
    }>>(`/admin/reveal-aadhaar/${doctorId}`, { reason, reasonDetails });
    return data;
  },

  revealUpiId: async (doctorId: string, reason: string, reasonDetails?: string) => {
    const { data } = await api.post<ApiResponse<{
      doctorId: string;
      doctorName: string;
      upiId: string;
      expiresAt: number;
      validFor: number;
    }>>(`/admin/reveal-upi/${doctorId}`, { reason, reasonDetails });
    return data;
  },

  // Audit logs
  getAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    actorType?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    const { data } = await api.get<ApiResponse<{
      logs: any[];
      pagination: any;
    }>>('/admin/audit-logs', { params });
    return data;
  },

  getAdminAccessLogs: async (params?: {
    page?: number;
    limit?: number;
    accessType?: string;
    resourceType?: string;
    reason?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    const { data } = await api.get<ApiResponse<{
      logs: any[];
      pagination: any;
    }>>('/admin/admin-access-logs', { params });
    return data;
  },

  getAuditStats: async (days?: number) => {
    const { data } = await api.get<ApiResponse<{
      stats: any;
      recentFailedLogins: any[];
      period: string;
    }>>('/admin/audit-stats', { params: { days } });
    return data;
  },

  // Admin Management (Super Admin only)
  createAdmin: async (adminData: {
    email: string;
    password: string;
    fullName: string;
    role: 'ADMIN' | 'SUPER_ADMIN';
  }) => {
    const { data } = await api.post<ApiResponse<{ admin: Admin }>>('/admin/admins', adminData);
    return data;
  },

  getAdmins: async (params?: {
    page?: number;
    limit?: number;
    role?: 'ADMIN' | 'SUPER_ADMIN';
    isActive?: boolean;
  }) => {
    const { data } = await api.get<ApiResponse<{
      admins: Admin[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>>('/admin/admins', { params });
    return data;
  },

  updateAdmin: async (adminId: string, updates: {
    fullName?: string;
    role?: 'ADMIN' | 'SUPER_ADMIN';
    isActive?: boolean;
  }) => {
    const { data } = await api.put<ApiResponse<{ admin: Admin }>>(`/admin/admins/${adminId}`, updates);
    return data;
  },

  deleteAdmin: async (adminId: string) => {
    const { data } = await api.delete<ApiResponse<any>>(`/admin/admins/${adminId}`);
    return data;
  },

  toggleAdminActive: async (adminId: string) => {
    const { data } = await api.put<ApiResponse<{ admin: Admin }>>(`/admin/admins/${adminId}/toggle-active`);
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

  // Get patient vitals history (doctor only)
  getPatientVitals: async (patientId: string) => {
    const { data } = await api.get<ApiResponse<{ vitals: any[] }>>(`/doctor/patients/${patientId}/vitals`);
    return data;
  },

  // Get patient medical files (doctor only)
  getPatientFiles: async (patientId: string) => {
    const { data } = await api.get<ApiResponse<{ files: any[] }>>(`/doctor/patients/${patientId}/files`);
    return data;
  },

  // Get patient case sheet (demographics + history + visit timeline)
  getCaseSheet: async (patientId: string) => {
    const { data } = await api.get<ApiResponse<any>>(`/patients/${patientId}/case-sheet`);
    return data;
  },

  // Update patient history (upsert)
  updateCaseSheet: async (patientId: string, historyData: Record<string, string>) => {
    const { data } = await api.put<ApiResponse<any>>(`/patients/${patientId}/case-sheet`, historyData);
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

// Feedback API (App Feedback from Doctors)
export const feedbackApi = {
  // Submit app feedback (doctor)
  submitFeedback: async (feedbackData: {
    type: 'FEATURE_REQUEST' | 'BUG_REPORT' | 'GENERAL_FEEDBACK' | 'RATING';
    rating?: number;
    title?: string;
    description: string;
    category?: 'UI/UX' | 'PERFORMANCE' | 'FEATURES' | 'BUGS' | 'OTHER';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    deviceInfo?: string;
  }) => {
    const { data} = await api.post<ApiResponse<any>>('/feedback/submit', feedbackData);
    return data;
  },

  // Get doctor's own feedback history
  getMyFeedback: async (limit?: number, offset?: number) => {
    const { data } = await api.get<ApiResponse<{ feedback: any[]; pagination: any }>>('/feedback/my-feedback', {
      params: { limit, offset },
    });
    return data;
  },

  // Check if should prompt for feedback
  shouldPromptFeedback: async () => {
    const { data } = await api.get<ApiResponse<{ shouldPrompt: boolean; daysSinceLastFeedback: number; lastFeedbackType: string | null }>>('/feedback/should-prompt');
    return data;
  },

  // Admin: Get all feedback
  getAllFeedback: async (params?: { status?: string; type?: string; priority?: string; limit?: number; offset?: number }) => {
    const { data } = await api.get<ApiResponse<{ feedback: any[]; stats: any; pagination: any }>>('/feedback/all', { params });
    return data;
  },

  // Admin: Update feedback status
  updateFeedbackStatus: async (id: string, status: string, adminResponse?: string) => {
    const { data } = await api.put<ApiResponse<{ feedback: any }>>(`/feedback/${id}/status`, { status, adminResponse });
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
    const { data} = await api.put<ApiResponse<null>>('/notifications/mark-all-read');
    return data;
  },
};

// Patient Authentication API
export const patientAuth = {
    sendOtp: async (phone: string) => {
      const { data } = await api.post<ApiResponse<null>>('/patient-auth/send-otp', { phone });
      return data;
    },

    verifyOtp: async (phone: string, otp: string) => {
      const { data } = await api.post<ApiResponse<null>>('/patient-auth/verify-otp', { phone, otp });
      return data;
    },

    signup: async (phone: string, otp: string, fullName: string, age: number, gender: string, pin: string) => {
      const { data } = await api.post<ApiResponse<{
        patient: any;
        accessToken: string;
        refreshToken: string;
      }>>('/patient-auth/signup', { phone, otp, fullName, age, gender, pin });
      return data;
    },

    login: async (phone: string, pin: string) => {
      const { data } = await api.post<ApiResponse<{
        patient: any;
        accessToken: string;
        refreshToken: string;
      }>>('/patient-auth/login', { phone, pin });
      return data;
    },

    refreshToken: async (refreshToken: string) => {
      const { data } = await api.post<ApiResponse<{
        accessToken: string;
        refreshToken: string;
      }>>('/patient-auth/refresh', { refreshToken });
      return data;
    },

    getProfile: async (token: string) => {
      const { data } = await api.get<ApiResponse<{ patient: any }>>('/patient-auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },

    updateProfile: async (token: string, updates: any) => {
      const { data } = await api.put<ApiResponse<{ patient: any }>>('/patient-auth/profile', updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },

    changePin: async (token: string, currentPin: string, newPin: string) => {
      const { data } = await api.post<ApiResponse<null>>('/patient-auth/change-pin',
        { currentPin, newPin },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    },

    getMyConsultations: async () => {
      const { data } = await api.get<ApiResponse<{ consultations: any[] }>>('/patient-auth/consultations');
      return data;
    },

    getMyMedicalRecords: async () => {
      const { data } = await api.get<ApiResponse<{
        patient: any;
        prescriptions: any[];
        vitals: any[];
        medicalUploads: any[];
      }>>('/patient-auth/medical-records');
      return data;
    },
};

// Doctor Discovery API
export const doctorDiscovery = {
    search: async (params: {
      search?: string;
      doctorType?: string;
      specialization?: string;
      isOnline?: boolean;
      minFee?: number;
      maxFee?: number;
      minRating?: number;
      sortBy?: string;
      page?: number;
      limit?: number;
    }) => {
      const { data } = await api.get<ApiResponse<{
        doctors: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>>('/doctors/search', { params });
      return data;
    },

    getPublicProfile: async (doctorId: string) => {
      const { data } = await api.get<ApiResponse<{
        doctor: any;
        reviews: any[];
        ratingDistribution: {
          5: number;
          4: number;
          3: number;
          2: number;
          1: number;
        };
      }>>(`/doctors/${doctorId}/public`);
      return data;
    },

    getSpecializations: async () => {
      const { data } = await api.get<ApiResponse<{ specializations: string[] }>>('/doctors/specializations');
      return data;
    },

    updateOnlineStatus: async (isOnline: boolean) => {
      const { data } = await api.post<ApiResponse<{ doctor: any }>>('/doctors/online-status', { isOnline });
      return data;
    },

    updateProfile: async (updates: any) => {
      const { data } = await api.put<ApiResponse<{ doctor: any }>>('/doctors/profile', updates);
      return data;
    },

    updateProfilePhoto: async (formData: FormData) => {
      const { data } = await api.put<ApiResponse<{ doctor: any }>>('/doctor/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },

    uploadDigitalSignature: async (formData: FormData) => {
      const { data } = await api.put<ApiResponse<{ doctor: any }>>('/doctor/profile/signature', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
};

// Appointment API
export const appointmentApi = {
  // Doctor Availability
  getAvailability: async () => {
    const { data } = await api.get<ApiResponse<any>>('/appointments/doctors/availability');
    return data;
  },

  updateAvailability: async (availabilityData: any) => {
    const { data } = await api.put<ApiResponse<any>>('/appointments/doctors/availability', availabilityData);
    return data;
  },

  // Doctor Appointment Management
  getPendingRequests: async (params?: { page?: number; limit?: number }) => {
    const { data } = await api.get<ApiResponse<any>>('/appointments/requests', { params });
    return data;
  },

  getUpcomingAppointments: async () => {
    const { data } = await api.get<ApiResponse<any>>('/appointments/upcoming');
    return data;
  },

  getPastAppointments: async (params?: { page?: number; limit?: number }) => {
    const { data } = await api.get<ApiResponse<any>>('/appointments/history', { params });
    return data;
  },

  acceptRequest: async (appointmentId: string, acceptData: { scheduledTime: string; duration?: number; message?: string }) => {
    const { data } = await api.post<ApiResponse<any>>(`/appointments/${appointmentId}/accept`, acceptData);
    return data;
  },

  proposeAlternative: async (appointmentId: string, proposeData: { proposedTime: string; proposedMessage: string }) => {
    const { data } = await api.post<ApiResponse<any>>(`/appointments/${appointmentId}/propose-alternative`, proposeData);
    return data;
  },

  rejectRequest: async (appointmentId: string, rejectionData: { rejectionReason: string }) => {
    const { data } = await api.post<ApiResponse<any>>(`/appointments/${appointmentId}/reject`, rejectionData);
    return data;
  },

  cancelAppointment: async (appointmentId: string, cancellationData: { cancellationReason: string }) => {
    const { data } = await api.put<ApiResponse<any>>(`/appointments/${appointmentId}/cancel`, cancellationData);
    return data;
  },

  // Patient Appointment Management
  requestAppointment: async (requestData: {
    doctorId: string;
    requestedDate: string;
    requestedTimePreference: string;
    reason: string;
    consultationType: string;
  }) => {
    const { data} = await api.post<ApiResponse<any>>('/appointments/patient/request', requestData);
    return data;
  },

  getPatientAppointments: async (params?: { status?: string; page?: number }) => {
    const { data } = await api.get<ApiResponse<any>>('/appointments/patient', { params });
    return data;
  },

  acceptProposal: async (appointmentId: string) => {
    const { data } = await api.post<ApiResponse<any>>(`/appointments/patient/${appointmentId}/accept-proposal`);
    return data;
  },

  declineProposal: async (appointmentId: string, message?: string) => {
    const { data } = await api.post<ApiResponse<any>>(`/appointments/patient/${appointmentId}/decline-proposal`, { message });
    return data;
  },
};

export default api;
