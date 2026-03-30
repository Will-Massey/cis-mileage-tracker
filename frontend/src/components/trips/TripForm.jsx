import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Button from '../common/Button';
import Input from '../common/Input';
import { validateMiles, validateLocation, validateTripDate } from '../../utils/validators';
import { calculateMileageClaim, getCurrentTaxYear } from '../../utils/hmrcCalculator';
import { formatCurrency } from '../../utils/formatters';

/**
 * TripForm Component
 * Form for adding or editing a trip
 * 
 * @param {object} initialData - Initial trip data for editing
 * @param {function} onSubmit - Form submit handler
 * @param {function} onCancel - Cancel handler
 * @param {boolean} isLoading - Loading state
 * @param {string} error - Error message
 */
const TripForm = ({ 
  initialData = null, 
  onSubmit, 
  onCancel, 
  isLoading, 
  error 
}) => {
  const isEditing = !!initialData;
  const today = format(new Date(), 'yyyy-MM-dd');

  const [formData, setFormData] = useState({
    tripDate: today,
    startLocation: '',
    endLocation: '',
    startPostcode: '',
    endPostcode: '',
    distanceMiles: '',
    isRoundTrip: false,
    purpose: '',
    purposeCategory: 'site_visit',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [calculatedAmount, setCalculatedAmount] = useState(null);

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        tripDate: initialData.tripDate || today,
        startLocation: initialData.startLocation || '',
        endLocation: initialData.endLocation || '',
        startPostcode: initialData.startPostcode || '',
        endPostcode: initialData.endPostcode || '',
        distanceMiles: initialData.distanceMiles?.toString() || '',
        isRoundTrip: initialData.isRoundTrip || false,
        purpose: initialData.purpose || '',
        purposeCategory: initialData.purposeCategory || 'site_visit',
        notes: initialData.notes || ''
      });
    }
  }, [initialData, today]);

  // Calculate amount when miles change
  useEffect(() => {
    const miles = parseFloat(formData.distanceMiles);
    if (!isNaN(miles) && miles > 0) {
      const result = calculateMileageClaim(miles, 0, 'car', getCurrentTaxYear());
      setCalculatedAmount(result);
    } else {
      setCalculatedAmount(null);
    }
  }, [formData.distanceMiles]);

  const purposeCategories = [
    { value: 'site_visit', label: 'Site Visit' },
    { value: 'client_meeting', label: 'Client Meeting' },
    { value: 'supplier_visit', label: 'Supplier Visit' },
    { value: 'materials', label: 'Materials/Supplies' },
    { value: 'training', label: 'Training' },
    { value: 'other', label: 'Other' }
  ];

  const validate = () => {
    const newErrors = {};

    // Date validation
    const dateValidation = validateTripDate(formData.tripDate);
    if (!dateValidation.isValid) {
      newErrors.tripDate = dateValidation.error;
    }

    // Start location
    const startLocValidation = validateLocation(formData.startLocation);
    if (!startLocValidation.isValid) {
      newErrors.startLocation = startLocValidation.error;
    }

    // End location
    const endLocValidation = validateLocation(formData.endLocation);
    if (!endLocValidation.isValid) {
      newErrors.endLocation = endLocValidation.error;
    }

    // Miles
    const milesValidation = validateMiles(formData.distanceMiles);
    if (!milesValidation.isValid) {
      newErrors.distanceMiles = milesValidation.error;
    }

    // Purpose
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const submitData = {
        ...formData,
        distanceMiles: parseFloat(formData.distanceMiles)
      };
      onSubmit(submitData);
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

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date <span className="text-danger-500">*</span>
        </label>
        <input
          type="date"
          name="tripDate"
          value={formData.tripDate}
          onChange={handleChange}
          max={today}
          className={`block w-full rounded-lg border-gray-300 shadow-sm min-h-[48px] px-4 py-3 text-base focus:border-primary-500 focus:ring-primary-500 ${errors.tripDate ? 'border-danger-500' : ''}`}
          disabled={isLoading}
        />
        {errors.tripDate && (
          <p className="mt-1 text-sm text-danger-600">{errors.tripDate}</p>
        )}
      </div>

      {/* From Location */}
      <Input
        label="From"
        type="text"
        name="startLocation"
        value={formData.startLocation}
        onChange={handleChange}
        placeholder="e.g., Home, Office, Site address"
        error={errors.startLocation}
        required
        disabled={isLoading}
      />

      {/* To Location */}
      <Input
        label="To"
        type="text"
        name="endLocation"
        value={formData.endLocation}
        onChange={handleChange}
        placeholder="e.g., Client site, Supplier, Meeting location"
        error={errors.endLocation}
        required
        disabled={isLoading}
      />

      {/* Purpose Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Purpose Type <span className="text-danger-500">*</span>
        </label>
        <select
          name="purposeCategory"
          value={formData.purposeCategory}
          onChange={handleChange}
          className="block w-full rounded-lg border-gray-300 shadow-sm min-h-[48px] px-4 py-3 text-base focus:border-primary-500 focus:ring-primary-500"
          disabled={isLoading}
        >
          {purposeCategories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Purpose Details */}
      <Input
        label="Purpose Details"
        type="text"
        name="purpose"
        value={formData.purpose}
        onChange={handleChange}
        placeholder="e.g., Site inspection for new project"
        error={errors.purpose}
        required
        disabled={isLoading}
      />

      {/* Miles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Miles <span className="text-danger-500">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            name="distanceMiles"
            value={formData.distanceMiles}
            onChange={handleChange}
            placeholder="0.0"
            step="0.1"
            min="0.1"
            max="1000"
            className={`block w-full rounded-lg border-gray-300 shadow-sm min-h-[48px] px-4 py-3 text-base focus:border-primary-500 focus:ring-primary-500 ${errors.distanceMiles ? 'border-danger-500' : ''}`}
            disabled={isLoading}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            miles
          </span>
        </div>
        {errors.distanceMiles && (
          <p className="mt-1 text-sm text-danger-600">{errors.distanceMiles}</p>
        )}
        
        {/* Calculated Amount */}
        {calculatedAmount && calculatedAmount.amount > 0 && (
          <div className="mt-2 p-3 bg-success-50 rounded-lg">
            <p className="text-sm text-success-800">
              <span className="font-medium">Claim amount:</span>{' '}
              {formatCurrency(calculatedAmount.amount)}
              <span className="text-success-600 ml-1">
                (at {Math.round(calculatedAmount.rateApplied * 100)}p/mile)
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Round Trip Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          name="isRoundTrip"
          id="isRoundTrip"
          checked={formData.isRoundTrip}
          onChange={handleChange}
          className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          disabled={isLoading}
        />
        <label htmlFor="isRoundTrip" className="ml-2 text-gray-700">
          This is a return journey
        </label>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Any additional details..."
          rows={3}
          className="block w-full rounded-lg border-gray-300 shadow-sm px-4 py-3 text-base focus:border-primary-500 focus:ring-primary-500 resize-none"
          disabled={isLoading}
        />
      </div>

      {/* Buttons */}
      <div className="flex space-x-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isEditing ? 'Update Trip' : 'Save Trip'}
        </Button>
      </div>
    </form>
  );
};

export default TripForm;
