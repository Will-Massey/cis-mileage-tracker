import React, { useState } from 'react';
import TripCard from './TripCard';
import Loading from '../common/Loading';
import Button from '../common/Button';

/**
 * TripList Component
 * Displays a list of trips with filtering and pagination
 * 
 * @param {Array} trips - Array of trip objects
 * @param {boolean} isLoading - Loading state
 * @param {object} pagination - Pagination info
 * @param {function} onEdit - Edit handler
 * @param {function} onDelete - Delete handler
 * @param {function} onLoadMore - Load more handler
 * @param {function} onFilter - Filter handler
 */
const TripList = ({
  trips = [],
  isLoading,
  pagination,
  onEdit,
  onDelete,
  onLoadMore,
  onFilter
}) => {
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const purposeCategories = [
    { value: '', label: 'All Categories' },
    { value: 'site_visit', label: 'Site Visit' },
    { value: 'client_meeting', label: 'Client Meeting' },
    { value: 'supplier_visit', label: 'Supplier Visit' },
    { value: 'materials', label: 'Materials/Supplies' },
    { value: 'training', label: 'Training' },
    { value: 'other', label: 'Other' }
  ];

  // Generate last 12 months for filter
  const getMonthOptions = () => {
    const options = [{ value: '', label: 'All Time' }];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  };

  const handleMonthChange = (e) => {
    setFilterMonth(e.target.value);
    if (onFilter) {
      onFilter({ month: e.target.value, category: filterCategory });
    }
  };

  const handleCategoryChange = (e) => {
    setFilterCategory(e.target.value);
    if (onFilter) {
      onFilter({ month: filterMonth, category: e.target.value });
    }
  };

  if (isLoading && trips.length === 0) {
    return <Loading.List items={5} />;
  }

  if (!isLoading && trips.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 7m0 13V7m0 0L9.553 4.553A1 1 0 009 4.118v.004" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
        <p className="text-gray-600 mb-4">Start tracking your business mileage</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Month
            </label>
            <select
              value={filterMonth}
              onChange={handleMonthChange}
              className="block w-full rounded-lg border-gray-300 text-sm min-h-[40px] px-3 py-2 focus:border-primary-500 focus:ring-primary-500"
            >
              {getMonthOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Category
            </label>
            <select
              value={filterCategory}
              onChange={handleCategoryChange}
              className="block w-full rounded-lg border-gray-300 text-sm min-h-[40px] px-3 py-2 focus:border-primary-500 focus:ring-primary-500"
            >
              {purposeCategories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Trip Cards */}
      <div className="space-y-3">
        {trips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Load More */}
      {pagination?.hasNext && onLoadMore && (
        <div className="pt-4">
          <Button
            variant="secondary"
            fullWidth
            onClick={onLoadMore}
            isLoading={isLoading}
          >
            Load More
          </Button>
        </div>
      )}

      {/* Pagination Info */}
      {pagination && (
        <p className="text-center text-sm text-gray-500">
          Showing {trips.length} of {pagination.total} trips
        </p>
      )}
    </div>
  );
};

export default TripList;
