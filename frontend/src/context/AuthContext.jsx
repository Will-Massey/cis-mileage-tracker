import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

// Create context
export const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Provides authentication state and methods to the app
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = authService.getToken();
        const storedUser = authService.getUser();

        if (token && storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
          
          // Verify token by fetching current user
          try {
            const response = await authService.getCurrentUser();
            setUser(response.data);
          } catch (err) {
            // Token invalid, logout
            await logout();
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login user
   */
  const login = useCallback(async (email, password) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await authService.login(email, password);
      setUser(response.data.user);
      setIsAuthenticated(true);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message || 'Login failed');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(async (userData) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await authService.register(userData);
      setUser(response.data.user);
      setIsAuthenticated(true);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message || 'Registration failed');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (profileData) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await authService.updateProfile(profileData);
      setUser(response.data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message || 'Update failed');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Change password
   */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message || 'Password change failed');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Request password reset
   */
  const forgotPassword = useCallback(async (email) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message || 'Request failed');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reset password with token
   */
  const resetPassword = useCallback(async (token, password) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await authService.resetPassword(token, password);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message || 'Reset failed');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      setUser(response.data);
      return response.data;
    } catch (err) {
      console.error('Refresh user error:', err);
      return null;
    }
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    clearError,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
