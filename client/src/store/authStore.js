import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', credentials);
          const { user, token } = response.data;
          
          // Set auth header for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          return { success: true, user };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Login failed';
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null
          });
          return { success: false, error: errorMessage };
        }
      },
      
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', userData);
          const { user, token } = response.data;
          
          // Set auth header for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          return { success: true, user };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Registration failed';
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null
          });
          return { success: false, error: errorMessage };
        }
      },
      
      logout: async () => {
        set({ isLoading: true });
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.warn('Logout API call failed:', error);
        }
        
        // Clear auth header
        delete api.defaults.headers.common['Authorization'];
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      },
      
      refreshToken: async () => {
        try {
          const response = await api.post('/auth/refresh-token');
          const { token } = response.data;
          
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          set({ token });
          
          return true;
        } catch (error) {
          get().logout();
          return false;
        }
      },
      
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData }
        }));
      },
      
      verifyPhone: async (phone, otp) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/auth/verify-phone', { phone, otp });
          set((state) => ({
            user: { ...state.user, isPhoneVerified: true },
            isLoading: false
          }));
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Verification failed';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },
      
      resendOTP: async (phone) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/auth/resend-phone-otp', { phone });
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to resend OTP';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },
      
      clearError: () => set({ error: null }),
      
      // Initialize auth state from token
      initialize: async () => {
        const { token } = get();
        if (token) {
          try {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const response = await api.get('/auth/me');
            set({
              user: response.data.user,
              isAuthenticated: true
            });
          } catch (error) {
            // Token is invalid, clear auth state
            get().logout();
          }
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;