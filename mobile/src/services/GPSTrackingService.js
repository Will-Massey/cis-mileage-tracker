/**
 * GPS Tracking Service
 * Handles background location tracking, trip detection, and local storage
 * Optimized for CIS contractors working on construction sites
 */

import { Geolocation } from '@capacitor/geolocation';
import { BackgroundGeolocation } from '@capacitor-community/background-geolocation';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';
import { SQLiteService } from './SQLiteService';

// Trip detection constants
const SPEED_THRESHOLD_MPH = 5; // Minimum speed to consider as driving
const TRIP_START_DURATION = 30000; // 30 seconds of movement to start trip
const TRIP_END_STATIONARY = 300000; // 5 minutes stationary to end trip
const MIN_TRIP_DISTANCE = 0.5; // Minimum 0.5 miles to save trip
const LOCATION_UPDATE_INTERVAL = 30000; // 30 seconds between updates

class GPSTrackingService {
  constructor() {
    this.isTracking = false;
    this.currentTrip = null;
    this.locationHistory = [];
    this.tripStartTime = null;
    this.lastLocation = null;
    this.stationaryStartTime = null;
    this.listeners = [];
    this.sqlite = new SQLiteService();
  }

  /**
   * Initialize the GPS tracking service
   */
  async initialize() {
    await this.sqlite.initialize();
    await this.loadStoredState();
    this.setupAppStateListeners();
    console.log('GPS Tracking Service initialized');
  }

  /**
   * Request location permissions
   */
  async requestPermissions() {
    try {
      // Request foreground permission
      const foreground = await Geolocation.requestPermissions();
      
      // Request background permission (iOS)
      if (foreground.location === 'granted') {
        const background = await BackgroundGeolocation.requestPermissions();
        return background;
      }
      
      return foreground;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      throw error;
    }
  }

  /**
   * Check if location permissions are granted
   */
  async checkPermissions() {
    const foreground = await Geolocation.checkPermissions();
    const background = await BackgroundGeolocation.checkPermissions();
    
    return {
      foreground: foreground.location,
      background: background.location
    };
  }

  /**
   * Start background GPS tracking
   */
  async startTracking() {
    try {
      const permissions = await this.checkPermissions();
      
      if (permissions.background !== 'granted') {
        await this.requestPermissions();
      }

      // Configure background geolocation
      await BackgroundGeolocation.configure({
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        stationaryRadius: 50,
        distanceFilter: 50,
        interval: LOCATION_UPDATE_INTERVAL,
        fastestInterval: 10000,
        activitiesInterval: 10000,
        startForeground: true,
        startOnBoot: false,
        stopOnTerminate: false,
        stopOnStillActivity: false,
        notificationsEnabled: true,
        notificationTitle: 'Mileage Tracker',
        notificationText: 'Tracking your business trips',
        notificationIcon: 'notification_icon',
        debug: false, // Set to true for debugging
      });

      // Add location listener
      BackgroundGeolocation.addListener('location', (location) => {
        this.handleLocationUpdate(location);
      });

      // Add error listener
      BackgroundGeolocation.addListener('error', (error) => {
        console.error('BackgroundGeolocation error:', error);
        this.notifyListeners('error', error);
      });

      // Start tracking
      await BackgroundGeolocation.start();
      this.isTracking = true;
      
      // Save state
      await Preferences.set({ key: 'gps_tracking_enabled', value: 'true' });
      
      this.notifyListeners('trackingStarted', {});
      console.log('GPS tracking started');
      
      return true;
    } catch (error) {
      console.error('Error starting GPS tracking:', error);
      this.notifyListeners('error', error);
      throw error;
    }
  }

  /**
   * Stop background GPS tracking
   */
  async stopTracking() {
    try {
      await BackgroundGeolocation.stop();
      this.isTracking = false;
      
      // Save state
      await Preferences.set({ key: 'gps_tracking_enabled', value: 'false' });
      
      this.notifyListeners('trackingStopped', {});
      console.log('GPS tracking stopped');
      
      return true;
    } catch (error) {
      console.error('Error stopping GPS tracking:', error);
      throw error;
    }
  }

  /**
   * Handle location updates from background geolocation
   */
  async handleLocationUpdate(location) {
    try {
      const { latitude, longitude, speed, accuracy, time } = location;
      
      // Convert speed from m/s to mph
      const speedMph = speed ? speed * 2.23694 : 0;
      
      const locationData = {
        latitude,
        longitude,
        speed: speedMph,
        accuracy,
        timestamp: new Date(time || Date.now()).toISOString(),
      };

      // Store location
      this.locationHistory.push(locationData);
      this.lastLocation = locationData;

      // Process trip detection
      await this.processTripDetection(locationData);

      // Save to local database
      await this.sqlite.saveLocation(locationData);

      // Notify listeners
      this.notifyListeners('location', locationData);
      
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  }

  /**
   * Process trip detection logic
   */
  async processTripDetection(location) {
    const speed = location.speed || 0;
    const now = Date.now();

    if (speed >= SPEED_THRESHOLD_MPH) {
      // Vehicle is moving
      this.stationaryStartTime = null;

      if (!this.currentTrip) {
        // Potential trip start
        if (!this.tripStartTime) {
          this.tripStartTime = now;
        } else if (now - this.tripStartTime >= TRIP_START_DURATION) {
          // Trip has started (moving for 30+ seconds)
          await this.startTrip(location);
        }
      } else {
        // Trip in progress - add location
        this.currentTrip.locations.push(location);
        this.currentTrip.distance = this.calculateDistance(this.currentTrip.locations);
      }
    } else {
      // Vehicle is stationary or slow
      if (this.currentTrip) {
        if (!this.stationaryStartTime) {
          this.stationaryStartTime = now;
        } else if (now - this.stationaryStartTime >= TRIP_END_STATIONARY) {
          // Trip has ended (stationary for 5+ minutes)
          await this.endTrip();
        }
      } else {
        // Reset trip start timer
        this.tripStartTime = null;
      }
    }
  }

  /**
   * Start a new trip
   */
  async startTrip(location) {
    this.currentTrip = {
      id: this.generateId(),
      startTime: new Date().toISOString(),
      startLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: null, // Will be reverse geocoded later
      },
      locations: [location],
      distance: 0,
      purpose: null,
      vehicleId: await this.getDefaultVehicle(),
    };

    this.notifyListeners('tripStarted', this.currentTrip);
    console.log('Trip started:', this.currentTrip.id);
  }

  /**
   * End the current trip
   */
  async endTrip() {
    if (!this.currentTrip) return;

    const lastLocation = this.currentTrip.locations[this.currentTrip.locations.length - 1];
    
    this.currentTrip.endTime = new Date().toISOString();
    this.currentTrip.endLocation = {
      latitude: lastLocation.latitude,
      longitude: lastLocation.longitude,
      address: null,
    };
    this.currentTrip.duration = new Date(this.currentTrip.endTime) - new Date(this.currentTrip.startTime);

    // Only save if meets minimum distance
    if (this.currentTrip.distance >= MIN_TRIP_DISTANCE) {
      // Calculate HMRC-compliant amount
      const calculation = await this.calculateTripAmount(this.currentTrip.distance);
      this.currentTrip.amount = calculation.amount;
      this.currentTrip.rateApplied = calculation.rateApplied;
      this.currentTrip.taxYear = calculation.taxYear;

      // Save to local database
      await this.sqlite.saveTrip(this.currentTrip);

      // Try to sync immediately if online
      this.syncTrip(this.currentTrip);

      this.notifyListeners('tripEnded', this.currentTrip);
      console.log('Trip ended:', this.currentTrip.id, 'Distance:', this.currentTrip.distance.toFixed(2), 'miles');
    } else {
      this.notifyListeners('tripDiscarded', { reason: 'Too short', distance: this.currentTrip.distance });
      console.log('Trip discarded - too short:', this.currentTrip.distance.toFixed(2), 'miles');
    }

    // Reset trip state
    this.currentTrip = null;
    this.tripStartTime = null;
    this.stationaryStartTime = null;
  }

  /**
   * Calculate distance from array of locations
   */
  calculateDistance(locations) {
    if (locations.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < locations.length; i++) {
      totalDistance += this.haversineDistance(locations[i - 1], locations[i]);
    }
    return totalDistance;
  }

  /**
   * Calculate haversine distance between two points
   */
  haversineDistance(point1, point2) {
    const R = 3959; // Earth's radius in miles
    const lat1 = this.toRadians(point1.latitude);
    const lat2 = this.toRadians(point2.latitude);
    const deltaLat = this.toRadians(point2.latitude - point1.latitude);
    const deltaLon = this.toRadians(point2.longitude - point1.longitude);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate HMRC-compliant trip amount
   */
  async calculateTripAmount(distance) {
    // Get user's YTD miles from local storage or API
    const ytdMiles = await this.getYtdMiles();
    const taxYear = this.getCurrentTaxYear();

    // HMRC rates
    const threshold = 10000;
    const remainingThreshold = Math.max(0, threshold - ytdMiles);

    let at45p = 0;
    let at25p = 0;
    let amount = 0;

    if (remainingThreshold > 0) {
      at45p = Math.min(distance, remainingThreshold);
      at25p = Math.max(0, distance - remainingThreshold);
      amount = (at45p * 0.45) + (at25p * 0.25);
    } else {
      at25p = distance;
      amount = distance * 0.25;
    }

    return {
      amount: Math.round(amount * 100) / 100,
      rateApplied: remainingThreshold > 0 ? 0.45 : 0.25,
      taxYear,
    };
  }

  /**
   * Get year-to-date miles from local storage
   */
  async getYtdMiles() {
    try {
      const { value } = await Preferences.get({ key: 'ytd_miles' });
      return parseFloat(value || '0');
    } catch {
      return 0;
    }
  }

  /**
   * Get current tax year
   */
  getCurrentTaxYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    if (month < 3 || (month === 3 && now.getDate() < 6)) {
      return `${year - 1}-${year.toString().slice(-2)}`;
    }
    return `${year}-${(year + 1).toString().slice(-2)}`;
  }

  /**
   * Get default vehicle
   */
  async getDefaultVehicle() {
    try {
      const { value } = await Preferences.get({ key: 'default_vehicle' });
      return value;
    } catch {
      return null;
    }
  }

  /**
   * Sync a trip to the cloud API
   */
  async syncTrip(trip) {
    try {
      // Check if online
      const isOnline = navigator.onLine;
      if (!isOnline) {
        // Mark for later sync
        await this.sqlite.markTripForSync(trip.id);
        return;
      }

      // Get auth token
      const { value: token } = await Preferences.get({ key: 'auth_token' });
      if (!token) {
        await this.sqlite.markTripForSync(trip.id);
        return;
      }

      // Send to API
      const response = await fetch(`${process.env.REACT_APP_API_URL}/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(trip),
      });

      if (response.ok) {
        await this.sqlite.markTripSynced(trip.id);
        this.notifyListeners('tripSynced', { tripId: trip.id });
      } else {
        await this.sqlite.markTripForSync(trip.id);
      }
    } catch (error) {
      console.error('Error syncing trip:', error);
      await this.sqlite.markTripForSync(trip.id);
    }
  }

  /**
   * Sync all pending trips
   */
  async syncPendingTrips() {
    try {
      const pendingTrips = await this.sqlite.getPendingTrips();
      
      for (const trip of pendingTrips) {
        await this.syncTrip(trip);
      }
      
      console.log(`Synced ${pendingTrips.length} pending trips`);
      return pendingTrips.length;
    } catch (error) {
      console.error('Error syncing pending trips:', error);
      return 0;
    }
  }

  /**
   * Load stored state from preferences
   */
  async loadStoredState() {
    try {
      const { value: trackingEnabled } = await Preferences.get({ key: 'gps_tracking_enabled' });
      if (trackingEnabled === 'true') {
        // Resume tracking if it was enabled
        await this.startTracking();
      }
    } catch (error) {
      console.error('Error loading stored state:', error);
    }
  }

  /**
   * Setup app state listeners
   */
  setupAppStateListeners() {
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // App came to foreground - sync pending trips
        this.syncPendingTrips();
      }
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.syncPendingTrips();
    });
  }

  /**
   * Subscribe to GPS events
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners of an event
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
   * Get current tracking status
   */
  getStatus() {
    return {
      isTracking: this.isTracking,
      currentTrip: this.currentTrip,
      lastLocation: this.lastLocation,
    };
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const gpsTrackingService = new GPSTrackingService();
export default GPSTrackingService;
