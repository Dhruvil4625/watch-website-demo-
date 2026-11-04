import { sendMail } from '../../server/mailer.js';
import {
  checkRateLimit,
  getCorsHeaders,
  getSecurityHeaders,
  sanitizeHtml,
} from '../../server/security.js';

export default async function handler(req, res) {
  // 1. Strict Security Headers
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([k, v]) => {
    res.setHeader(k, v);
  });

  // 2. CORS Handling
  const origin = req.headers['origin'] || '';
  const corsHeaders = getCorsHeaders(origin, process.env.ALLOWED_ORIGIN);
  Object.entries(corsHeaders).forEach(([k, v]) => {
    res.setHeader(k, v);
  });

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // 3. Rate Limiting: 10 order reservations per 15 minutes per IP
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  const rateResult = checkRateLimit(clientIp, 'orders-reserve', 10, 15 * 60 * 1000);
  if (!rateResult.allowed) {
    res.setHeader('Retry-After', String(rateResult.retryAfterSeconds));
    return res.status(429).json({
      success: false,
      error: `Too Many Requests. Please retry after ${rateResult.retryAfterSeconds} seconds.`,
      retryAfter: rateResult.retryAfterSeconds,
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
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

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    const cleanName = sanitizeHtml(name);
    const cleanEmail = sanitizeHtml(email);
    const cleanPhone = sanitizeHtml(phone);
    const cleanAddress = sanitizeHtml(address);
    const cleanCity = sanitizeHtml(city);
    const cleanPostal = sanitizeHtml(postal);
    const cleanNotes = sanitizeHtml(notes);

    const itemsSummary = items
      .map((i) => `${i.name || 'Timepiece'} (${i.ref || 'Ref. GTC'}) - ${i.price || ''}`)
      .join('; ');

    const primaryWatch = items[0] || {};
    const formattedPrice = `₹${(totalAmount || 245000).toLocaleString('en-IN')}`;

    // Dispatch luxury cross-mail to all 3 Admins + Customer Confirmation Copy
    await sendMail({
      type: 'watch_inquiry_booking',
      actionType: 'BOOKING',
      accountName: cleanName,
      customerEmail: cleanEmail,
      customerPhone: cleanPhone,
      watchName: primaryWatch.name || 'Maison GTC Collection Reference',
      watchRef: primaryWatch.ref || 'HIM-GT-2001',
      watchPrice: formattedPrice,
      customerMessage: `Delivery: ${deliveryMode.toUpperCase()} | Destination: ${cleanAddress}, ${cleanCity} - ${cleanPostal} | Allocated Items: ${itemsSummary || 'Standard Reference'} | Collector Instructions: ${cleanNotes || 'None'}`,
    }).catch((err) => console.warn('[Orders API] Email dispatch note:', err.message));

    return res.status(200).json({
      success: true,
      message: 'Allocation dossier secured and dispatched successfully.',
    });
  } catch (err) {
    console.error('[Orders API] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Unable to process allocation dossier. Our concierge will assist you.',
    });
  }
}
