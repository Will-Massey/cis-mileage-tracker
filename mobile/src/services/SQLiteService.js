/**
 * SQLite Service for offline data storage
 * Falls back to localStorage for web/PWA testing
 */

import { Capacitor } from '@capacitor/core';

class SQLiteService {
  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    if (this.isNative) {
      try {
        // Dynamic import to avoid errors on web
        const { CapacitorSQLite } = await import('@capacitor-community/sqlite');
        this.db = CapacitorSQLite;
        await this.db.requestPermissions();
        await this.createTables();
      } catch (error) {
        console.warn('SQLite not available, using localStorage fallback:', error);
        this.isNative = false;
      }
    }

    this.initialized = true;
    console.log('SQLite Service initialized (native:', this.isNative, ')');
  }

  async createTables() {
    if (!this.isNative) return;

    const schema = `
      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        userId TEXT,
        startTime TEXT,
        endTime TEXT,
        startLocation TEXT,
        endLocation TEXT,
        distance REAL,
        duration INTEGER,
        amount REAL,
        rateApplied REAL,
        purpose TEXT,
        syncStatus TEXT DEFAULT 'pending',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tripId TEXT,
        latitude REAL,
        longitude REAL,
        speed REAL,
        accuracy REAL,
        timestamp TEXT,
        FOREIGN KEY (tripId) REFERENCES trips(id)
      );

      CREATE TABLE IF NOT EXISTS sites (
        id TEXT PRIMARY KEY,
        userId TEXT,
        name TEXT,
        address TEXT,
        latitude REAL,
        longitude REAL,
        radius INTEGER,
        firstVisitDate TEXT,
        lastVisitDate TEXT,
        visitCount INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1
      );

      CREATE INDEX IF NOT EXISTS idx_trips_userId ON trips(userId);
      CREATE INDEX IF NOT EXISTS idx_trips_syncStatus ON trips(syncStatus);
    `;

    try {
      await this.db.execute({ statements: schema });
    } catch (error) {
      console.error('Error creating tables:', error);
    }
  }

  async saveTrip(trip) {
    if (this.isNative && this.db) {
      try {
        const query = `
          INSERT OR REPLACE INTO trips 
          (id, userId, startTime, endTime, startLocation, endLocation, 
           distance, duration, amount, rateApplied, purpose, syncStatus)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await this.db.run({
          statement: query,
          values: [
            trip.id,
            trip.userId,
            trip.startTime,
            trip.endTime,
            JSON.stringify(trip.startLocation),
            JSON.stringify(trip.endLocation),
            trip.distance,
            trip.duration,
            trip.amount,
            trip.rateApplied,
            trip.purpose,
            'pending'
          ]
        });
      } catch (error) {
        console.error('Error saving trip to SQLite:', error);
        await this.fallbackSaveTrip(trip);
      }
    } else {
      await this.fallbackSaveTrip(trip);
    }
  }

  async fallbackSaveTrip(trip) {
    try {
      const trips = JSON.parse(localStorage.getItem('trips') || '[]');
      const existingIndex = trips.findIndex(t => t.id === trip.id);
      
      const tripWithSync = { ...trip, syncStatus: 'pending' };
      
      if (existingIndex >= 0) {
        trips[existingIndex] = tripWithSync;
      } else {
        trips.push(tripWithSync);
      }
      
      localStorage.setItem('trips', JSON.stringify(trips));
    } catch (error) {
      console.error('Error in fallback save:', error);
    }
  }

  async getTrips(userId) {
    if (this.isNative && this.db) {
      try {
        const result = await this.db.query({
          statement: 'SELECT * FROM trips WHERE userId = ? ORDER BY startTime DESC',
          values: [userId]
        });
        return result.values || [];
      } catch (error) {
        console.error('Error getting trips from SQLite:', error);
        return this.fallbackGetTrips(userId);
      }
    } else {
      return this.fallbackGetTrips(userId);
    }
  }

  async fallbackGetTrips(userId) {
    try {
      const trips = JSON.parse(localStorage.getItem('trips') || '[]');
      return trips.filter(t => t.userId === userId).sort((a, b) => 
        new Date(b.startTime) - new Date(a.startTime)
      );
    } catch (error) {
      return [];
    }
  }

  async getPendingTrips() {
    if (this.isNative && this.db) {
      try {
        const result = await this.db.query({
          statement: "SELECT * FROM trips WHERE syncStatus = 'pending'"
        });
        return result.values || [];
      } catch (error) {
        return this.fallbackGetPendingTrips();
      }
    } else {
      return this.fallbackGetPendingTrips();
    }
  }

  async fallbackGetPendingTrips() {
    try {
      const trips = JSON.parse(localStorage.getItem('trips') || '[]');
      return trips.filter(t => t.syncStatus === 'pending');
    } catch (error) {
      return [];
    }
  }

  async markTripSynced(tripId) {
    if (this.isNative && this.db) {
      try {
        await this.db.run({
          statement: "UPDATE trips SET syncStatus = 'synced' WHERE id = ?",
          values: [tripId]
        });
      } catch (error) {
        await this.fallbackMarkTripSynced(tripId);
      }
    } else {
      await this.fallbackMarkTripSynced(tripId);
    }
  }

  async fallbackMarkTripSynced(tripId) {
    try {
      const trips = JSON.parse(localStorage.getItem('trips') || '[]');
      const trip = trips.find(t => t.id === tripId);
      if (trip) {
        trip.syncStatus = 'synced';
        localStorage.setItem('trips', JSON.stringify(trips));
      }
    } catch (error) {
      console.error('Error marking trip synced:', error);
    }
  }

  async saveSite(site) {
    await this.fallbackSaveSite(site);
  }

  async fallbackSaveSite(site) {
    try {
      const sites = JSON.parse(localStorage.getItem('sites') || '[]');
      const existingIndex = sites.findIndex(s => s.id === site.id);
      
      if (existingIndex >= 0) {
        sites[existingIndex] = site;
      } else {
        sites.push(site);
      }
      
      localStorage.setItem('sites', JSON.stringify(sites));
    } catch (error) {
      console.error('Error saving site:', error);
    }
  }

  async getSites(userId) {
    try {
      const sites = JSON.parse(localStorage.getItem('sites') || '[]');
      return sites.filter(s => s.userId === userId && s.isActive !== false);
    } catch (error) {
      return [];
    }
  }
}

export const sqliteService = new SQLiteService();
export default SQLiteService;
