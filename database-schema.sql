-- ============================================
-- UK Business Mileage Tracker - PostgreSQL Schema
-- Target Platform: Neon (Serverless PostgreSQL)
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. COMPANIES TABLE (For multi-company support)
-- ============================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    postcode VARCHAR(10),
    vat_number VARCHAR(20),
    cis_number VARCHAR(20),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE companies IS 'Companies for multi-tenant support, primarily for CIS contractors';

-- ============================================
-- 2. USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'accountant')),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'Application users with role-based access control';
COMMENT ON COLUMN users.role IS 'User role: admin (full access), user (own data only), accountant (read-only access to assigned users)';

-- ============================================
-- 3. REFRESH TOKENS TABLE (For JWT refresh)
-- ============================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    replaced_by_token VARCHAR(500),
    ip_address INET,
    user_agent TEXT
);

COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for session management';

-- ============================================
-- 4. HMRC MILEAGE RATES TABLE
-- ============================================
CREATE TABLE mileage_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_year VARCHAR(10) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL DEFAULT 'car' CHECK (vehicle_type IN ('car', 'van', 'motorcycle', 'bicycle')),
    rate_first_10000 DECIMAL(4,2) NOT NULL,
    rate_over_10000 DECIMAL(4,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tax_year, vehicle_type)
);

COMMENT ON TABLE mileage_rates IS 'HMRC approved mileage rates by tax year';

-- ============================================
-- 5. VEHICLES TABLE
-- ============================================
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    registration VARCHAR(20),
    make VARCHAR(50),
    model VARCHAR(50),
    fuel_type VARCHAR(20) CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid', 'plugin_hybrid')),
    engine_size VARCHAR(10),
    year INTEGER CHECK (year >= 1900 AND year <= 2100),
    color VARCHAR(30),
    is_company_car BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, registration)
);

COMMENT ON TABLE vehicles IS 'User vehicles for mileage tracking';

-- ============================================
-- 6. TRIPS TABLE (Core mileage records)
-- ============================================
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    
    -- Trip details
    trip_date DATE NOT NULL,
    start_location VARCHAR(255) NOT NULL,
    end_location VARCHAR(255) NOT NULL,
    start_postcode VARCHAR(10),
    end_postcode VARCHAR(10),
    
    -- Distance and calculation
    distance_miles DECIMAL(8,2) NOT NULL CHECK (distance_miles > 0),
    is_round_trip BOOLEAN DEFAULT false,
    
    -- Purpose
    purpose VARCHAR(255) NOT NULL,
    purpose_category VARCHAR(50) CHECK (purpose_category IN (
        'site_visit', 'client_meeting', 'supplier_visit', 'training',
        'conference', 'business_trip', 'commute', 'other'
    )),
    
    -- HMRC calculation
    tax_year VARCHAR(10) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL DEFAULT 'car',
    rate_applied DECIMAL(4,2) NOT NULL,
    amount_gbp DECIMAL(10,2) NOT NULL,
    
    -- Running totals for the user (for rate calculation)
    user_miles_ytd DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Additional data
    notes TEXT,
    gps_start JSONB,
    gps_end JSONB,
    gps_route JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

COMMENT ON TABLE trips IS 'Business mileage trip records - core of the application';
COMMENT ON COLUMN trips.rate_applied IS 'HMRC rate applied: 0.45 for first 10k miles, 0.25 after';
COMMENT ON COLUMN trips.user_miles_ytd IS 'Users total miles in this tax year up to this trip (for rate calculation)';

-- ============================================
-- 7. RECEIPTS TABLE (For expense receipts)
-- ============================================
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- File info
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL CHECK (file_size > 0),
    
    -- OCR data (future feature)
    ocr_data JSONB,
    ocr_processed_at TIMESTAMP WITH TIME ZONE,
    
    -- User data
    description TEXT,
    expense_date DATE,
    expense_amount DECIMAL(10,2),
    expense_category VARCHAR(50),
    
    -- Metadata
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES users(id)
);

COMMENT ON TABLE receipts IS 'Receipt uploads for trip expenses';

-- ============================================
-- 8. REPORTS TABLE (Generated reports)
-- ============================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Report details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(20) NOT NULL DEFAULT 'mileage' CHECK (report_type IN ('mileage', 'expense', 'summary', 'tax')),
    
    -- Date range
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    tax_year VARCHAR(10),
    
    -- Format
    format VARCHAR(10) NOT NULL CHECK (format IN ('pdf', 'csv', 'excel')),
    
    -- Statistics
    total_miles DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    trip_count INTEGER NOT NULL DEFAULT 0,
    
    -- Filters applied
    filters JSONB DEFAULT '{}',
    
    -- File storage
    file_url VARCHAR(500),
    file_size INTEGER,
    download_url VARCHAR(500),
    download_token VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    generated_by UUID REFERENCES users(id)
);

COMMENT ON TABLE reports IS 'Generated mileage reports with download links';

-- ============================================
-- 9. AUDIT LOGS TABLE (For compliance)
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action details
    action VARCHAR(50) NOT NULL CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'DOWNLOAD')),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    
    -- Data changes
    old_data JSONB,
    new_data JSONB,
    
    -- Request info
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE audit_logs IS 'Audit trail for all data changes - HMRC compliance requirement';

-- ============================================
-- 10. USER MILEAGE SUMMARIES TABLE (Cached totals)
-- ============================================
CREATE TABLE user_mileage_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tax_year VARCHAR(10) NOT NULL,
    
    -- Totals
    total_miles DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_claim_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    trip_count INTEGER NOT NULL DEFAULT 0,
    
    -- Breakdown by rate
    miles_at_45p DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_at_45p DECIMAL(10,2) NOT NULL DEFAULT 0,
    miles_at_25p DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_at_25p DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Last calculation
    last_trip_date DATE,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, tax_year)
);

COMMENT ON TABLE user_mileage_summaries IS 'Cached mileage totals by tax year for quick reporting';

-- ============================================
-- INDEXES
-- ============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Refresh tokens indexes
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- Trips indexes
CREATE INDEX idx_trips_user ON trips(user_id);
CREATE INDEX idx_trips_user_date ON trips(user_id, trip_date DESC);
CREATE INDEX idx_trips_date ON trips(trip_date);
CREATE INDEX idx_trips_date_range ON trips(trip_date, user_id);
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_tax_year ON trips(tax_year);

-- Vehicles indexes
CREATE INDEX idx_vehicles_user ON vehicles(user_id);
CREATE INDEX idx_vehicles_active ON vehicles(user_id, is_active);

-- Receipts indexes
CREATE INDEX idx_receipts_trip ON receipts(trip_id);
CREATE INDEX idx_receipts_user ON receipts(user_id);
CREATE INDEX idx_receipts_uploaded ON receipts(uploaded_at DESC);

-- Reports indexes
CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_reports_date_range ON reports(date_from, date_to);
CREATE INDEX idx_reports_expires ON reports(expires_at);
CREATE INDEX idx_reports_status ON reports(status);

-- Audit logs indexes
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, entity_type);

-- User mileage summaries indexes
CREATE INDEX idx_mileage_summary_user ON user_mileage_summaries(user_id);
CREATE INDEX idx_mileage_summary_year ON user_mileage_summaries(tax_year);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate HMRC mileage amount
CREATE OR REPLACE FUNCTION calculate_mileage_amount(
    p_distance DECIMAL(8,2),
    p_user_id UUID,
    p_tax_year VARCHAR(10),
    p_vehicle_type VARCHAR(20) DEFAULT 'car'
)
RETURNS TABLE (
    rate_applied DECIMAL(4,2),
    amount_gbp DECIMAL(10,2),
    user_miles_ytd DECIMAL(10,2)
) AS $$
DECLARE
    v_rate_first_10000 DECIMAL(4,2);
    v_rate_over_10000 DECIMAL(4,2);
    v_current_miles DECIMAL(10,2);
    v_rate DECIMAL(4,2);
    v_amount DECIMAL(10,2);
BEGIN
    -- Get HMRC rates for the tax year
    SELECT rate_first_10000, rate_over_10000
    INTO v_rate_first_10000, v_rate_over_10000
    FROM mileage_rates
    WHERE tax_year = p_tax_year
      AND vehicle_type = p_vehicle_type
      AND is_active = true
    ORDER BY effective_from DESC
    LIMIT 1;
    
    -- Default rates if not found
    IF v_rate_first_10000 IS NULL THEN
        v_rate_first_10000 := 0.45;
        v_rate_over_10000 := 0.25;
    END IF;
    
    -- Get current YTD miles for user
    SELECT COALESCE(total_miles, 0)
    INTO v_current_miles
    FROM user_mileage_summaries
    WHERE user_id = p_user_id AND tax_year = p_tax_year;
    
    IF v_current_miles IS NULL THEN
        v_current_miles := 0;
    END IF;
    
    -- Calculate which rate applies
    IF v_current_miles >= 10000 THEN
        v_rate := v_rate_over_10000;
        v_amount := p_distance * v_rate_over_10000;
    ELSIF v_current_miles + p_distance <= 10000 THEN
        v_rate := v_rate_first_10000;
        v_amount := p_distance * v_rate_first_10000;
    ELSE
        -- Mixed rate calculation
        v_amount := (10000 - v_current_miles) * v_rate_first_10000 +
                    (v_current_miles + p_distance - 10000) * v_rate_over_10000;
        v_rate := v_amount / p_distance;
    END IF;
    
    RETURN QUERY SELECT v_rate, ROUND(v_amount, 2), v_current_miles + p_distance;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_mileage_amount IS 'Calculate HMRC-compliant mileage claim amount based on user YTD miles';

-- Function to update user mileage summary
CREATE OR REPLACE FUNCTION update_user_mileage_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate summary for the user and tax year
    INSERT INTO user_mileage_summaries (
        user_id, tax_year, total_miles, total_claim_amount, trip_count,
        miles_at_45p, amount_at_45p, miles_at_25p, amount_at_25p, last_trip_date
    )
    SELECT 
        user_id,
        tax_year,
        SUM(distance_miles) as total_miles,
        SUM(amount_gbp) as total_claim_amount,
        COUNT(*) as trip_count,
        SUM(CASE WHEN rate_applied >= 0.40 THEN distance_miles ELSE 0 END) as miles_at_45p,
        SUM(CASE WHEN rate_applied >= 0.40 THEN amount_gbp ELSE 0 END) as amount_at_45p,
        SUM(CASE WHEN rate_applied < 0.40 THEN distance_miles ELSE 0 END) as miles_at_25p,
        SUM(CASE WHEN rate_applied < 0.40 THEN amount_gbp ELSE 0 END) as amount_at_25p,
        MAX(trip_date) as last_trip_date
    FROM trips
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND tax_year = COALESCE(NEW.tax_year, OLD.tax_year)
    GROUP BY user_id, tax_year
    ON CONFLICT (user_id, tax_year) 
    DO UPDATE SET
        total_miles = EXCLUDED.total_miles,
        total_claim_amount = EXCLUDED.total_claim_amount,
        trip_count = EXCLUDED.trip_count,
        miles_at_45p = EXCLUDED.miles_at_45p,
        amount_at_45p = EXCLUDED.amount_at_45p,
        miles_at_25p = EXCLUDED.miles_at_25p,
        amount_at_25p = EXCLUDED.amount_at_25p,
        last_trip_date = EXCLUDED.last_trip_date,
        calculated_at = CURRENT_TIMESTAMP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at columns
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mileage_rates_updated_at
    BEFORE UPDATE ON mileage_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update mileage summary on trip changes
CREATE TRIGGER update_mileage_summary_after_insert
    AFTER INSERT ON trips
    FOR EACH ROW
    EXECUTE FUNCTION update_user_mileage_summary();

CREATE TRIGGER update_mileage_summary_after_update
    AFTER UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION update_user_mileage_summary();

CREATE TRIGGER update_mileage_summary_after_delete
    AFTER DELETE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION update_user_mileage_summary();

-- ============================================
-- SEED DATA
-- ============================================

-- HMRC Mileage Rates (2024-25 Tax Year)
INSERT INTO mileage_rates (tax_year, vehicle_type, rate_first_10000, rate_over_10000, is_active, effective_from) VALUES
('2024-25', 'car', 0.45, 0.25, true, '2024-04-06'),
('2024-25', 'van', 0.45, 0.25, true, '2024-04-06'),
('2024-25', 'motorcycle', 0.24, 0.24, true, '2024-04-06'),
('2024-25', 'bicycle', 0.20, 0.20, true, '2024-04-06');

-- HMRC Mileage Rates (2023-24 Tax Year - for historical data)
INSERT INTO mileage_rates (tax_year, vehicle_type, rate_first_10000, rate_over_10000, is_active, effective_from, effective_to) VALUES
('2023-24', 'car', 0.45, 0.25, false, '2023-04-06', '2024-04-05'),
('2023-24', 'van', 0.45, 0.25, false, '2023-04-06', '2024-04-05'),
('2023-24', 'motorcycle', 0.24, 0.24, false, '2023-04-06', '2024-04-05'),
('2023-24', 'bicycle', 0.20, 0.20, false, '2023-04-06', '2024-04-05');

-- Sample Companies (for CIS contractors)
INSERT INTO companies (name, address_line1, city, postcode, vat_number, cis_number, contact_email) VALUES
('Smith Construction Ltd', '123 Builder Street', 'Manchester', 'M1 1AA', 'GB123456789', '1234567890', 'john@smithconstruction.co.uk'),
('Johnson Builders', '456 Site Road', 'Birmingham', 'B1 2BB', 'GB987654321', '0987654321', 'admin@johnsonbuilders.co.uk');

-- Sample Users (password: 'Password123!' hashed with bcrypt)
-- Note: In production, use proper bcrypt hashing
INSERT INTO users (email, password_hash, first_name, last_name, role, company_id, phone, is_active, email_verified) VALUES
-- Admin user
('admin@mileagetracker.co.uk', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/I1K', 'System', 'Administrator', 'admin', NULL, '07700 900001', true, true),

-- Regular users
('john.smith@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/I1K', 'John', 'Smith', 'user', (SELECT id FROM companies WHERE name = 'Smith Construction Ltd'), '07700 900002', true, true),
('sarah.jones@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/I1K', 'Sarah', 'Jones', 'user', (SELECT id FROM companies WHERE name = 'Johnson Builders'), '07700 900003', true, true),
('mike.wilson@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/I1K', 'Mike', 'Wilson', 'user', NULL, '07700 900004', true, true),

-- Accountant user
('accountant@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/I1K', 'Jane', 'Accountant', 'accountant', NULL, '07700 900005', true, true);

-- Sample Vehicles
INSERT INTO vehicles (user_id, name, registration, make, model, fuel_type, year, is_company_car, is_active) VALUES
((SELECT id FROM users WHERE email = 'john.smith@example.com'), 'Work Van', 'AB12 CDE', 'Ford', 'Transit', 'diesel', 2022, true, true),
((SELECT id FROM users WHERE email = 'john.smith@example.com'), 'Personal Car', 'FG34 HIJ', 'Vauxhall', 'Corsa', 'petrol', 2020, false, true),
((SELECT id FROM users WHERE email = 'sarah.jones@example.com'), 'Company Car', 'KL56 MNO', 'BMW', '3 Series', 'diesel', 2023, true, true),
((SELECT id FROM users WHERE email = 'mike.wilson@example.com'), 'Pickup Truck', 'PQ78 RST', 'Ford', 'Ranger', 'diesel', 2021, false, true);

-- Sample Trips (for testing HMRC calculations)
INSERT INTO trips (user_id, vehicle_id, trip_date, start_location, end_location, start_postcode, end_postcode, distance_miles, is_round_trip, purpose, purpose_category, tax_year, vehicle_type, rate_applied, amount_gbp, user_miles_ytd, notes) VALUES
-- John Smith's trips (testing 45p rate for first 10k miles)
((SELECT id FROM users WHERE email = 'john.smith@example.com'), 
 (SELECT id FROM vehicles WHERE registration = 'AB12 CDE'),
 '2024-01-15', 'Manchester Office', 'Leeds Site', 'M1 1AA', 'LS1 1AA', 45.50, false, 'Site inspection for new project', 'site_visit', '2024-25', 'van', 0.45, 20.48, 45.50, 'Met with site manager'),

((SELECT id FROM users WHERE email = 'john.smith@example.com'),
 (SELECT id FROM vehicles WHERE registration = 'AB12 CDE'),
 '2024-01-16', 'Manchester Office', 'Liverpool Client', 'M1 1AA', 'L1 1AA', 35.20, true, 'Client meeting - project review', 'client_meeting', '2024-25', 'van', 0.45, 15.84, 80.70, 'Return journey included'),

((SELECT id FROM users WHERE email = 'john.smith@example.com'),
 (SELECT id FROM vehicles WHERE registration = 'FG34 HIJ'),
 '2024-01-18', 'Home', 'Birmingham Supplier', 'M2 2BB', 'B1 1BB', 87.30, true, 'Picking up materials', 'supplier_visit', '2024-25', 'car', 0.45, 39.29, 168.00, 'Long distance trip'),

-- Sarah Jones's trips
((SELECT id FROM users WHERE email = 'sarah.jones@example.com'),
 (SELECT id FROM vehicles WHERE registration = 'KL56 MNO'),
 '2024-01-10', 'Birmingham Office', 'Coventry Site', 'B1 2BB', 'CV1 1AA', 22.50, false, 'Weekly site visit', 'site_visit', '2024-25', 'car', 0.45, 10.13, 22.50, 'Routine inspection'),

((SELECT id FROM users WHERE email = 'sarah.jones@example.com'),
 (SELECT id FROM vehicles WHERE registration = 'KL56 MNO'),
 '2024-01-12', 'Birmingham Office', 'London Meeting', 'B1 2BB', 'SW1A 1AA', 125.00, true, 'Board meeting with directors', 'meeting', '2024-25', 'car', 0.45, 56.25, 147.50, 'Overnight stay required'),

-- Mike Wilson's trips (testing mixed rate scenario - crossing 10k threshold)
((SELECT id FROM users WHERE email = 'mike.wilson@example.com'),
 (SELECT id FROM vehicles WHERE registration = 'PQ78 RST'),
 '2024-01-05', 'Home', 'Nottingham Project', 'M3 3CC', 'NG1 1AA', 78.50, true, 'Project kickoff meeting', 'client_meeting', '2024-25', 'car', 0.45, 35.33, 78.50, 'New contract start'),

((SELECT id FROM users WHERE email = 'mike.wilson@example.com'),
 (SELECT id FROM vehicles WHERE registration = 'PQ78 RST'),
 '2024-01-08', 'Home', 'Sheffield Site', 'M3 3CC', 'S1 1AA', 42.00, false, 'Site survey', 'site_visit', '2024-25', 'car', 0.45, 18.90, 120.50, 'Survey for quote'),

((SELECT id FROM users WHERE email = 'mike.wilson@example.com'),
 (SELECT id FROM vehicles WHERE registration = 'PQ78 RST'),
 '2024-01-10', 'Home', 'Leeds Client', 'M3 3CC', 'LS1 1AA', 45.00, true, 'Contract signing', 'client_meeting', '2024-25', 'car', 0.45, 20.25, 165.50, 'Secured new contract');

-- Sample Reports
INSERT INTO reports (user_id, name, description, report_type, date_from, date_to, tax_year, format, total_miles, total_amount, trip_count, filters, status) VALUES
((SELECT id FROM users WHERE email = 'john.smith@example.com'),
 'January 2024 Mileage', 'Monthly mileage report for January 2024', 'mileage', '2024-01-01', '2024-01-31', '2024-25', 'pdf', 168.00, 75.61, 3, '{"vehicle_id": null, "purpose": null}', 'completed'),

((SELECT id FROM users WHERE email = 'sarah.jones@example.com'),
 'Q1 2024 Summary', 'First quarter mileage summary', 'summary', '2024-01-01', '2024-03-31', '2024-25', 'csv', 147.50, 66.38, 2, '{"vehicle_id": null, "purpose": null}', 'completed'),

((SELECT id FROM users WHERE email = 'mike.wilson@example.com'),
 'Tax Year 2023-24', 'Full tax year mileage for HMRC submission', 'tax', '2023-04-06', '2024-04-05', '2023-24', 'pdf', 165.50, 74.48, 3, '{"vehicle_id": null, "purpose": null}', 'completed');

-- Sample Audit Logs
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data, ip_address, request_method, request_path) VALUES
((SELECT id FROM users WHERE email = 'john.smith@example.com'), 'LOGIN', 'users', 
 (SELECT id FROM users WHERE email = 'john.smith@example.com'), NULL, '{"last_login": "2024-01-15T08:30:00Z"}', '192.168.1.100', 'POST', '/api/auth/login'),

((SELECT id FROM users WHERE email = 'john.smith@example.com'), 'CREATE', 'trips',
 (SELECT id FROM trips WHERE purpose = 'Site inspection for new project'), NULL, '{"distance": 45.50, "amount": 20.48}', '192.168.1.100', 'POST', '/api/trips'),

((SELECT id FROM users WHERE email = 'sarah.jones@example.com'), 'CREATE', 'trips',
 (SELECT id FROM trips WHERE purpose = 'Weekly site visit'), NULL, '{"distance": 22.50, "amount": 10.13}', '192.168.1.101', 'POST', '/api/trips'),

((SELECT id FROM users WHERE email = 'admin@mileagetracker.co.uk'), 'CREATE', 'users',
 (SELECT id FROM users WHERE email = 'mike.wilson@example.com'), NULL, '{"email": "mike.wilson@example.com", "role": "user"}', '192.168.1.1', 'POST', '/api/admin/users');

-- ============================================
-- VIEWS
-- ============================================

-- View: User trip summary by month
CREATE OR REPLACE VIEW v_user_monthly_summary AS
SELECT 
    user_id,
    DATE_TRUNC('month', trip_date) as month,
    tax_year,
    COUNT(*) as trip_count,
    SUM(distance_miles) as total_miles,
    SUM(amount_gbp) as total_amount,
    AVG(distance_miles) as avg_distance,
    MAX(trip_date) as last_trip_date
FROM trips
GROUP BY user_id, DATE_TRUNC('month', trip_date), tax_year;

COMMENT ON VIEW v_user_monthly_summary IS 'Monthly mileage summary per user for dashboard widgets';

-- View: User yearly summary with rate breakdown
CREATE OR REPLACE VIEW v_user_yearly_summary AS
SELECT 
    user_id,
    tax_year,
    COUNT(*) as trip_count,
    SUM(distance_miles) as total_miles,
    SUM(amount_gbp) as total_amount,
    SUM(CASE WHEN rate_applied >= 0.40 THEN distance_miles ELSE 0 END) as miles_at_45p,
    SUM(CASE WHEN rate_applied >= 0.40 THEN amount_gbp ELSE 0 END) as amount_at_45p,
    SUM(CASE WHEN rate_applied < 0.40 THEN distance_miles ELSE 0 END) as miles_at_25p,
    SUM(CASE WHEN rate_applied < 0.40 THEN amount_gbp ELSE 0 END) as amount_at_25p,
    MIN(trip_date) as first_trip,
    MAX(trip_date) as last_trip
FROM trips
GROUP BY user_id, tax_year;

COMMENT ON VIEW v_user_yearly_summary IS 'Yearly mileage summary with HMRC rate breakdown';

-- View: Recent trips with user details
CREATE OR REPLACE VIEW v_recent_trips AS
SELECT 
    t.id,
    t.user_id,
    u.first_name || ' ' || u.last_name as user_name,
    u.email as user_email,
    t.trip_date,
    t.start_location,
    t.end_location,
    t.distance_miles,
    t.purpose,
    t.purpose_category,
    t.rate_applied,
    t.amount_gbp,
    v.name as vehicle_name,
    v.registration as vehicle_registration,
    t.created_at
FROM trips t
JOIN users u ON t.user_id = u.id
LEFT JOIN vehicles v ON t.vehicle_id = v.id
ORDER BY t.created_at DESC;

COMMENT ON VIEW v_recent_trips IS 'Recent trips with user and vehicle details for admin dashboard';

-- ============================================
-- ROW LEVEL SECURITY (Optional - for multi-tenant)
-- ============================================

-- Enable RLS on trips table
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own trips
CREATE POLICY trips_user_isolation ON trips
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Policy: Admins can see all trips
CREATE POLICY trips_admin_access ON trips
    FOR ALL
    TO admin_role
    USING (true);

COMMENT ON TABLE trips IS 'Business mileage trips with row-level security enabled';

-- ============================================
-- ADDITIONAL CONSTRAINTS AND VALIDATIONS
-- ============================================

-- Ensure trip date is not in the future
ALTER TABLE trips ADD CONSTRAINT chk_trip_date_not_future 
    CHECK (trip_date <= CURRENT_DATE);

-- Ensure report date range is valid
ALTER TABLE reports ADD CONSTRAINT chk_report_date_range 
    CHECK (date_from <= date_to);

-- Ensure mileage rates are positive
ALTER TABLE mileage_rates ADD CONSTRAINT chk_rates_positive 
    CHECK (rate_first_10000 > 0 AND rate_over_10000 > 0);

-- Ensure vehicle year is reasonable
ALTER TABLE vehicles ADD CONSTRAINT chk_vehicle_year 
    CHECK (year IS NULL OR (year >= 1900 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1));

-- ============================================
-- DATABASE COMMENTS
-- ============================================

COMMENT ON DATABASE current_database() IS 'UK Business Mileage Tracker - PostgreSQL Database for CIS Contractors';

-- ============================================
-- END OF SCHEMA
-- ============================================
