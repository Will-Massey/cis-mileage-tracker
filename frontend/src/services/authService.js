import api, { handleApiError } from './api';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

const authService = {
  /**
   * Register a new user
   * @param {object} userData - User registration data
   * @returns {Promise} Registration result
   */
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      // Store tokens and user data
      if (response.data.data?.tokens) {
        localStorage.setItem('accessToken', response.data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Login result
   */
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Store tokens and user data
      if (response.data.data?.tokens) {
        localStorage.setItem('accessToken', response.data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Logout user
   * @returns {Promise} Logout result
   */
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', refreshToken ? { refreshToken } : {});
    } catch (error) {
      // Ignore logout errors
    } finally {
      // Always clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  /**
   * Refresh access token
   * @returns {Promise} Token refresh result
   */
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await api.post('/auth/refresh', { refreshToken });
      
      localStorage.setItem('accessToken', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise} Password reset request result
   */
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise} Password reset result
   */
  resetPassword: async (token, password) => {
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get current user profile
   * @returns {Promise} User profile
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      localStorage.setItem('user', JSON.stringify(response.data.data));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update user profile
   * @param {object} profileData - Profile data to update
   * @returns {Promise} Update result
   */
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/me', profileData);
      localStorage.setItem('user', JSON.stringify(response.data.data));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Change password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise} Password change result
   */
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} Is authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },

  /**
   * Get stored user data
   * @returns {object|null} User data
   */
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Get access token
   * @returns {string|null} Access token
   */
  getToken: () => {
    return localStorage.getItem('accessToken');
  }
};

export default authService;
