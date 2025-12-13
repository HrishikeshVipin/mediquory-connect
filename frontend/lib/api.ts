import axios from 'axios';
import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  PlatformStats,
  Doctor,
  DoctorWithCounts,
  PaginationData,
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/admin/login';
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
};

// Consultation API
export const consultationApi = {
  // Start or get active consultation (doctor only)
  startConsultation: async (patientId: string) => {
    const { data } = await api.post<ApiResponse<{ consultation: any }>>('/consultations/start', { patientId });
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

  // End consultation (doctor only)
  endConsultation: async (consultationId: string) => {
    const { data } = await api.put<ApiResponse<{ consultation: any }>>(`/consultations/${consultationId}/end`);
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
};

export default api;
