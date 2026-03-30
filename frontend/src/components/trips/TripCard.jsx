import React, { useState } from 'react';
import { formatDate, formatCurrency, formatMiles } from '../../utils/formatters';

/**
 * TripCard Component
 * Displays a single trip in card format
 * 
 * @param {object} trip - Trip data
 * @param {function} onEdit - Edit handler
 * @param {function} onDelete - Delete handler
 */
const TripCard = ({ trip, onEdit, onDelete }) => {
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(trip);
    }
    setShowActions(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this trip?')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(trip.id);
      }
    } finally {
      setIsDeleting(false);
      setShowActions(false);
    }
  };

  // Get category label and color
  const getCategoryInfo = (category) => {
    const categories = {
      site_visit: { label: 'Site Visit', color: 'bg-blue-100 text-blue-800' },
      client_meeting: { label: 'Client Meeting', color: 'bg-green-100 text-green-800' },
      supplier_visit: { label: 'Supplier', color: 'bg-purple-100 text-purple-800' },
      materials: { label: 'Materials', color: 'bg-orange-100 text-orange-800' },
      training: { label: 'Training', color: 'bg-pink-100 text-pink-800' },
      other: { label: 'Other', color: 'bg-gray-100 text-gray-800' }
    };
    return categories[category] || categories.other;
  };

  const categoryInfo = getCategoryInfo(trip.purposeCategory);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
      {/* Main Content */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setShowActions(!showActions)}
      >
        <div className="flex items-start justify-between">
          {/* Left: Date & Route */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-gray-900">
                {formatDate(trip.tripDate)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${categoryInfo.color}`}>
                {categoryInfo.label}
              </span>
              {trip.isRoundTrip && (
                <span className="text-xs text-gray-500">(Return)</span>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center text-gray-700">
                <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" strokeWidth={2} />
                </svg>
                <span className="text-sm truncate">{trip.startLocation}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <svg className="w-4 h-4 mr-2 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm truncate">{trip.endLocation}</span>
              </div>
            </div>

            {trip.purpose && (
              <p className="mt-2 text-sm text-gray-500 truncate">
                {trip.purpose}
              </p>
            )}
          </div>

          {/* Right: Miles & Amount */}
          <div className="text-right ml-4 flex-shrink-0">
            <p className="text-lg font-bold text-gray-900">
              {formatMiles(trip.distanceMiles)}
            </p>
            <p className="text-sm font-medium text-success-600">
              {formatCurrency(trip.amountGbp)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex border-t border-gray-100 animate-fade-in">
          <button
            onClick={handleEdit}
            disabled={isDeleting}
            className="flex-1 py-3 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <div className="w-px bg-gray-100" />
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 py-3 text-sm font-medium text-danger-600 hover:bg-danger-50 transition-colors flex items-center justify-center"
          >
            {isDeleting ? (
              <svg className="animate-spin w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default TripCard;
