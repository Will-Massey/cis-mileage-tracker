import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import Input from '../common/Input';
import { isValidEmail } from '../../utils/validators';

/**
 * LoginForm Component
 * User login form with validation
 * 
 * @param {function} onSubmit - Form submit handler
 * @param {boolean} isLoading - Loading state
 * @param {string} error - Error message
 */
const LoginForm = ({ onSubmit, isLoading, error }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData.email, formData.password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg" role="alert">
          <p className="font-medium">Login failed</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

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

      {/* Password Field */}
      <div>
        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          error={errors.password}
          required
          disabled={isLoading}
        />
        <div className="mt-2 text-right">
          <Link 
            to="/forgot-password" 
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            Forgot password?
          </Link>
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
        Sign In
      </Button>

      {/* Register Link */}
      <p className="text-center text-gray-600">
        Don't have an account?{' '}
        <Link 
          to="/register" 
          className="text-primary-600 hover:text-primary-500 font-medium"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;
