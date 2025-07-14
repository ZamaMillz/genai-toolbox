import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token to requests if available
    const token = localStorage.getItem('auth-storage');
    if (token) {
      try {
        const authData = JSON.parse(token);
        if (authData.state?.token) {
          config.headers.Authorization = `Bearer ${authData.state.token}`;
        }
      } catch (error) {
        console.warn('Failed to parse auth token:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshResponse = await api.post('/auth/refresh-token');
        const { token } = refreshResponse.data;
        
        // Update token in localStorage
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const authData = JSON.parse(authStorage);
          authData.state.token = token;
          localStorage.setItem('auth-storage', JSON.stringify(authData));
        }
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Handle specific error responses
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh-token'),
  getProfile: () => api.get('/auth/me'),
  verifyPhone: (phone, otp) => api.post('/auth/verify-phone', { phone, otp }),
  resendOTP: (phone) => api.post('/auth/resend-phone-otp', { phone }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, newPassword: password }),
};

export const servicesAPI = {
  getServices: (params) => api.get('/services', { params }),
  getService: (id) => api.get(`/services/${id}`),
  getServicesByCategory: (category, params) => api.get(`/services/category/${category}`, { params }),
  getCategories: () => api.get('/services/meta/categories'),
  findNearbyProviders: (data) => api.post('/services/providers/nearby', data),
};

export const bookingsAPI = {
  createBooking: (bookingData) => api.post('/bookings', bookingData),
  getMyBookings: (params) => api.get('/bookings/my-bookings', { params }),
  getBooking: (id) => api.get(`/bookings/${id}`),
  respondToBooking: (id, action, reason) => api.patch(`/bookings/${id}/respond`, { action, reason }),
  updateBookingStatus: (id, status, location) => api.patch(`/bookings/${id}/status`, { status, location }),
  updateProviderLocation: (id, location) => api.patch(`/bookings/${id}/location`, location),
  sendEmergencyAlert: (id, reason) => api.post(`/bookings/${id}/emergency`, { reason }),
  sendMessage: (id, message) => api.post(`/bookings/${id}/messages`, { message }),
  cancelBooking: (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason }),
};

export const usersAPI = {
  updateProfile: (userData) => api.put('/users/profile', userData),
  uploadProfilePicture: (formData) => api.post('/users/profile/picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateLocation: (location) => api.put('/users/location', location),
  getProviderDashboard: () => api.get('/users/provider/dashboard'),
  getCustomerDashboard: () => api.get('/users/customer/dashboard'),
  updateProviderProfile: (data) => api.put('/users/provider/profile', data),
  updateProviderServices: (serviceIds) => api.post('/users/provider/services', { serviceIds }),
  uploadProviderDocuments: (formData) => api.post('/users/provider/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateAvailability: (availability) => api.patch('/users/provider/availability', availability),
  updateBankDetails: (bankDetails) => api.put('/users/provider/bank-details', bankDetails),
  searchProviders: (params) => api.get('/users/providers/search', { params }),
  getProvider: (id) => api.get(`/users/providers/${id}`),
  addPreferredProvider: (providerId) => api.post('/users/customer/preferred-providers', { providerId }),
  removePreferredProvider: (providerId) => api.delete(`/users/customer/preferred-providers/${providerId}`),
};

export const paymentsAPI = {
  createPaymentIntent: (bookingId) => api.post('/payments/create-payment-intent', { bookingId }),
  confirmPayment: (paymentIntentId) => api.post('/payments/confirm-payment', { paymentIntentId }),
  getPaymentHistory: (params) => api.get('/payments/history', { params }),
  requestRefund: (bookingId, reason) => api.post('/payments/request-refund', { bookingId, reason }),
  getProviderEarnings: (params) => api.get('/payments/provider/earnings', { params }),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, status) => api.patch(`/admin/users/${id}/status`, status),
  getPendingProviders: (params) => api.get('/admin/providers/pending-verification', { params }),
  verifyProvider: (id, status, reason) => api.patch(`/admin/providers/${id}/verification`, { status, reason }),
  verifyDocument: (id, documentType, verified, reason) => 
    api.patch(`/admin/providers/${id}/documents/${documentType}/verify`, { verified, reason }),
  getBookings: (params) => api.get('/admin/bookings', { params }),
  getBooking: (id) => api.get(`/admin/bookings/${id}`),
  getDisputes: (params) => api.get('/admin/disputes', { params }),
  resolveDispute: (id, resolution, refundAmount) => 
    api.patch(`/admin/disputes/${id}/resolve`, { resolution, refundAmount }),
  getFinancialReports: (params) => api.get('/admin/reports/financial', { params }),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settings) => api.put('/admin/settings', settings),
};

export default api;