import { useState, useCallback } from 'react';

/**
 * useApi Hook
 * Generic hook for making API calls with loading and error states
 * 
 * @param {Function} apiFunction - API function to call
 * @returns {object} API state and execute function
 * 
 * @example
 * const { data, isLoading, error, execute } = useApi(tripService.getTrips);
 * 
 * // Call the API
 * execute({ page: 1, limit: 10 });
 */
export const useApi = (apiFunction) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Execute the API function
   */
  const execute = useCallback(async (...args) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFunction(...args);
      setData(response.data || response);
      return { success: true, data: response.data || response };
    } catch (err) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, [apiFunction]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    setError(null);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
    clearError
  };
};

/**
 * useLazyApi Hook
 * Similar to useApi but doesn't auto-execute
 * 
 * @param {Function} apiFunction - API function to call
 * @returns {object} API state and execute function
 */
export const useLazyApi = (apiFunction) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [called, setCalled] = useState(false);

  const execute = useCallback(async (...args) => {
    setIsLoading(true);
    setError(null);
    setCalled(true);

    try {
      const response = await apiFunction(...args);
      setData(response.data || response);
      return { success: true, data: response.data || response };
    } catch (err) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    setError(null);
    setCalled(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    isLoading,
    error,
    called,
    execute,
    reset,
    clearError
  };
};

/**
 * useMutation Hook
 * Hook for mutation operations (create, update, delete)
 * 
 * @param {Function} mutationFunction - Mutation function
 * @returns {object} Mutation state and mutate function
 */
export const useMutation = (mutationFunction) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (...args) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await mutationFunction(...args);
      setData(response.data || response);
      return { success: true, data: response.data || response };
    } catch (err) {
      const errorMessage = err.message || 'Operation failed';
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, [mutationFunction]);

  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    data,
    isLoading,
    error,
    mutate,
    reset
  };
};

export default useApi;
