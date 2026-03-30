import axios from 'axios';

// API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 second timeout
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login?session=expired';
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

export default api;

// Helper function for file uploads
export const uploadFile = async (endpoint, file, onProgress = null) => {
  const formData = new FormData();
  formData.append('file', file);

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  };

  if (onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgress(percentCompleted);
    };
  }

  return api.post(endpoint, formData, config);
};

// Helper to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return {
          type: 'validation',
          message: data.message || data.error?.message || 'Invalid request',
          details: data.errors || data.error?.details || []
        };
      case 401:
        return {
          type: 'auth',
          message: 'Please log in again',
          details: []
        };
      case 403:
        return {
          type: 'permission',
          message: 'You do not have permission to do this',
          details: []
        };
      case 404:
        return {
          type: 'notfound',
          message: 'Resource not found',
          details: []
        };
      case 409:
        return {
          type: 'conflict',
          message: data.message || data.error?.message || 'Resource already exists',
          details: []
        };
      case 422:
        return {
          type: 'business',
          message: data.message || data.error?.message || 'Request could not be processed',
          details: []
        };
      case 429:
        return {
          type: 'ratelimit',
          message: 'Too many requests. Please try again later.',
          details: []
        };
      default:
        return {
          type: 'server',
          message: 'Something went wrong. Please try again.',
          details: []
        };
    }
  }

  if (error.request) {
    // Request made but no response
    return {
      type: 'network',
      message: 'Network error. Please check your connection.',
      details: []
    };
  }

  // Something else happened
  return {
    type: 'unknown',
    message: error.message || 'An unexpected error occurred',
    details: []
  };
};
