// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://helperhive-api.com/api';

// Service Types
export const SERVICE_TYPES = {
  CLEANING: 'cleaning',
  GARDENING: 'gardening',
  CAR_WASH: 'car_wash'
};

// Service Pricing (in ZAR)
export const SERVICE_PRICING = {
  [SERVICE_TYPES.CLEANING]: {
    base_price: 400,
    description: 'House cleaning service per day',
    duration: '4-8 hours',
    equipment_available: true
  },
  [SERVICE_TYPES.GARDENING]: {
    base_price: 350,
    description: 'Garden maintenance service per day',
    duration: '4-6 hours',
    equipment_available: true
  },
  [SERVICE_TYPES.CAR_WASH]: {
    internal_only: 150,
    external_only: 120,
    full_sedan: 200,
    full_suv: 250,
    description: 'Professional car washing service',
    duration: '1-2 hours',
    equipment_available: true,
    water_required: true
  }
};

// App Commission
export const APP_COMMISSION_RATE = 0.10; // 10%

// User Types
export const USER_TYPES = {
  CUSTOMER: 'customer',
  SERVICE_PROVIDER: 'service_provider'
};

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  PAYMENT_PENDING: 'payment_pending'
};

// Document Types for Service Providers
export const DOCUMENT_TYPES = {
  ID_DOCUMENT: 'id_document',
  PROOF_OF_ADDRESS: 'proof_of_address',
  BANK_STATEMENT: 'bank_statement',
  CRIMINAL_RECORD: 'criminal_record',
  REFERENCES: 'references'
};

// Verification Status
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  UNDER_REVIEW: 'under_review'
};

// Security Features
export const SECURITY_FEATURES = {
  TWO_FACTOR_AUTH: true,
  REAL_TIME_TRACKING: true,
  EMERGENCY_CONTACT: true,
  BACKGROUND_CHECKS: true,
  RATING_SYSTEM: true,
  SECURE_PAYMENTS: true
};

// South African Provinces
export const SA_PROVINCES = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape'
];

// Colors
export const COLORS = {
  primary: '#1E40AF',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    light: '#9CA3AF'
  },
  border: '#E5E7EB'
};