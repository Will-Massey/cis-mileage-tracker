/**
 * Site Manager Component
 * Manage construction sites with 24-month rule monitoring
 */

import React, { useState, useEffect } from 'react';
import { siteManagementService } from '../services/SiteManagementService';
import { Geolocation } from '@capacitor/geolocation';

const SiteManager = ({ onSiteSelect }) => {
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [newSite, setNewSite] = useState({
    name: '',
    address: '',
    postcode: ''
  });

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    setIsLoading(true);
    try {
      await siteManagementService.initialize();
      const sitesWithStatus = await siteManagementService.getSitesWithStatus();
      setSites(sitesWithStatus);
    } catch (error) {
      console.error('Error loading sites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSite = async () => {
    try {
      // Get current location for coordinates
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true
      });

      const site = await siteManagementService.addSite({
        ...newSite,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });

      setSites([...sites, { ...site, ruleStatus: siteManagementService.check24MonthRule(site) }]);
      setNewSite({ name: '', address: '', postcode: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding site:', error);
      alert('Error adding site. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ok': return 'bg-green-500';
      case 'warning': return 'bg-amber-500';
      case 'urgent': return 'bg-orange-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
      case 'urgent':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'expired':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Construction Sites</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Site
        </button>
      </div>

      {/* Add Site Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-lg p-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Add New Site</h3>
          <input
            type="text"
            placeholder="Site name (e.g., Smith Residence)"
            value={newSite.name}
            onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Address"
            value={newSite.address}
            onChange={(e) => setNewSite({ ...newSite, address: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Postcode"
            value={newSite.postcode}
            onChange={(e) => setNewSite({ ...newSite, postcode: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSite}
              disabled={!newSite.name || !newSite.address}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300"
            >
              Save Site
            </button>
          </div>
        </div>
      )}

      {/* Sites List */}
      {sites.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">No sites saved yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first construction site</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sites.map(site => (
            <div
              key={site.id}
              onClick={() => {
                setSelectedSite(selectedSite?.id === site.id ? null : site);
                onSiteSelect?.(site);
              }}
              className={`
                bg-white rounded-2xl p-5 shadow-sm border-2 cursor-pointer transition-all
                ${selectedSite?.id === site.id ? 'border-blue-500 shadow-md' : 'border-transparent'}
              `}
            >
              <div className="flex items-start gap-4">
                {/* Status Indicator */}
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0
                  ${getStatusColor(site.ruleStatus.status)}
                `}>
                  {getStatusIcon(site.ruleStatus.status)}
                </div>

                {/* Site Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{site.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{site.address}</p>
                  
                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`
                      inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${site.ruleStatus.status === 'ok' ? 'bg-green-100 text-green-800' : ''}
                      ${site.ruleStatus.status === 'warning' ? 'bg-amber-100 text-amber-800' : ''}
                      ${site.ruleStatus.status === 'urgent' ? 'bg-orange-100 text-orange-800' : ''}
                      ${site.ruleStatus.status === 'expired' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {site.ruleStatus.status === 'ok' && '✓ Temporary Workplace'}
                      {site.ruleStatus.status === 'warning' && `⚠ ${site.ruleStatus.monthsUntilExpiry} months left`}
                      {site.ruleStatus.status === 'urgent' && '🚨 Expires soon!'}
                      {site.ruleStatus.status === 'expired' && '✗ Permanent Workplace'}
                    </span>
                  </div>

                  {/* Details (when selected) */}
                  {selectedSite?.id === site.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">First Visit</p>
                          <p className="font-medium">{formatDate(site.firstVisitDate)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Last Visit</p>
                          <p className="font-medium">{formatDate(site.lastVisitDate)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Visits</p>
                          <p className="font-medium">{site.visitCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Days Active</p>
                          <p className="font-medium">{site.ruleStatus.daysSinceFirstVisit}</p>
                        </div>
                      </div>

                      {site.ruleStatus.message && (
                        <div className={`
                          p-3 rounded-xl text-sm
                          ${site.ruleStatus.status === 'ok' ? 'bg-green-50 text-green-800 border border-green-200' : ''}
                          ${site.ruleStatus.status === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' : ''}
                          ${site.ruleStatus.status === 'urgent' ? 'bg-orange-50 text-orange-800 border border-orange-200' : ''}
                          ${site.ruleStatus.status === 'expired' ? 'bg-red-50 text-red-800 border border-red-200' : ''}
                        `}>
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>{site.ruleStatus.message}</p>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to site trips
                        }}
                        className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors"
                      >
                        View Trips to This Site
                      </button>
                    </div>
                  )}
                </div>

                {/* Expand Icon */}
                <svg 
                  className={`
                    w-5 h-5 text-gray-400 flex-shrink-0 transition-transform
                    ${selectedSite?.id === site.id ? 'rotate-180' : ''}
                  `} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 24-Month Rule Info */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">24-Month Rule</p>
            <p className="mt-1">
              HMRC considers a site "temporary" if you work there less than 24 months. 
              After 24 months, it becomes a permanent workplace and you can no longer claim 
              home-to-site travel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteManager;
