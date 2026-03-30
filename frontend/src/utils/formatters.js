import { format, parseISO, isValid } from 'date-fns';

/**
 * Format a date to UK format (DD/MM/YYYY)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return '-';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '-';
  return format(parsed, 'dd/MM/yyyy');
};

/**
 * Format a date to short UK format (DD MMM)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDateShort = (date) => {
  if (!date) return '-';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '-';
  return format(parsed, 'dd MMM');
};

/**
 * Format currency to GBP
 * @param {number} amount - Amount in pounds
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '£0.00';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format miles with proper pluralization
 * @param {number} miles - Number of miles
 * @returns {string} Formatted miles
 */
export const formatMiles = (miles) => {
  if (miles === null || miles === undefined || isNaN(miles)) return '0 miles';
  const formatted = parseFloat(miles).toFixed(1);
  const num = parseFloat(formatted);
  return `${formatted} ${num === 1 ? 'mile' : 'miles'}`;
};

/**
 * Format miles without decimal for whole numbers
 * @param {number} miles - Number of miles
 * @returns {string} Formatted miles
 */
export const formatMilesCompact = (miles) => {
  if (miles === null || miles === undefined || isNaN(miles)) return '0';
  const num = parseFloat(miles);
  return Number.isInteger(num) ? num.toString() : num.toFixed(1);
};

/**
 * Format a number with thousand separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-GB').format(num);
};

/**
 * Format phone number to UK format
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('07') && cleaned.length === 11) {
    return cleaned.replace(/(\d{5})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return cleaned.replace(/(\d{5})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  return phone;
};

/**
 * Format postcode to UK format (uppercase with space)
 * @param {string} postcode - Postcode
 * @returns {string} Formatted postcode
 */
export const formatPostcode = (postcode) => {
  if (!postcode) return '';
  const cleaned = postcode.toUpperCase().replace(/\s/g, '');
  const match = cleaned.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)(\d[A-Z]{2})$/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }
  return postcode.toUpperCase();
};

/**
 * Get month name from date
 * @param {string|Date} date - Date
 * @returns {string} Month name
 */
export const getMonthName = (date) => {
  if (!date) return '';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '';
  return format(parsed, 'MMMM yyyy');
};

/**
 * Get relative time (today, yesterday, or date)
 * @param {string|Date} date - Date
 * @returns {string} Relative time
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '';
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (format(parsed, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
    return 'Today';
  }
  if (format(parsed, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
    return 'Yesterday';
  }
  return formatDate(parsed);
};

/**
 * Format duration in minutes to hours and minutes
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes < 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
};
