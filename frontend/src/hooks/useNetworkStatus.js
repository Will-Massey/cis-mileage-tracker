import { useState, useEffect } from 'react';

/**
 * useNetworkStatus Hook
 * Tracks online/offline status of the application
 * 
 * @returns {object} Network status information
 * @returns {boolean} isOnline - Whether the device is online
 * @returns {boolean} isOffline - Whether the device is offline
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('📶 App is online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('📴 App is offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
};

export default useNetworkStatus;