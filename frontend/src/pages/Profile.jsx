import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTrips } from '../hooks/useTrips';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Loading from '../components/common/Loading';
import { formatCurrency, formatMiles } from '../utils/formatters';

/**
 * Profile Page
 * User profile and settings
 */
const Profile = () => {
  const { user, updateProfile, changePassword, logout, isLoading: authLoading } = useAuth();
  const { getYearToDateSummary } = useTrips();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [ytdStats, setYtdStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || ''
  });
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Load YTD stats
  React.useEffect(() => {
    const loadStats = async () => {
      setIsLoadingStats(true);
      try {
        const stats = await getYearToDateSummary();
        setYtdStats(stats);
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setIsLoadingStats(false);
      }
    };
    loadStats();
  }, [getYearToDateSummary]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
    setProfileError(null);
    setProfileSuccess(false);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    setPasswordError(null);
    setPasswordSuccess(false);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    try {
      await updateProfile(profileForm);
      setProfileSuccess(true);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Year to Date Stats */}
        <Card title="Year to Date" className="p-4">
          {isLoadingStats ? (
            <Loading size="sm" />
          ) : ytdStats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {formatMiles(ytdStats.totalMiles)}
                </p>
                <p className="text-xs text-gray-500">Total Miles</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-success-600">
                  {formatCurrency(ytdStats.totalAmount)}
                </p>
                <p className="text-xs text-gray-500">Total Claim</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No data available</p>
          )}
        </Card>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {['profile', 'password'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'profile' ? 'Profile' : 'Password'}
            </button>
          ))}
        </div>

        {/* Profile Form */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Profile
            </h3>

            {profileSuccess && (
              <div className="mb-4 bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg">
                Profile updated successfully
              </div>
            )}

            {profileError && (
              <div className="mb-4 bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={handleProfileChange}
                  required
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={profileForm.lastName}
                  onChange={handleProfileChange}
                  required
                />
              </div>
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={profileForm.phone}
                onChange={handleProfileChange}
                placeholder="07700 900000"
              />
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={authLoading}
              >
                Save Changes
              </Button>
            </form>
          </div>
        )}

        {/* Password Form */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Change Password
            </h3>

            {passwordSuccess && (
              <div className="mb-4 bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg">
                Password changed successfully
              </div>
            )}

            {passwordError && (
              <div className="mb-4 bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
              />
              <Input
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
              />
              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={authLoading}
              >
                Change Password
              </Button>
            </form>
          </div>
        )}

        {/* Logout Button */}
        <Button
          variant="ghost"
          fullWidth
          onClick={handleLogout}
          className="text-danger-600 hover:bg-danger-50"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Profile;
