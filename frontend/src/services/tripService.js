import api, { handleApiError } from './api';

/**
 * Trip Service
 * Handles all trip-related API calls
 */

const tripService = {
  /**
   * Get all trips with optional filters
   * @param {object} params - Query parameters
   * @returns {Promise} Trips list
   */
  getTrips: async (params = {}) => {
    try {
      const response = await api.get('/trips', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get a single trip by ID
   * @param {string} id - Trip ID
   * @returns {Promise} Trip details
   */
  getTrip: async (id) => {
    try {
      const response = await api.get(`/trips/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Create a new trip
   * @param {object} tripData - Trip data
   * @returns {Promise} Created trip
   */
  createTrip: async (tripData) => {
    try {
      const response = await api.post('/trips', tripData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update an existing trip
   * @param {string} id - Trip ID
   * @param {object} tripData - Updated trip data
   * @returns {Promise} Updated trip
   */
  updateTrip: async (id, tripData) => {
    try {
      const response = await api.put(`/trips/${id}`, tripData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete a trip
   * @param {string} id - Trip ID
   * @returns {Promise} Delete result
   */
  deleteTrip: async (id) => {
    try {
      const response = await api.delete(`/trips/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get trip statistics
   * @param {object} params - Query parameters (taxYear, startDate, endDate)
   * @returns {Promise} Statistics
   */
  getStats: async (params = {}) => {
    try {
      const response = await api.get('/trips/stats', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get monthly statistics for current year
   * @returns {Promise} Monthly statistics
   */
  getMonthlyStats: async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      
      const response = await api.get('/trips/stats', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get trips for a specific month
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Promise} Trips for the month
   */
  getTripsByMonth: async (year, month) => {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
      
      const response = await api.get('/trips', {
        params: { startDate, endDate, limit: 100 }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get recent trips (last N trips)
   * @param {number} limit - Number of trips to get
   * @returns {Promise} Recent trips
   */
  getRecentTrips: async (limit = 5) => {
    try {
      const response = await api.get('/trips', {
        params: { limit, sortBy: 'tripDate', sortOrder: 'desc' }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Bulk import trips from CSV
   * @param {File} file - CSV file
   * @returns {Promise} Import result
   */
  bulkImport: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/trips/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Search trips by location or purpose
   * @param {string} query - Search query
   * @returns {Promise} Search results
   */
  searchTrips: async (query) => {
    try {
      const response = await api.get('/trips', {
        params: { search: query, limit: 20 }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get current month's summary
   * @returns {Promise} Monthly summary
   */
  getCurrentMonthSummary: async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
      
      const response = await api.get('/trips/stats', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get year-to-date summary
   * @returns {Promise} YTD summary
   */
  getYearToDateSummary: async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      
      // Get tax year start (April 6th)
      const currentYear = now.getMonth() >= 3 && now.getDate() >= 6 ? year : year - 1;
      const startDate = `${currentYear}-04-06`;
      const endDate = now.toISOString().split('T')[0];
      
      const response = await api.get('/trips/stats', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

export default tripService;
