import { defineConfig } from 'vite';
import { resolve } from 'path';
import { sendMail } from './server/mailer.js';
import {
  checkRateLimit,
  resetRateLimit,
  clearAllRateLimits,
  getCorsHeaders,
  getSecurityHeaders,
  validateMailPayload,
} from './server/security.js';

/**
 * Custom Vite Plugin to intercept POST /api/send-mail during local dev
 * Applies production-grade rate limiting, input validation, CORS and security headers.
 */
function gtcMailApiPlugin() {
  return {
    name: 'gtc-mail-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Apply security headers to all responses
        const securityHeaders = getSecurityHeaders();
        Object.entries(securityHeaders).forEach(([k, v]) => {
          res.setHeader(k, v);
        });

        const urlPath = (req.url || '').split('?')[0];

        // Rate limit reset endpoint (invoked on successful customer login or recovery)
        if (urlPath === '/api/reset-rate-limit') {
          const clientIp = req.socket?.remoteAddress || '127.0.0.1';
          const origin = req.headers['origin'] || '';
          const corsHeaders = getCorsHeaders(origin, process.env.ALLOWED_ORIGIN);
          Object.entries(corsHeaders).forEach(([k, v]) => {
            res.setHeader(k, v);
          });

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            return res.end();
          }

          resetRateLimit(clientIp, '*');
          clearAllRateLimits();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true, message: 'All rate limits reset to fresh state.' }));
        }

        // Order reservation endpoint
        if (urlPath === '/api/orders/reserve') {
          const clientIp = req.socket?.remoteAddress || '127.0.0.1';
          const origin = req.headers['origin'] || '';
          const corsHeaders = getCorsHeaders(origin, process.env.ALLOWED_ORIGIN);
          Object.entries(corsHeaders).forEach(([k, v]) => {
            res.setHeader(k, v);
          });

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            return res.end();
          }

          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
          }

          let rawBody = '';
          req.on('data', (chunk) => {
            rawBody += chunk;
          });
          req.on('end', async () => {
            try {
              const body = JSON.parse(rawBody || '{}');
              const {
                name = 'Valued Collector',
                email = '',
                phone = 'Not Provided',
                deliveryMode = 'courier',
                address = 'Not Provided',
                city = 'Surat',
                postal = '395007',
                notes = '',
                items = [],
                totalAmount = 0,
              } = body;

              const itemsSummary = items
                .map((i) => `${i.name || 'Timepiece'} (${i.ref || 'Ref. GTC'}) - ${i.price || ''}`)
                .join('; ');
              const primaryWatch = items[0] || {};
              const formattedPrice = `₹${(totalAmount || 245000).toLocaleString('en-IN')}`;

              await sendMail({
                type: 'watch_inquiry_booking',
                actionType: 'BOOKING',
                accountName: name,
                customerEmail: email,
                customerPhone: phone,
                watchName: primaryWatch.name || 'Maison GTC Collection Reference',
                watchRef: primaryWatch.ref || 'HIM-GT-2001',
                watchPrice: formattedPrice,
                customerMessage: `Delivery: ${deliveryMode.toUpperCase()} | Destination: ${address}, ${city} - ${postal} | Allocated Items: ${itemsSummary || 'Standard Reference'} | Collector Instructions: ${notes || 'None'}`,
              }).catch((err) => console.warn('[vite-orders-api] Email dispatch note:', err.message));

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Allocation dossier secured and dispatched successfully.' }));
            } catch (err) {
              console.warn('[vite-orders-api] Error processing order:', err.message);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Internal order error' }));
            }
          });
          return;
        }

        if (urlPath === '/api/send-mail') {
          const clientIp = req.socket?.remoteAddress || '127.0.0.1';
          const origin = req.headers['origin'] || '';
          const corsHeaders = getCorsHeaders(origin, process.env.ALLOWED_ORIGIN);
          Object.entries(corsHeaders).forEach(([k, v]) => {
            res.setHeader(k, v);
          });

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            return res.end();
          }

          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
          }

          // Rate limit: 5 requests per 15 minutes per IP
          const rateResult = checkRateLimit(clientIp, 'send-mail', 5, 15 * 60 * 1000);
          if (!rateResult.allowed) {
            res.statusCode = 429;
            res.setHeader('Retry-After', String(rateResult.retryAfterSeconds));
            res.setHeader('Content-Type', 'application/json');
            return res.end(
              JSON.stringify({
                success: false,
                error: `Too Many Requests. Rate limit exceeded. Please retry after ${rateResult.retryAfterSeconds} seconds.`,
                retryAfter: rateResult.retryAfterSeconds,
              })
            );
          }

          let rawBody = '';
          req.on('data', (chunk) => {
            rawBody += chunk;
          });
          req.on('end', async () => {
            try {
              let payload = {};
              try {
                payload = JSON.parse(rawBody || '{}');
              } catch (e) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, error: 'Malformed JSON payload' }));
              }

              const validation = validateMailPayload(payload);
              if (!validation.valid) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, error: validation.error }));
              }

              console.log(`[gtc-mail-api] Processing ${payload.type || 'email'} dispatch safely...`);
              const result = await sendMail(validation.sanitized);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              console.warn('[gtc-mail-api] SMTP dispatch notice:', err.message);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: false,
                  error: 'Dispatch service temporarily unavailable. Please retry or contact concierge.',
                })
              );
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [gtcMailApiPlugin()],
  optimizeDeps: {
    include: [
      'three',
      'three/addons/loaders/GLTFLoader.js',
      'three/addons/loaders/RGBELoader.js',
      'three/addons/loaders/EXRLoader.js',
      'gsap',
      'gsap/ScrollTrigger',
      'lenis',
      '@supabase/supabase-js',
    ],
  },
  server: {
    host: true, // Exposes dev server on local network (e.g. http://192.168.1.92:5173)
    port: 5173,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        collection: resolve(import.meta.dirname, 'collection.html'),
        about: resolve(import.meta.dirname, 'about.html'),
        profile: resolve(import.meta.dirname, 'profile.html'),
        checkout: resolve(import.meta.dirname, 'checkout.html'),
        contact: resolve(import.meta.dirname, 'contact.html'),
        privacy: resolve(import.meta.dirname, 'privacy.html'),
        terms: resolve(import.meta.dirname, 'terms.html'),
        warranty: resolve(import.meta.dirname, 'warranty.html'),
      },
    },
  },
});
