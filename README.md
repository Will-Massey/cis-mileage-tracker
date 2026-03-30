# UK Business Mileage Tracker

A mobile-first web application for UK businesses (primarily CIS contractors) to record, calculate, and report business mileage for tax purposes.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-%5E18.0.0-blue.svg)

---

## Features

### MVP (Current)

- **User Authentication**: Secure registration/login with JWT
- **Trip Recording**: Log business trips with date, locations, purpose, miles
- **HMRC Compliance**: Automatic 45p/25p mileage rate calculation
- **Dashboard**: View monthly totals and recent trips
- **Reports**: Generate PDF/CSV reports by custom date range
- **Mobile-First**: Optimized for phone use on construction sites
- **Multi-User**: Unlimited users with role-based access

### Future Roadmap

- **GPS Tracking**: Automatic trip detection and mileage calculation
- **Receipt Upload**: Photo capture and OCR for fuel receipts
- **Accountant Portal**: Dedicated access for bookkeepers/accountants
- **Messaging**: In-app communication with accountants
- **Integrations**: Xero, QuickBooks, Sage
- **Native Apps**: iOS and Android applications
- **VAT Calculations**: Automatic VAT on fuel and expenses
- **Route Optimization**: Suggest efficient routes

---

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: JWT (RS256)
- **Security**: Helmet, CORS, Rate Limiting
- **Reports**: PDFKit, fast-csv

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **PWA**: Service Worker, Manifest

### Infrastructure
- **Hosting**: Render
- **Database**: Neon (Serverless PostgreSQL)
- **File Storage**: AWS S3 / Cloudflare R2 (future)

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/mileage-tracker.git
cd mileage-tracker
```

2. **Setup Backend**
```bash
cd backend
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# Generate JWT keys (see below)

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

3. **Setup Frontend**
```bash
cd frontend
npm install

# Copy environment file
cp .env.example .env

# Edit .env with API URL

# Start development server
npm run dev
```

4. **Access the app**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

---

## Generating JWT Keys

```bash
# Generate RSA private key (2048-bit)
openssl genrsa -out private.pem 2048

# Generate RSA public key
openssl rsa -in private.pem -pubout -out public.pem

# Copy the contents into your .env file
# Include the BEGIN/END lines
```

---

## Project Structure

```
mileage-tracker/
├── backend/
│   ├── src/
│   │   ├── config/         # Database & security config
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth, validation, RBAC
│   │   ├── models/         # Prisma schema
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helpers & validators
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── context/        # React context
│   │   ├── services/       # API services
│   │   └── utils/          # Formatters & validators
│   ├── package.json
│   └── .env.example
│
├── docs/                   # Documentation
├── render.yaml            # Render deployment config
└── README.md
```

---

## HMRC Compliance

This app follows UK HMRC guidelines for business mileage:

### Approved Mileage Rates (2023/2024)

| Mileage | Rate | Description |
|---------|------|-------------|
| First 10,000 miles | 45p/mile | Cars and vans |
| Over 10,000 miles | 25p/mile | Cars and vans |

### Tax Year
- Runs from **6 April** to **5 April** each year
- Mileage threshold resets annually

### Record Requirements

HMRC requires the following for each business journey:
- Date of trip
- Start and end locations
- Purpose of journey
- Total miles
- Calculated claim amount

All records are stored securely and can be exported for tax returns or audits.

---

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/me` | Get current user |

### Trip Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips` | List user's trips |
| POST | `/api/trips` | Create new trip |
| GET | `/api/trips/:id` | Get trip details |
| PUT | `/api/trips/:id` | Update trip |
| DELETE | `/api/trips/:id` | Delete trip |
| GET | `/api/trips/stats` | Trip statistics |
| GET | `/api/trips/summary` | Mileage summary |

### Report Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports` | List reports |
| POST | `/api/reports` | Generate report |
| GET | `/api/reports/:id/download` | Download report |

---

## Deployment

### Deploy to Render (Recommended)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

**Quick Deploy:**
1. Push to GitHub
2. Connect to Render
3. Use `render.yaml` blueprint
4. Done!

---

## User Roles

### User (CIS Contractor)
- Record and manage own trips
- Generate personal reports
- View mileage statistics
- Update profile

### Accountant
- View assigned users' trips
- Generate reports for multiple users
- Export data for bookkeeping

### Admin
- Manage all users
- View system statistics
- Configure settings
- Access audit logs

---

## Security Features

- **Authentication**: JWT with refresh tokens
- **Password Security**: bcrypt hashing (12 rounds)
- **Input Validation**: Joi schemas
- **Rate Limiting**: Prevents brute force attacks
- **CORS**: Configured for specific origins
- **Helmet**: Security headers
- **XSS Protection**: Output encoding
- **CSRF Protection**: Double-submit cookies
- **GDPR Compliant**: Data export and deletion

---

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

---

## License

MIT License - see [LICENSE](LICENSE) file

---

## Support

For support, email support@mileagetracker.co.uk or open an issue.

---

## Roadmap

### Phase 1: MVP (Current)
- [x] User authentication
- [x] Trip recording
- [x] HMRC calculations
- [x] Report generation
- [x] Mobile-first UI

### Phase 2: Enhanced Features
- [ ] GPS auto-tracking
- [ ] Receipt photo upload
- [ ] Offline mode
- [ ] Push notifications
- [ ] Accountant portal

### Phase 3: Integrations
- [ ] Xero integration
- [ ] QuickBooks integration
- [ ] Sage integration
- [ ] Bank feed connection
- [ ] Automated expense matching

### Phase 4: Native Apps
- [ ] iOS app
- [ ] Android app
- [ ] iBeacon support
- [ ] Apple Watch app
- [ ] Widget support

---

## Acknowledgments

- HMRC for mileage rate guidance
- UK CIS contractors for feedback
- Open source community

---

**Built with ❤️ for UK businesses**
