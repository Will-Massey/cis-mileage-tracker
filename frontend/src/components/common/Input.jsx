import React, { forwardRef } from 'react';

/**
 * Input Component
 * Reusable input field with label, error, and helper text
 * 
 * @param {string} label - Input label
 * @param {string} type - Input type
 * @param {string} name - Input name
 * @param {string} value - Input value
 * @param {string} placeholder - Placeholder text
 * @param {string} error - Error message
 * @param {string} helperText - Helper text
 * @param {boolean} required - Is required
 * @param {boolean} disabled - Is disabled
 * @param {ReactNode} icon - Optional icon
 * @param {function} onChange - Change handler
 * @param {function} onBlur - Blur handler
 * @param {string} className - Additional classes
 */
const Input = forwardRef(({
  label,
  type = 'text',
  name,
  value,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
  onChange,
  onBlur,
  className = ''
}, ref) => {
  const inputId = name || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  // Base input classes
  const baseInputClasses = 'block w-full rounded-lg border-gray-300 shadow-sm transition-colors duration-200 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed';
  
  // Error state
  const errorClasses = error 
    ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' 
    : '';
  
  // Icon padding
  const iconClasses = Icon ? 'pl-10' : '';
  
  const inputClasses = `
    ${baseInputClasses}
    ${errorClasses}
    ${iconClasses}
    min-h-[48px] px-4 py-3 text-base
    ${className}
  `.trim();
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          type={type}
          name={name}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onChange={onChange}
          onBlur={onBlur}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        />
      </div>
      
      {error && (
        <p 
          id={`${inputId}-error`}
          className="mt-1 text-sm text-danger-600"
          role="alert"
        >
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p 
          id={`${inputId}-helper`}
          className="mt-1 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
