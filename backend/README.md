# UK Business Mileage Tracker - Backend API

A comprehensive Node.js/Express backend API for tracking business mileage with HMRC-compliant calculations.

## Features

- **Authentication & Authorization**
  - JWT-based authentication with refresh tokens
  - Role-based access control (RBAC)
  - Password reset functionality
  - Email verification

- **Trip Management**
  - Create, read, update, delete trips
  - Automatic HMRC mileage calculations (45p/25p rates)
  - Year-to-date mileage tracking
  - Vehicle association

- **HMRC Compliance**
  - Automatic 45p/mile for first 10,000 miles per tax year
  - 25p/mile after 10,000 miles
  - Tax year tracking (April 6 - April 5)
  - Comprehensive audit logging

- **Report Generation**
  - PDF reports with professional formatting
  - CSV exports for spreadsheet analysis
  - Date range filtering
  - Download links with expiry

- **Admin Features**
  - User management
  - System statistics
  - Audit log access

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **PDF Generation**: PDFKit
- **CSV Generation**: fast-csv
- **Email**: Nodemailer

## Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd mileage-app/backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed  # Optional: seed with sample data
```

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_REFRESH_SECRET` | Refresh token secret | Required |
| `SMTP_HOST` | Email SMTP host | Optional |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |

See `.env.example` for complete list.

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password | No |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/me` | Update profile | Yes |
| PUT | `/api/auth/change-password` | Change password | Yes |

### Trips

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/trips` | List user's trips | Yes |
| POST | `/api/trips` | Create new trip | Yes |
| GET | `/api/trips/:id` | Get trip details | Yes |
| PUT | `/api/trips/:id` | Update trip | Yes |
| DELETE | `/api/trips/:id` | Delete trip | Yes |
| GET | `/api/trips/stats` | Get trip statistics | Yes |
| GET | `/api/trips/summary` | Get mileage summary | Yes |

### Reports

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/reports` | List reports | Yes |
| POST | `/api/reports` | Generate report | Yes |
| GET | `/api/reports/:id` | Get report details | Yes |
| GET | `/api/reports/:id/download` | Download report | Yes |
| DELETE | `/api/reports/:id` | Delete report | Yes |

### Users (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create new user |
| GET | `/api/users/:id` | Get user details |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/users/stats` | System statistics |

## Request/Response Examples

### Create Trip

**Request:**
```json
POST /api/trips
{
  "tripDate": "2024-01-15",
  "startLocation": "Manchester Office",
  "endLocation": "Leeds Site",
  "startPostcode": "M1 1AA",
  "endPostcode": "LS1 1AA",
  "distanceMiles": 45.50,
  "purpose": "Site inspection for new project",
  "purposeCategory": "site_visit"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trip created successfully",
  "data": {
    "id": "trip-uuid",
    "tripDate": "2024-01-15",
    "startLocation": "Manchester Office",
    "endLocation": "Leeds Site",
    "distanceMiles": 45.50,
    "rateApplied": 0.45,
    "amountGbp": 20.48,
    "userMilesYtd": 145.50
  }
}
```

### Generate Report

**Request:**
```json
POST /api/reports
{
  "name": "Q1 2024 Mileage Report",
  "description": "Quarterly report for accountant",
  "reportType": "mileage",
  "dateFrom": "2024-01-01",
  "dateTo": "2024-03-31",
  "format": "pdf"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report generation started",
  "data": {
    "id": "report-uuid",
    "name": "Q1 2024 Mileage Report",
    "status": "processing"
  }
}
```

## HMRC Mileage Rates

The API automatically applies HMRC-approved mileage rates:

| Vehicle Type | First 10,000 Miles | Over 10,000 Miles |
|--------------|-------------------|-------------------|
| Cars & Vans | 45p per mile | 25p per mile |
| Motorcycles | 24p per mile | 24p per mile |
| Bicycles | 20p per mile | 20p per mile |

## Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts
- `trips` - Mileage trip records
- `vehicles` - User vehicles
- `reports` - Generated reports
- `mileage_rates` - HMRC rates by tax year
- `refresh_tokens` - JWT refresh tokens
- `audit_logs` - Audit trail

See `src/models/prisma/schema.prisma` for complete schema.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with hot reload |
| `npm test` | Run tests |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |

## Security

- JWT authentication with refresh tokens
- bcrypt password hashing (12 rounds)
- Rate limiting on all endpoints
- Helmet.js security headers
- CORS protection
- Input validation and sanitization
- SQL injection prevention via Prisma ORM

## License

MIT License - see LICENSE file for details.

## Support

For support, email support@mileagetracker.co.uk or open an issue on GitHub.
