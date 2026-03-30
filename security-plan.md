# UK Business Mileage Tracking Web App - Security Architecture

## Executive Summary

This document outlines the comprehensive security architecture for the UK Business Mileage Tracking Web Application. The security design follows OWASP Top 10 guidelines, UK GDPR requirements, and industry best practices for web application security.

---

## 1. Authentication System Architecture

### 1.1 JWT-Based Authentication

**Token Structure:**
- **Access Token**: Short-lived (15 minutes), contains user ID, roles, and permissions
- **Refresh Token**: Long-lived (7 days with "Remember Me", 24 hours without), stored in httpOnly cookie
- **Algorithm**: RS256 (asymmetric) for production, HS256 (symmetric) for development

**Security Measures:**
```
┌─────────────────────────────────────────────────────────────┐
│                    JWT TOKEN STRUCTURE                       │
├─────────────────────────────────────────────────────────────┤
│  Header: { alg: "RS256", typ: "JWT" }                       │
│  Payload: {                                                 │
│    sub: user_id,           // Subject (user ID)            │
│    email: user_email,      // User email                   │
│    roles: ["user"],        // Array of roles               │
│    iat: timestamp,         // Issued at                    │
│    exp: timestamp,         // Expiration                   │
│    jti: unique_id          // JWT ID for revocation        │
│  }                                                          │
│  Signature: RSA-SHA256 signed                               │
└─────────────────────────────────────────────────────────────┘
```

**Token Storage Strategy:**
| Token Type | Storage | Security |
|------------|---------|----------|
| Access Token | Memory (React Context/Redux) | Prevents XSS theft |
| Refresh Token | httpOnly, Secure, SameSite cookie | Prevents JS access |
| CSRF Token | Double-submit cookie pattern | CSRF protection |

### 1.2 Password Security

**Hashing Configuration (bcrypt):**
- **Cost Factor**: 12 (2^12 iterations = 4096 rounds)
- **Salt**: Automatically generated 16-byte random salt
- **Output**: 60-character hash string
- **Timing**: ~250ms per hash on modern hardware

**Password Requirements:**
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)
- No common passwords (checked against haveibeenpwned API)
- Maximum 128 characters (DoS prevention)

### 1.3 Session Management

**Session Lifecycle:**
```
User Login
    │
    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Validate   │────▶│   Generate   │────▶│   Create     │
│  Credentials │     │    Tokens    │     │   Session    │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
    ┌─────────────────────────────────────────────┘
    ▼
┌──────────────┐     ┌──────────────┐
│   Refresh    │◄───▶│   Validate   │
│    Token     │     │    Token     │
└──────────────┘     └──────────────┘
```

**Session Security:**
- Sessions stored in Redis with TTL
- Automatic cleanup of expired sessions
- Device fingerprinting for anomaly detection
- Concurrent session limiting (max 5 per user)
- Session invalidation on password change

### 1.4 Email Verification Flow

```
1. User registers → Account created (inactive)
2. Verification email sent (expires in 24 hours)
3. User clicks link → Token validated
4. Account activated → Redirect to login
5. Failed verification → Resend option available
```

**Verification Token Security:**
- Cryptographically secure random token (32 bytes)
- SHA-256 hash stored in database
- Single-use only
- 24-hour expiration
- Rate limited (max 3 resends per hour)

### 1.5 Password Reset Flow

```
1. User requests reset → Email sent if account exists
2. Reset link sent (expires in 1 hour)
3. User clicks link → Token validated
4. New password form displayed
5. Password updated → All sessions invalidated
```

**Reset Token Security:**
- Same security as verification tokens
- Token invalidated after use
- Email sent regardless of account existence (prevents enumeration)
- Rate limited (max 3 requests per hour)

---

## 2. Authorization Architecture (RBAC)

### 2.1 Role Hierarchy

```
                    ┌─────────┐
                    │  Admin  │  ← Full system access
                    └────┬────┘
                         │
              ┌─────────┴─────────┐
              │                   │
         ┌────┴────┐         ┌────┴────┐
         │Accountant│         │  User   │
         └────┬────┘         └────┬────┘
              │                   │
              │            ┌─────┴─────┐
              │            │           │
              └───────────▶│ View Own  │
                           │   Trips   │
                           └───────────┘
```

### 2.2 Permission Matrix

| Permission | Admin | Accountant | User |
|------------|-------|------------|------|
| View own trips | ✓ | ✓ | ✓ |
| Create trips | ✓ | ✓ | ✓ |
| Edit own trips | ✓ | ✓ | ✓ |
| Delete own trips | ✓ | ✓ | ✓ |
| View assigned users' trips | ✓ | ✓ | ✗ |
| Export trips | ✓ | ✓ | ✓ |
| Manage users | ✓ | ✗ | ✗ |
| Assign accountants | ✓ | ✗ | ✗ |
| View system logs | ✓ | ✗ | ✗ |
| Configure settings | ✓ | ✗ | ✗ |

### 2.3 Data Access Control

**Trip Access Rules:**
```javascript
// Pseudocode for trip access validation
function canAccessTrip(user, trip) {
  if (user.role === 'admin') return true;
  if (user.role === 'accountant') {
    return trip.userId === user.id || 
           user.assignedUsers.includes(trip.userId);
  }
  return trip.userId === user.id;
}
```

---

## 3. Data Protection Measures

### 3.1 Input Validation & Sanitization

**Validation Layers:**
```
┌────────────────────────────────────────────────────────────┐
│  Layer 1: Client-side (UX only, not security)             │
│  Layer 2: API Validation (Joi schemas)                    │
│  Layer 3: Database Constraints                             │
│  Layer 4: Output Encoding (XSS prevention)                │
└────────────────────────────────────────────────────────────┘
```

**Validation Categories:**
| Category | Examples | Sanitization |
|----------|----------|--------------|
| Strings | Names, descriptions | Trim, escape HTML, length limit |
| Numbers | Mileage, amounts | Range check, type validation |
| Dates | Trip dates | Format validation, range check |
| Emails | User emails | Normalize, validate format |
| UUIDs | IDs | Validate format, existence check |

### 3.2 SQL Injection Prevention

**Strategy: Parameterized Queries Only**

```javascript
// ❌ VULNERABLE - Never do this
const query = `SELECT * FROM trips WHERE user_id = '${userId}'`;

// ✅ SECURE - Parameterized query
const query = 'SELECT * FROM trips WHERE user_id = $1';
const result = await db.query(query, [userId]);
```

**ORM Configuration:**
- Use Sequelize/TypeORM with prepared statements
- Enable query logging in development only
- Disable raw queries in production
- Use migrations for schema changes

### 3.3 XSS Protection

**Defense in Depth:**
```
┌─────────────────────────────────────────────────────────────┐
│  1. Input Validation - Reject malicious patterns            │
│  2. Output Encoding - Escape HTML entities                  │
│  3. Content Security Policy - Restrict script sources       │
│  4. HttpOnly Cookies - Prevent cookie theft via XSS         │
│  5. X-XSS-Protection Header - Browser XSS filter            │
└─────────────────────────────────────────────────────────────┘
```

**Output Encoding Rules:**
| Context | Encoding |
|---------|----------|
| HTML body | HTML entities (& → &amp;) |
| HTML attribute | Quote wrapping + HTML entities |
| JavaScript | JSON.stringify() |
| CSS | Strict whitelist |
| URL | encodeURIComponent() |

### 3.4 CSRF Protection

**Double-Submit Cookie Pattern:**
```
1. Server sets random token in httpOnly cookie
2. Same token included in response body/meta tag
3. Client sends token in header with each request
4. Server validates cookie token === header token
```

**CSRF Token Configuration:**
- 32-byte cryptographically secure random value
- Rotated on authentication
- Expires with session
- SameSite=Strict cookie attribute

### 3.5 Rate Limiting

**Endpoint-Specific Limits:**

| Endpoint | Limit | Window | Action |
|----------|-------|--------|--------|
| /api/auth/login | 5 | 15 min | Block + log |
| /api/auth/register | 3 | 1 hour | Block + CAPTCHA |
| /api/auth/reset-password | 3 | 1 hour | Silent fail |
| /api/auth/verify-email | 3 | 1 hour | Silent fail |
| /api/trips/* | 100 | 15 min | Block |
| /api/admin/* | 50 | 15 min | Block + alert |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
Retry-After: 900
```

---

## 4. GDPR Compliance (UK/EU)

### 4.1 Data Minimization

**Principle:** Collect only what is necessary

| Data Type | Purpose | Retention |
|-----------|---------|-----------|
| Email | Authentication, communication | Account lifetime |
| Name | Personalization, reporting | Account lifetime |
| Trip data | Business mileage tracking | 7 years (HMRC) |
| IP address | Security logging | 90 days |
| Device info | Security, support | 90 days |

### 4.2 Right to be Forgotten (Article 17)

**Deletion Process:**
```
1. User requests account deletion
2. Identity verification required
3. 30-day grace period (reversible)
4. After grace period:
   - Personal data anonymized
   - Trip data retained (anonymized) for HMRC
   - Logs purged after 90 days
5. Confirmation email sent
```

**Anonymization Strategy:**
- Replace PII with hash values
- Remove direct identifiers
- Aggregate data where possible
- Maintain audit trail

### 4.3 Data Export (Article 20)

**Export Format:** JSON (machine-readable)

**Export Contents:**
```json
{
  "user": {
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2023-01-01T00:00:00Z"
  },
  "trips": [...],
  "settings": {...},
  "export_date": "2024-01-01T00:00:00Z"
}
```

### 4.4 Consent Management

**Consent Types:**
| Purpose | Required | Withdrawable |
|---------|----------|--------------|
| Terms of Service | Yes | No (account termination) |
| Privacy Policy | Yes | No (account termination) |
| Marketing emails | No | Yes |
| Analytics cookies | No | Yes |
| Functional cookies | Yes | No |

**Consent Record:**
```javascript
{
  userId: "uuid",
  consentType: "marketing",
  given: true,
  timestamp: "2024-01-01T00:00:00Z",
  ipAddress: "hashed_ip",
  userAgent: "hashed_ua",
  version: "v1.2.0"
}
```

### 4.5 Privacy Policy Requirements

**Required Sections:**
1. Identity and contact details of controller
2. Data Protection Officer contact
3. Purpose and legal basis for processing
4. Categories of personal data
5. Recipients of personal data
6. International transfers
7. Retention periods
8. Data subject rights
9. Right to lodge complaint with ICO
10. Automated decision-making
11. Cookies and tracking

### 4.6 Data Breach Response

**72-Hour Notification Timeline:**
```
Hour 0:   Breach detected
Hour 1:   Incident response team activated
Hour 4:   Breach contained and assessed
Hour 24:  ICO notified (if high risk)
Hour 48:  Affected users notified
Hour 72:  Full documentation completed
```

---

## 5. Deployment Security

### 5.1 HTTPS Configuration

**TLS Requirements:**
- TLS 1.2 minimum (TLS 1.3 preferred)
- Strong cipher suites only
- HSTS with 1-year max-age
- OCSP stapling enabled
- Certificate pinning (optional)

**Cipher Suite Configuration:**
```
TLS_AES_256_GCM_SHA384
TLS_CHACHA20_POLY1305_SHA256
TLS_AES_128_GCM_SHA256
ECDHE-RSA-AES256-GCM-SHA384
ECDHE-RSA-AES128-GCM-SHA256
```

### 5.2 Security Headers (Helmet)

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | See below | XSS prevention |
| X-Frame-Options | DENY | Clickjacking prevention |
| X-Content-Type-Options | nosniff | MIME sniffing prevention |
| Strict-Transport-Security | max-age=31536000 | HTTPS enforcement |
| X-XSS-Protection | 1; mode=block | Browser XSS filter |
| Referrer-Policy | strict-origin-when-cross-origin | Privacy |
| Permissions-Policy | See below | Feature restriction |

**Content Security Policy:**
```
default-src 'self';
script-src 'self' 'nonce-{random}';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self';
connect-src 'self' https://api.example.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

### 5.3 Environment Variable Management

**Security Requirements:**
- Never commit .env files
- Use different secrets per environment
- Rotate secrets quarterly
- Use secret management service (AWS Secrets Manager, Azure Key Vault)
- Encrypt secrets at rest

**Required Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://...
DATABASE_SSL_MODE=require

# JWT
JWT_PRIVATE_KEY_PATH=/secrets/jwt-private.pem
JWT_PUBLIC_KEY_PATH=/secrets/jwt-public.pem
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Encryption
ENCRYPTION_KEY_PATH=/secrets/app-key

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...

# Rate Limiting
REDIS_URL=redis://...

# Application
NODE_ENV=production
APP_URL=https://app.example.com
```

### 5.4 Database Security

**Connection Security:**
- SSL/TLS required for all connections
- Certificate validation enabled
- Connection pooling with max limits
- Query timeout configured
- Prepared statements only

**User Privileges:**
| User | Permissions |
|------|-------------|
| app_readonly | SELECT only |
| app_readwrite | SELECT, INSERT, UPDATE |
| app_admin | Full access (migrations only) |

---

## 6. Security Monitoring & Logging

### 6.1 Security Events to Log

| Event Level | Examples |
|-------------|----------|
| INFO | Successful login, logout, password change |
| WARN | Failed login, rate limit hit, suspicious activity |
| ERROR | Authentication errors, authorization failures |
| CRITICAL | Data breach indicators, admin actions |

### 6.2 Log Format

```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "WARN",
  "event": "failed_login",
  "userId": "uuid_or_null",
  "ipAddress": "hashed_ip",
  "userAgent": "hashed_ua",
  "details": {
    "reason": "invalid_password",
    "attempt": 3
  },
  "requestId": "uuid"
}
```

### 6.3 Security Alerts

**Alert Triggers:**
- 5+ failed logins from same IP in 15 minutes
- Login from new country/region
- Admin account activity
- Mass data export
- Configuration changes
- Database errors

---

## 7. Security Checklist

### Pre-Deployment

- [ ] All dependencies updated (npm audit)
- [ ] No hardcoded secrets in code
- [ ] Environment variables configured
- [ ] HTTPS certificates valid
- [ ] Database migrations tested
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] CSP policy tested
- [ ] Input validation implemented
- [ ] Output encoding implemented
- [ ] CSRF protection enabled
- [ ] Session management configured
- [ ] Logging configured
- [ ] Error handling secure (no stack traces)
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie consent implemented
- [ ] GDPR procedures documented

### Post-Deployment

- [ ] SSL Labs A+ rating
- [ ] Security headers validated
- [ ] Penetration test completed
- [ ] Vulnerability scan clean
- [ ] Backup procedures tested
- [ ] Incident response plan ready
- [ ] DPO contact published
- [ ] Cookie policy displayed

---

## 8. Incident Response Plan

### Severity Levels

| Level | Definition | Response Time |
|-------|------------|---------------|
| P1 Critical | Data breach, system compromise | 1 hour |
| P2 High | Authentication bypass, privilege escalation | 4 hours |
| P3 Medium | XSS, CSRF vulnerabilities | 24 hours |
| P4 Low | Information disclosure, misconfigurations | 72 hours |

### Response Steps

1. **Detect**: Identify and confirm the incident
2. **Contain**: Limit the scope and impact
3. **Eradicate**: Remove the threat
4. **Recover**: Restore normal operations
5. **Learn**: Document and improve

---

## 9. References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [UK GDPR Guidance](https://ico.org.uk/for-organisations/guide-to-data-protection/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CIS Controls](https://www.cisecurity.org/controls/)

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-01  
**Next Review:** 2024-04-01  
**Owner:** Security Team
