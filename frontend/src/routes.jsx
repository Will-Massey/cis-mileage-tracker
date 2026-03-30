import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Trips from './pages/Trips';
import AddTrip from './pages/AddTrip';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import { ForgotPasswordForm, ResetPasswordForm } from './components/auth/PasswordReset';

// Layout components
import Header from './components/common/Header';
import Navigation from './components/common/Navigation';

/**
 * ProtectedRoute Component
 * Redirects to login if not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} replace />;
  }

  return children;
};

/**
 * PublicRoute Component
 * Redirects to dashboard if already authenticated
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * AppLayout Component
 * Layout with header and navigation for authenticated pages
 */
const AppLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    <Header />
    <main className="pt-0">
      {children}
    </main>
    <Navigation />
  </div>
);

/**
 * AuthLayout Component
 * Simple layout for auth pages
 */
const AuthLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    {children}
  </div>
);

/**
 * ForgotPassword Page
 */
const ForgotPassword = () => {
  const { forgotPassword, isLoading, error, clearError } = useAuth();
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleSubmit = async (email) => {
    clearError();
    const result = await forgotPassword(email);
    if (result.success) {
      setIsSuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Reset Password
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-xl sm:px-10">
          <ForgotPasswordForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            isSuccess={isSuccess}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * ResetPassword Page
 */
const ResetPassword = () => {
  const { resetPassword, isLoading, error, clearError } = useAuth();
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [searchParams] = React.useState(() => new URLSearchParams(window.location.search));
  const token = searchParams.get('token');

  const handleSubmit = async (password) => {
    clearError();
    if (!token) {
      return;
    }
    const result = await resetPassword(token, password);
    if (result.success) {
      setIsSuccess(true);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-4">This password reset link is invalid or has expired.</p>
          <a href="/forgot-password" className="text-primary-600 hover:text-primary-500 font-medium">
            Request a new reset link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Create New Password
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-xl sm:px-10">
          <ResetPasswordForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            isSuccess={isSuccess}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * AppRoutes Component
 * Main application routes
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <Login />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <AuthLayout>
              <Register />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <AuthLayout>
              <ForgotPassword />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <AuthLayout>
              <ResetPassword />
            </AuthLayout>
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trips"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Trips />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-trip"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AddTrip />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trips/edit/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AddTrip />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Reports />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Default Routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
