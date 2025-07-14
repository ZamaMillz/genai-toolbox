import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import useAuthStore from './store/authStore';

// Layout components
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import VerifyPhonePage from './pages/auth/VerifyPhonePage';

// Main pages
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import BookingPage from './pages/BookingPage';
import BookingDetailPage from './pages/BookingDetailPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';

// Customer pages
import CustomerDashboard from './pages/customer/DashboardPage';
import MyBookingsPage from './pages/customer/MyBookingsPage';

// Provider pages
import ProviderDashboard from './pages/provider/DashboardPage';
import ProviderBookingsPage from './pages/provider/BookingsPage';
import ProviderProfilePage from './pages/provider/ProfilePage';
import ProviderEarningsPage from './pages/provider/EarningsPage';

// Admin pages
import AdminDashboard from './pages/admin/DashboardPage';
import AdminUsersPage from './pages/admin/UsersPage';
import AdminBookingsPage from './pages/admin/BookingsPage';
import AdminProvidersPage from './pages/admin/ProvidersPage';
import AdminReportsPage from './pages/admin/ReportsPage';

// Error pages
import NotFoundPage from './pages/NotFoundPage';
import LoadingScreen from './components/ui/LoadingScreen';

function App() {
  const { user, isAuthenticated, initialize } = useAuthStore();

  // Initialize auth state on app start
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="App min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        } />
        <Route path="/register" element={
          <AuthLayout>
            <RegisterPage />
          </AuthLayout>
        } />
        <Route path="/forgot-password" element={
          <AuthLayout>
            <ForgotPasswordPage />
          </AuthLayout>
        } />
        <Route path="/verify-phone" element={
          <AuthLayout>
            <VerifyPhonePage />
          </AuthLayout>
        } />

        {/* Protected routes with layout */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                {/* Main routes */}
                <Route index element={<HomePage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="services/:id" element={<ServiceDetailPage />} />
                <Route path="book/:serviceId" element={<BookingPage />} />
                <Route path="bookings/:id" element={<BookingDetailPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="notifications" element={<NotificationsPage />} />

                {/* Customer routes */}
                <Route path="customer" element={
                  <ProtectedRoute requiredUserType="customer">
                    <Routes>
                      <Route path="dashboard" element={<CustomerDashboard />} />
                      <Route path="bookings" element={<MyBookingsPage />} />
                    </Routes>
                  </ProtectedRoute>
                } />

                {/* Provider routes */}
                <Route path="provider" element={
                  <ProtectedRoute requiredUserType="provider">
                    <Routes>
                      <Route path="dashboard" element={<ProviderDashboard />} />
                      <Route path="bookings" element={<ProviderBookingsPage />} />
                      <Route path="profile" element={<ProviderProfilePage />} />
                      <Route path="earnings" element={<ProviderEarningsPage />} />
                    </Routes>
                  </ProtectedRoute>
                } />

                {/* Admin routes */}
                <Route path="admin" element={
                  <ProtectedRoute requireAdmin={true}>
                    <Routes>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="users" element={<AdminUsersPage />} />
                      <Route path="bookings" element={<AdminBookingsPage />} />
                      <Route path="providers" element={<AdminProvidersPage />} />
                      <Route path="reports" element={<AdminReportsPage />} />
                    </Routes>
                  </ProtectedRoute>
                } />

                {/* Redirect based on user type */}
                <Route path="dashboard" element={
                  user?.userType === 'customer' ? (
                    <Navigate to="/customer/dashboard" replace />
                  ) : user?.userType === 'provider' ? (
                    <Navigate to="/provider/dashboard" replace />
                  ) : user?.email?.includes('@admin.helperhive') ? (
                    <Navigate to="/admin/dashboard" replace />
                  ) : (
                    <Navigate to="/" replace />
                  )
                } />

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />

        {/* Catch all - redirect to login if not authenticated */}
        <Route path="*" element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </div>
  );
}

export default App;