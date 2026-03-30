/**
 * useGPSTracking Hook
 * React hook for GPS tracking functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { gpsTrackingService } from '../services/GPSTrackingService';

export const useGPSTracking = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [tripDistance, setTripDistance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingSync, setPendingSync] = useState(0);
  
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    // Initialize service
    gpsTrackingService.initialize();
    
    // Subscribe to events
    unsubscribeRef.current = gpsTrackingService.subscribe((event, data) => {
      switch (event) {
        case 'trackingStarted':
          setIsTracking(true);
          setError(null);
          break;
        case 'trackingStopped':
          setIsTracking(false);
          setCurrentTrip(null);
          setTripDistance(0);
          break;
        case 'tripStarted':
          setCurrentTrip(data);
          setTripDistance(0);
          break;
        case 'tripEnded':
          setCurrentTrip(null);
          setTripDistance(0);
          break;
        case 'location':
          if (currentTrip) {
            setTripDistance(prev => {
              // Calculate new distance
              const lastLoc = currentTrip.locations[currentTrip.locations.length - 1];
              if (lastLoc) {
                return prev + calculateDistance(lastLoc, data);
              }
              return prev;
            });
          }
          break;
        case 'error':
          setError(data);
          break;
        case 'tripSynced':
          // Refresh pending count
          updatePendingCount();
          break;
      }
    });

    // Get initial status
    const status = gpsTrackingService.getStatus();
    setIsTracking(status.isTracking);
    setCurrentTrip(status.currentTrip);

    // Get pending sync count
    updatePendingCount();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [currentTrip]);

  const calculateDistance = (p1, p2) => {
    const R = 3959;
    const lat1 = toRadians(p1.latitude);
    const lat2 = toRadians(p2.latitude);
    const deltaLat = toRadians(p2.latitude - p1.latitude);
    const deltaLon = toRadians(p2.longitude - p1.longitude);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const toRadians = (degrees) => degrees * (Math.PI / 180);

  const updatePendingCount = async () => {
    const pending = await gpsTrackingService.sqlite.getPendingTrips();
    setPendingSync(pending.length);
  };

  const startTracking = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await gpsTrackingService.startTracking();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopTracking = useCallback(async () => {
    setIsLoading(true);
    try {
      await gpsTrackingService.stopTracking();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncPending = useCallback(async () => {
    setIsLoading(true);
    try {
      const count = await gpsTrackingService.syncPendingTrips();
      await updatePendingCount();
      return count;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isTracking,
    currentTrip,
    tripDistance,
    isLoading,
    error,
    pendingSync,
    startTracking,
    stopTracking,
    syncPending,
  };
};

export default useGPSTracking;
