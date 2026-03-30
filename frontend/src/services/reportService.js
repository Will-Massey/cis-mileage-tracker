import api, { handleApiError } from './api';

/**
 * Report Service
 * Handles all report-related API calls
 */

const reportService = {
  /**
   * Get all reports
   * @param {object} params - Query parameters
   * @returns {Promise} Reports list
   */
  getReports: async (params = {}) => {
    try {
      const response = await api.get('/reports', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get a single report by ID
   * @param {string} id - Report ID
   * @returns {Promise} Report details
   */
  getReport: async (id) => {
    try {
      const response = await api.get(`/reports/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Generate a new report
   * @param {object} reportData - Report configuration
   * @returns {Promise} Generated report
   */
  generateReport: async (reportData) => {
    try {
      const response = await api.post('/reports', reportData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Download a report
   * @param {string} id - Report ID
   * @returns {Promise} Download URL or blob
   */
  downloadReport: async (id) => {
    try {
      const response = await api.get(`/reports/${id}/download`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete a report
   * @param {string} id - Report ID
   * @returns {Promise} Delete result
   */
  deleteReport: async (id) => {
    try {
      const response = await api.delete(`/reports/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Generate and download a mileage report
   * @param {object} params - Report parameters
   * @returns {Promise} Report data
   */
  generateMileageReport: async (params) => {
    try {
      const reportData = {
        name: params.name || `Mileage Report ${params.dateFrom} to ${params.dateTo}`,
        description: params.description || '',
        reportType: 'mileage',
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        format: params.format || 'pdf',
        filters: {
          vehicleId: params.vehicleId || null,
          purposeCategory: params.purposeCategory || null,
          includeReceipts: params.includeReceipts || false
        }
      };

      const response = await api.post('/reports', reportData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Generate a summary report
   * @param {object} params - Report parameters
   * @returns {Promise} Report data
   */
  generateSummaryReport: async (params) => {
    try {
      const reportData = {
        name: params.name || `Summary Report ${params.dateFrom} to ${params.dateTo}`,
        description: params.description || '',
        reportType: 'summary',
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        format: params.format || 'pdf',
        filters: {}
      };

      const response = await api.post('/reports', reportData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Generate a tax report (HMRC format)
   * @param {object} params - Report parameters
   * @returns {Promise} Report data
   */
  generateTaxReport: async (params) => {
    try {
      const reportData = {
        name: params.name || `Tax Report ${params.taxYear}`,
        description: params.description || 'HMRC Tax Submission Report',
        reportType: 'tax',
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        format: params.format || 'csv',
        filters: {
          taxYear: params.taxYear
        }
      };

      const response = await api.post('/reports', reportData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get report download URL
   * @param {string} id - Report ID
   * @returns {string} Download URL
   */
  getDownloadUrl: (id) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${baseUrl}/reports/${id}/download`;
  },

  /**
   * Poll for report status
   * @param {string} id - Report ID
   * @param {number} maxAttempts - Maximum polling attempts
   * @param {number} interval - Polling interval in ms
   * @returns {Promise} Final report status
   */
  pollReportStatus: async (id, maxAttempts = 30, interval = 2000) => {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await api.get(`/reports/${id}`);
      const report = response.data.data;

      if (report.status === 'completed') {
        return response.data;
      }

      if (report.status === 'failed') {
        throw new Error('Report generation failed');
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('Report generation timeout');
  }
};

export default reportService;
