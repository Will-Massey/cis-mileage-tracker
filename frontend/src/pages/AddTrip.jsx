import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTrips } from '../hooks/useTrips';
import TripForm from '../components/trips/TripForm';
import Loading from '../components/common/Loading';

/**
 * AddTrip Page
 * Page for adding or editing a trip
 */
const AddTrip = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const { createTrip, fetchTrip, updateTrip, isLoading } = useTrips();
  const [tripData, setTripData] = useState(null);
  const [isLoadingTrip, setIsLoadingTrip] = useState(isEditing);
  const [error, setError] = useState(null);

  // Load trip data if editing
  useEffect(() => {
    if (isEditing && id) {
      const loadTrip = async () => {
        setIsLoadingTrip(true);
        try {
          const data = await fetchTrip(id);
          setTripData(data);
        } catch (err) {
          setError('Failed to load trip');
        } finally {
          setIsLoadingTrip(false);
        }
      };
      loadTrip();
    }
  }, [isEditing, id, fetchTrip]);

  const handleSubmit = async (formData) => {
    setError(null);
    
    try {
      if (isEditing) {
        await updateTrip(id, formData);
      } else {
        await createTrip(formData);
      }
      navigate('/trips');
    } catch (err) {
      setError(err.message || 'Failed to save trip');
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (isLoadingTrip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading text="Loading trip..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={handleCancel}
              className="mr-4 p-2 -ml-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {isEditing ? 'Edit Trip' : 'Add New Trip'}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="max-w-lg mx-auto">
          {/* Info Box */}
          <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-blue-900">HMRC Requirements</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Record the date, start/end locations, purpose, and miles for each business journey.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <TripForm
              initialData={tripData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTrip;
