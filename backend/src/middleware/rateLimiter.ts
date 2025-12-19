import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Custom error message handler
const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

// Strict rate limiter for authentication endpoints (prevent brute force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: 'Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: rateLimitHandler,
  // Skip successful requests (only count failures)
  skipSuccessfulRequests: true,
});

// Moderate rate limiter for registration/signup
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour
  message: 'Too many registration attempts. Please try again after 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// General API rate limiter (for all API endpoints)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: 'Too many API requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  // Skip rate limiting for authenticated users with valid tokens
  skip: (req: Request) => {
    // If user is authenticated and verified, give them more leeway
    return req.user?.role === 'ADMIN';
  },
});

// Strict rate limiter for file uploads
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 file uploads per hour
  message: 'Too many file uploads. Please try again after 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Rate limiter for patient self-registration links
export const patientRegistrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 patient registrations per hour (per IP address)
  message: 'Too many patient registrations. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  // Standard IP-based rate limiting
});

// Very strict rate limiter for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: 'Too many password reset requests. Please try again after 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Moderate rate limiter for creating patients (doctors only)
export const createPatientLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 patient creations per hour (reasonable for a doctor)
  message: 'Too many patient creation requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Rate limiter for prescription generation
export const prescriptionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 prescriptions per hour (reasonable for a busy doctor)
  message: 'Too many prescription requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
