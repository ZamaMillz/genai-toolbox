import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear storage and redirect to login
      await AsyncStorage.multiRemove(['authToken', 'userType', 'userData']);
      // Implement navigation to login screen
    }
    return Promise.reject(error);
  }
);

// Authentication Services
export const authService = {
  login: async (email, password, userType) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        userType,
      });
      
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('userType', userType);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      await AsyncStorage.multiRemove(['authToken', 'userType', 'userData']);
    }
  },

  verifyOTP: async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'OTP verification failed' };
    }
  },

  resendOTP: async (email) => {
    try {
      const response = await api.post('/auth/resend-otp', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to resend OTP' };
    }
  },
};

// Booking Services
export const bookingService = {
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Booking creation failed' };
    }
  },

  getBookings: async (status = null) => {
    try {
      const params = status ? { status } : {};
      const response = await api.get('/bookings', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch bookings' };
    }
  },

  updateBookingStatus: async (bookingId, status) => {
    try {
      const response = await api.patch(`/bookings/${bookingId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update booking status' };
    }
  },

  cancelBooking: async (bookingId, reason) => {
    try {
      const response = await api.patch(`/bookings/${bookingId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to cancel booking' };
    }
  },

  trackBooking: async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}/track`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to track booking' };
    }
  },
};

// Service Provider Services
export const providerService = {
  updateAvailability: async (availability) => {
    try {
      const response = await api.patch('/providers/availability', { availability });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update availability' };
    }
  },

  updateLocation: async (location) => {
    try {
      const response = await api.patch('/providers/location', location);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update location' };
    }
  },

  uploadDocuments: async (documents) => {
    try {
      const formData = new FormData();
      
      Object.keys(documents).forEach((key) => {
        if (documents[key]) {
          formData.append(key, documents[key]);
        }
      });

      const response = await api.post('/providers/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Document upload failed' };
    }
  },

  getEarnings: async (period = 'week') => {
    try {
      const response = await api.get(`/providers/earnings?period=${period}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch earnings' };
    }
  },

  getJobRequests: async () => {
    try {
      const response = await api.get('/providers/job-requests');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch job requests' };
    }
  },
};

// Payment Services
export const paymentService = {
  createPaymentIntent: async (amount, bookingId) => {
    try {
      const response = await api.post('/payments/create-intent', {
        amount,
        bookingId,
        currency: 'zar',
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Payment intent creation failed' };
    }
  },

  confirmPayment: async (paymentIntentId) => {
    try {
      const response = await api.post('/payments/confirm', { paymentIntentId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Payment confirmation failed' };
    }
  },

  getPaymentHistory: async () => {
    try {
      const response = await api.get('/payments/history');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch payment history' };
    }
  },
};

// User Services
export const userService = {
  getProfile: async () => {
    try {
      const response = await api.get('/user/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch profile' };
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.patch('/user/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Profile update failed' };
    }
  },

  addEmergencyContact: async (contact) => {
    try {
      const response = await api.post('/user/emergency-contact', contact);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add emergency contact' };
    }
  },

  reportUser: async (userId, reason) => {
    try {
      const response = await api.post('/user/report', { userId, reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to report user' };
    }
  },
};

export default api;