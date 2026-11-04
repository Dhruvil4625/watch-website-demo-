/**
 * Gujarat Time Company (GTC) · Reset Rate Limit API Endpoint
 * Invoked on successful customer authentication or password change to provide a fresh start.
 */
import { getCorsHeaders, getSecurityHeaders, resetRateLimit, clearAllRateLimits } from '../server/security.js';

export default async function handler(req, res) {
  // Apply strict HTTP security headers
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([header, value]) => {
    res.setHeader(header, value);
  });

  const origin = req.headers['origin'] || '';
  const corsHeaders = getCorsHeaders(origin, process.env.ALLOWED_ORIGIN);
  Object.entries(corsHeaders).forEach(([header, value]) => {
    res.setHeader(header, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const clientIp =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  resetRateLimit(clientIp, '*');
  clearAllRateLimits();

  return res.status(200).json({
    success: true,
    message: 'Rate limits refreshed successfully. Enjoy a fresh start.',
  });
}
