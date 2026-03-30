import React from 'react';

/**
 * Loading Component
 * Reusable loading spinner with optional text
 * 
 * @param {string} size - Spinner size (sm, md, lg, xl)
 * @param {string} text - Loading text
 * @param {boolean} fullScreen - Full screen overlay
 * @param {boolean} overlay - Show as overlay on parent
 * @param {string} className - Additional classes
 */
const Loading = ({
  size = 'md',
  text,
  fullScreen = false,
  overlay = false,
  className = ''
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  // Spinner component
  const Spinner = () => (
    <svg
      className={`animate-spin text-primary-600 ${sizeClasses[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Full screen overlay
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
        <Spinner />
        {text && (
          <p className="mt-4 text-gray-600 font-medium">{text}</p>
        )}
      </div>
    );
  }

  // Overlay on parent
  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
        <Spinner />
        {text && (
          <p className="mt-4 text-gray-600 font-medium">{text}</p>
        )}
      </div>
    );
  }

  // Inline loading
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Spinner />
      {text && (
        <p className="mt-2 text-gray-600 text-sm">{text}</p>
      )}
    </div>
  );
};

/**
 * Loading.Skeleton - Skeleton loading placeholder
 */
Loading.Skeleton = ({ lines = 3, className = '' }) => (
  <div className={`animate-pulse space-y-3 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div 
        key={i}
        className="h-4 bg-gray-200 rounded w-full"
        style={{ width: `${100 - (i * 10)}%` }}
      />
    ))}
  </div>
);

/**
 * Loading.Card - Card skeleton
 */
Loading.Card = ({ className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse ${className}`}>
    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
      <div className="h-4 bg-gray-200 rounded w-4/6" />
    </div>
  </div>
);

/**
 * Loading.List - List skeleton
 */
Loading.List = ({ items = 5, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: items }).map((_, i) => (
      <div 
        key={i}
        className="bg-white rounded-lg p-4 border border-gray-100 animate-pulse"
      >
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default Loading;
