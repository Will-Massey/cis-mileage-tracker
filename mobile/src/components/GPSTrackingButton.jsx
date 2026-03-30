/**
 * GPS Tracking Button Component
 * Large, easy-to-press button for starting/stopping GPS tracking
 * Optimized for construction workers with gloves
 */

import React, { useState, useEffect } from 'react';
import { gpsTrackingService } from '../services/GPSTrackingService';

const GPSTrackingButton = ({ onStatusChange }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [tripDistance, setTripDistance] = useState(0);

  useEffect(() => {
    // Subscribe to GPS events
    const unsubscribe = gpsTrackingService.subscribe((event, data) => {
      switch (event) {
        case 'trackingStarted':
          setIsTracking(true);
          break;
        case 'trackingStopped':
          setIsTracking(false);
          setCurrentTrip(null);
          setTripDistance(0);
          break;
        case 'tripStarted':
          setCurrentTrip(data);
          break;
        case 'tripEnded':
          setCurrentTrip(null);
          setTripDistance(0);
          break;
        case 'location':
          if (currentTrip) {
            // Update distance display
            const distance = calculateCurrentDistance(currentTrip, data);
            setTripDistance(distance);
          }
          break;
      }
      
      if (onStatusChange) {
        onStatusChange({ event, data, isTracking });
      }
    });

    // Get initial status
    const status = gpsTrackingService.getStatus();
    setIsTracking(status.isTracking);
    setCurrentTrip(status.currentTrip);

    return () => unsubscribe();
  }, [currentTrip, isTracking, onStatusChange]);

  const calculateCurrentDistance = (trip, currentLocation) => {
    if (!trip.locations || trip.locations.length === 0) return 0;
    
    let total = 0;
    for (let i = 1; i < trip.locations.length; i++) {
      total += haversineDistance(trip.locations[i - 1], trip.locations[i]);
    }
    // Add distance from last location to current
    const lastLoc = trip.locations[trip.locations.length - 1];
    total += haversineDistance(lastLoc, currentLocation);
    
    return total;
  };

  const haversineDistance = (p1, p2) => {
    const R = 3959; // Earth's radius in miles
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

  const handleToggleTracking = async () => {
    setIsLoading(true);
    try {
      if (isTracking) {
        await gpsTrackingService.stopTracking();
      } else {
        await gpsTrackingService.startTracking();
      }
    } catch (error) {
      console.error('Error toggling tracking:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDistance = (miles) => {
    if (miles < 0.1) return `${(miles * 5280).toFixed(0)} ft`;
    return `${miles.toFixed(1)} mi`;
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      {/* Active Trip Status */}
      {currentTrip && (
        <div className="mb-4 bg-blue-600 text-white rounded-2xl p-4 shadow-lg animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Recording Trip...</p>
              <p className="text-2xl font-bold">{formatDistance(tripDistance)}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Main Tracking Button */}
      <button
        onClick={handleToggleTracking}
        disabled={isLoading}
        className={`
          w-full py-6 px-8 rounded-3xl shadow-2xl
          flex items-center justify-center gap-4
          transition-all duration-300 transform active:scale-95
          ${isTracking 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
          }
          ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
        `}
        style={{
          minHeight: '80px',
          touchAction: 'manipulation',
        }}
      >
        {isLoading ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-xl font-semibold">Please wait...</span>
          </div>
        ) : (
          <>
            {/* Icon */}
            <div className={`
              w-14 h-14 rounded-full flex items-center justify-center
              ${isTracking ? 'bg-red-400' : 'bg-blue-500'}
            `}>
              {isTracking ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <rect x="6" y="4" width="4" height="12" rx="1" />
                  <rect x="12" y="4" width="4" height="12" rx="1" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            {/* Text */}
            <div className="text-left">
              <p className="text-2xl font-bold">
                {isTracking ? 'Stop Tracking' : 'Start Tracking'}
              </p>
              <p className="text-sm opacity-90">
                {isTracking 
                  ? 'GPS is recording your trips' 
                  : 'Automatically record business trips'
                }
              </p>
            </div>
          </>
        )}
      </button>

      {/* Status Indicator */}
      <div className="mt-3 text-center">
        <div className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
          ${isTracking 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-600'
          }
        `}>
          <div className={`
            w-3 h-3 rounded-full
            ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}
          `} />
          {isTracking ? 'GPS Active' : 'GPS Inactive'}
        </div>
      </div>
    </div>
  );
};

export default GPSTrackingButton;
