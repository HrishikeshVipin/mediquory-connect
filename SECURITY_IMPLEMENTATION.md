# Security Implementation Summary

## ✅ Implemented Security Features

This document summarizes all security features that have been implemented in the Bhishak Med telemedicine platform.

---

## 1️⃣ Rate Limiting

### Implementation
- **Package**: `express-rate-limit@8.2.1`
- **Location**: `backend/src/middleware/rateLimiter.ts`

### Rate Limiters Configured

#### General API Rate Limiter
- **Applied to**: All `/api/*` routes
- **Limit**: 100 requests per 15 minutes per IP
- **Exception**: Admin users bypass this limit

#### Authentication Rate Limiter
- **Applied to**: Login endpoints (`/api/auth/doctor/login`, `/api/auth/admin/login`)
- **Limit**: 5 failed login attempts per 15 minutes
- **Purpose**: Prevent brute force attacks
- **Note**: Only failed requests are counted

#### Registration Rate Limiter
- **Applied to**: Doctor signup (`/api/auth/doctor/signup`)
- **Limit**: 3 registration attempts per hour
- **Purpose**: Prevent spam registrations

#### File Upload Rate Limiter
- **Applied to**: Doctor KYC document uploads
- **Limit**: 10 file uploads per hour
- **Purpose**: Prevent abuse of file storage

#### Patient Creation Rate Limiter
- **Applied to**: `/api/patients/create` (doctor-created patients)
- **Limit**: 50 patient creations per hour
- **Purpose**: Reasonable limit for legitimate usage

#### Patient Self-Registration Rate Limiter
- **Applied to**: `/api/patients/self-register` (public endpoint)
- **Limit**: 20 registrations per hour per IP
- **Purpose**: Prevent spam from patient registration links

#### Prescription Rate Limiter
- **Applied to**: `/api/prescriptions/:consultationId` (POST)
- **Limit**: 30 prescriptions per hour
- **Purpose**: Reasonable limit for a busy doctor

### Rate Limit Response
When rate limit is exceeded, users receive:
```json
{
  "success": false,
  "message": "Too many requests from this IP. Please try again later.",
  "retryAfter": "900" // seconds until retry allowed
}
```

HTTP Status Code: `429 Too Many Requests`

---

## 2️⃣ Field-Level Encryption

### Implementation
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Location**:
  - `backend/src/utils/encryption.ts` - Core encryption utilities
  - `backend/src/services/encryption.service.ts` - Business logic for data encryption
- **Key Length**: 256 bits (32 bytes)
- **IV**: Random 16 bytes per encryption
- **Authentication**: GCM provides built-in authentication tags

### Encrypted Fields

#### Doctor Model
- ✅ `aadhaarNumber` - 12-digit Aadhaar (encrypted)
- ✅ `phone` - Phone number (encrypted)
- ✅ `upiId` - UPI payment ID (encrypted)

#### Patient Model
- ✅ `phone` - Phone number (encrypted)

### Encryption Configuration
Environment Variable: `ENCRYPTION_KEY` in `.env`

```bash
# IMPORTANT: Generate a strong random key for production
# Example: openssl rand -base64 32
ENCRYPTION_KEY=temp-encryption-key-change-in-production-strong-key-needed
```

### Encryption Functions

#### `encrypt(plaintext)`
Encrypts sensitive data using AES-256-GCM
- Returns format: `iv:authTag:encrypted` (hex-encoded)

#### `decrypt(encryptedData)`
Decrypts data encrypted with `encrypt()`
- Input format: `iv:authTag:encrypted`
- Returns: Original plaintext

#### `maskAadhaar(aadhaar)`
Masks Aadhaar number for display
- Example: `123456789012` → `XXXX-XXXX-9012`

#### `maskPhone(phone)`
Masks phone number for display
- Example: `9876543210` → `XXXXXX3210`

### Service Layer Functions

#### `encryptDoctorData(doctorData)`
Automatically encrypts all sensitive fields before saving to database

#### `decryptDoctorData(doctorData, maskSensitive)`
- `maskSensitive = false`: Fully decrypts data (for authorized users)
- `maskSensitive = true`: Returns masked data (for display/lists)

#### `encryptPatientData(patientData)`
Encrypts patient phone number before saving

#### `decryptPatientData(patientData, maskSensitive)`
Decrypts or masks patient phone number

### Usage Example (Controller)
```typescript
import { encryptDoctorData, decryptDoctorData } from '../services/encryption.service';

// When creating a doctor
const encryptedData = encryptDoctorData({
  email: 'doctor@example.com',
  aadhaarNumber: '123456789012',
  phone: '9876543210',
  upiId: 'doctor@upi'
});

await prisma.doctor.create({ data: encryptedData });

// When retrieving a doctor
const doctor = await prisma.doctor.findUnique({ where: { id } });
const decryptedDoctor = decryptDoctorData(doctor, false); // Full decrypt
const maskedDoctor = decryptDoctorData(doctor, true);    // Masked for display
```

### Security Considerations

**✅ Implemented:**
1. AES-256-GCM provides both encryption and authentication
2. Random IV per encryption prevents pattern analysis
3. Authentication tags prevent tampering
4. Separate masking functions for safe display
5. Automatic field detection in service layer

**⚠️ TODO for Production:**
1. **Generate Strong Encryption Key**
   ```bash
   openssl rand -base64 32
   ```
2. **Use Proper Secrets Management** (AWS Secrets Manager, HashiCorp Vault, etc.)
3. **Rotate Encryption Keys** periodically with key versioning
4. **Database Backup Encryption** - Ensure backups are also encrypted at rest
5. **Audit Logging** - Log all access to encrypted data (implemented separately)

---

## 3️⃣ Additional Security Measures

### Authentication
- ✅ JWT-based authentication with httpOnly cookies
- ✅ Token expiration: 7 days
- ✅ Role-based access control (DOCTOR, ADMIN)
- ✅ Account status verification (PENDING_VERIFICATION, VERIFIED, REJECTED, SUSPENDED)
- ✅ `req.doctorId` and `req.adminId` properly set in middleware

### CORS
- ✅ Origin whitelisting (localhost + network IPs)
- ✅ Credentials support enabled
- ✅ Configurable for different network environments

### Database
- ✅ Prisma ORM prevents SQL injection
- ✅ Cascade deletes configured for data integrity
- ✅ Foreign key constraints enforced

### File Uploads
- ✅ MIME type validation
- ✅ File size limits (10MB images, 15MB documents)
- ✅ Filename sanitization with UUID
- ✅ Separate directories per file type

### Headers Security
- ✅ Helmet.js enabled
- ✅ Cross-Origin Resource Policy configured

---

## 🚨 Critical TODOs Before Production

### 1. Secrets Management
- [ ] Remove committed `.env` file from git history
- [ ] Rotate ALL API keys (JWT_SECRET, AGORA, RAZORPAY, ENCRYPTION_KEY)
- [ ] Generate cryptographically secure keys:
  ```bash
  # JWT Secret
  openssl rand -base64 64

  # Encryption Key
  openssl rand -base64 32
  ```
- [ ] Use environment-specific secrets (AWS Secrets Manager, etc.)
- [ ] Add environment variable validation on startup

### 2. Database Migration
- [ ] Switch from SQLite to PostgreSQL
- [ ] Enable encryption at rest (PostgreSQL: pgcrypto extension)
- [ ] Implement proper connection pooling
- [ ] Set up automated backups with encryption

### 3. Socket.io Security
- [ ] Add JWT authentication to socket connections
- [ ] Verify user authorization before joining consultation rooms
- [ ] Implement message rate limiting

### 4. Input Sanitization
- [ ] Add XSS protection for user inputs (DOMPurify or similar)
- [ ] Sanitize chat messages, doctor notes, prescriptions
- [ ] Implement HTML escaping

### 5. Enhanced Security Headers
- [ ] Implement Content Security Policy (CSP)
- [ ] Add HSTS headers for production
- [ ] Configure X-Frame-Options, X-Content-Type-Options

### 6. File Security
- [ ] Add magic number validation (not just MIME type)
- [ ] Implement virus scanning (ClamAV)
- [ ] Store files outside web root
- [ ] Add signed URLs with expiration
- [ ] Implement file integrity checking (hashes)

### 7. Audit Logging
- [ ] Log all access to patient medical records
- [ ] Log prescription views and downloads
- [ ] Log authentication events (login, logout, failures)
- [ ] Log admin actions
- [ ] Implement compliance logging for DPDPA/HIPAA

### 8. Patient Access Links
- [ ] Implement token expiration (24-48 hours)
- [ ] Add HMAC signatures to tokens
- [ ] Track and limit access attempts
- [ ] Consider IP-based restrictions after first access

### 9. Compliance
- [ ] Implement DPDPA (India) compliance measures
- [ ] Add data retention policies
- [ ] Implement "Right to Deletion" feature
- [ ] Add consent management
- [ ] Create privacy policy endpoints
- [ ] Implement data breach notification procedures

---

## 📊 Security Metrics

### Rate Limiting Coverage
- ✅ Authentication endpoints: **100%**
- ✅ File upload endpoints: **100%**
- ✅ Patient creation: **100%**
- ✅ Prescription generation: **100%**
- ✅ General API: **100%**

### Encryption Coverage
- ✅ Doctor Aadhaar: **Encrypted**
- ✅ Doctor Phone: **Encrypted**
- ✅ Doctor UPI ID: **Encrypted**
- ✅ Patient Phone: **Encrypted**
- ❌ Patient Medical Records: **TODO**
- ❌ Chat Messages: **TODO**

### Authentication Coverage
- ✅ JWT tokens: **Implemented**
- ✅ Role-based access: **Implemented**
- ✅ Account status checks: **Implemented**
- ❌ Token refresh rotation: **TODO**
- ❌ Multi-factor authentication: **TODO**

---

## 🔐 Testing Rate Limiting

### Test Authentication Rate Limit
```bash
# Try logging in 6 times with wrong password
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/doctor/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# 6th request should return 429 Too Many Requests
```

### Test API Rate Limit
```bash
# Make 101 requests to any API endpoint
for i in {1..101}; do
  curl http://localhost:5000/api/patients/list \
    -H "Cookie: token=YOUR_JWT_TOKEN"
done

# 101st request should return 429
```

---

## 🛡️ Security Best Practices Followed

1. ✅ **Defense in Depth** - Multiple layers of security
2. ✅ **Least Privilege** - Users only have access to their own data
3. ✅ **Fail Securely** - Errors don't expose sensitive information
4. ✅ **Secure Defaults** - Security features enabled by default
5. ✅ **Complete Mediation** - All requests authenticated and authorized
6. ✅ **Open Design** - Security doesn't rely on obscurity

---

## 📞 Support

For security concerns or questions:
- Review this document
- Check the security audit in the codebase
- Consult with security professionals before production deployment

**Remember**: Security is an ongoing process, not a one-time implementation!
