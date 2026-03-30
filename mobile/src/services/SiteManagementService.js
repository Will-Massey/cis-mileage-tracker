/**
 * Site Management Service
 * Handles construction site addresses, geofencing, and 24-month rule monitoring
 */

import { Geolocation } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';
import { SQLiteService } from './SQLiteService';

// Constants
const GEOFENCE_RADIUS_METERS = 100; // 100m radius for site detection
const TWENTY_FOUR_MONTHS_MS = 24 * 30 * 24 * 60 * 60 * 1000; // Approximate 24 months
const WARNING_18_MONTHS_MS = 18 * 30 * 24 * 60 * 60 * 1000; // Warning at 18 months

class SiteManagementService {
  constructor() {
    this.sqlite = new SQLiteService();
    this.sites = [];
    this.currentSite = null;
    this.listeners = [];
  }

  /**
   * Initialize the service
   */
  async initialize() {
    await this.sqlite.initialize();
    await this.loadSites();
    this.startGeofenceMonitoring();
  }

  /**
   * Load sites from database
   */
  async loadSites() {
    try {
      const userId = await this.getCurrentUserId();
      this.sites = await this.sqlite.getSites(userId);
      return this.sites;
    } catch (error) {
      console.error('Error loading sites:', error);
      return [];
    }
  }

  /**
   * Add a new construction site
   */
  async addSite(siteData) {
    try {
      const userId = await this.getCurrentUserId();
      
      const site = {
        id: `site_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        name: siteData.name,
        address: siteData.address,
        postcode: siteData.postcode,
        latitude: siteData.latitude,
        longitude: siteData.longitude,
        radius: siteData.radius || GEOFENCE_RADIUS_METERS,
        firstVisitDate: new Date().toISOString(),
        lastVisitDate: new Date().toISOString(),
        visitCount: 0,
        isActive: true
      };

      // Geocode address if coordinates not provided
      if (!site.latitude || !site.longitude) {
        const coords = await this.geocodeAddress(site.address, site.postcode);
        if (coords) {
          site.latitude = coords.latitude;
          site.longitude = coords.longitude;
        }
      }

      await this.sqlite.saveSite(site);
      this.sites.push(site);
      
      this.notifyListeners('siteAdded', site);
      return site;
    } catch (error) {
      console.error('Error adding site:', error);
      throw error;
    }
  }

  /**
   * Geocode address to coordinates
   */
  async geocodeAddress(address, postcode) {
    try {
      // Use OpenStreetMap Nominatim (free, no API key required)
      const query = postcode ? `${address}, ${postcode}, UK` : `${address}, UK`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Check if a location is within a site's geofence
   */
  isInGeofence(location, site) {
    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      site.latitude,
      site.longitude
    );
    return distance <= (site.radius || GEOFENCE_RADIUS_METERS);
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = this.toRadians(lat1);
    const φ2 = this.toRadians(lat2);
    const Δφ = this.toRadians(lat2 - lat1);
    const Δλ = this.toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Monitor geofences and detect site entry/exit
   */
  async startGeofenceMonitoring() {
    // This would be called periodically (e.g., every minute)
    // For now, we'll check when location updates come in
  }

  /**
   * Check current location against all sites
   */
  async checkLocationAgainstSites(location) {
    for (const site of this.sites) {
      const isInSite = this.isInGeofence(location, site);
      const wasInSite = this.currentSite?.id === site.id;

      if (isInSite && !wasInSite) {
        // Entered site
        await this.handleSiteEntry(site);
      } else if (!isInSite && wasInSite) {
        // Exited site
        await this.handleSiteExit(site);
      }
    }
  }

  /**
   * Handle site entry
   */
  async handleSiteEntry(site) {
    this.currentSite = site;
    await this.sqlite.updateSiteVisit(site.id);
    
    // Check 24-month rule
    const ruleStatus = this.check24MonthRule(site);
    
    this.notifyListeners('siteEntered', {
      site,
      ruleStatus,
      canClaimMileage: ruleStatus.canClaim
    });

    // If approaching 24-month limit, show warning
    if (ruleStatus.status === 'warning' || ruleStatus.status === 'urgent') {
      this.notifyListeners('24MonthWarning', ruleStatus);
    }
  }

  /**
   * Handle site exit
   */
  async handleSiteExit(site) {
    this.currentSite = null;
    this.notifyListeners('siteExited', { site });
  }

  /**
   * Check 24-month rule for a site
   * HMRC: Site is temporary if working < 24 months OR < 40% of time
   */
  check24MonthRule(site) {
    const firstVisit = new Date(site.firstVisitDate);
    const now = new Date();
    const daysSinceFirstVisit = Math.floor((now - firstVisit) / (1000 * 60 * 60 * 24));
    const monthsSinceFirstVisit = daysSinceFirstVisit / 30;

    // Calculate status
    let status = 'ok';
    let message = '';
    let canClaim = true;

    if (monthsSinceFirstVisit >= 24) {
      status = 'expired';
      message = `Site "${site.name}" has become a permanent workplace. Home-to-site travel is no longer claimable.`;
      canClaim = false;
    } else if (monthsSinceFirstVisit >= 23) {
      status = 'urgent';
      message = `URGENT: Site "${site.name}" reaches 24-month limit in ${Math.ceil(24 - monthsSinceFirstVisit)} months.`;
    } else if (monthsSinceFirstVisit >= 18) {
      status = 'warning';
      const monthsRemaining = Math.floor(24 - monthsSinceFirstVisit);
      message = `WARNING: Site "${site.name}" has ${monthsRemaining} months remaining as temporary workplace.`;
    }

    return {
      siteId: site.id,
      siteName: site.name,
      firstVisitDate: site.firstVisitDate,
      daysSinceFirstVisit,
      monthsSinceFirstVisit: Math.floor(monthsSinceFirstVisit),
      status, // ok, warning, urgent, expired
      message,
      canClaim,
      expiresAt: new Date(firstVisit.getTime() + TWENTY_FOUR_MONTHS_MS).toISOString()
    };
  }

  /**
   * Get all sites with their 24-month rule status
   */
  async getSitesWithStatus() {
    const sites = await this.loadSites();
    return sites.map(site => ({
      ...site,
      ruleStatus: this.check24MonthRule(site)
    }));
  }

  /**
   * Get sites with warnings
   */
  async getSitesWithWarnings() {
    const sitesWithStatus = await this.getSitesWithStatus();
    return sitesWithStatus.filter(site => 
      site.ruleStatus.status === 'warning' || site.ruleStatus.status === 'urgent'
    );
  }

  /**
   * Auto-suggest site based on location
   */
  async suggestSiteForLocation(location) {
    let closestSite = null;
    let closestDistance = Infinity;

    for (const site of this.sites) {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        site.latitude,
        site.longitude
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestSite = site;
      }
    }

    // Only suggest if within 500m
    if (closestSite && closestDistance <= 500) {
      return {
        site: closestSite,
        distance: Math.round(closestDistance),
        isAtSite: closestDistance <= GEOFENCE_RADIUS_METERS
      };
    }

    return null;
  }

  /**
   * Update site details
   */
  async updateSite(siteId, updates) {
    try {
      const site = this.sites.find(s => s.id === siteId);
      if (!site) throw new Error('Site not found');

      const updatedSite = { ...site, ...updates };
      await this.sqlite.saveSite(updatedSite);
      
      // Update local cache
      const index = this.sites.findIndex(s => s.id === siteId);
      this.sites[index] = updatedSite;

      return updatedSite;
    } catch (error) {
      console.error('Error updating site:', error);
      throw error;
    }
  }

  /**
   * Delete a site
   */
  async deleteSite(siteId) {
    try {
      await this.sqlite.db.run(
        'UPDATE sites SET is_active = 0 WHERE id = ?',
        [siteId]
      );
      
      this.sites = this.sites.filter(s => s.id !== siteId);
      this.notifyListeners('siteDeleted', { siteId });
      
      return true;
    } catch (error) {
      console.error('Error deleting site:', error);
      throw error;
    }
  }

  /**
   * Get current user ID
   */
  async getCurrentUserId() {
    try {
      const { value } = await Preferences.get({ key: 'user_id' });
      return value || 'local_user';
    } catch {
      return 'local_user';
    }
  }

  /**
   * Subscribe to events
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in listener:', error);
      }
    });
  }

  /**
   * Get site visit statistics
   */
  async getSiteStats(siteId) {
    try {
      const site = await this.sqlite.getSite(siteId);
      if (!site) return null;

      // Get trips to this site
      const { value: userId } = await Preferences.get({ key: 'user_id' });
      const trips = await this.sqlite.getTrips(userId, {
        startDate: site.firstVisitDate
      });

      // Filter trips that end at this site
      const siteTrips = trips.filter(trip => {
        const distance = this.calculateDistance(
          trip.end_lat,
          trip.end_lng,
          site.latitude,
          site.longitude
        );
        return distance <= GEOFENCE_RADIUS_METERS;
      });

      const totalMiles = siteTrips.reduce((sum, t) => sum + (t.distance || 0), 0);
      const totalClaim = siteTrips.reduce((sum, t) => sum + (t.amount || 0), 0);

      return {
        site,
        visitCount: site.visitCount,
        tripCount: siteTrips.length,
        totalMiles: Math.round(totalMiles * 100) / 100,
        totalClaim: Math.round(totalClaim * 100) / 100,
        firstVisit: site.firstVisitDate,
        lastVisit: site.lastVisitDate,
        ruleStatus: this.check24MonthRule(site)
      };
    } catch (error) {
      console.error('Error getting site stats:', error);
      return null;
    }
  }
}

// Export singleton
export const siteManagementService = new SiteManagementService();
export default SiteManagementService;
