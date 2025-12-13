// User types
export interface Admin {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  specialization: string;
  registrationType: string;
  registrationNo: string;
  registrationState?: string;
  aadhaarNumber?: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  rejectionReason?: string;
  subscriptionStatus: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  trialEndsAt: string;
  subscriptionEndsAt?: string;
  patientsCreated: number;
  registrationCertificate?: string;
  aadhaarFrontPhoto?: string;
  aadhaarBackPhoto?: string;
  profilePhoto?: string;
  upiId?: string;
  qrCodeImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorWithCounts extends Doctor {
  _count?: {
    patients: number;
    consultations: number;
    prescriptions: number;
  };
}

// Platform stats
export interface PlatformStats {
  doctors: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
    suspended: number;
    active: number;
  };
  patients: number;
  consultations: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: any[];
}

export interface PaginationData<T> {
  doctors?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  admin?: Admin;
  doctor?: Doctor;
}
