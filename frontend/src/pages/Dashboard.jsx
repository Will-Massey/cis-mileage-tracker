import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTrips } from '../hooks/useTrips';
import TripSummary from '../components/trips/TripSummary';
import TripCard from '../components/trips/TripCard';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

/**
 * Dashboard Page
 * Main dashboard with summary and recent trips
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    getCurrentMonthSummary, 
    getRecentTrips, 
    deleteTrip,
    isLoading 
  } = useTrips();
  
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [statsData, tripsData] = await Promise.all([
          getCurrentMonthSummary(),
          getRecentTrips(5)
        ]);
        setMonthlyStats(statsData);
        setRecentTrips(tripsData?.trips || []);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [getCurrentMonthSummary, getRecentTrips]);

  const handleDeleteTrip = async (tripId) => {
    try {
      await deleteTrip(tripId);
      setRecentTrips(prev => prev.filter(t => t.id !== tripId));
      // Refresh stats
      const stats = await getCurrentMonthSummary();
      setMonthlyStats(stats);
    } catch (error) {
      console.error('Error deleting trip:', error);
    }
  };

  const handleEditTrip = (trip) => {
    navigate(`/trips/edit/${trip.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Welcome Section */}
      <div className="bg-primary-600 text-white py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">
            Hello, {user?.firstName || 'there'}!
          </h1>
          <p className="text-primary-100 mt-1">
            Track your business mileage and generate reports
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <TripSummary 
          stats={monthlyStats} 
          isLoading={isLoadingData} 
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/add-trip"
            className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="font-medium text-gray-900">Add Trip</span>
          </Link>
          
          <Link
            to="/reports"
            className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-medium text-gray-900">Reports</span>
          </Link>
        </div>

        {/* Recent Trips */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Trips</h2>
            <Link 
              to="/trips" 
              className="text-sm text-primary-600 hover:text-primary-500 font-medium"
            >
              View All
            </Link>
          </div>

          {isLoadingData ? (
            <Loading.List items={3} />
          ) : recentTrips.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 7m0 13V7m0 0L9.553 4.553A1 1 0 009 4.118v.004" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trips yet</h3>
              <p className="text-gray-600 mb-4">Start tracking your business mileage</p>
              <Button
                variant="primary"
                onClick={() => navigate('/add-trip')}
              >
                Add Your First Trip
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTrips.map(trip => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onEdit={handleEditTrip}
                  onDelete={handleDeleteTrip}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tax Year Info */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-medium text-blue-900">HMRC Mileage Rates</h3>
              <p className="text-sm text-blue-700 mt-1">
                45p per mile for the first 10,000 miles, then 25p per mile.
                Keep records for 6 years.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
