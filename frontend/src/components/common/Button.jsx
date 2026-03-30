import React from 'react';

/**
 * Button Component
 * Reusable button with variants and sizes
 * 
 * @param {string} variant - Button variant (primary, secondary, success, danger, ghost)
 * @param {string} size - Button size (sm, md, lg)
 * @param {boolean} isLoading - Show loading state
 * @param {boolean} disabled - Disable button
 * @param {boolean} fullWidth - Full width button
 * @param {ReactNode} children - Button content
 * @param {ReactNode} icon - Optional icon
 * @param {string} type - Button type
 * @param {function} onClick - Click handler
 * @param {string} className - Additional classes
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  children,
  icon: Icon,
  type = 'button',
  onClick,
  className = ''
}) => {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Size classes - mobile-first with large touch targets
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[40px]',
    md: 'px-4 py-3 text-base min-h-[48px]',
    lg: 'px-6 py-4 text-lg min-h-[56px]'
  };
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 active:bg-primary-800 shadow-sm',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-primary-500 active:bg-gray-100 shadow-sm',
    success: 'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500 active:bg-success-700 shadow-sm',
    danger: 'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500 active:bg-danger-700 shadow-sm',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200',
    outline: 'bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500 active:bg-primary-100'
  };
  
  // Loading spinner
  const LoadingSpinner = () => (
    <svg 
      className="animate-spin -ml-1 mr-2 h-5 w-5" 
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
  
  const classes = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={classes}
    >
      {isLoading && <LoadingSpinner />}
      {!isLoading && Icon && (
        <span className="mr-2">
          <Icon className="w-5 h-5" />
        </span>
      )}
      {children}
    </button>
  );
};

export default Button;
