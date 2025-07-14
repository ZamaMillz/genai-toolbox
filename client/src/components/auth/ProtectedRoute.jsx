import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import LoadingScreen from '../ui/LoadingScreen';

const ProtectedRoute = ({ 
  children, 
  requiredUserType = null, 
  requireAdmin = false,
  requireVerification = false 
}) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for admin access
  if (requireAdmin) {
    const isAdmin = user.email?.includes('@admin.helperhive') || user.email?.includes('@helperhive.admin');
    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  // Check for specific user type
  if (requiredUserType && user.userType !== requiredUserType) {
    // Redirect based on user type
    if (user.userType === 'customer') {
      return <Navigate to="/customer/dashboard" replace />;
    } else if (user.userType === 'provider') {
      return <Navigate to="/provider/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  // Check for verification requirements
  if (requireVerification) {
    if (!user.isEmailVerified || !user.isPhoneVerified) {
      if (!user.isPhoneVerified) {
        return <Navigate to="/verify-phone" replace />;
      }
      // Add email verification redirect if needed
    }
  }

  // Check provider-specific requirements
  if (user.userType === 'provider') {
    // Check if provider is approved
    if (user.providerProfile?.backgroundCheckStatus === 'rejected') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-red-600 text-5xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Suspended</h2>
            <p className="text-gray-600 mb-4">
              Your provider application has been rejected. Please contact support for more information.
            </p>
            <div className="space-y-2">
              <a 
                href="mailto:support@helperhive.com" 
                className="btn-primary w-full inline-block"
              >
                Contact Support
              </a>
              <button 
                onClick={() => useAuthStore.getState().logout()}
                className="btn-outline w-full"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Show pending approval message
    if (user.providerProfile?.backgroundCheckStatus === 'pending') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-yellow-600 text-5xl mb-4">⏳</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Application Under Review</h2>
            <p className="text-gray-600 mb-4">
              Your provider application is being reviewed. You'll receive an email once approved.
            </p>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.reload()}
                className="btn-primary w-full"
              >
                Refresh Status
              </button>
              <button 
                onClick={() => useAuthStore.getState().logout()}
                className="btn-outline w-full"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;