/**
 * GPS Tracking Service
 * Handles location tracking, trip detection, and local storage
 * Optimized for CIS contractors working on construction sites
 */

import { Geolocation } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';

// Trip detection constants
const SPEED_THRESHOLD_MPH = 5;
const TRIP_START_DURATION = 30000;
const TRIP_END_STATIONARY = 300000;
const MIN_TRIP_DISTANCE = 0.5;
const LOCATION_UPDATE_INTERVAL = 30000;

class GPSTrackingService {
  constructor() {
    this.isTracking = false;
    this.currentTrip = null;
    this.locationHistory = [];
    this.tripStartTime = null;
    this.lastLocation = null;
    this.stationaryStartTime = null;
    this.listeners = [];
    this.watchId = null;
  }

  async initialize() {
    await this.loadStoredState();
    this.setupAppStateListeners();
    console.log('GPS Tracking Service initialized');
  }

  async requestPermissions() {
    try {
      const permissions = await Geolocation.requestPermissions();
      return permissions;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      throw error;
    }
  }

  async checkPermissions() {
    return await Geolocation.checkPermissions();
  }

  async startTracking() {
    try {
      const permissions = await this.checkPermissions();
      
      if (permissions.location !== 'granted') {
        await this.requestPermissions();
      }

      // Start watching position
      this.watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000 },
        (position) => {
          if (position) {
            this.handleLocationUpdate(position);
          }
        }
      );

      this.isTracking = true;
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

  async stopTracking() {
    try {
      if (this.watchId !== null) {
        await Geolocation.clearWatch({ id: this.watchId });
        this.watchId = null;
      }
      
      this.isTracking = false;
      await Preferences.set({ key: 'gps_tracking_enabled', value: 'false' });
      this.notifyListeners('trackingStopped', {});
      console.log('GPS tracking stopped');
      
      return true;
    } catch (error) {
      console.error('Error stopping GPS tracking:', error);
      throw error;
    }
  }

  async handleLocationUpdate(position) {
    try {
      const { latitude, longitude, speed, accuracy } = position.coords;
      
      const speedMph = speed ? speed * 2.23694 : 0;
      
      const locationData = {
        latitude,
        longitude,
        speed: speedMph,
        accuracy,
        timestamp: new Date().toISOString(),
      };

      this.locationHistory.push(locationData);
      this.lastLocation = locationData;

      await this.processTripDetection(locationData);
      this.notifyListeners('location', locationData);
      
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  }

  async processTripDetection(location) {
    const speed = location.speed || 0;
    const now = Date.now();

    if (speed >= SPEED_THRESHOLD_MPH) {
      this.stationaryStartTime = null;

      if (!this.currentTrip) {
        if (!this.tripStartTime) {
          this.tripStartTime = now;
        } else if (now - this.tripStartTime >= TRIP_START_DURATION) {
          await this.startTrip(location);
        }
      } else {
        this.currentTrip.locations.push(location);
        this.currentTrip.distance = this.calculateDistance(this.currentTrip.locations);
        this.notifyListeners('tripUpdated', this.currentTrip);
      }
    } else {
      if (this.currentTrip) {
        if (!this.stationaryStartTime) {
          this.stationaryStartTime = now;
        } else if (now - this.stationaryStartTime >= TRIP_END_STATIONARY) {
          await this.endTrip();
        }
      } else {
        this.tripStartTime = null;
      }
    }
  }

  async startTrip(location) {
    this.currentTrip = {
      id: this.generateId(),
      startTime: new Date().toISOString(),
      startLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      locations: [location],
      distance: 0,
      purpose: 'Business',
    };

    this.notifyListeners('tripStarted', this.currentTrip);
    console.log('Trip started:', this.currentTrip.id);
  }

  async endTrip() {
    if (!this.currentTrip) return;

    const lastLocation = this.currentTrip.locations[this.currentTrip.locations.length - 1];
    
    this.currentTrip.endTime = new Date().toISOString();
    this.currentTrip.endLocation = {
      latitude: lastLocation.latitude,
      longitude: lastLocation.longitude,
    };
    this.currentTrip.duration = new Date(this.currentTrip.endTime) - new Date(this.currentTrip.startTime);

    if (this.currentTrip.distance >= MIN_TRIP_DISTANCE) {
      const calculation = this.calculateTripAmount(this.currentTrip.distance);
      this.currentTrip.amount = calculation.amount;
      this.currentTrip.rateApplied = calculation.rateApplied;

      this.notifyListeners('tripEnded', this.currentTrip);
      console.log('Trip ended:', this.currentTrip.id, 'Distance:', this.currentTrip.distance.toFixed(2), 'miles');
    } else {
      this.notifyListeners('tripDiscarded', { reason: 'Too short', distance: this.currentTrip.distance });
    }

    this.currentTrip = null;
    this.tripStartTime = null;
    this.stationaryStartTime = null;
  }

  calculateDistance(locations) {
    if (locations.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < locations.length; i++) {
      totalDistance += this.haversineDistance(locations[i - 1], locations[i]);
    }
    return totalDistance;
  }

  haversineDistance(point1, point2) {
    const R = 3959;
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

  calculateTripAmount(distance) {
    const amount = distance * 0.45;
    return {
      amount: Math.round(amount * 100) / 100,
      rateApplied: 0.45,
    };
  }

  async loadStoredState() {
    try {
      const { value: trackingEnabled } = await Preferences.get({ key: 'gps_tracking_enabled' });
      if (trackingEnabled === 'true') {
        await this.startTracking();
      }
    } catch (error) {
      console.error('Error loading stored state:', error);
    }
  }

  setupAppStateListeners() {
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed:', isActive ? 'active' : 'background');
    });
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in listener:', error);
      }
    });
  }

  getStatus() {
    return {
      isTracking: this.isTracking,
      currentTrip: this.currentTrip,
      lastLocation: this.lastLocation,
    };
  }

  generateId() {
    return `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const gpsTrackingService = new GPSTrackingService();
export default GPSTrackingService;
