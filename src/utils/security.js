/**
 * Gujarat Time Company (GTC) · Security & Hardening Core Utility
 * Implements enterprise web application security rules:
 * - XSS Prevention & HTML Escaping
 * - Input Sanitization & Validation
 * - Client-Side Rate Limiting & Account Lockout
 * - File Upload Inspection (MIME type & size limits)
 * - Safe Error Normalization (Prevent schema/internal leaks)
 */

// Allowed MIME types for luxury watch image assets
export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Escapes HTML characters to prevent Cross-Site Scripting (XSS).
 * Rule 11: Never render dynamic user content as raw HTML.
 */
export function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitizes and trims user input string with length constraints and control char removal.
 * Rule 3: Validate and sanitize everything.
 */
export function sanitizeString(input, maxLength = 255) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Strip ASCII control characters
    .trim()
    .slice(0, maxLength);
}

/**
 * Strict RFC 5322 compliant email validator with length caps.
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  if (clean.length > 254) return false;
  // Robust standard email pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(clean);
}

/**
 * Validates international phone format.
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return true; // Optional field
  const clean = phone.trim();
  if (clean.length === 0) return true;
  if (clean.length > 25) return false;
  // Allows digits, optional leading +, spaces, hyphens, and parenthesis
  return /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,20}$/.test(clean);
}

/**
 * Rule 8: Validates user-uploaded image files by MIME type, extension, and byte size.
 */
export function validateImageUpload(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  // 1. Check File Size (Max 5MB)
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 5.0 MB.`,
    };
  }

  // 2. Check MIME Type
  if (!ALLOWED_IMAGE_MIMES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Invalid file format. Only JPEG, PNG, and WebP images are permitted.',
    };
  }

  // 3. Check File Extension
  const extensionMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extensionMatch ? extensionMatch[1].toLowerCase() : '';
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: 'File extension does not match allowed image formats (.jpg, .jpeg, .png, .webp).',
    };
  }

  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════
// RULE 2 & 4: RATE LIMITING & ACCOUNT LOCKOUT ENGINE
// ═══════════════════════════════════════════════════════════════

const STORAGE_PREFIX = 'gtc_sec_';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 Minutes

/**
 * Checks if an account or IP identifier is currently locked out.
 */
export function isAccountLocked(identifier) {
  if (!identifier || typeof localStorage === 'undefined') return false;
  try {
    const key = `${STORAGE_PREFIX}lock_${identifier.toLowerCase().trim()}`;
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const lockUntil = parseInt(raw, 10);
    if (Date.now() < lockUntil) {
      return true;
    }
    // Lock expired, clean up
    localStorage.removeItem(key);
    clearFailedAttempts(identifier);
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Returns remaining lockout time in minutes and seconds.
 */
export function getLockoutRemaining(identifier) {
  if (!identifier || typeof localStorage === 'undefined') return { minutes: 0, seconds: 0 };
  try {
    const key = `${STORAGE_PREFIX}lock_${identifier.toLowerCase().trim()}`;
    const raw = localStorage.getItem(key);
    if (!raw) return { minutes: 0, seconds: 0 };
    const diffMs = Math.max(0, parseInt(raw, 10) - Date.now());
    return {
      minutes: Math.ceil(diffMs / 60000),
      seconds: Math.ceil(diffMs / 1000),
      totalMs: diffMs,
    };
  } catch (e) {
    return { minutes: 0, seconds: 0, totalMs: 0 };
  }
}

/**
 * Records a failed login attempt. Locks out account after 5 attempts.
 */
export function recordFailedLogin(identifier) {
  if (!identifier || typeof localStorage === 'undefined') return 1;
  try {
    const cleanId = identifier.toLowerCase().trim();
    const attemptsKey = `${STORAGE_PREFIX}attempts_${cleanId}`;
    const current = parseInt(localStorage.getItem(attemptsKey) || '0', 10) + 1;
    localStorage.setItem(attemptsKey, String(current));

    if (current >= MAX_FAILED_ATTEMPTS) {
      const lockKey = `${STORAGE_PREFIX}lock_${cleanId}`;
      const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(lockKey, String(lockUntil));
      console.warn(`[GTC Security] Security Lockout triggered for ${cleanId}. Locked for 15 minutes.`);
    }

    return current;
  } catch (e) {
    return 1;
  }
}

/**
 * Clears failed login attempts after successful authentication.
 */
export function clearFailedAttempts(identifier) {
  if (!identifier || typeof localStorage === 'undefined') return;
  try {
    const cleanId = identifier.toLowerCase().trim();
    localStorage.removeItem(`${STORAGE_PREFIX}attempts_${cleanId}`);
    localStorage.removeItem(`${STORAGE_PREFIX}lock_${cleanId}`);
  } catch (e) {}
}

/**
 * Generic client-side action rate limiter (e.g. form submissions, OTP resends).
 * Returns { allowed: boolean, retryAfterSeconds: number }
 */
export function checkRateLimit(actionKey, maxCalls = 5, windowMs = 60000) {
  if (typeof sessionStorage === 'undefined') return { allowed: true, retryAfterSeconds: 0 };
  try {
    const key = `${STORAGE_PREFIX}ratelimit_${actionKey}`;
    const now = Date.now();
    const raw = sessionStorage.getItem(key);
    let timestamps = raw ? JSON.parse(raw) : [];

    // Filter out timestamps outside current sliding window
    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length >= maxCalls) {
      const oldest = timestamps[0];
      const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
      return { allowed: false, retryAfterSeconds };
    }

    timestamps.push(now);
    sessionStorage.setItem(key, JSON.stringify(timestamps));
    return { allowed: true, retryAfterSeconds: 0 };
  } catch (e) {
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

/**
 * Resets / clears a specific rate limit bucket across sessionStorage & localStorage.
 */
export function resetRateLimit(actionKey) {
  if (!actionKey || typeof window === 'undefined') return;
  try {
    const key = `${STORAGE_PREFIX}ratelimit_${actionKey}`;
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(key);
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  } catch (e) {}
}

/**
 * Clears all client-side rate limit tracking (fresh start).
 */
export function clearAllRateLimits() {
  if (typeof window === 'undefined') return;
  try {
    [sessionStorage, localStorage].forEach((store) => {
      if (!store) return;
      for (let i = store.length - 1; i >= 0; i--) {
        const k = store.key(i);
        if (k && k.startsWith(`${STORAGE_PREFIX}ratelimit_`)) {
          store.removeItem(k);
        }
      }
    });
  } catch (e) {}
}

/**
 * Resets all rate limits, login attempt lockouts, and OTP limits for a user
 * upon successful login or password update to ensure a complete fresh start.
 */
export function resetUserSecurityLimits(identifier) {
  if (!identifier || typeof window === 'undefined') return;
  try {
    const cleanId = identifier.toLowerCase().trim();
    clearFailedAttempts(cleanId);
    resetRateLimit(`pw_reset_${cleanId}`);
    resetRateLimit(`login_${cleanId}`);
    resetRateLimit(`otp_verify_${cleanId}`);

    // Remove any user-specific security or rate limit keys from storage
    [sessionStorage, localStorage].forEach((store) => {
      if (!store) return;
      for (let i = store.length - 1; i >= 0; i--) {
        const k = store.key(i);
        if (k && (k.includes(cleanId) || k.includes('pw_reset') || k.includes('ratelimit'))) {
          store.removeItem(k);
        }
      }
    });
  } catch (e) {}
}

/**
 * Rule 9: Normalizes errors to avoid leaking database schema or internal stack traces.
 */
export function normalizeUserError(error, defaultMsg = 'An unexpected error occurred. Please try again.') {
  if (!error) return defaultMsg;
  const rawMsg = typeof error === 'string' ? error : error.message || '';

  // Redact PostgreSQL, Supabase schema or network traces
  if (
    /postgres|relation|syntax error|column|violates foreign key|violates unique|pg_|anon_key|jwt/i.test(rawMsg)
  ) {
    return 'Database request failed. Please check your allocation data and try again.';
  }

  if (/networkerror|failed to fetch|econnrefused/i.test(rawMsg)) {
    return 'Network connection issue. Please check your internet connection.';
  }

  if (/rate limit|too many requests|429/i.test(rawMsg)) {
    return 'Too many requests. For your security, please wait a moment before trying again.';
  }

  if (/invalid login credentials|invalid credentials/i.test(rawMsg)) {
    return 'Invalid email or password. Please verify your credentials.';
  }

  // Return clean message if safe
  return sanitizeString(rawMsg, 160) || defaultMsg;
}
