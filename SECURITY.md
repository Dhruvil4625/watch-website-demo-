# Gujarat Time Company (GTC) · Web Security & Hardening Architecture

This document outlines the 12 core security defenses implemented across the GTC Haute Horlogerie digital platform.

---

## The 12 Security Defenses

### 1. Secrets and Environment Variables
- **Policy:** Never expose private API keys, tokens, or credentials in client-side code.
- **Frontend vs Backend Separation:**
  - Client-side variables are strictly scoped to the `VITE_` prefix (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RAZORPAY_KEY_ID`).
  - Private backend secrets (`GMAIL_APP_PASSWORD`, `ADMIN_EMAILS`, `SUPABASE_SERVICE_ROLE_KEY`) do **NOT** have the `VITE_` prefix and are accessed strictly via `process.env` in server code.
- **Git Protection:** `.gitignore` excludes `.env`, `.env.local`, `.env.*.local`, `.env.*`, `*.pem`, and `*.key`.
- **Reference Spec:** [`.env.example`](file:///.env.example) contains full template definitions without raw credentials.

### 2. API Rate Limiting
- **Implementation:** [`server/security.js`](file:///server/security.js) & [`src/utils/security.js`](file:///src/utils/security.js).
- **Enforcement:**
  - `/api/send-mail`: Enforces sliding-window limit of **5 requests per 15 minutes** per IP. Returns `429 Too Many Requests` with `Retry-After` header.
  - Client Authentication: Tracks failed login attempts per account.
  - Reservation Submissions: Rate-limited to 5 requests per 10 minutes.
  - Password Reset Requests: Rate-limited to 3 requests per 15 minutes.

### 3. Input Validation and Sanitization
- **Implementation:** [`server/security.js`](file:///server/security.js) & [`src/utils/security.js`](file:///src/utils/security.js).
- **Enforcement:**
  - All payload types must match whitelisted enums (`admin_otp`, `collector_welcome`, etc.).
  - Email addresses validated against strict RFC 5322 regex patterns with length caps (< 254 chars).
  - All strings sanitized and escaped before database insertion or HTML template interpolation.
  - Malformed or invalid requests rejected with `400 Bad Request`.

### 4. Authentication and Authorization
- **Implementation:** [`src/lib/watchApi.js`](file:///src/lib/watchApi.js) & [`src/components/authModal.js`](file:///src/components/authModal.js).
- **Enforcement:**
  - Password rules enforced (min 8 chars for registry).
  - Cryptographic 3-Key Quorum validation required for Co-Owner administrative actions with 90-second auto-destruct timers.
  - Account Lockout triggered automatically after 5 consecutive failed attempts (15-minute cooldown).
  - Admin controls in [`src/components/adminStudio.js`](file:///src/components/adminStudio.js) protected by active session role checks.

### 5. SQL and Database Security
- **Implementation:** [`supabase/migrations/20261020000000_security_hardening.sql`](file:///supabase/migrations/20261020000000_security_hardening.sql).
- **Enforcement:**
  - Row Level Security (RLS) enabled on all database tables (`reservations_orders`, `reservations`, `customer_profiles`, `admin_users`, `admin_vault_quorum`).
  - Least-Privilege Policies: Anonymous users can only INSERT reservations; only authenticated admins can query or export reservations.
  - Parameterized PostgREST API queries only; zero raw SQL string concatenation.

### 6. CORS Configuration
- **Implementation:** [`server/security.js`](file:///server/security.js) & [`vercel.json`](file:///vercel.json).
- **Enforcement:**
  - Explicit origin whitelisting via `ALLOWED_ORIGIN`. No wildcards (`*`) permitted in production.
  - Allowed HTTP methods strictly restricted to `POST, OPTIONS`.

### 7. HTTP Security Headers
- **Implementation:** [`vercel.json`](file:///vercel.json) & HTML files.
- **Headers Configured:**
  - `Content-Security-Policy`: Restricts scripts, styles, fonts, media, and connect origins.
  - `X-Frame-Options: DENY`: Prevents UI clickjacking attacks.
  - `X-Content-Type-Options: nosniff`: Prevents MIME-confusion attacks.
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`: Enforces HTTPS.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

### 8. File Upload Security
- **Implementation:** [`src/utils/security.js`](file:///src/utils/security.js) & [`src/components/adminStudio.js`](file:///src/components/adminStudio.js).
- **Enforcement:**
  - Whitelisted MIME types: `image/jpeg`, `image/png`, `image/webp`. Rejects executable, SVG scripts, or HTML files.
  - Strict size limit: Max 5.0 MB per asset.

### 9. Error Handling and Logging
- **Implementation:** [`server/security.js`](file:///server/security.js) & [`src/utils/security.js`](file:///src/utils/security.js).
- **Enforcement:**
  - Internal database errors, table schemas, and SMTP credentials redacted from responses.
  - Generic, polite user messages presented on failure. Full error context logged securely on the server.

### 10. Dependency Security
- **Verification:** Audited via `npm audit` (0 vulnerabilities found).
- **Lockfile:** Pinned dependencies managed via `package-lock.json`.

### 11. XSS Prevention
- **Implementation:**
  - Universal HTML escaping utility `escapeHtml()` applied across catalog sync, dynamic cards, and inquiries table in `adminStudio.js`.
  - Email templates in `server/mailer.js` sanitized before injection.
  - Zero dynamic script execution with `eval()` or unescaped user inputs.

### 12. Pre-Deployment Gate Checklist
Before deploying any release, verify:
- [ ] `.env` is uncommitted and listed in `.gitignore`
- [ ] Environment variables set in hosting platform dashboard (Vercel / Supabase)
- [ ] `npm audit` reports 0 high or critical vulnerabilities
- [ ] `npm run build` succeeds cleanly without bundle or import errors
- [ ] HTTPS enforced and SSL certificates active
- [ ] Database RLS migration executed in Supabase SQL editor
