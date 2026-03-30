# UK Business Mileage Tracker - REST API Specification

## Base URL

```
Production:  https://api.mileagetracker.co.uk/api
Development: http://localhost:5000/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

---

## 1. Authentication Endpoints

### 1.1 Register User

```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Smith",
  "phone": "07700 900000",
  "companyId": "uuid-here" // Optional
}
```

**Validation Rules:**
- Email: Valid email format, unique
- Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- First/Last name: 2-100 characters
- Phone: Valid UK phone format (optional)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Smith",
      "role": "user",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }
  }
}
```

**Error Responses:**
- `400` - Validation error
- `409` - Email already exists
- `500` - Server error

---

### 1.2 Login

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Smith",
      "role": "user",
      "companyId": null,
      "lastLoginAt": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }
  }
}
```

**Error Responses:**
- `400` - Invalid credentials format
- `401` - Invalid email or password
- `403` - Account disabled
- `429` - Too many login attempts

---

### 1.3 Logout

```http
POST /auth/logout
Authorization: Bearer <access_token>
```

**Request Body (optional):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..." // Optional: revoke specific refresh token
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 1.4 Refresh Token

```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

**Error Responses:**
- `401` - Invalid or expired refresh token

---

### 1.5 Forgot Password

```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "If an account exists, a password reset email has been sent"
}
```

> Note: Always return success to prevent email enumeration attacks

---

### 1.6 Reset Password

```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

### 1.7 Get Current User

```http
GET /auth/me
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "role": "user",
    "phone": "07700 900000",
    "companyId": null,
    "preferences": {
      "defaultVehicle": "uuid-here",
      "dateFormat": "DD/MM/YYYY",
      "currency": "GBP"
    },
    "emailVerified": true,
    "lastLoginAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### 1.8 Update Profile

```http
PUT /auth/me
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "07700 900001",
  "preferences": {
    "defaultVehicle": "uuid-here",
    "dateFormat": "DD/MM/YYYY"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "John",
    "lastName": "Smith",
    "phone": "07700 900001",
    "preferences": {
      "defaultVehicle": "uuid-here",
      "dateFormat": "DD/MM/YYYY",
      "currency": "GBP"
    },
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

---

### 1.9 Change Password

```http
PUT /auth/change-password
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 2. Trip Management Endpoints

### 2.1 List Trips

```http
GET /trips
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (default: 20, max: 100) |
| startDate | date | Filter from date (YYYY-MM-DD) |
| endDate | date | Filter to date (YYYY-MM-DD) |
| vehicleId | uuid | Filter by vehicle |
| purpose | string | Filter by purpose category |
| search | string | Search in locations/purpose |
| sortBy | string | Sort field (default: tripDate) |
| sortOrder | string | asc or desc (default: desc) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "trips": [
      {
        "id": "trip-uuid-1",
        "tripDate": "2024-01-15",
        "startLocation": "Manchester Office",
        "endLocation": "Leeds Site",
        "startPostcode": "M1 1AA",
        "endPostcode": "LS1 1AA",
        "distanceMiles": 45.50,
        "isRoundTrip": false,
        "purpose": "Site inspection for new project",
        "purposeCategory": "site_visit",
        "rateApplied": 0.45,
        "amountGbp": 20.48,
        "vehicle": {
          "id": "vehicle-uuid",
          "name": "Work Van",
          "registration": "AB12 CDE"
        },
        "notes": "Met with site manager",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "summary": {
      "totalMiles": 1250.50,
      "totalAmount": 562.73,
      "tripCount": 45
    }
  }
}
```

---

### 2.2 Create Trip

```http
POST /trips
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "tripDate": "2024-01-15",
  "startLocation": "Manchester Office",
  "endLocation": "Leeds Site",
  "startPostcode": "M1 1AA",
  "endPostcode": "LS1 1AA",
  "distanceMiles": 45.50,
  "isRoundTrip": false,
  "purpose": "Site inspection for new project",
  "purposeCategory": "site_visit",
  "vehicleId": "vehicle-uuid", // Optional
  "notes": "Met with site manager"
}
```

**Purpose Categories:**
- `site_visit` - Site visits and inspections
- `client_meeting` - Client meetings
- `supplier_visit` - Supplier visits
- `training` - Training courses
- `conference` - Conferences and events
- `business_trip` - General business travel
- `commute` - Commuting (if claimable)
- `other` - Other purposes

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Trip created successfully",
  "data": {
    "id": "trip-uuid-new",
    "tripDate": "2024-01-15",
    "startLocation": "Manchester Office",
    "endLocation": "Leeds Site",
    "distanceMiles": 45.50,
    "rateApplied": 0.45,
    "amountGbp": 20.48,
    "userMilesYtd": 145.50,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Unauthorized

---

### 2.3 Get Trip Details

```http
GET /trips/:id
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "trip-uuid-1",
    "userId": "user-uuid",
    "tripDate": "2024-01-15",
    "startLocation": "Manchester Office",
    "endLocation": "Leeds Site",
    "startPostcode": "M1 1AA",
    "endPostcode": "LS1 1AA",
    "distanceMiles": 45.50,
    "isRoundTrip": false,
    "purpose": "Site inspection for new project",
    "purposeCategory": "site_visit",
    "taxYear": "2024-25",
    "vehicleType": "van",
    "rateApplied": 0.45,
    "amountGbp": 20.48,
    "userMilesYtd": 145.50,
    "vehicle": {
      "id": "vehicle-uuid",
      "name": "Work Van",
      "registration": "AB12 CDE",
      "make": "Ford",
      "model": "Transit"
    },
    "notes": "Met with site manager",
    "receipts": [],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 2.4 Update Trip

```http
PUT /trips/:id
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "tripDate": "2024-01-15",
  "startLocation": "Manchester Office",
  "endLocation": "Leeds Site",
  "distanceMiles": 50.00, // Updated
  "purpose": "Updated purpose",
  "notes": "Updated notes"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Trip updated successfully",
  "data": {
    "id": "trip-uuid-1",
    "distanceMiles": 50.00,
    "rateApplied": 0.45,
    "amountGbp": 22.50,
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

---

### 2.5 Delete Trip

```http
DELETE /trips/:id
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Trip deleted successfully"
}
```

---

### 2.6 Get Trip Statistics

```http
GET /trips/stats
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| taxYear | string | Tax year (e.g., "2024-25") |
| startDate | date | Start date filter |
| endDate | date | End date filter |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "taxYear": "2024-25",
    "totalMiles": 1250.50,
    "totalAmount": 562.73,
    "tripCount": 45,
    "breakdown": {
      "at45p": {
        "miles": 10000.00,
        "amount": 4500.00
      },
      "at25p": {
        "miles": 250.50,
        "amount": 62.63
      }
    },
    "byCategory": {
      "site_visit": { "count": 20, "miles": 500.00, "amount": 225.00 },
      "client_meeting": { "count": 15, "miles": 450.00, "amount": 202.50 },
      "supplier_visit": { "count": 10, "miles": 300.50, "amount": 135.23 }
    },
    "byMonth": [
      { "month": "2024-01", "miles": 250.50, "amount": 112.73, "count": 10 },
      { "month": "2024-02", "miles": 300.00, "amount": 135.00, "count": 12 },
      { "month": "2024-03", "miles": 700.00, "amount": 315.00, "count": 23 }
    ]
  }
}
```

---

### 2.7 Bulk Import Trips

```http
POST /trips/bulk
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request:**
```
file: CSV file with columns: tripDate, startLocation, endLocation, distanceMiles, purpose
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "imported": 48,
    "failed": 2,
    "errors": [
      { "row": 5, "error": "Invalid date format" },
      { "row": 23, "error": "Distance must be positive" }
    ]
  }
}
```

---

## 3. Vehicle Endpoints

### 3.1 List Vehicles

```http
GET /vehicles
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| includeInactive | boolean | Include inactive vehicles |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "vehicles": [
      {
        "id": "vehicle-uuid-1",
        "name": "Work Van",
        "registration": "AB12 CDE",
        "make": "Ford",
        "model": "Transit",
        "fuelType": "diesel",
        "year": 2022,
        "isCompanyCar": true,
        "isActive": true,
        "tripCount": 45,
        "totalMiles": 1250.50,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### 3.2 Create Vehicle

```http
POST /vehicles
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Work Van",
  "registration": "AB12 CDE",
  "make": "Ford",
  "model": "Transit",
  "fuelType": "diesel",
  "engineSize": "2.0",
  "year": 2022,
  "color": "White",
  "isCompanyCar": true,
  "notes": "Main work vehicle"
}
```

**Fuel Types:**
- `petrol`
- `diesel`
- `electric`
- `hybrid`
- `plugin_hybrid`

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Vehicle created successfully",
  "data": {
    "id": "vehicle-uuid-new",
    "name": "Work Van",
    "registration": "AB12 CDE",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 3.3 Get Vehicle Details

```http
GET /vehicles/:id
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "vehicle-uuid-1",
    "name": "Work Van",
    "registration": "AB12 CDE",
    "make": "Ford",
    "model": "Transit",
    "fuelType": "diesel",
    "engineSize": "2.0",
    "year": 2022,
    "color": "White",
    "isCompanyCar": true,
    "isActive": true,
    "notes": "Main work vehicle",
    "stats": {
      "tripCount": 45,
      "totalMiles": 1250.50,
      "totalAmount": 562.73,
      "lastTripDate": "2024-01-15"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 3.4 Update Vehicle

```http
PUT /vehicles/:id
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Updated Van Name",
  "isActive": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Vehicle updated successfully",
  "data": {
    "id": "vehicle-uuid-1",
    "name": "Updated Van Name",
    "isActive": false,
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

---

### 3.5 Delete Vehicle

```http
DELETE /vehicles/:id
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Vehicle deleted successfully"
}
```

> Note: Cannot delete vehicle with associated trips (trips will have vehicle_id set to NULL)

---

## 4. Report Endpoints

### 4.1 List Reports

```http
GET /reports
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number |
| limit | integer | Items per page |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "report-uuid-1",
        "name": "January 2024 Mileage",
        "description": "Monthly mileage report",
        "reportType": "mileage",
        "dateFrom": "2024-01-01",
        "dateTo": "2024-01-31",
        "taxYear": "2024-25",
        "format": "pdf",
        "totalMiles": 250.50,
        "totalAmount": 112.73,
        "tripCount": 10,
        "status": "completed",
        "downloadUrl": "https://...",
        "expiresAt": "2024-02-15T00:00:00Z",
        "createdAt": "2024-01-31T23:59:59Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5
    }
  }
}
```

---

### 4.2 Generate Report

```http
POST /reports
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Q1 2024 Mileage Report",
  "description": "Quarterly report for accountant",
  "reportType": "mileage",
  "dateFrom": "2024-01-01",
  "dateTo": "2024-03-31",
  "format": "pdf",
  "filters": {
    "vehicleId": null,
    "purposeCategory": null,
    "includeReceipts": true
  }
}
```

**Report Types:**
- `mileage` - Detailed trip list
- `expense` - Expense summary with receipts
- `summary` - Summary statistics
- `tax` - HMRC tax submission format

**Formats:**
- `pdf` - PDF document
- `csv` - CSV spreadsheet
- `excel` - Excel file (future)

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Report generation started",
  "data": {
    "id": "report-uuid-new",
    "name": "Q1 2024 Mileage Report",
    "status": "processing",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 4.3 Get Report Details

```http
GET /reports/:id
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "report-uuid-1",
    "name": "Q1 2024 Mileage Report",
    "description": "Quarterly report for accountant",
    "reportType": "mileage",
    "dateFrom": "2024-01-01",
    "dateTo": "2024-03-31",
    "taxYear": "2024-25",
    "format": "pdf",
    "totalMiles": 750.50,
    "totalAmount": 337.73,
    "tripCount": 30,
    "filters": {
      "vehicleId": null,
      "purposeCategory": null
    },
    "status": "completed",
    "fileUrl": "https://storage...",
    "downloadUrl": "https://download...",
    "expiresAt": "2024-04-15T00:00:00Z",
    "createdAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:31:00Z"
  }
}
```

---

### 4.4 Download Report

```http
GET /reports/:id/download
Authorization: Bearer <access_token>
```

**Response:**
- `200` - File download (Content-Disposition: attachment)
- `404` - Report not found or expired

---

### 4.5 Delete Report

```http
DELETE /reports/:id
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Report deleted successfully"
}
```

---

## 5. Receipt Endpoints

### 5.1 Upload Receipt

```http
POST /receipts
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request:**
```
file: Image/PDF file (max 10MB)
description: "Fuel receipt for Leeds trip"
expenseDate: "2024-01-15"
expenseAmount: 45.50
expenseCategory: "fuel"
```

**Supported Formats:**
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Receipt uploaded successfully",
  "data": {
    "id": "receipt-uuid-new",
    "filename": "receipt_20240115.jpg",
    "fileUrl": "https://storage.../receipt_20240115.jpg",
    "fileType": "image/jpeg",
    "fileSize": 2457600,
    "description": "Fuel receipt for Leeds trip",
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 5.2 List Receipts

```http
GET /receipts
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| tripId | uuid | Filter by associated trip |
| page | integer | Page number |
| limit | integer | Items per page |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "receipts": [
      {
        "id": "receipt-uuid-1",
        "filename": "receipt_20240115.jpg",
        "fileUrl": "https://storage...",
        "fileType": "image/jpeg",
        "fileSize": 2457600,
        "description": "Fuel receipt",
        "expenseDate": "2024-01-15",
        "expenseAmount": 45.50,
        "tripId": "trip-uuid-1",
        "uploadedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15
    }
  }
}
```

---

### 5.3 Get Receipt

```http
GET /receipts/:id
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "receipt-uuid-1",
    "filename": "receipt_20240115.jpg",
    "originalFilename": "IMG_1234.jpg",
    "fileUrl": "https://storage...",
    "fileType": "image/jpeg",
    "fileSize": 2457600,
    "description": "Fuel receipt for Leeds trip",
    "expenseDate": "2024-01-15",
    "expenseAmount": 45.50,
    "expenseCategory": "fuel",
    "tripId": "trip-uuid-1",
    "ocrData": null,
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 5.4 Attach Receipt to Trip

```http
POST /receipts/:id/attach
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "tripId": "trip-uuid-1"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Receipt attached to trip successfully",
  "data": {
    "id": "receipt-uuid-1",
    "tripId": "trip-uuid-1"
  }
}
```

---

### 5.5 Delete Receipt

```http
DELETE /receipts/:id
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Receipt deleted successfully"
}
```

---

## 6. Admin Endpoints

### 6.1 List All Users

```http
GET /admin/users
Authorization: Bearer <access_token>  // Admin only
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number |
| limit | integer | Items per page |
| role | string | Filter by role |
| search | string | Search by name/email |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-uuid-1",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Smith",
        "role": "user",
        "companyId": null,
        "isActive": true,
        "tripCount": 45,
        "totalMiles": 1250.50,
        "lastLoginAt": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

---

### 6.2 Get User Details (Admin)

```http
GET /admin/users/:id
Authorization: Bearer <access_token>  // Admin only
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid-1",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "role": "user",
    "companyId": null,
    "phone": "07700 900000",
    "isActive": true,
    "emailVerified": true,
    "preferences": {},
    "stats": {
      "tripCount": 45,
      "totalMiles": 1250.50,
      "totalAmount": 562.73,
      "vehicleCount": 2
    },
    "lastLoginAt": "2024-01-15T10:30:00Z",
    "loginCount": 50,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 6.3 Update User (Admin)

```http
PUT /admin/users/:id
Authorization: Bearer <access_token>  // Admin only
```

**Request Body:**
```json
{
  "role": "accountant",
  "isActive": false,
  "companyId": "company-uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "user-uuid-1",
    "role": "accountant",
    "isActive": false,
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

---

### 6.4 Delete User (Admin)

```http
DELETE /admin/users/:id
Authorization: Bearer <access_token>  // Admin only
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### 6.5 Get System Statistics

```http
GET /admin/stats
Authorization: Bearer <access_token>  // Admin only
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 150,
      "active": 140,
      "inactive": 10,
      "byRole": {
        "admin": 2,
        "user": 145,
        "accountant": 3
      }
    },
    "trips": {
      "total": 5000,
      "thisMonth": 450,
      "totalMiles": 125000.50
    },
    "reports": {
      "total": 300,
      "thisMonth": 25
    },
    "storage": {
      "receiptsCount": 500,
      "totalSize": "2.5 GB"
    }
  }
}
```

---

### 6.6 Get Audit Logs

```http
GET /admin/audit-logs
Authorization: Bearer <access_token>  // Admin only
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | uuid | Filter by user |
| action | string | Filter by action |
| entityType | string | Filter by entity type |
| startDate | date | Start date |
| endDate | date | End date |
| page | integer | Page number |
| limit | integer | Items per page |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log-uuid-1",
        "userId": "user-uuid-1",
        "userEmail": "user@example.com",
        "action": "CREATE",
        "entityType": "trips",
        "entityId": "trip-uuid-1",
        "oldData": null,
        "newData": {"distance": 45.50},
        "ipAddress": "192.168.1.100",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1000
    }
  }
}
```

---

## 7. Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 202 | Accepted (async processing) |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Business logic error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_ERROR` | Invalid credentials |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `RESOURCE_EXISTS` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `FILE_TOO_LARGE` | Uploaded file exceeds size limit |
| `INVALID_FILE_TYPE` | Unsupported file type |
| `TRIP_DATE_FUTURE` | Trip date cannot be in the future |
| `REPORT_EXPIRED` | Report download link expired |

---

## 8. Rate Limiting

| Endpoint | Limit |
|----------|-------|
| POST /auth/login | 5 requests per minute |
| POST /auth/register | 3 requests per minute |
| All other endpoints | 100 requests per 15 minutes |

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642341600
```

---

## 9. API Versioning

Current version: **v1**

Version is specified in the URL path:
```
/api/v1/trips
```

---

*API Specification Version: 1.0*
*Last Updated: 2024*
