import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import Input from '../common/Input';
import { isValidEmail, validatePassword } from '../../utils/validators';

/**
 * ForgotPasswordForm Component
 * Request password reset email
 * 
 * @param {function} onSubmit - Form submit handler
 * @param {boolean} isLoading - Loading state
 * @param {boolean} isSuccess - Success state
 * @param {string} error - Error message
 */
export const ForgotPasswordForm = ({ onSubmit, isLoading, isSuccess, error }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email');
      return;
    }
    
    setEmailError('');
    onSubmit(email);
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Check your email</h3>
        <p className="text-gray-600">
          If an account exists with <strong>{email}</strong>, we've sent password reset instructions.
        </p>
        <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg" role="alert">
          <p className="font-medium">Request failed</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <p className="text-gray-600">
        Enter your email address and we'll send you instructions to reset your password.
      </p>

      <Input
        label="Email Address"
        type="email"
        name="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setEmailError('');
        }}
        placeholder="your@email.com"
        error={emailError}
        required
        disabled={isLoading}
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        disabled={isLoading}
      >
        Send Reset Link
      </Button>

      <p className="text-center">
        <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
          Back to login
        </Link>
      </p>
    </form>
  );
};

/**
 * ResetPasswordForm Component
 * Reset password with token
 * 
 * @param {function} onSubmit - Form submit handler
 * @param {boolean} isLoading - Loading state
 * @param {boolean} isSuccess - Success state
 * @param {string} error - Error message
 */
export const ResetPasswordForm = ({ onSubmit, isLoading, isSuccess, error }) => {
  const [formData, setFormData] = useState({
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

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors.join(', ');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      onSubmit(formData.password);
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

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Password reset successful</h3>
        <p className="text-gray-600">
          Your password has been reset. You can now log in with your new password.
        </p>
        <Link 
          to="/login" 
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg" role="alert">
          <p className="font-medium">Reset failed</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <p className="text-gray-600">
        Enter your new password below.
      </p>

      <div>
        <Input
          label="New Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a new password"
          error={errors.password}
          required
          disabled={isLoading}
        />
        
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

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        disabled={isLoading}
      >
        Reset Password
      </Button>
    </form>
  );
};

export default { ForgotPasswordForm, ResetPasswordForm };
