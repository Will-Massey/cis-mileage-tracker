---
name: node-express-api
description: Build secure REST APIs with Node.js and Express. Use when creating API endpoints, implementing JWT authentication, adding middleware (validation, rate limiting, error handling), or structuring Express applications for production.
---

# Node Express API

Build secure, production-ready REST APIs with Express.js.

## Project Structure

```
backend/
├── src/
│   ├── config/           # Database, security config
│   ├── controllers/      # Route handlers
│   ├── middleware/       # Auth, validation, errors
│   ├── models/           # Database models/schema
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic
│   └── utils/            # Helpers
├── tests/
├── .env
└── package.json
```

## Quick Setup

```bash
npm init -y
npm install express cors helmet morgan dotenv
npm install -D nodemon jest supertest
```

```javascript
// src/server.js
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const morgan = require('morgan')

const app = express()

// Security middleware
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL }))
app.use(morgan('dev'))
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server on port ${PORT}`))
```

## JWT Authentication

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken')

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports = { authenticate }
```

## Validation Middleware

```javascript
// middleware/validation.js
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(d => d.message)
    })
  }
  next()
}

module.exports = { validate }
```

## Rate Limiting

```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit')

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { error: 'Too many attempts, try again later' }
})

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})

module.exports = { authLimiter, apiLimiter }
```

## Error Handling Pattern

```javascript
// middleware/errorHandler.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.message = err.message || 'Internal server error'

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      error: err.message,
      stack: err.stack
    })
  } else {
    res.status(err.statusCode).json({ error: err.message })
  }
}

module.exports = { AppError, errorHandler }
```

## Testing with Jest

```javascript
// tests/auth.test.js
const request = require('supertest')
const app = require('../src/app')

describe('Auth Endpoints', () => {
  test('POST /api/auth/register - creates user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!'
      })
    
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
  })
})
```

## Security Checklist

- [ ] Helmet for security headers
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] JWT secret strong (32+ chars)
- [ ] Password hashing (bcrypt)
- [ ] Input validation (Joi/yup)
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] HTTPS in production
