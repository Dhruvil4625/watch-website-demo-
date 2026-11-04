import { sendMail } from '../server/mailer.js';
import {
  checkRateLimit,
  getCorsHeaders,
  getSecurityHeaders,
  validateMailPayload,
} from '../server/security.js';

/**
 * Enterprise Secure Serverless Endpoint for /api/send-mail
 * Enforces:
 * - Rule 2: Rate Limiting (5 requests per 15 minutes per IP, returns 429 with Retry-After)
 * - Rule 3: Input Validation & Sanitization (Reject invalid payloads with 400 Bad Request)
 * - Rule 6: CORS Origin Whitelisting (No wildcards)
 * - Rule 7: Enterprise HTTP Security Headers (X-Frame-Options, CSP, nosniff)
 * - Rule 9: Redacted Internal Errors (Generic client error message)
 */
export default async function handler(req, res) {
  // Extract client IP address safely across cloud proxies
  const clientIp =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    '127.0.0.1';

  // Extract origin
  const origin = req.headers['origin'] || '';
  const corsHeaders = getCorsHeaders(origin, process.env.ALLOWED_ORIGIN);
  const securityHeaders = getSecurityHeaders();

  // Apply security & CORS headers to all responses
  Object.entries({ ...corsHeaders, ...securityHeaders }).forEach(([key, val]) => {
    res.setHeader(key, val);
  });

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Enforce HTTP Method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. Only POST is accepted.',
    });
  }

  // 1. Rate Limiting Check: 5 requests per 15 mins per IP
  const rateLimitResult = checkRateLimit(clientIp, 'send-mail', 5, 15 * 60 * 1000);
  if (!rateLimitResult.allowed) {
    res.setHeader('Retry-After', String(rateLimitResult.retryAfterSeconds));
    console.warn(`[GTC Security] Rate limit exceeded on /api/send-mail for IP: ${clientIp}`);
    return res.status(429).json({
      success: false,
      error: `Too Many Requests. Rate limit exceeded. Please retry after ${rateLimitResult.retryAfterSeconds} seconds.`,
      retryAfter: rateLimitResult.retryAfterSeconds,
    });
  }

  // 2. Parse & Validate Input Payload
  let rawPayload;
  try {
    rawPayload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (parseErr) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON payload format.',
    });
  }

  const validation = validateMailPayload(rawPayload);
  if (!validation.valid) {
    console.warn(`[GTC Security] Validation failure on /api/send-mail from ${clientIp}: ${validation.error}`);
    return res.status(400).json({
      success: false,
      error: validation.error,
    });
  }

  // 3. Dispatch Email via Secure Nodemailer Engine
  try {
    const result = await sendMail(validation.sanitized);
    return res.status(200).json(result);
  } catch (err) {
    // Rule 9: Redact internal stack traces and SMTP credentials
    console.error(`[GTC Mail Error] [${new Date().toISOString()}] IP: ${clientIp} -`, err.message);
    return res.status(500).json({
      success: false,
      error: 'Dispatch service temporarily unavailable. Please retry or contact concierge.',
    });
  }
}
