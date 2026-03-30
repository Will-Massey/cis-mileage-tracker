import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import Input from '../common/Input';
import { isValidEmail, validatePassword, isValidPhone } from '../../utils/validators';

/**
 * RegisterForm Component
 * User registration form with validation
 * 
 * @param {function} onSubmit - Form submit handler
 * @param {boolean} isLoading - Loading state
 * @param {string} error - Error message
 */
const RegisterForm = ({ onSubmit, isLoading, error }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false
  });

  const validate = () => {
    const newErrors = {};

    // First name
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name too short';
    }

    // Last name
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name too short';
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Phone (optional)
    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid UK phone number';
    }

    // Password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors.join(', ');
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Update password strength indicators
    if (name === 'password') {
      setPasswordChecks({
        minLength: value.length >= 8,
        hasUppercase: /[A-Z]/.test(value),
        hasLowercase: /[a-z]/.test(value),
        hasNumber: /[0-9]/.test(value)
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const { confirmPassword, ...registerData } = formData;
      onSubmit(registerData);
    }
  };

  const CheckIcon = ({ checked }) => (
    <svg 
      className={`w-4 h-4 mr-1 ${checked ? 'text-success-500' : 'text-gray-300'}`}
      fill="currentColor" 
      viewBox="0 0 20 20"
    >
      <path 
        fillRule="evenodd" 
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
        clipRule="evenodd" 
      />
    </svg>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Alert */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg" role="alert">
          <p className="font-medium">Registration failed</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="John"
          error={errors.firstName}
          required
          disabled={isLoading}
        />
        <Input
          label="Last Name"
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Smith"
          error={errors.lastName}
          required
          disabled={isLoading}
        />
      </div>

      {/* Email Field */}
      <Input
        label="Email Address"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="your@email.com"
        error={errors.email}
        required
        disabled={isLoading}
      />

      {/* Phone Field */}
      <Input
        label="Phone Number (optional)"
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="07700 900000"
        error={errors.phone}
        disabled={isLoading}
        helperText="For account recovery"
      />

      {/* Password Field */}
      <div>
        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a password"
          error={errors.password}
          required
          disabled={isLoading}
        />
        
        {/* Password Requirements */}
        <div className="mt-2 space-y-1">
          <p className="text-xs text-gray-500 mb-1">Password must have:</p>
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs flex items-center ${passwordChecks.minLength ? 'text-success-600' : 'text-gray-400'}`}>
              <CheckIcon checked={passwordChecks.minLength} />
              8+ characters
            </span>
            <span className={`text-xs flex items-center ${passwordChecks.hasUppercase ? 'text-success-600' : 'text-gray-400'}`}>
              <CheckIcon checked={passwordChecks.hasUppercase} />
              Uppercase
            </span>
            <span className={`text-xs flex items-center ${passwordChecks.hasLowercase ? 'text-success-600' : 'text-gray-400'}`}>
              <CheckIcon checked={passwordChecks.hasLowercase} />
              Lowercase
            </span>
            <span className={`text-xs flex items-center ${passwordChecks.hasNumber ? 'text-success-600' : 'text-gray-400'}`}>
              <CheckIcon checked={passwordChecks.hasNumber} />
              Number
            </span>
          </div>
        </div>
      </div>

      {/* Confirm Password Field */}
      <Input
        label="Confirm Password"
        type="password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        placeholder="Confirm your password"
        error={errors.confirmPassword}
        required
        disabled={isLoading}
      />

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        disabled={isLoading}
      >
        Create Account
      </Button>

      {/* Login Link */}
      <p className="text-center text-gray-600">
        Already have an account?{' '}
        <Link 
          to="/login" 
          className="text-primary-600 hover:text-primary-500 font-medium"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
};

export default RegisterForm;
