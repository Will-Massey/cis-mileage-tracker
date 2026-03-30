-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "vatNumber" TEXT,
    "cisNumber" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "company_id" TEXT,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" DATETIME,
    "password_reset_token" TEXT,
    "password_reset_expires_at" DATETIME,
    "last_login_at" DATETIME,
    "login_count" INTEGER NOT NULL DEFAULT 0,
    "preferences" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" DATETIME,
    "replaced_by_token" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mileage_rates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tax_year" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "rate_first_10000" REAL NOT NULL,
    "rate_over_10000" REAL NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" DATETIME NOT NULL,
    "effective_to" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registration" TEXT,
    "make" TEXT,
    "model" TEXT,
    "fuel_type" TEXT,
    "engine_size" TEXT,
    "year" INTEGER,
    "color" TEXT,
    "is_company_car" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "vehicle_id" TEXT,
    "trip_date" DATETIME NOT NULL,
    "start_location" TEXT NOT NULL,
    "end_location" TEXT NOT NULL,
    "start_postcode" TEXT,
    "end_postcode" TEXT,
    "distance_miles" REAL NOT NULL,
    "is_round_trip" BOOLEAN NOT NULL DEFAULT false,
    "purpose" TEXT NOT NULL,
    "purpose_category" TEXT,
    "tax_year" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL DEFAULT 'car',
    "rate_applied" REAL NOT NULL,
    "amount_gbp" REAL NOT NULL,
    "user_miles_ytd" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "gps_start" TEXT,
    "gps_end" TEXT,
    "gps_route" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    CONSTRAINT "trips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "trips_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trip_id" TEXT,
    "user_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "ocr_data" TEXT,
    "ocr_processed_at" DATETIME,
    "description" TEXT,
    "expense_date" DATETIME,
    "expense_amount" REAL,
    "expense_category" TEXT,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by" TEXT,
    CONSTRAINT "receipts_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "report_type" TEXT NOT NULL DEFAULT 'mileage',
    "date_from" DATETIME NOT NULL,
    "date_to" DATETIME NOT NULL,
    "tax_year" TEXT,
    "format" TEXT NOT NULL,
    "total_miles" REAL NOT NULL DEFAULT 0,
    "total_amount" REAL NOT NULL DEFAULT 0,
    "trip_count" INTEGER NOT NULL DEFAULT 0,
    "filters" TEXT NOT NULL DEFAULT '{}',
    "file_url" TEXT,
    "file_size" INTEGER,
    "download_url" TEXT,
    "download_token" TEXT,
    "expires_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    "generated_by" TEXT,
    CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_data" TEXT,
    "new_data" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "request_method" TEXT,
    "request_path" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_mileage_summaries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "tax_year" TEXT NOT NULL,
    "total_miles" REAL NOT NULL DEFAULT 0,
    "total_claim_amount" REAL NOT NULL DEFAULT 0,
    "trip_count" INTEGER NOT NULL DEFAULT 0,
    "miles_at_45p" REAL NOT NULL DEFAULT 0,
    "amount_at_45p" REAL NOT NULL DEFAULT 0,
    "miles_at_25p" REAL NOT NULL DEFAULT 0,
    "amount_at_25p" REAL NOT NULL DEFAULT 0,
    "last_trip_date" DATETIME,
    "calculated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_mileage_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "mileage_rates_tax_year_vehicle_type_key" ON "mileage_rates"("tax_year", "vehicle_type");

-- CreateIndex
CREATE INDEX "vehicles_user_id_idx" ON "vehicles"("user_id");

-- CreateIndex
CREATE INDEX "vehicles_user_id_is_active_idx" ON "vehicles"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_user_id_registration_key" ON "vehicles"("user_id", "registration");

-- CreateIndex
CREATE INDEX "trips_user_id_idx" ON "trips"("user_id");

-- CreateIndex
CREATE INDEX "trips_user_id_trip_date_idx" ON "trips"("user_id", "trip_date");

-- CreateIndex
CREATE INDEX "trips_trip_date_idx" ON "trips"("trip_date");

-- CreateIndex
CREATE INDEX "trips_trip_date_user_id_idx" ON "trips"("trip_date", "user_id");

-- CreateIndex
CREATE INDEX "trips_vehicle_id_idx" ON "trips"("vehicle_id");

-- CreateIndex
CREATE INDEX "trips_tax_year_idx" ON "trips"("tax_year");

-- CreateIndex
CREATE INDEX "receipts_trip_id_idx" ON "receipts"("trip_id");

-- CreateIndex
CREATE INDEX "receipts_user_id_idx" ON "receipts"("user_id");

-- CreateIndex
CREATE INDEX "receipts_uploaded_at_idx" ON "receipts"("uploaded_at");

-- CreateIndex
CREATE INDEX "reports_user_id_idx" ON "reports"("user_id");

-- CreateIndex
CREATE INDEX "reports_date_from_date_to_idx" ON "reports"("date_from", "date_to");

-- CreateIndex
CREATE INDEX "reports_expires_at_idx" ON "reports"("expires_at");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_entity_type_idx" ON "audit_logs"("action", "entity_type");

-- CreateIndex
CREATE INDEX "user_mileage_summaries_user_id_idx" ON "user_mileage_summaries"("user_id");

-- CreateIndex
CREATE INDEX "user_mileage_summaries_tax_year_idx" ON "user_mileage_summaries"("tax_year");

-- CreateIndex
CREATE UNIQUE INDEX "user_mileage_summaries_user_id_tax_year_key" ON "user_mileage_summaries"("user_id", "tax_year");
