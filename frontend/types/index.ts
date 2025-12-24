// User types
export interface Admin {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export type SubscriptionTier = 'TRIAL' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';

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
  subscriptionTier: SubscriptionTier;
  trialEndsAt: string;
  subscriptionEndsAt?: string;
  razorpaySubscriptionId?: string;
  patientsCreated: number;
  patientLimit: number;
  monthlyVideoMinutes: number;
  purchasedMinutes: number;
  totalMinutesUsed: number;
  lastResetDate: string;
  registrationCertificate?: string;
  aadhaarFrontPhoto?: string;
  aadhaarBackPhoto?: string;
  profilePhoto?: string;
  bio?: string;
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
  patients?: T[];
  stats?: {
    total: number;
    manual: number;
    selfRegistered: number;
    active: number;
    waitlisted: number;
  };
  pagination?: {
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

// Subscription types
export type WarningLevel = 'none' | 'low' | 'critical' | 'expired';

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  price: number; // in paise
  patientLimit: number; // -1 for unlimited
  monthlyVideoMinutes: number;
  features: string[];
  suggestedFor?: string[];
  avgConsultationTime?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MinutePackage {
  minutes: number;
  price: number; // in paise
  priceDisplay: string;
  perMinuteCost: string;
  savings?: number; // percentage
}

export interface SubscriptionInfo {
  subscription: {
    tier: SubscriptionTier;
    status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    trialEndsAt?: string;
    subscriptionEndsAt?: string;
  };
  usage: {
    patients: {
      used: number;
      limit: number;
      unlimited: boolean;
    };
    videoMinutes: {
      subscription: number;
      purchased: number;
      used: number;
      available: number;
    };
  };
  status: {
    canCreatePatients: boolean;
    canStartConsultations: boolean;
    warningLevel: WarningLevel;
    message?: string;
  };
}

export interface MinutePurchase {
  id: string;
  doctorId: string;
  minutes: number;
  price: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

// Review types
export interface ConsultationReview {
  id: string;
  consultationId: string;
  rating: number; // 1-5
  reviewText?: string;
  createdAt: string;
}

export interface ReviewStatistics {
  totalReviews: number;
  averageRating: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// Consultation types (updated)
export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startedAt: string;
  completedAt?: string;
  duration?: number; // in seconds
  wentOvertime?: boolean;
  overtimeMinutes?: number;
  chiefComplaint?: string;
  doctorNotes?: string;
  createdAt: string;
  updatedAt: string;
  review?: ConsultationReview;
}

// Medicine types
export type MedicineCategory = 'AYURVEDA' | 'HOMEOPATHY' | 'ALLOPATHY' | 'UNANI' | 'SIDDHA' | 'GENERAL';

export interface Medicine {
  id: string;
  name: string;
  category: MedicineCategory;
  genericName?: string;
  manufacturer?: string;
  dosageForms?: string[];
  commonStrengths?: string[];
  isVerified: boolean;
  isBanned: boolean;
  restrictionNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorMedicine {
  id: string;
  doctorId: string;
  medicineId: string;
  medicine: Medicine;
  personalNotes?: string;
  usageCount: number;
  addedAt: string;
}

// Appointment types
export type AppointmentStatus =
  | 'REQUESTED'
  | 'PROPOSED_ALTERNATIVE'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

export type TimePreference = 'MORNING' | 'AFTERNOON' | 'EVENING';

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  requestedDate: string;
  requestedTimePreference?: TimePreference;
  reason?: string;
  scheduledTime?: string;
  proposedTime?: string;
  proposedMessage?: string;
  rejectionReason?: string;
  duration: number;
  status: AppointmentStatus;
  consultationType: 'VIDEO' | 'CHAT' | 'BOTH';
  consultationId?: string;
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
  doctor?: {
    id: string;
    fullName: string;
    specialization: string;
    profilePhoto?: string;
  };
  patient?: {
    id: string;
    fullName: string;
    age?: number;
    gender?: string;
    phone?: string;
  };
}

export interface DoctorAvailability {
  monday?: { enabled: boolean; start: string; end: string };
  tuesday?: { enabled: boolean; start: string; end: string };
  wednesday?: { enabled: boolean; start: string; end: string };
  thursday?: { enabled: boolean; start: string; end: string };
  friday?: { enabled: boolean; start: string; end: string };
  saturday?: { enabled: boolean; start: string; end: string };
  sunday?: { enabled: boolean; start: string; end: string };
}
