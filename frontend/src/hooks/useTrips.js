import { useState, useEffect, useCallback } from 'react';
import tripService from '../services/tripService';

/**
 * useTrips Hook
 * Custom hook for managing trips data
 * 
 * @param {object} initialParams - Initial query parameters
 * @returns {object} Trips data and operations
 */
export const useTrips = (initialParams = {}) => {
  const [trips, setTrips] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  /**
   * Fetch trips
   */
  const fetchTrips = useCallback(async (queryParams = params) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await tripService.getTrips(queryParams);
      setTrips(response.data.trips || []);
      setPagination(response.data.pagination || null);
      setSummary(response.data.summary || null);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch trips');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  /**
   * Fetch a single trip
   */
  const fetchTrip = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await tripService.getTrip(id);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch trip');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new trip
   */
  const createTrip = useCallback(async (tripData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await tripService.createTrip(tripData);
      // Refresh trips list
      await fetchTrips();
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to create trip');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchTrips]);

  /**
   * Update an existing trip
   */
  const updateTrip = useCallback(async (id, tripData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await tripService.updateTrip(id, tripData);
      // Update local state
      setTrips(prev => prev.map(trip => 
        trip.id === id ? { ...trip, ...response.data } : trip
      ));
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to update trip');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a trip
   */
  const deleteTrip = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      await tripService.deleteTrip(id);
      // Remove from local state
      setTrips(prev => prev.filter(trip => trip.id !== id));
      return true;
    } catch (err) {
      setError(err.message || 'Failed to delete trip');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get trip statistics
   */
  const getStats = useCallback(async (statsParams = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await tripService.getStats(statsParams);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch statistics');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get recent trips
   */
  const getRecentTrips = useCallback(async (limit = 5) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await tripService.getRecentTrips(limit);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch recent trips');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get trips by month
   */
  const getTripsByMonth = useCallback(async (year, month) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await tripService.getTripsByMonth(year, month);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch trips');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get current month summary
   */
  const getCurrentMonthSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await tripService.getCurrentMonthSummary();
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch summary');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get year-to-date summary
   */
  const getYearToDateSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await tripService.getYearToDateSummary();
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch summary');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update query parameters
   */
  const updateParams = useCallback((newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch trips on mount and when params change
  useEffect(() => {
    fetchTrips();
  }, [params, fetchTrips]);

  return {
    // State
    trips,
    pagination,
    summary,
    isLoading,
    error,
    params,
    
    // Actions
    fetchTrips,
    fetchTrip,
    createTrip,
    updateTrip,
    deleteTrip,
    getStats,
    getRecentTrips,
    getTripsByMonth,
    getCurrentMonthSummary,
    getYearToDateSummary,
    updateParams,
    clearError
  };
};

export default useTrips;
