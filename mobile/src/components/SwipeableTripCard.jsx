/**
 * Swipeable Trip Card Component
 * MileIQ-style swipe to classify trips as Business or Personal
 * Large touch targets for construction workers
 */

import React, { useState, useRef, useCallback } from 'react';

const SwipeableTripCard = ({ trip, onClassify, onEdit, onDelete }) => {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [classified, setClassified] = useState(trip.purposeCategory || null);
  const cardRef = useRef(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  // Swipe thresholds
  const SWIPE_THRESHOLD = 100; // Minimum swipe distance to trigger action
  const MAX_SWIPE = 150; // Maximum visual swipe distance

  const handleTouchStart = useCallback((e) => {
    setIsSwiping(true);
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isSwiping) return;
    
    const touchX = e.touches[0].clientX;
    const diff = touchX - startXRef.current;
    
    // Limit swipe distance
    const limitedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff));
    setSwipeX(limitedDiff);
    currentXRef.current = touchX;
  }, [isSwiping]);

  const handleTouchEnd = useCallback(() => {
    setIsSwiping(false);
    
    if (swipeX > SWIPE_THRESHOLD) {
      // Swiped right - Business
      handleClassify('business');
    } else if (swipeX < -SWIPE_THRESHOLD) {
      // Swiped left - Personal
      handleClassify('personal');
    } else {
      // Snap back
      setSwipeX(0);
    }
  }, [swipeX]);

  const handleClassify = (category) => {
    setClassified(category);
    setSwipeX(0);
    
    // Trigger haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    onClassify?.(trip.id, category);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Calculate duration
  const getDuration = () => {
    if (!trip.endTime) return 'In progress';
    const start = new Date(trip.startTime);
    const end = new Date(trip.endTime);
    const diff = (end - start) / 1000 / 60; // minutes
    
    if (diff < 60) return `${Math.round(diff)} min`;
    return `${Math.round(diff / 60 * 10) / 10} hr`;
  };

  // Get classification color
  const getClassificationColor = () => {
    if (classified === 'business') return 'bg-green-500';
    if (classified === 'personal') return 'bg-gray-400';
    return 'bg-amber-500';
  };

  // Get classification label
  const getClassificationLabel = () => {
    if (classified === 'business') return 'Business';
    if (classified === 'personal') return 'Personal';
    return 'Unclassified';
  };

  return (
    <div className="relative mb-4 select-none">
      {/* Background layers - shown during swipe */}
      <div className="absolute inset-0 flex rounded-2xl overflow-hidden">
        {/* Left side - Business (green) */}
        <div 
          className={`
            flex-1 flex items-center justify-start pl-6
            bg-gradient-to-r from-green-500 to-green-600
            transition-opacity duration-200
            ${swipeX > 0 ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <div className="flex items-center gap-2 text-white">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg font-semibold">Business</span>
          </div>
        </div>

        {/* Right side - Personal (gray) */}
        <div 
          className={`
            flex-1 flex items-center justify-end pr-6
            bg-gradient-to-l from-gray-500 to-gray-600
            transition-opacity duration-200
            ${swipeX < 0 ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <div className="flex items-center gap-2 text-white">
            <span className="text-lg font-semibold">Personal</span>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div
        ref={cardRef}
        className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-5 cursor-grab active:cursor-grabbing"
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={(e) => {
          setIsSwiping(true);
          startXRef.current = e.clientX;
        }}
        onMouseMove={(e) => {
          if (!isSwiping) return;
          const diff = e.clientX - startXRef.current;
          const limitedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff));
          setSwipeX(limitedDiff);
        }}
        onMouseUp={() => handleTouchEnd()}
        onMouseLeave={() => {
          if (isSwiping) handleTouchEnd();
        }}
      >
        <div className="flex items-start justify-between">
          {/* Left - Date and Time */}
          <div className="flex-shrink-0 text-center pr-4 border-r border-gray-100">
            <p className="text-2xl font-bold text-gray-800">{formatDate(trip.startTime).split(' ')[1]}</p>
            <p className="text-sm text-gray-500">{formatDate(trip.startTime).split(' ')[2]}</p>
            <p className="text-xs text-gray-400 mt-1">{formatTime(trip.startTime)}</p>
          </div>

          {/* Middle - Route Info */}
          <div className="flex-1 px-4 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <p className="text-sm text-gray-600 truncate">{trip.startLocation?.address || trip.startAddress || 'Start Location'}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              <p className="text-sm text-gray-600 truncate">{trip.endLocation?.address || trip.endAddress || 'End Location'}</p>
            </div>
            
            {/* Purpose if set */}
            {trip.purpose && (
              <p className="text-xs text-gray-500 mt-2 truncate">{trip.purpose}</p>
            )}
          </div>

          {/* Right - Stats */}
          <div className="flex-shrink-0 text-right pl-4">
            <p className="text-2xl font-bold text-gray-800">{parseFloat(trip.distanceMiles || trip.distance || 0).toFixed(1)}</p>
            <p className="text-xs text-gray-500">miles</p>
            <p className="text-sm font-semibold text-green-600 mt-1">
              £{parseFloat(trip.amountGbp || trip.amount || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Bottom row - Classification badge and actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          {/* Classification Badge */}
          <div className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
            ${getClassificationColor()} text-white
          `}>
            {classified === 'business' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {classified === 'personal' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {!classified && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {getClassificationLabel()}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(trip);
              }}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(trip);
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Swipe hint */}
        {!classified && (
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Swipe left for Personal
            </span>
            <span className="flex items-center gap-1">
              Swipe right for Business
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwipeableTripCard;
