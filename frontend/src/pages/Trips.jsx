import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrips } from '../hooks/useTrips';
import TripList from '../components/trips/TripList';
import TripSummary from '../components/trips/TripSummary';
import Loading from '../components/common/Loading';

/**
 * Trips Page
 * Full trip list with filtering
 */
const Trips = () => {
  const navigate = useNavigate();
  const { 
    trips, 
    pagination, 
    summary,
    isLoading, 
    fetchTrips, 
    deleteTrip,
    updateParams 
  } = useTrips({ limit: 20, sortBy: 'tripDate', sortOrder: 'desc' });

  const [monthlyStats, setMonthlyStats] = useState(null);

  useEffect(() => {
    // Load initial trips
    fetchTrips();
  }, [fetchTrips]);

  const handleEdit = (trip) => {
    navigate(`/trips/edit/${trip.id}`);
  };

  const handleDelete = async (tripId) => {
    await deleteTrip(tripId);
  };

  const handleLoadMore = () => {
    if (pagination?.hasNext) {
      updateParams({ page: (pagination.page || 1) + 1 });
    }
  };

  const handleFilter = (filters) => {
    const params = {};
    
    if (filters.month) {
      const [year, month] = filters.month.split('-');
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${month}-${lastDay}`;
      params.startDate = startDate;
      params.endDate = endDate;
    }
    
    if (filters.category) {
      params.purpose = filters.category;
    }
    
    updateParams({ ...params, page: 1 });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">My Trips</h1>
            <button
              onClick={() => navigate('/add-trip')}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Trip
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary */}
        {summary && (
          <TripSummary.Extended 
            stats={summary} 
            isLoading={isLoading && trips.length === 0} 
          />
        )}

        {/* Trip List */}
        <TripList
          trips={trips}
          isLoading={isLoading}
          pagination={pagination}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onLoadMore={handleLoadMore}
          onFilter={handleFilter}
        />
      </div>
    </div>
  );
};

export default Trips;
