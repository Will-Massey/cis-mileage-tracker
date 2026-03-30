/**
 * SQLite Service
 * Local database for offline storage of trips, locations, and receipts
 */

import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

class SQLiteService {
  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the database
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create connection
      this.db = await this.sqlite.createConnection(
        'mileage_tracker',
        false,
        'no-encryption',
        1,
        false
      );

      // Open database
      await this.db.open();

      // Create tables
      await this.createTables();

      this.isInitialized = true;
      console.log('SQLite database initialized');
    } catch (error) {
      console.error('Error initializing SQLite:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  async createTables() {
    const schema = `
      -- Trips table
      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        start_lat REAL,
        start_lng REAL,
        start_address TEXT,
        end_lat REAL,
        end_lng REAL,
        end_address TEXT,
        distance REAL DEFAULT 0,
        purpose TEXT,
        purpose_category TEXT,
        vehicle_id TEXT,
        amount REAL DEFAULT 0,
        rate_applied REAL,
        tax_year TEXT,
        is_synced INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Locations table (GPS points)
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        speed REAL,
        accuracy REAL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
      );

      -- Sites table (saved construction sites)
      CREATE TABLE IF NOT EXISTS sites (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        postcode TEXT,
        latitude REAL,
        longitude REAL,
        radius INTEGER DEFAULT 100,
        first_visit_date TEXT,
        last_visit_date TEXT,
        visit_count INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Receipts table
      CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        trip_id TEXT,
        filename TEXT NOT NULL,
        local_path TEXT,
        storage_key TEXT,
        file_type TEXT,
        file_size INTEGER,
        description TEXT,
        amount REAL,
        merchant TEXT,
        receipt_date TEXT,
        category TEXT,
        ocr_data TEXT,
        is_synced INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
      );

      -- Vehicles table
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        registration TEXT,
        make TEXT,
        model TEXT,
        fuel_type TEXT,
        engine_size TEXT,
        year INTEGER,
        is_company_car INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        is_default INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- User settings
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id TEXT PRIMARY KEY,
        cis_rate TEXT DEFAULT '20%',
        default_vehicle_id TEXT,
        auto_track_enabled INTEGER DEFAULT 0,
        offline_mode_enabled INTEGER DEFAULT 1,
        dark_mode_enabled INTEGER DEFAULT 0,
        notification_enabled INTEGER DEFAULT 1,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_trips_user ON trips(user_id);
      CREATE INDEX IF NOT EXISTS idx_trips_sync ON trips(is_synced);
      CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(start_time);
      CREATE INDEX IF NOT EXISTS idx_locations_trip ON locations(trip_id);
      CREATE INDEX IF NOT EXISTS idx_sites_user ON sites(user_id);
      CREATE INDEX IF NOT EXISTS idx_receipts_user ON receipts(user_id);
      CREATE INDEX IF NOT EXISTS idx_receipts_sync ON receipts(is_synced);
    `;

    await this.db.execute(schema);
  }

  /**
   * Save a trip
   */
  async saveTrip(trip) {
    try {
      const query = `
        INSERT OR REPLACE INTO trips (
          id, user_id, start_time, end_time, start_lat, start_lng, 
          start_address, end_lat, end_lng, end_address, distance,
          purpose, vehicle_id, amount, rate_applied, tax_year, is_synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        trip.id,
        trip.userId || 'local_user',
        trip.startTime,
        trip.endTime,
        trip.startLocation?.latitude,
        trip.startLocation?.longitude,
        trip.startLocation?.address,
        trip.endLocation?.latitude,
        trip.endLocation?.longitude,
        trip.endLocation?.address,
        trip.distance,
        trip.purpose,
        trip.vehicleId,
        trip.amount,
        trip.rateApplied,
        trip.taxYear,
        0 // Not synced yet
      ];

      await this.db.run(query, values);
      
      // Save locations if provided
      if (trip.locations && trip.locations.length > 0) {
        for (const location of trip.locations) {
          await this.saveLocation(location, trip.id);
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving trip:', error);
      throw error;
    }
  }

  /**
   * Save a GPS location
   */
  async saveLocation(location, tripId = null) {
    try {
      const query = `
        INSERT INTO locations (trip_id, latitude, longitude, speed, accuracy, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const values = [
        tripId,
        location.latitude,
        location.longitude,
        location.speed,
        location.accuracy,
        location.timestamp
      ];

      await this.db.run(query, values);
      return true;
    } catch (error) {
      console.error('Error saving location:', error);
      throw error;
    }
  }

  /**
   * Get all trips for a user
   */
  async getTrips(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, startDate, endDate } = options;
      
      let query = 'SELECT * FROM trips WHERE user_id = ?';
      const values = [userId];

      if (startDate) {
        query += ' AND start_time >= ?';
        values.push(startDate);
      }

      if (endDate) {
        query += ' AND start_time <= ?';
        values.push(endDate);
      }

      query += ' ORDER BY start_time DESC LIMIT ? OFFSET ?';
      values.push(limit, offset);

      const result = await this.db.query(query, values);
      return result.values || [];
    } catch (error) {
      console.error('Error getting trips:', error);
      throw error;
    }
  }

  /**
   * Get trips pending sync
   */
  async getPendingTrips() {
    try {
      const query = 'SELECT * FROM trips WHERE is_synced = 0 ORDER BY created_at ASC';
      const result = await this.db.query(query);
      return result.values || [];
    } catch (error) {
      console.error('Error getting pending trips:', error);
      return [];
    }
  }

  /**
   * Mark trip as synced
   */
  async markTripSynced(tripId) {
    try {
      const query = 'UPDATE trips SET is_synced = 1 WHERE id = ?';
      await this.db.run(query, [tripId]);
      return true;
    } catch (error) {
      console.error('Error marking trip synced:', error);
      throw error;
    }
  }

  /**
   * Mark trip for sync
   */
  async markTripForSync(tripId) {
    try {
      const query = 'UPDATE trips SET is_synced = 0 WHERE id = ?';
      await this.db.run(query, [tripId]);
      return true;
    } catch (error) {
      console.error('Error marking trip for sync:', error);
      throw error;
    }
  }

  /**
   * Save a site
   */
  async saveSite(site) {
    try {
      const query = `
        INSERT OR REPLACE INTO sites (
          id, user_id, name, address, postcode, latitude, longitude, 
          radius, first_visit_date, last_visit_date, visit_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        site.id,
        site.userId,
        site.name,
        site.address,
        site.postcode,
        site.latitude,
        site.longitude,
        site.radius || 100,
        site.firstVisitDate,
        site.lastVisitDate,
        site.visitCount || 0
      ];

      await this.db.run(query, values);
      return true;
    } catch (error) {
      console.error('Error saving site:', error);
      throw error;
    }
  }

  /**
   * Get all sites for a user
   */
  async getSites(userId) {
    try {
      const query = 'SELECT * FROM sites WHERE user_id = ? AND is_active = 1 ORDER BY visit_count DESC';
      const result = await this.db.query(query, [userId]);
      return result.values || [];
    } catch (error) {
      console.error('Error getting sites:', error);
      return [];
    }
  }

  /**
   * Get site by ID
   */
  async getSite(siteId) {
    try {
      const query = 'SELECT * FROM sites WHERE id = ?';
      const result = await this.db.query(query, [siteId]);
      return result.values?.[0] || null;
    } catch (error) {
      console.error('Error getting site:', error);
      return null;
    }
  }

  /**
   * Update site visit
   */
  async updateSiteVisit(siteId) {
    try {
      const query = `
        UPDATE sites 
        SET visit_count = visit_count + 1, last_visit_date = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      await this.db.run(query, [siteId]);
      return true;
    } catch (error) {
      console.error('Error updating site visit:', error);
      throw error;
    }
  }

  /**
   * Save a receipt
   */
  async saveReceipt(receipt) {
    try {
      const query = `
        INSERT OR REPLACE INTO receipts (
          id, user_id, trip_id, filename, local_path, storage_key,
          file_type, file_size, description, amount, merchant,
          receipt_date, category, ocr_data, is_synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        receipt.id,
        receipt.userId,
        receipt.tripId,
        receipt.filename,
        receipt.localPath,
        receipt.storageKey,
        receipt.fileType,
        receipt.fileSize,
        receipt.description,
        receipt.amount,
        receipt.merchant,
        receipt.receiptDate,
        receipt.category,
        receipt.ocrData ? JSON.stringify(receipt.ocrData) : null,
        0
      ];

      await this.db.run(query, values);
      return true;
    } catch (error) {
      console.error('Error saving receipt:', error);
      throw error;
    }
  }

  /**
   * Get receipts for a trip
   */
  async getTripReceipts(tripId) {
    try {
      const query = 'SELECT * FROM receipts WHERE trip_id = ? ORDER BY created_at DESC';
      const result = await this.db.query(query, [tripId]);
      return result.values || [];
    } catch (error) {
      console.error('Error getting trip receipts:', error);
      return [];
    }
  }

  /**
   * Get pending receipts
   */
  async getPendingReceipts() {
    try {
      const query = 'SELECT * FROM receipts WHERE is_synced = 0 ORDER BY created_at ASC';
      const result = await this.db.query(query);
      return result.values || [];
    } catch (error) {
      console.error('Error getting pending receipts:', error);
      return [];
    }
  }

  /**
   * Get mileage stats for a date range
   */
  async getMileageStats(userId, startDate, endDate) {
    try {
      const query = `
        SELECT 
          COUNT(*) as tripCount,
          SUM(distance) as totalDistance,
          SUM(amount) as totalAmount
        FROM trips
        WHERE user_id = ? AND start_time >= ? AND start_time <= ?
      `;

      const result = await this.db.query(query, [userId, startDate, endDate]);
      return result.values?.[0] || { tripCount: 0, totalDistance: 0, totalAmount: 0 };
    } catch (error) {
      console.error('Error getting mileage stats:', error);
      return { tripCount: 0, totalDistance: 0, totalAmount: 0 };
    }
  }

  /**
   * Delete a trip and its locations
   */
  async deleteTrip(tripId) {
    try {
      await this.db.run('DELETE FROM trips WHERE id = ?', [tripId]);
      return true;
    } catch (error) {
      console.error('Error deleting trip:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.db) {
      await this.db.close();
      this.isInitialized = false;
    }
  }
}

export default SQLiteService;
