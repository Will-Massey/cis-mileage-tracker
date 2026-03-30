# Mileage Tracker - Frontend

A mobile-first UK Business Mileage Tracking Web Application for CIS Contractors.

## Features

- **Simple Trip Recording**: Add trips with date, locations, purpose, and miles
- **HMRC Compliance**: Automatic calculation using 45p/25p rates
- **Dashboard**: Quick overview of monthly mileage and claims
- **Reports**: Generate PDF/CSV reports for tax submissions
- **Mobile-First**: Designed for easy use on phones by non-technical users
- **PWA Support**: Works offline with service worker

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **React Router DOM** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **date-fns** - Date formatting
- **jsPDF** - PDF generation
- **PapaParse** - CSV export

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your API URL:
```
VITE_API_URL=http://localhost:5000/api
```

4. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Output will be in the `dist` folder.

## Project Structure

```
frontend/
├── public/              # Static files
│   ├── index.html
│   ├── manifest.json    # PWA manifest
│   └── service-worker.js # Offline support
├── src/
│   ├── components/      # React components
│   │   ├── common/      # Shared components (Button, Input, Card, etc.)
│   │   ├── auth/        # Auth components (LoginForm, RegisterForm)
│   │   ├── trips/       # Trip components (TripForm, TripList, TripCard)
│   │   └── reports/     # Report components (ReportForm, ReportPreview)
│   ├── pages/           # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Trips.jsx
│   │   ├── AddTrip.jsx
│   │   ├── Reports.jsx
│   │   └── Profile.jsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useTrips.js
│   │   └── useApi.js
│   ├── context/         # React context
│   │   └── AuthContext.jsx
│   ├── services/        # API services
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── tripService.js
│   │   └── reportService.js
│   ├── utils/           # Utility functions
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── hmrcCalculator.js
│   ├── styles/          # Global styles
│   │   └── globals.css
│   ├── App.jsx          # Root component
│   ├── main.jsx         # Entry point
│   └── routes.jsx       # Route definitions
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Design Principles

### Mobile-First for Non-IT Users

- **Large Touch Targets**: Buttons minimum 48px height
- **Clear Labels**: Labels always above input fields
- **Minimal Typing**: Dropdowns for common selections
- **Simple Navigation**: Bottom nav bar on mobile
- **Big Numbers**: Dashboard stats are large and clear
- **One Action Per Screen**: Focus on single tasks

### Color Scheme

- **Primary**: Blue (#2563eb) - trust, professional
- **Success**: Green (#10b981) - positive actions
- **Background**: Light gray (#f3f4f6)
- **Cards**: White

## HMRC Mileage Rates

Current rates (2024-25 tax year):

| Vehicle Type | First 10,000 Miles | Over 10,000 Miles |
|--------------|-------------------|-------------------|
| Cars & Vans | 45p per mile | 25p per mile |
| Motorcycles | 24p per mile | 24p per mile |
| Bicycles | 20p per mile | 20p per mile |

## API Integration

The frontend expects a REST API with the following endpoints:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile

### Trips
- `GET /api/trips` - List trips
- `POST /api/trips` - Create trip
- `GET /api/trips/:id` - Get trip
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip
- `GET /api/trips/stats` - Get statistics

### Reports
- `GET /api/reports` - List reports
- `POST /api/reports` - Generate report
- `GET /api/reports/:id/download` - Download report
- `DELETE /api/reports/:id` - Delete report

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- iOS Safari (iOS 14+)
- Chrome for Android (latest)

## License

MIT
