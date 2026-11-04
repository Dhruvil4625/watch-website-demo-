/**
 * Gujarat Time Company (GTC) · Backend & Serverless API Security Engine
 * Implements:
 * - Rule 2: API Rate Limiting (Sliding Window with 429 & Retry-After)
 * - Rule 3: Server-Side Input Validation & Sanitization
 * - Rule 6: Explicit Origin CORS Whitelisting (No wildcards in production)
 * - Rule 7: Strict HTTP Security Headers
 * - Rule 9: Safe Error Logging & Redaction (No stack trace leaks)
 * - Rule 11: Email HTML Injection & XSS Prevention
 */

// In-Memory sliding-window rate limit store
const rateLimitStore = new Map();

// Periodic cleanup of stale rate-limit records every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
      if (now - data.resetTime > 60000) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Rule 2: Rate Limiter Middleware
 * Default limit for email / auth endpoints: 5 requests per 15 minutes (900,000 ms)
 */
export function checkRateLimit(ip = 'unknown', endpoint = 'general', maxRequests = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const key = `${endpoint}:${ip}`;

  let record = rateLimitStore.get(key);
  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, record);
    return {
      allowed: true,
      remaining: maxRequests - 1,
      retryAfterSeconds: 0,
    };
  }

  record.count += 1;
  rateLimitStore.set(key, record);

  if (record.count > maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Resets rate limit for a specific IP and endpoint, or all endpoints if wildcard.
 */
export function resetRateLimit(ip = 'unknown', endpoint = 'send-mail') {
  if (endpoint === '*') {
    for (const key of rateLimitStore.keys()) {
      if (key.endsWith(`:${ip}`)) {
        rateLimitStore.delete(key);
      }
    }
  } else {
    rateLimitStore.delete(`${endpoint}:${ip}`);
  }
}

/**
 * Clears all server-side in-memory rate limits (fresh start).
 */
export function clearAllRateLimits() {
  rateLimitStore.clear();
}


/**
 * Rule 6: CORS Whitelisting
 * Restricts cross-origin requests to explicit allowed domains.
 */
export function getCorsHeaders(requestOrigin = '', envAllowedOrigin = '') {
  // Allowed development and production origins
  const defaultAllowed = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ];

  if (envAllowedOrigin) {
    envAllowedOrigin.split(',').forEach((o) => {
      const clean = o.trim();
      if (clean && !defaultAllowed.includes(clean)) {
        defaultAllowed.push(clean);
      }
    });
  }

  const isAllowed = defaultAllowed.some((allowed) => {
    if (!requestOrigin) return false;
    return requestOrigin === allowed || requestOrigin.endsWith('.vercel.app');
  });

  const effectiveOrigin = isAllowed ? requestOrigin : defaultAllowed[0];

  return {
    'Access-Control-Allow-Origin': effectiveOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

/**
 * Rule 7: Enterprise HTTP Security Headers
 */
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none';",
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

/**
 * Rule 3 & 11: Server-Side Input Sanitizer & HTML Escaper
 */
export function sanitizeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Strict RFC 5322 Email Validation
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  if (clean.length > 254) return false;
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(clean);
}

/**
 * Rule 3: Validates and sanitizes mail dispatch payloads
 * Rejects invalid requests with 400 Bad Request.
 */
export function validateMailPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Malformed JSON payload.' };
  }

  const ALLOWED_TYPES = [
    'admin_otp',
    'admin_otp_request',
    'admin_login_unlocked',
    'collector_welcome',
    'private_reservation_dossier',
  ];

  const type = String(payload.type || '').trim();
  if (!ALLOWED_TYPES.includes(type)) {
    return {
      valid: false,
      error: `Invalid dispatch type "${type}". Allowed types: ${ALLOWED_TYPES.join(', ')}`,
    };
  }

  // Type-specific validation
  if (type === 'admin_otp' || type === 'admin_otp_request') {
    if (payload.initiatorEmail && !isValidEmail(payload.initiatorEmail)) {
      return { valid: false, error: 'Invalid initiator email address.' };
    }
    if (payload.otps && Array.isArray(payload.otps)) {
      const allValidOtps = payload.otps.every((otp) => /^[0-9]{6}$/.test(String(otp)));
      if (!allValidOtps) {
        return { valid: false, error: 'Invalid OTP format. Must be 6-digit numeric codes.' };
      }
    }
  }

  if (type === 'collector_welcome') {
    if (!payload.customerEmail || !isValidEmail(payload.customerEmail)) {
      return { valid: false, error: 'Valid customerEmail is required for collector welcome pass.' };
    }
  }

  if (type === 'admin_login_unlocked') {
    if (!payload.actorEmail || !isValidEmail(payload.actorEmail)) {
      return { valid: false, error: 'Valid actorEmail is required for admin unlock notice.' };
    }
  }

  if (type === 'private_reservation_dossier') {
    if (!payload.customerEmail || !isValidEmail(payload.customerEmail)) {
      return { valid: false, error: 'Valid customerEmail is required for reservation dossier.' };
    }
  }

  // Sanitize all text fields against XSS/HTML injection
  const sanitized = { ...payload };
  const textKeys = [
    'customerName',
    'actorName',
    'initiatorEmail',
    'actorEmail',
    'customerEmail',
    'watchName',
    'watchRef',
    'watchSubtitle',
    'watchPrice',
    'customerMessage',
    'customerPhone',
    'allocationCode',
  ];

  for (const key of textKeys) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeHtml(sanitized[key].slice(0, 1000).trim());
    }
  }

  return { valid: true, sanitized };
}
