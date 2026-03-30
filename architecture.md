# UK Business Mileage Tracking Web App - System Architecture

## Executive Summary

This document outlines the complete system architecture for a UK Business Mileage Tracking Web Application targeting the Construction Industry Scheme (CIS) market. The application is designed to be simple, mobile-first, and compliant with UK HMRC mileage claim regulations.

---

## 1. Tech Stack Justification

### 1.1 Core Stack

| Component | Technology | Justification |
|-----------|------------|---------------|
| **Frontend** | React 18 + Vite | Fast development, excellent mobile support, component reusability |
| **Backend** | Node.js + Express | Lightweight, scalable, excellent PostgreSQL support |
| **Database** | PostgreSQL (Neon) | ACID compliance, JSON support for extensibility, serverless scaling |
| **Authentication** | JWT (jsonwebtoken) | Stateless, scalable, works well with mobile apps |
| **Hosting** | Render (Backend) + Neon (DB) | Cost-effective, auto-scaling, UK/EU data centers available |
| **File Storage** | AWS S3 / Cloudflare R2 | Scalable storage for receipts and reports |

### 1.2 Supporting Libraries

```
Frontend:
- react-router-dom (routing)
- axios (HTTP client)
- react-hook-form (form handling)
- zod (validation)
- tailwindcss (styling)
- date-fns (date manipulation)
- react-query (server state management)
- jsPDF + PapaParse (PDF/CSV export)

Backend:
- express (web framework)
- pg (PostgreSQL driver)
- bcryptjs (password hashing)
- jsonwebtoken (JWT)
- express-validator (input validation)
- helmet (security headers)
- cors (CORS handling)
- multer (file uploads)
- node-cron (scheduled tasks)
- winston (logging)
```

### 1.3 Why This Stack?

1. **Neon PostgreSQL**: Serverless PostgreSQL with branching, perfect for CIS contractors who need data durability
2. **Render**: Free tier for startups, easy deployment from GitHub, automatic HTTPS
3. **React**: Large talent pool, excellent mobile performance via PWA capabilities
4. **JWT**: Simple authentication that scales to mobile apps without session storage

---

## 2. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Mobile    │  │   Tablet    │  │   Desktop   │  │   PWA (Future)      │ │
│  │  (Browser)  │  │  (Browser)  │  │  (Browser)  │  │   (Installable)     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         └─────────────────┴─────────────────┘                    │           │
│                           │                                      │           │
│                    ┌──────┴──────┐                      ┌────────┴────────┐  │
│                    │  React SPA  │◄─────────────────────│  Service Worker │  │
│                    │  (Vite)     │                      │  (Offline Sync) │  │
│                    └──────┬──────┘                      └─────────────────┘  │
└───────────────────────────┼──────────────────────────────────────────────────┘
                            │ HTTPS/JSON
┌───────────────────────────┼──────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                                       │
│  ┌──────────────────────┴─────────────────────────────────────────────────┐  │
│  │                    Express.js API Server (Render)                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │  │
│  │  │   Auth      │  │   Trips     │  │  Reports    │  │  Admin        │  │  │
│  │  │ Middleware  │  │   Routes    │  │   Routes    │  │  Routes       │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────────┘  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │  │
│  │  │  Validation │  │   Rate      │  │   File      │  │   Health      │  │  │
│  │  │ Middleware  │  │   Limiter   │  │   Upload    │  │   Check       │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────────────────┐
│                      SERVICE LAYER                                           │
│  ┌────────────────────────┼────────────────────────────────────────────────┐ │
│  │                        ▼                                                │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │ │
│  │  │   Auth      │  │   Trip      │  │   Report    │  │   Vehicle     │  │ │
│  │  │   Service   │  │   Service   │  │   Service   │  │   Service     │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────────┘  │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │ │
│  │  │   HMRC      │  │   GPS       │  │   Receipt   │  │  Integration  │  │ │
│  │  │ Calculator  │  │  Service    │  │   Service   │  │   Service     │  │ │
│  │  │  (Future)   │  │  (Future)   │  │  (Future)   │  │  (Future)     │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────────────────┐
│                      DATA LAYER                                              │
│  ┌────────────────────────┼────────────────────────────────────────────────┐ │
│  │                        ▼                                                │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │  │              PostgreSQL Database (Neon Serverless)               │   │ │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐│   │ │
│  │  │  │  users  │  │  trips  │  │ vehicles│  │ reports │  │settings││   │ │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └────────┘│   │ │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │   │ │
│  │  │  │receipts │  │  audit  │  │  logs   │  │companies│ (Future)   │   │ │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  AWS S3 /   │  │   HMRC      │  │  Xero API   │  │  QuickBooks API     │ │
│  │ Cloudflare  │  │   API       │  │  (Future)   │  │    (Future)         │ │
│  │    R2       │  │  (Future)   │  │             │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema (PostgreSQL)

### 3.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │     trips       │       │    vehicles     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ PK id           │◄──────┤ FK user_id      │       │ PK id           │
│    email        │       │ FK vehicle_id   │──────►│ FK user_id      │
│    password_hash│       │    date         │       │    name         │
│    first_name   │       │    start_loc    │       │    registration │
│    last_name    │       │    end_loc      │       │    fuel_type    │
│    role         │       │    distance_miles│      │    is_active    │
│    company_id   │────┐  │    purpose      │       │    created_at   │
│    is_active    │    │  │    rate_applied │       └─────────────────┘
│    created_at   │    │  │    amount_gbp   │
└─────────────────┘    │  │    created_at   │
                       │  └─────────────────┘
                       │
                       │  ┌─────────────────┐       ┌─────────────────┐
                       │  │    reports      │       │    receipts     │
                       │  ├─────────────────┤       ├─────────────────┤
                       │  │ PK id           │       │ PK id           │
                       └──┤ FK user_id      │       │ FK trip_id      │
                          │    name         │       │    filename     │
                          │    date_from    │       │    file_url     │
                          │    date_to      │       │    file_type    │
                          │    format       │       │    file_size    │
                          │    download_url │       │    uploaded_at  │
                          │    expires_at   │       └─────────────────┘
                          │    created_at   │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    companies    │       │  mileage_rates  │       │  audit_logs     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ PK id           │       │ PK id           │       │ PK id           │
│    name         │       │    year         │       │ FK user_id      │
│    address      │       │    rate_1st_10k │       │    action       │
│    vat_number   │       │    rate_over_10k│       │    entity_type  │
│    cis_number   │       │    is_active    │       │    entity_id    │
│    created_at   │       │    created_at   │       │    old_data     │
└─────────────────┘       └─────────────────┘       │    new_data     │
                                                    │    created_at   │
                                                    └─────────────────┘
```

### 3.2 Table Definitions

#### users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email (login) |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| first_name | VARCHAR(100) | NOT NULL | First name |
| last_name | VARCHAR(100) | NOT NULL | Last name |
| role | VARCHAR(20) | DEFAULT 'user' | admin, user, accountant |
| company_id | UUID | FK → companies | Optional company association |
| phone | VARCHAR(20) | NULL | Contact number |
| is_active | BOOLEAN | DEFAULT true | Account status |
| email_verified | BOOLEAN | DEFAULT false | Email verification status |
| last_login_at | TIMESTAMP | NULL | Last login timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Registration date |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

#### trips
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Trip identifier |
| user_id | UUID | FK → users, NOT NULL | Trip owner |
| vehicle_id | UUID | FK → vehicles, NULL | Associated vehicle |
| trip_date | DATE | NOT NULL | Date of trip |
| start_location | VARCHAR(255) | NOT NULL | Starting point |
| end_location | VARCHAR(255) | NOT NULL | Destination |
| start_postcode | VARCHAR(10) | NULL | Start postcode |
| end_postcode | VARCHAR(10) | NULL | End postcode |
| distance_miles | DECIMAL(8,2) | NOT NULL | Distance traveled |
| purpose | VARCHAR(255) | NOT NULL | Business purpose |
| purpose_category | VARCHAR(50) | NULL | Category (site_visit, meeting, etc.) |
| rate_applied | DECIMAL(4,2) | NOT NULL | HMRC rate used (0.45 or 0.25) |
| amount_gbp | DECIMAL(10,2) | NOT NULL | Calculated claim amount |
| is_round_trip | BOOLEAN | DEFAULT false | Return journey |
| notes | TEXT | NULL | Additional notes |
| gps_data | JSONB | NULL | GPS coordinates (future) |
| created_at | TIMESTAMP | DEFAULT NOW() | Record created |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last modified |

#### vehicles
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Vehicle identifier |
| user_id | UUID | FK → users, NOT NULL | Vehicle owner |
| name | VARCHAR(100) | NOT NULL | Vehicle nickname |
| registration | VARCHAR(20) | UNIQUE | License plate |
| make | VARCHAR(50) | NULL | Manufacturer |
| model | VARCHAR(50) | NULL | Model name |
| fuel_type | VARCHAR(20) | NULL | petrol, diesel, electric, hybrid |
| engine_size | VARCHAR(10) | NULL | Engine capacity |
| year | INTEGER | NULL | Year of manufacture |
| is_company_car | BOOLEAN | DEFAULT false | Company vehicle flag |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Added date |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

#### reports
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Report identifier |
| user_id | UUID | FK → users, NOT NULL | Report owner |
| name | VARCHAR(255) | NOT NULL | Report name |
| date_from | DATE | NOT NULL | Report start date |
| date_to | DATE | NOT NULL | Report end date |
| format | VARCHAR(10) | NOT NULL | pdf, csv, excel |
| total_miles | DECIMAL(10,2) | NOT NULL | Total miles in report |
| total_amount | DECIMAL(10,2) | NOT NULL | Total claim amount |
| trip_count | INTEGER | NOT NULL | Number of trips |
| filters | JSONB | NULL | Applied filters |
| file_url | VARCHAR(500) | NULL | S3/R2 file location |
| download_url | VARCHAR(500) | NULL | Temporary download URL |
| expires_at | TIMESTAMP | NULL | Download expiry |
| created_at | TIMESTAMP | DEFAULT NOW() | Generated date |

#### receipts
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Receipt identifier |
| trip_id | UUID | FK → trips, NULL | Associated trip |
| user_id | UUID | FK → users, NOT NULL | Owner |
| filename | VARCHAR(255) | NOT NULL | Original filename |
| storage_key | VARCHAR(500) | NOT NULL | S3/R2 object key |
| file_url | VARCHAR(500) | NOT NULL | Public/private URL |
| file_type | VARCHAR(50) | NOT NULL | MIME type |
| file_size | INTEGER | NOT NULL | Size in bytes |
| description | TEXT | NULL | User description |
| ocr_data | JSONB | NULL | Extracted text (future) |
| uploaded_at | TIMESTAMP | DEFAULT NOW() | Upload timestamp |

#### mileage_rates (HMRC rates)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Rate identifier |
| tax_year | VARCHAR(10) | NOT NULL | e.g., "2024-25" |
| vehicle_type | VARCHAR(20) | NOT NULL | car, van, motorcycle |
| rate_first_10000 | DECIMAL(4,2) | NOT NULL | Rate for first 10k miles |
| rate_over_10000 | DECIMAL(4,2) | NOT NULL | Rate after 10k miles |
| is_active | BOOLEAN | DEFAULT true | Current rate flag |
| effective_from | DATE | NOT NULL | When rate applies from |
| created_at | TIMESTAMP | DEFAULT NOW() | Record date |

#### companies
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Company identifier |
| name | VARCHAR(255) | NOT NULL | Company name |
| address_line1 | VARCHAR(255) | NULL | Address |
| address_line2 | VARCHAR(255) | NULL | Address continued |
| city | VARCHAR(100) | NULL | City |
| postcode | VARCHAR(10) | NULL | Postcode |
| vat_number | VARCHAR(20) | NULL | VAT registration |
| cis_number | VARCHAR(20) | NULL | CIS registration number |
| contact_email | VARCHAR(255) | NULL | Contact email |
| contact_phone | VARCHAR(20) | NULL | Contact phone |
| created_at | TIMESTAMP | DEFAULT NOW() | Created date |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

#### audit_logs
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Log identifier |
| user_id | UUID | FK → users, NULL | Acting user |
| action | VARCHAR(50) | NOT NULL | CREATE, UPDATE, DELETE, LOGIN |
| entity_type | VARCHAR(50) | NOT NULL | Table name |
| entity_id | UUID | NULL | Affected record ID |
| old_data | JSONB | NULL | Previous values |
| new_data | JSONB | NULL | New values |
| ip_address | INET | NULL | Client IP |
| user_agent | TEXT | NULL | Browser info |
| created_at | TIMESTAMP | DEFAULT NOW() | Event timestamp |

### 3.3 Indexes

```sql
-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_role ON users(role);

-- Trips indexes
CREATE INDEX idx_trips_user_date ON trips(user_id, trip_date DESC);
CREATE INDEX idx_trips_date_range ON trips(trip_date);
CREATE INDEX idx_trips_user_vehicle ON trips(user_id, vehicle_id);

-- Reports indexes
CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_reports_date_range ON reports(date_from, date_to);

-- Audit logs indexes
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- Receipts indexes
CREATE INDEX idx_receipts_trip ON receipts(trip_id);
CREATE INDEX idx_receipts_user ON receipts(user_id);
```

---

## 4. API Endpoint Specification

### 4.1 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /api/auth/register | Register new user | No |
| POST | /api/auth/login | User login | No |
| POST | /api/auth/logout | User logout | Yes |
| POST | /api/auth/refresh | Refresh JWT token | Yes |
| POST | /api/auth/forgot-password | Request password reset | No |
| POST | /api/auth/reset-password | Reset password with token | No |
| GET | /api/auth/me | Get current user | Yes |
| PUT | /api/auth/me | Update profile | Yes |
| PUT | /api/auth/change-password | Change password | Yes |

### 4.2 Trip Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /api/trips | List user's trips | Yes |
| POST | /api/trips | Create new trip | Yes |
| GET | /api/trips/:id | Get trip details | Yes |
| PUT | /api/trips/:id | Update trip | Yes |
| DELETE | /api/trips/:id | Delete trip | Yes |
| GET | /api/trips/stats | Get mileage statistics | Yes |
| POST | /api/trips/bulk | Bulk import trips | Yes |

### 4.3 Vehicle Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /api/vehicles | List user's vehicles | Yes |
| POST | /api/vehicles | Add new vehicle | Yes |
| GET | /api/vehicles/:id | Get vehicle details | Yes |
| PUT | /api/vehicles/:id | Update vehicle | Yes |
| DELETE | /api/vehicles/:id | Delete vehicle | Yes |

### 4.4 Report Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /api/reports | List generated reports | Yes |
| POST | /api/reports | Generate new report | Yes |
| GET | /api/reports/:id | Get report details | Yes |
| GET | /api/reports/:id/download | Download report file | Yes |
| DELETE | /api/reports/:id | Delete report | Yes |

### 4.5 Receipt Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /api/receipts | Upload receipt | Yes |
| GET | /api/receipts | List receipts | Yes |
| GET | /api/receipts/:id | Get receipt | Yes |
| DELETE | /api/receipts/:id | Delete receipt | Yes |
| POST | /api/receipts/:id/attach | Attach to trip | Yes |

### 4.6 Admin Endpoints (Admin only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /api/admin/users | List all users | Admin |
| GET | /api/admin/users/:id | Get user details | Admin |
| PUT | /api/admin/users/:id | Update user | Admin |
| DELETE | /api/admin/users/:id | Delete user | Admin |
| GET | /api/admin/stats | System statistics | Admin |
| GET | /api/admin/audit-logs | View audit logs | Admin |

---

## 5. Folder Structure

```
mileage-app/
├── README.md
├── .env.example
├── .gitignore
├── docker-compose.yml                 # Local development
│
├── client/                            # React Frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   │
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── manifest.json              # PWA manifest
│   │   └── icons/
│   │
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       │
│       ├── api/                       # API client
│       │   ├── axiosConfig.js
│       │   ├── authApi.js
│       │   ├── tripsApi.js
│       │   ├── vehiclesApi.js
│       │   ├── reportsApi.js
│       │   └── receiptsApi.js
│       │
│       ├── components/                # Reusable components
│       │   ├── common/
│       │   │   ├── Button.jsx
│       │   │   ├── Input.jsx
│       │   │   ├── Select.jsx
│       │   │   ├── Card.jsx
│       │   │   ├── Modal.jsx
│       │   │   ├── Loading.jsx
│       │   │   └── ErrorBoundary.jsx
│       │   │
│       │   ├── layout/
│       │   │   ├── Header.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   ├── Footer.jsx
│       │   │   ├── Layout.jsx
│       │   │   └── MobileNav.jsx
│       │   │
│       │   ├── forms/
│       │   │   ├── TripForm.jsx
│       │   │   ├── VehicleForm.jsx
│       │   │   ├── LoginForm.jsx
│       │   │   ├── RegisterForm.jsx
│       │   │   └── ReportFilterForm.jsx
│       │   │
│       │   └── trips/
│       │       ├── TripList.jsx
│       │       ├── TripCard.jsx
│       │       ├── TripDetail.jsx
│       │       └── TripStats.jsx
│       │
│       ├── hooks/                     # Custom hooks
│       │   ├── useAuth.js
│       │   ├── useTrips.js
│       │   ├── useVehicles.js
│       │   ├── useReports.js
│       │   ├── useLocalStorage.js
│       │   └── useMediaQuery.js
│       │
│       ├── context/                   # React context
│       │   ├── AuthContext.jsx
│       │   └── ThemeContext.jsx
│       │
│       ├── pages/                     # Page components
│       │   ├── public/
│       │   │   ├── Home.jsx
│       │   │   ├── Login.jsx
│       │   │   ├── Register.jsx
│       │   │   ├── ForgotPassword.jsx
│       │   │   └── ResetPassword.jsx
│       │   │
│       │   ├── private/
│       │   │   ├── Dashboard.jsx
│       │   │   ├── Trips.jsx
│       │   │   ├── TripNew.jsx
│       │   │   ├── TripEdit.jsx
│       │   │   ├── Vehicles.jsx
│       │   │   ├── Reports.jsx
│       │   │   ├── Settings.jsx
│       │   │   └── Profile.jsx
│       │   │
│       │   └── admin/
│       │       ├── AdminDashboard.jsx
│       │       ├── Users.jsx
│       │       └── AuditLogs.jsx
│       │
│       ├── utils/                     # Utilities
│       │   ├── validators.js
│       │   ├── formatters.js
│       │   ├── calculations.js        # HMRC calculations
│       │   ├── constants.js
│       │   └── helpers.js
│       │
│       └── styles/                    # Additional styles
│           └── components.css
│
├── server/                            # Node.js Backend
│   ├── package.json
│   ├── server.js                      # Entry point
│   ├── app.js                         # Express app setup
│   │
│   ├── config/
│   │   ├── database.js                # DB connection
│   │   ├── redis.js                   # Redis (future caching)
│   │   └── s3.js                      # S3/R2 config
│   │
│   ├── middleware/
│   │   ├── auth.js                    # JWT verification
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   ├── validator.js
│   │   ├── upload.js                  # File upload handling
│   │   └── auditLogger.js
│   │
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   ├── trips.routes.js
│   │   ├── vehicles.routes.js
│   │   ├── reports.routes.js
│   │   ├── receipts.routes.js
│   │   └── admin.routes.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── trips.controller.js
│   │   ├── vehicles.controller.js
│   │   ├── reports.controller.js
│   │   ├── receipts.controller.js
│   │   └── admin.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── trips.service.js
│   │   ├── vehicles.service.js
│   │   ├── reports.service.js
│   │   ├── receipts.service.js
│   │   ├── hmrcCalculator.service.js
│   │   ├── pdfGenerator.service.js
│   │   ├── csvExport.service.js
│   │   └── email.service.js
│   │
│   ├── models/
│   │   ├── index.js
│   │   ├── user.model.js
│   │   ├── trip.model.js
│   │   ├── vehicle.model.js
│   │   ├── report.model.js
│   │   ├── receipt.model.js
│   │   └── auditLog.model.js
│   │
│   ├── utils/
│   │   ├── logger.js
│   │   ├── helpers.js
│   │   ├── constants.js
│   │   └── validators.js
│   │
│   └── jobs/
│       ├── cleanupReports.js          # Delete expired reports
│       └── sendReminders.js           # Future: email reminders
│
├── database/                          # Database files
│   ├── schema.sql
│   ├── seeds.sql
│   └── migrations/
│       ├── 001_initial.sql
│       └── 002_add_receipts.sql
│
├── docs/                              # Documentation
│   ├── api-spec.md
│   ├── deployment.md
│   └── user-guide.md
│
└── scripts/                           # Utility scripts
    ├── deploy.sh
    ├── backup.sh
    └── seed-data.js
```

---

## 6. Environment Variables

### 6.1 Server (.env)

```bash
# ============================================
# Application Configuration
# ============================================
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

# ============================================
# Database Configuration (Neon PostgreSQL)
# ============================================
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
DATABASE_SSL=true

# ============================================
# JWT Configuration
# ============================================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ============================================
# Password Security
# ============================================
BCRYPT_ROUNDS=12

# ============================================
# Email Configuration (SendGrid/AWS SES)
# ============================================
EMAIL_SERVICE=sendgrid
EMAIL_FROM=noreply@mileagetracker.co.uk
SENDGRID_API_KEY=SG.xxx

# AWS SES Alternative
# AWS_REGION=eu-west-2
# AWS_ACCESS_KEY_ID=xxx
# AWS_SECRET_ACCESS_KEY=xxx

# ============================================
# File Storage (AWS S3 or Cloudflare R2)
# ============================================
STORAGE_PROVIDER=s3
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
S3_BUCKET_NAME=mileage-app-receipts
S3_BUCKET_URL=https://mileage-app-receipts.s3.eu-west-2.amazonaws.com

# Cloudflare R2 Alternative
# STORAGE_PROVIDER=r2
# R2_ACCOUNT_ID=xxx
# R2_ACCESS_KEY_ID=xxx
# R2_SECRET_ACCESS_KEY=xxx
# R2_BUCKET_NAME=mileage-app-receipts
# R2_PUBLIC_URL=https://pub-xxx.r2.dev

# ============================================
# Rate Limiting
# ============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# HMRC Configuration
# ============================================
HMRC_RATE_FIRST_10000=0.45
HMRC_RATE_OVER_10000=0.25
CURRENT_TAX_YEAR=2024-25

# ============================================
# Report Generation
# ============================================
REPORT_EXPIRY_DAYS=30
MAX_REPORT_SIZE_MB=10

# ============================================
# Logging
# ============================================
LOG_LEVEL=info
LOG_FILE=logs/app.log

# ============================================
# Security
# ============================================
CORS_ORIGIN=http://localhost:5173
HELMET_ENABLED=true
```

### 6.2 Client (.env)

```bash
# ============================================
# API Configuration
# ============================================
VITE_API_URL=http://localhost:5000/api

# ============================================
# App Configuration
# ============================================
VITE_APP_NAME=Mileage Tracker
VITE_APP_VERSION=1.0.0
VITE_ENABLE_PWA=false

# ============================================
# Feature Flags
# ============================================
VITE_FEATURE_RECEIPTS=true
VITE_FEATURE_GPS_TRACKING=false
VITE_FEATURE_XERO_INTEGRATION=false
VITE_FEATURE_QUICKBOOKS_INTEGRATION=false
```

---

## 7. HMRC Compliance Notes

### 7.1 Mileage Rates (2024-25 Tax Year)

| Vehicle Type | First 10,000 Miles | Over 10,000 Miles |
|--------------|-------------------|-------------------|
| Cars & Vans | 45p per mile | 25p per mile |
| Motorcycles | 24p per mile | 24p per mile |
| Bicycles | 20p per mile | 20p per mile |

### 7.2 Required Record Fields

Per HMRC requirements, each mileage claim must include:
- Date of journey
- Start and end locations (with postcodes recommended)
- Purpose of business travel
- Total miles traveled
- Calculation method (45p/25p rate)

### 7.3 CIS Considerations

- CIS contractors can claim mileage as a business expense
- Records must be kept for 6 years
- Monthly/weekly reports align with CIS return periods
- Integration with CIS300 returns (future feature)

---

## 8. Scalability & Future Features

### 8.1 Phase 1 (MVP) - Current
- User auth & basic trip recording
- HMRC rate calculations
- PDF/CSV reports
- Mobile-first responsive UI

### 8.2 Phase 2 (Near-term)
- GPS tracking for automatic mileage
- Receipt photo upload
- Multiple vehicle support
- Accountant portal access

### 8.3 Phase 3 (Future)
- Xero/QuickBooks integration
- CIS300 return integration
- AI-powered receipt OCR
- Route optimization
- Team/company management

### 8.4 Scalability Considerations

1. **Database**: Neon serverless scales automatically
2. **API**: Stateless design allows horizontal scaling on Render
3. **File Storage**: S3/R2 handles unlimited growth
4. **Caching**: Redis can be added for session/API caching
5. **CDN**: Cloudflare for static assets

---

## 9. Security Checklist

- [x] JWT authentication with refresh tokens
- [x] Password hashing with bcrypt (12 rounds)
- [x] Input validation on all endpoints
- [x] Rate limiting to prevent abuse
- [x] Helmet.js for security headers
- [x] CORS configuration
- [x] SQL injection prevention (parameterized queries)
- [x] XSS protection
- [x] Audit logging for all data changes
- [x] HTTPS enforcement in production
- [x] Secure file upload (type/size validation)
- [x] Environment variable separation

---

*Document Version: 1.0*
*Last Updated: 2024*
*Author: System Architecture Team*
