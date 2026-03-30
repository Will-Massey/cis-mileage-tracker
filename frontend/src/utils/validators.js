/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
};

/**
 * Validate UK postcode
 * @param {string} postcode - Postcode to validate
 * @returns {boolean} Is valid
 */
export const isValidPostcode = (postcode) => {
  if (!postcode) return false;
  const regex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
  return regex.test(postcode.trim());
};

/**
 * Validate UK phone number
 * @param {string} phone - Phone to validate
 * @returns {boolean} Is valid
 */
export const isValidPhone = (phone) => {
  if (!phone) return true; // Phone is optional
  const cleaned = phone.replace(/\s/g, '');
  const regex = /^(07\d{9}|01\d{9}|02\d{9}|08\d{9})$/;
  return regex.test(cleaned);
};

/**
 * Validate password strength
 * Rules: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
 * @param {string} password - Password to validate
 * @returns {object} Validation result
 */
export const validatePassword = (password) => {
  const result = {
    isValid: false,
    errors: []
  };

  if (!password) {
    result.errors.push('Password is required');
    return result;
  }

  if (password.length < 8) {
    result.errors.push('At least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    result.errors.push('One uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    result.errors.push('One lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    result.errors.push('One number');
  }

  result.isValid = result.errors.length === 0;
  return result;
};

/**
 * Validate miles input
 * @param {string|number} miles - Miles to validate
 * @returns {object} Validation result
 */
export const validateMiles = (miles) => {
  const result = {
    isValid: false,
    error: null
  };

  if (miles === '' || miles === null || miles === undefined) {
    result.error = 'Miles is required';
    return result;
  }

  const numMiles = parseFloat(miles);
  if (isNaN(numMiles)) {
    result.error = 'Please enter a valid number';
    return result;
  }

  if (numMiles <= 0) {
    result.error = 'Miles must be greater than 0';
    return result;
  }

  if (numMiles > 1000) {
    result.error = 'Miles seems too high (max 1000)';
    return result;
  }

  result.isValid = true;
  return result;
};

/**
 * Validate location input
 * @param {string} location - Location to validate
 * @returns {object} Validation result
 */
export const validateLocation = (location) => {
  const result = {
    isValid: false,
    error: null
  };

  if (!location || location.trim().length === 0) {
    result.error = 'Location is required';
    return result;
  }

  if (location.trim().length < 2) {
    result.error = 'Location too short';
    return result;
  }

  if (location.trim().length > 255) {
    result.error = 'Location too long (max 255 characters)';
    return result;
  }

  result.isValid = true;
  return result;
};

/**
 * Validate trip date
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {object} Validation result
 */
export const validateTripDate = (date) => {
  const result = {
    isValid: false,
    error: null
  };

  if (!date) {
    result.error = 'Date is required';
    return result;
  }

  const tripDate = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (isNaN(tripDate.getTime())) {
    result.error = 'Invalid date';
    return result;
  }

  if (tripDate > today) {
    result.error = 'Date cannot be in the future';
    return result;
  }

  // Check if date is more than 6 years ago (HMRC requirement)
  const sixYearsAgo = new Date();
  sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);
  if (tripDate < sixYearsAgo) {
    result.error = 'Date is too old (HMRC requires records for 6 years)';
    return result;
  }

  result.isValid = true;
  return result;
};

/**
 * Validate date range for reports
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {object} Validation result
 */
export const validateDateRange = (startDate, endDate) => {
  const result = {
    isValid: false,
    error: null
  };

  if (!startDate) {
    result.error = 'Start date is required';
    return result;
  }

  if (!endDate) {
    result.error = 'End date is required';
    return result;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    result.error = 'Invalid date range';
    return result;
  }

  if (start > end) {
    result.error = 'Start date must be before end date';
    return result;
  }

  // Max 1 year range
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (end - start > oneYear) {
    result.error = 'Date range cannot exceed 1 year';
    return result;
  }

  result.isValid = true;
  return result;
};

/**
 * Validate name input
 * @param {string} name - Name to validate
 * @returns {object} Validation result
 */
export const validateName = (name) => {
  const result = {
    isValid: false,
    error: null
  };

  if (!name || name.trim().length === 0) {
    result.error = 'Name is required';
    return result;
  }

  if (name.trim().length < 2) {
    result.error = 'Name too short';
    return result;
  }

  if (name.trim().length > 100) {
    result.error = 'Name too long';
    return result;
  }

  result.isValid = true;
  return result;
};

/**
 * Get validation error message for a field
 * @param {string} fieldName - Name of the field
 * @param {any} value - Field value
 * @param {object} rules - Validation rules
 * @returns {string|null} Error message or null
 */
export const getFieldError = (fieldName, value, rules = {}) => {
  if (rules.required && (!value || value.toString().trim() === '')) {
    return `${fieldName} is required`;
  }

  if (rules.minLength && value && value.length < rules.minLength) {
    return `${fieldName} must be at least ${rules.minLength} characters`;
  }

  if (rules.maxLength && value && value.length > rules.maxLength) {
    return `${fieldName} must be less than ${rules.maxLength} characters`;
  }

  if (rules.email && value && !isValidEmail(value)) {
    return 'Please enter a valid email address';
  }

  if (rules.postcode && value && !isValidPostcode(value)) {
    return 'Please enter a valid UK postcode';
  }

  return null;
};
