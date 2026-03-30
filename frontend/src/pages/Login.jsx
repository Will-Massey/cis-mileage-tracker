import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';

/**
 * Login Page
 * User login screen
 */
const Login = () => {
  const { isAuthenticated, login, isLoading, error } = useAuth();
  const location = useLocation();
  
  // Get redirect path from query params
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const sessionExpired = searchParams.get('session') === 'expired';

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleLogin = async (email, password) => {
    await login(email, password);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 7m0 13V7m0 0L9.553 4.553A1 1 0 009 4.118v.004" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Sign in to Mileage Tracker
        </h2>
        <p className="mt-2 text-center text-gray-600">
          Track your business mileage for tax claims
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Session Expired Alert */}
        {sessionExpired && (
          <div className="mb-4 bg-warning-50 border border-warning-200 text-warning-800 px-4 py-3 rounded-lg">
            <p className="font-medium">Session expired</p>
            <p className="text-sm">Please sign in again to continue.</p>
          </div>
        )}

        <div className="bg-white py-8 px-4 shadow-sm rounded-xl sm:px-10">
          <LoginForm 
            onSubmit={handleLogin}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* Help Text */}
        <p className="mt-6 text-center text-sm text-gray-500">
          By signing in, you agree to our{' '}
          <a href="#" className="text-primary-600 hover:text-primary-500">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-primary-600 hover:text-primary-500">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
