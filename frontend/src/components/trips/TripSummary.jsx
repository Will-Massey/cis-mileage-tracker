import React from 'react';
import { formatCurrency, formatMiles } from '../../utils/formatters';
import Card from '../common/Card';

/**
 * TripSummary Component
 * Dashboard summary card showing key stats
 * 
 * @param {object} stats - Statistics data
 * @param {boolean} isLoading - Loading state
 */
const TripSummary = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-8 bg-gray-200 rounded w-3/4" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-8 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    );
  }

  const summaryData = [
    {
      label: 'This Month',
      value: stats?.totalMiles || 0,
      subValue: stats?.totalAmount || 0,
      format: 'miles',
      subFormat: 'currency',
      icon: (
        <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 7m0 13V7m0 0L9.553 4.553A1 1 0 009 4.118v.004" />
        </svg>
      )
    },
    {
      label: 'Total Trips',
      value: stats?.tripCount || 0,
      subValue: null,
      format: 'number',
      subFormat: null,
      icon: (
        <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    }
  ];

  const formatValue = (value, format) => {
    switch (format) {
      case 'miles':
        return formatMiles(value);
      case 'currency':
        return formatCurrency(value);
      case 'number':
        return value.toString();
      default:
        return value;
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {summaryData.map((item, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{item.label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatValue(item.value, item.format)}
              </p>
              {item.subValue !== null && (
                <p className="text-sm font-medium text-success-600 mt-1">
                  {formatValue(item.subValue, item.subFormat)}
                </p>
              )}
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              {item.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

/**
 * TripSummary.Extended - Extended summary with more details
 */
TripSummary.Extended = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </div>
      </Card>
    );
  }

  const hasBreakdown = stats?.breakdown?.at45p || stats?.breakdown?.at25p;

  return (
    <Card title="Mileage Summary" className="p-4">
      <div className="space-y-4">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <p className="text-3xl font-bold text-primary-700">
              {formatMiles(stats?.totalMiles || 0)}
            </p>
            <p className="text-sm text-primary-600 mt-1">Total Miles</p>
          </div>
          <div className="text-center p-4 bg-success-50 rounded-lg">
            <p className="text-3xl font-bold text-success-700">
              {formatCurrency(stats?.totalAmount || 0)}
            </p>
            <p className="text-sm text-success-600 mt-1">Total Claim</p>
          </div>
        </div>

        {/* Rate Breakdown */}
        {hasBreakdown && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Rate Breakdown</p>
            <div className="space-y-2">
              {stats.breakdown.at45p?.miles > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    At 45p/mile ({formatMiles(stats.breakdown.at45p.miles)})
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(stats.breakdown.at45p.amount)}
                  </span>
                </div>
              )}
              {stats.breakdown.at25p?.miles > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    At 25p/mile ({formatMiles(stats.breakdown.at25p.miles)})
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(stats.breakdown.at25p.amount)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trip Count */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Number of Trips</span>
            <span className="font-medium text-gray-900">{stats?.tripCount || 0}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TripSummary;
