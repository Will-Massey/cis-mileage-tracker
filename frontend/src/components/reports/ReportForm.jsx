import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import Button from '../common/Button';
import { validateDateRange } from '../../utils/validators';

/**
 * ReportForm Component
 * Form for generating mileage reports
 * 
 * @param {function} onSubmit - Form submit handler
 * @param {boolean} isLoading - Loading state
 * @param {string} error - Error message
 */
const ReportForm = ({ onSubmit, isLoading, error }) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const lastMonthStart = format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');
  const lastMonthEnd = format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');

  const [formData, setFormData] = useState({
    name: '',
    dateFrom: lastMonthStart,
    dateTo: lastMonthEnd,
    format: 'pdf',
    reportType: 'mileage'
  });
  const [errors, setErrors] = useState({});

  const quickRanges = [
    { label: 'This Month', days: 0 },
    { label: 'Last Month', days: 30 },
    { label: 'Last 3 Months', days: 90 },
    { label: 'This Year', days: 365 }
  ];

  const handleQuickRange = (days) => {
    let start, end;
    const now = new Date();
    
    if (days === 0) {
      // This month
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else if (days === 30) {
      // Last month
      start = startOfMonth(subMonths(now, 1));
      end = endOfMonth(subMonths(now, 1));
    } else if (days === 90) {
      // Last 3 months
      start = startOfMonth(subMonths(now, 3));
      end = endOfMonth(now);
    } else if (days === 365) {
      // This year (tax year from April 6)
      const currentYear = now.getMonth() >= 3 && now.getDate() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
      start = new Date(currentYear, 3, 6);
      end = now;
    }

    setFormData(prev => ({
      ...prev,
      dateFrom: format(start, 'yyyy-MM-dd'),
      dateTo: format(end, 'yyyy-MM-dd')
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Report name is required';
    }

    const dateValidation = validateDateRange(formData.dateFrom, formData.dateTo);
    if (!dateValidation.isValid) {
      newErrors.dateRange = dateValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Alert */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg" role="alert">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Report Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Report Name <span className="text-danger-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., January 2024 Mileage"
          className={`block w-full rounded-lg border-gray-300 shadow-sm min-h-[48px] px-4 py-3 text-base focus:border-primary-500 focus:ring-primary-500 ${errors.name ? 'border-danger-500' : ''}`}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-danger-600">{errors.name}</p>
        )}
      </div>

      {/* Quick Date Ranges */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Select
        </label>
        <div className="flex flex-wrap gap-2">
          {quickRanges.map(range => (
            <button
              key={range.label}
              type="button"
              onClick={() => handleQuickRange(range.days)}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
              disabled={isLoading}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From <span className="text-danger-500">*</span>
          </label>
          <input
            type="date"
            name="dateFrom"
            value={formData.dateFrom}
            onChange={handleChange}
            max={today}
            className={`block w-full rounded-lg border-gray-300 shadow-sm min-h-[48px] px-4 py-3 text-base focus:border-primary-500 focus:ring-primary-500 ${errors.dateRange ? 'border-danger-500' : ''}`}
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To <span className="text-danger-500">*</span>
          </label>
          <input
            type="date"
            name="dateTo"
            value={formData.dateTo}
            onChange={handleChange}
            max={today}
            className={`block w-full rounded-lg border-gray-300 shadow-sm min-h-[48px] px-4 py-3 text-base focus:border-primary-500 focus:ring-primary-500 ${errors.dateRange ? 'border-danger-500' : ''}`}
            disabled={isLoading}
          />
        </div>
      </div>
      {errors.dateRange && (
        <p className="text-sm text-danger-600">{errors.dateRange}</p>
      )}

      {/* Report Format */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Format
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.format === 'pdf' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input
              type="radio"
              name="format"
              value="pdf"
              checked={formData.format === 'pdf'}
              onChange={handleChange}
              className="sr-only"
              disabled={isLoading}
            />
            <svg className="w-6 h-6 text-danger-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">PDF</p>
              <p className="text-xs text-gray-500">Best for printing</p>
            </div>
          </label>
          
          <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.format === 'csv' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input
              type="radio"
              name="format"
              value="csv"
              checked={formData.format === 'csv'}
              onChange={handleChange}
              className="sr-only"
              disabled={isLoading}
            />
            <svg className="w-6 h-6 text-success-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">CSV</p>
              <p className="text-xs text-gray-500">For spreadsheets</p>
            </div>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        disabled={isLoading}
      >
        Generate Report
      </Button>
    </form>
  );
};

export default ReportForm;
