# Gujarat Time Company (GTC) — Luxury Horology Showcase & Atelier Platform

An ultra-premium, interactive Haute Horlogerie digital platform built for **Maison Gujarat Time Company (GTC)** (Surat Atelier, Est. 2026). Powered by **Vite**, **Vanilla CSS**, **JavaScript (ES Modules)**, **Three.js**, **GSAP**, **Lenis**, **Supabase**, and **Nodemailer SMTP**.

Featuring dual-layer 360° WebGL model inspection, 3D coffret vaults, real-time collector acquisition drawer & insured armored checkout, 3-key multi-sig admin quorum, live inventory management suite, and enterprise-grade security hardening.

---

## 📑 Table of Contents
1. [Core Pages & Route Architecture](#1-core-pages--route-architecture)
2. [Global Cart & Collector Acquisition Engine](#2-global-cart--collector-acquisition-engine)
3. [Interactive 3D WebGL & Horology Viewers](#3-interactive-3d-webgl--horology-viewers)
4. [Cinematic UI, Motion & Procedural Audio](#4-cinematic-ui-motion--procedural-audio)
5. [Collector Authentication & Sovereign Gatekeeper](#5-collector-authentication--sovereign-gatekeeper)
6. [3-Key Multi-Sig Admin Vault Quorum](#6-3-key-multi-sig-admin-vault-quorum)
7. [Admin Master Studio & Catalog Management](#7-admin-master-studio--catalog-management)
8. [Automated Transactional Mailer & SMTP Pipeline](#8-automated-transactional-mailer--smtp-pipeline)
9. [Sovereign Collector Sanctuary (Profile & Provenance)](#9-sovereign-collector-sanctuary-profile--provenance)
10. [Craftsmanship & Savoir-Faire Micro-Showcase](#10-craftsmanship--savoir-faire-micro-showcase)
11. [Heritage Genesis Vault & 3D Coffrets](#11-heritage-genesis-vault--3d-coffrets)
12. [Enterprise Security & Hardening Architecture](#12-enterprise-security--hardening-architecture)
13. [Key Exported Functions & API Reference](#13-key-exported-functions--api-reference)
14. [Tech Stack & Dependencies](#14-tech-stack--dependencies)
15. [Getting Started & Development Setup](#15-getting-started--development-setup)
16. [Project File Structure](#16-project-file-structure)

---

## 1. Core Pages & Route Architecture

| Page | File / Entry Point | Purpose & Core Experience |
| :--- | :--- | :--- |
| **Maison Showcase** | [`index.html`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/index.html) | Flagship homepage featuring 3D hero landscape morphing, brand cinema film, interactive calibre architecture, ethos collection cards, and technical dossier modals. |
| **Collection & Editions** | [`collection.html`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/collection.html) | Complete catalog of Genesis & Horizon 300 references, with direct `+ QUICK ACQUIRE` buttons, 3D interactive carousels, and specification sheets. |
| **Craftsmanship** | [`craftsmanship.html`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/craftsmanship.html) | Savoir-faire deep dive: Ken Burns macro rotators, case polishing, dial sunburst finishing, movement hand-anglage, and 3D studio viewer. |
| **Heritage & Vault** | [`heritage.html`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/heritage.html) | Surat Atelier founding archive, 4 interactive 3D Genesis Coffret safe boxes with procedural materials and opening animations. |
| **Collector Sanctuary** | [`profile.html`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/profile.html) | Authenticated patron dashboard showing horological lineage, allocation certificates, portfolio valuation, and private salon appointments. |
| **Insured Checkout** | [`checkout.html`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/checkout.html) | Multi-step allocation dossier: Armored courier transit vs. Surat Atelier Private Salon handover, dynamic price ledger, and order dispatch. |

---

## 2. Global Cart & Collector Acquisition Engine
*Implemented in [`src/components/cart.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/src/components/cart.js), [`src/components/cart.css`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/src/components/cart.css), and [`api/orders/reserve.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/api/orders/reserve.js).*

* **Persistent Storage**: Stores allocated timepieces in `localStorage` under key `gtc_collector_cart`.
* **Real-Time Header Badge**: Syncs active item count across navigation headers via `#gtc-cart-badge` and `.gtc-cart-count`.
* **Obsidian & Antique Gold Slide-Over Drawer**:
  * Smooth slide-out panel (`transform: translateX(0)`) with backdrop blur.
  * Empty-state guidance for collectors.
  * Item cards displaying thumbnail, reference code, edition title, and INR price (`₹`).
  * Real-time subtotal calculation in Indian Rupees (`₹`).
  * Integration with Lenis smooth scroll (freezes background scroll while drawer is open).
  * Keyboard support (`Escape` closes drawer).
* **Direct Quick-Acquire**:
  * `+ QUICK ACQUIRE` button on every collection card for instant addition without modal friction.
  * Internal quick-acquire button inside the detailed specification modal.
* **Insured Shipping & Allocation Flow ([`checkout.html`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/checkout.html))**:
  * Two handover modes: **❖ Insured Armored Transit** (requires verified address/PIN) vs. **❖ Surat Atelier Private Salon** (in-person VIP handover ceremony).
  * Auto pre-fills signed-in patron's legal name, email, and mobile number.
  * Posts allocation payload to `/api/orders/reserve` and persists order in Supabase `reservations_orders`.
  * Empties cart upon registration and redirects patron to their Sanctuary profile.

---

## 3. Interactive 3D WebGL & Horology Viewers
*Implemented in [`hero-3d.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/hero-3d.js), [`craft3dViewer.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/craft3dViewer.js), and [`main.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/main.js).*

* **Hero Section Dual-Layer 3D Engine ([`hero-3d.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/hero-3d.js))**:
  * **360° Synchronous Landscape Panning**: Rotating the watch synchronously pans 360° background environment spheres (`bgSphere1`, `bgSphere2`) and scene IBL radiance.
  * **Touch / Click to Focus**: Smooth camera dolly (FOV: 45° → 22°, Z: 12 → 4) focusing on dial details, fading in editorial origin badges.
  * **360° Accumulated Drag Morphing**: Once rotation reaches a full 360° revolution:
    1. Drag controls lock (`isMorphing = true`).
    2. Camera dollies out to wide landscape view (FOV 45, Z 12).
    3. Dual crossfade transitions background sphere textures, environment lighting, dial PBR materials, and narrative text.
    4. Camera glides back into the new variant (FOV 22, Z 4).
  * **PBR Material Customization**: Real-time shader replacement for sapphire crystal optics (transmission 0.95, roughness 0.05, IOR 1.5), cold-forged 904L steel cases, and fluted dial textures.
* **Collection 3D Showcase Engine ([`main.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/main.js))**:
  * 360° carousel rotating through multiple watch GLB models (*Rolex Datejust*, *Seiko Heritage*, *Tissot T-Race*, etc.).
  * HUD navigation displaying angle degrees (0°, 120°, 240°), section indicators, and dynamic specifications.
* **Craftsmanship 3D Studio ([`craft3dViewer.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/craft3dViewer.js))**:
  * Standalone 3D studio with orbital drag controls, auto-rotation toggle, camera reset button, and real-time GLTF/EXR load progress indicators.

---

## 4. Cinematic UI, Motion & Procedural Audio
*Implemented in [`main.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/main.js), [`src/morphingNav.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/src/morphingNav.js), and [`style.css`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/style.css).*

* **Lenis Inertial Smooth Scrolling**:
  * Customized lerp and touch multiplier ensuring fluid 120Hz/60Hz inertial scrolling.
  * Selective scroll-locking using `[data-lenis-prevent]` and modal detectors.
* **GSAP & ScrollTrigger Choreography**:
  * Navigation entrance slide, hero title staggered reveals, and parallax scrolling on watch layers.
  * Hydrodynamic cursor hover effects on collection cards.
* **Signature Morphing Dropdown Navigation ([`src/morphingNav.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/src/morphingNav.js))**:
  * Dynamic auto-sizing vertical dropdown panel that animates width/height and centers under active nav items.
  * Mobile slide-out navigation sheet.
* **Procedural Horology Audio Synthesizer (Web Audio API)**:
  * Zero external audio files required — fully synthesized via browser audio nodes:
    * `playTick()`: Mechanical balance wheel escapement click (triangle oscillator + bandpass filter at 2400Hz).
    * `playCharge()`: Rising energy hum for gold seam flares.
* **Cinematic Preloader**:
  * Atmospheric luxury intro sequence featuring the GTC seal, progress bar, audio toggle, and "Skip Intro" option.

---

## 5. Collector Authentication & Sovereign Gatekeeper
*Implemented in [`src/components/authModal.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/src/components/authModal.js), [`src/lib/watchApi.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/src/lib/watchApi.js), and [`src/lib/supabaseClient.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/src/lib/supabaseClient.js).*

* **Split-Screen Luxury Auth Modal**:
  * Left panel: Looping mechanical watch movement video (`watch-movement.mp4`) with obsidian poster fallback and gold badges.
  * Right panel: Multi-mode form container.
* **Supported Authentication Modes**:
  1. **Collector Registration**: Captures full name, email, phone, and password (enforces 8+ characters and complexity checks).
  2. **Collector Login**: Authenticates against Supabase Auth, updates session, and issues welcome emails.
  3. **Forgot Password Flow**: Dispatches 6-digit verification OTP and recovery link via Gmail SMTP.
  4. **Password Reset Modal**: Visual dialog with password view/hide toggle, confirmation check, and immediate Supabase database update.
  5. **Admin Quorum Portal**: Dedicated access gate for registered Maison co-owners.
* **Autonomous Gatekeeper Protocol**:
  * Automatically intercepts user interactions on protected actions (`.open-reserve-modal`, `.purchase-btn`, `.btn-quick-add`, `[data-require-auth="true"]`).
  * If patron is unauthenticated, stores the pending action, displays the luxury auth modal, and automatically executes the blocked action upon successful login.

---

## 6. 3-Key Multi-Sig Admin Vault Quorum
*Implemented in [`src/components/authModal.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/src/components/authModal.js), [`src/lib/watchApi.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/src/lib/watchApi.js), and [`server/mailer.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/server/mailer.js).*

* **Triumvirate Co-Owner Protection**:
  * Admin accounts are strictly bound to the 3 registered co-owners:
    * `gujarattimecompany@gmail.com`
    * `parthsherathiya181@gmail.com`
    * `ramoliadk@gmail.com`
* **Cryptographic 3-of-3 Quorum Protocol**:
  * When any co-owner requests administrative access, the system generates 3 cryptographically distinct 6-digit keys.
  * Each key is dispatched simultaneously to its respective co-owner via Gmail SMTP.
  * Unlocking the Admin Studio requires all 3 unique keys entered simultaneously into the 3-box interface.
* **90-Second Auto-Destruction**:
  * Real-time countdown timer in the modal UI.
  * Expired keys are purged automatically; brute-force attempts trigger exponential backoff.
* **Cross-Mail Security Audit Alert**:
  * As soon as an admin session is unlocked, a notification email is automatically dispatched to all 3 co-owners detailing the actor's identity, IP, and timestamp.

---

## 7. Admin Master Studio & Catalog Management
*Implemented in [`src/components/adminStudio.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/src/components/adminStudio.js) and [`src/components/adminStudio.css`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/src/components/adminStudio.css).*

* **Floating Admin Dock**:
  * Appears at the bottom of the viewport exclusively for verified co-owner sessions.
  * Quick triggers: Open Studio, Add Timepiece, Manage Inquiries, Sign Out.
* **Inventory Management Suite**:
  * Real-time catalog listing of all Genesis & Horizon timepieces.
  * Live card editing: Modify titles, reference numbers, prices, descriptions, and collections.
  * Technical specifications editor: Calibre architecture, power reserve, water resistance, dial finish, frequencies, and straps.
* **Multi-Slot Image & 3D Asset Uploader**:
  * 3 image slots per timepiece: **Dial Face**, **Case Profile**, and **Calibre Movement**.
  * File sanitization: Validates MIME types (`image/jpeg`, `image/png`, `image/webp`) and restricts file sizes to < 5.0 MB.
  * Direct 3D GLB file path binding.
  * Individual image clearing with custom SVG placeholders.
* **Inquiries & Reservations CRM Table**:
  * Live stream of all concierge reservations submitted across the website.
  * Displays patron name, email, phone, requested model, message, and timestamp.
  * Status filtering and one-click email response triggers.
* **Real-Time Client-Side & Supabase Sync**:
  * Catalog modifications automatically update card UI across [`index.html`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/index.html) and [`collection.html`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/collection.html) without requiring code redeployments.

---

## 8. Automated Transactional Mailer & SMTP Pipeline
*Implemented in [`server/mailer.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/server/mailer.js), [`api/send-mail.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/api/send-mail.js), and [`server/security.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/server/security.js).*

* **High-Deliverability Anti-Spam Architecture**:
  * Dual-format delivery: Multi-part **HTML + Plaintext** body for 100% spam filter compliance.
  * Authenticated via dedicated Gmail App Password over TLS/SSL.
  * Official Atelier footer complying with international transactional email standards.
* **6 Pre-Built Luxury Email Templates**:
  1. `admin_otp`: Dispatches 3 unique 90-second authorization keys to the 3 co-owners.
  2. `admin_login_unlocked`: Security broadcast alert sent to all 3 co-owners when an admin logs in.
  3. `watch_inquiry_booking`: Cross-mail dossier sent to co-owners with order details + official branded confirmation sent to the patron.
  4. `collector_welcome`: Branded welcome dossier dispatched upon patron registration or login.
  5. `password_reset_otp`: Password recovery email featuring a 6-digit OTP (2-min expiry) and direct reset button link.
  6. `password_updated_confirmation`: Security confirmation alerting patron that their password was changed (+ cross-mail to co-owners if admin).

---

## 9. Sovereign Collector Sanctuary (Profile & Provenance)
*Implemented in [`profile.html`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/profile.html).*

* **Collector Hero Card**:
  * Avatar initials crest, legal name, registered email, patron ID (e.g., `GTC-PATRON-8821`), and verified role badge.
  * Security metrics: Steward status and total collector portfolio valuation in INR.
* **Horological Lineage & Allocations Ledger**:
  * Dynamic table populated from Supabase `reservations_orders` and `reservations`.
  * Displays timepiece title, unique allocation code (e.g., `GTC-2026-088`), acquisition date, valuation, and status badge.
* **Certificate of Provenance (COA)**:
  * Visual inspection of official Surat Atelier provenance certificate.
* **Private Salon Appointments**:
  * Dedicated form to schedule a personal viewing ceremony at the private atelier in Surat, Gujarat.
* **Account Security Controls**:
  * View active credentials, trigger instant password updates, inspect 2FA/Quorum clearance level, and securely terminate sessions.

---

## 10. Craftsmanship & Savoir-Faire Micro-Showcase
*Implemented in [`src/components/craftsmanshipPage.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/src/components/craftsmanshipPage.js) and [`craftsmanship.html`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/craftsmanship.html).*

* **Ken Burns Architectural Macro Rotators**:
  * Automatic cross-fade and subtle Ken Burns zoom animation across horological components:
    * Cold-forged 904L steel cases and fluted bezels.
    * Anthracite and ice blue sunburst dials.
    * Calibre GTC-2601 mechanical movement plates.
    * Hand-stitched alligator and Jubilee steel bracelets.
* **Gold Progress Indicator**:
  * Animated golden progress line showing countdown (3.8s per slide).
* **Interactive Controls**:
  * Interactive thumbnail selector dots.
  * 3D mouse tilt effect on media cards.
  * Automatic pause on hover so collectors can inspect micro-finishing.

---

## 11. Heritage Genesis Vault & 3D Coffrets
*Implemented in [`heritage.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/heritage.js), [`heritage.html`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/heritage.html), and [`src/data/heritageData.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/src/data/heritageData.js).*

* **4 Genesis Coffrets Interactive 3D Vault**:
  * **Coffret 01**: *Prototype Zero* (Genesis Allocation charter, 904L milled coupon).
  * **Coffret 02**: *Expedition Survivor* (Extreme altitude testing logs).
  * **Coffret 03**: *Calibre Architecture* (Original movement blueprints).
  * **Coffret 04**: *Royal Commission* (Private sovereign order documentation).
* **Procedural 3D Safe Boxes**:
  * Custom Three.js procedural box geometry with brushed metallic textures and gold plaque engravings.
  * Interactive lid-opening animation and orbital camera angles.
* **Genesis Archive Timeline**:
  * Chronological milestones detailing Surat Atelier founding history, metallurgy standards, and horological patents.

---

## 12. Enterprise Security & Hardening Architecture
*Implemented in [`SECURITY.md`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/SECURITY.md), [`server/security.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/server/security.js), [`src/utils/security.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/src/utils/security.js), and [`supabase/migrations/20261020000000_security_hardening.sql`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/supabase/migrations/20261020000000_security_hardening.sql).*

* **12 Security Defenses Implemented**:
  1. **Strict Secrets Isolation**: Private SMTP credentials and service role keys are restricted to backend environment variables (zero leakage into client bundles).
  2. **Sliding-Window Rate Limiting**: Max 5 email dispatches per 15 min per IP; 5 failed login attempts trigger a 15-minute lockout.
  3. **Universal Input Validation & Sanitization**: Strict email regex checks, length capping, and HTML escaping (`escapeHtml()`) across all inputs.
  4. **Role-Based Access Control (RBAC)**: Distinct permissions for `customer` vs. `admin`.
  5. **Row Level Security (RLS)**: Enabled across all Supabase tables (`reservations_orders`, `reservations`, `customer_profiles`, `admin_users`).
  6. **CORS Restrictions**: Explicit origin whitelisting (`ALLOWED_ORIGIN`), disallowing wildcard `*` origins in production.
  7. **HTTP Security Headers**: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security`.
  8. **File Upload Security**: Rejects SVGs, scripts, and non-image files; restricts asset sizes to 5.0 MB.
  9. **Generic Error Responses**: Redacts internal database exceptions from client responses while keeping secure server logs.
  10. **Lockfile & Dependency Pinning**: Audited via `npm audit` with 0 high/critical vulnerabilities.
  11. **XSS & Template Injection Defense**: All user strings in email and card templates are escaped before injection.
  12. **Automated Penetration Suite ([`vaultDiagnostics.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/src/utils/vaultDiagnostics.js))**: Browser console diagnostic suite verifying database tables, RLS policies, and quorum timing.

---

## 13. Key Exported Functions & API Reference

### Cart & Checkout Engine ([`src/components/cart.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/src/components/cart.js))
* `getGtcCart()`: Retrieves array of allocated timepieces from `localStorage`.
* `saveGtcCart(cart)`: Persists cart array and triggers badge / item re-renders.
* `updateCartBadge()`: Updates header counter badges (`#gtc-cart-badge`).
* `toggleGtcCart(open)`: Smoothly slides open or closes the cart drawer.
* `addToGtcCart(item)`: Adds a timepiece reference and opens the drawer.
* `removeFromGtcCart(id)`: Removes a timepiece from the allocation bag.
* `renderCartItems()`: Generates HTML item rows inside the cart drawer.
* `proceedToCheckout()`: Closes the drawer and navigates to `checkout.html`.

### Authentication & Vault API ([`src/lib/watchApi.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/src/lib/watchApi.js) & [`src/components/authModal.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/src/components/authModal.js))
* `initAuthModal()`: Mounts modal DOM and binds triggers across the site.
* `signUpCustomer(email, password, metadata)`: Registers a new collector with Supabase.
* `loginUser(email, password)`: Authenticates patron and returns session + role.
* `logoutUser()`: Clears session and resets UI state.
* `requestAdminQuorumKeys(initiatorEmail)`: Generates 3 OTP keys and emails co-owners.
* `verifyAdminQuorum(keys)`: Validates 3 simultaneous keys against active quorum request.
* `requestPasswordReset(email)`: Triggers reset link and 6-digit recovery OTP.
* `confirmPasswordReset(newPassword)`: Updates the password directly in Supabase.

### Admin Master Studio ([`src/components/adminStudio.js`](file:///d:/CSE%20Projoct/watch%20website(Vs%20code)/src/components/adminStudio.js))
* `initAdminStudio()`: Injects studio DOM and displays floating dock if admin is authenticated.
* `getAllWatches()`: Returns current catalog array (merged from defaults + custom watches).
* `saveOrUpdateWatch(watchData)`: Saves timepiece edits or creates new reference.
* `deleteWatch(id)`: Removes a watch from the catalog.
* `deleteWatchImage(watchId, slotTarget)`: Clears a specific image slot (dial, profile, or movement).
* `openWatchEditor(watchId)`: Opens the visual card editor modal for that timepiece.
* `showToast(message, type)`: Displays luxury toast feedback in the UI.

### Server & Backend Endpoints
* `POST /api/send-mail`: Main transactional mailer endpoint (supports `admin_otp`, `watch_inquiry_booking`, `collector_welcome`, `password_reset_otp`, and `password_updated_confirmation`).
* `POST /api/orders/reserve`: Dedicated order reservation endpoint (validates payload, rate-limits, inserts into database, and emails dossier).
* `POST /api/reset-rate-limit`: Administrative endpoint to reset rate limits during testing.

---

## 14. Tech Stack & Dependencies

* **Frontend Build Tool**: [Vite](https://vite.dev/)
* **3D Graphics Engine**: [Three.js](https://threejs.org/) (`GLTFLoader`, `EXRLoader`, `OrbitControls`)
* **Motion & Kinetic Scroll**: [GSAP](https://gsap.com/) + [ScrollTrigger](https://gsap.com/scrolltrigger/) & [Lenis](https://lenis.darkroom.engineering/)
* **Backend Database & Auth**: [Supabase](https://supabase.com/) (`@supabase/supabase-js`, PostgREST, Row Level Security)
* **Transactional Email**: [Nodemailer](https://nodemailer.com/) (Gmail SMTP with SPF/DKIM compliance)
* **Typography**: *Cormorant Garamond*, *Cinzel*, *Inter*, *JetBrains Mono*

---

## 15. Getting Started & Development Setup

### Prerequisites
* **Node.js** (v18.0.0 or higher recommended)
* **npm** (v9.0.0 or higher)

### Installation
```bash
# Clone the repository
git clone https://github.com/Dhruvil4625/watch-website.git

# Navigate to project root
cd watch-website

# Install all pinned dependencies
npm install
```

### Environment Configuration
Copy the template environment file and supply your keys:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
# Client-side variables (Safe for frontend bundle)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"

# Server-side variables (Private backend only - NEVER EXPOSE TO CLIENT)
GMAIL_USER="gujarattimecompany@gmail.com"
GMAIL_APP_PASSWORD="your-gmail-app-password"
ADMIN_EMAILS="gujarattimecompany@gmail.com,parthsherathiya181@gmail.com,ramoliadk@gmail.com"
```

### Running Locally
```bash
# Launch development server with hot module replacement
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
# Compile and bundle multi-page production distribution
npm run build

# Preview production build locally
npm run preview
```

---

## 16. Project File Structure

```text
├── index.html                      # Flagship landing page
├── collection.html                 # Complete collection & editions showcase
├── craftsmanship.html              # Savoir-faire & macro component breakdown
├── heritage.html                   # 4 Genesis coffrets & Surat archive
├── profile.html                    # Sovereign Collector Sanctuary & order lineage
├── checkout.html                   # Insured shipping, salon pickup & allocation
├── style.css                       # Obsidian & Antique Gold design system
├── main.js                         # Flagship choreography, 3D carousel & audio
├── hero-3d.js                      # Dual-layer 360° PBR hero WebGL engine
├── craft3dViewer.js                # Dedicated craftsmanship 3D stage viewer
├── craftsmanship.js                # Craftsmanship standalone page controller
├── heritage.js                     # 3D procedural coffrets & heritage engine
├── vite.config.js                  # Multi-page build & dev API middleware
├── package.json                    # Pinned dependencies and npm build scripts
├── SECURITY.md                     # 12-point enterprise security architecture
│
├── api/
│   ├── send-mail.js                # Serverless endpoint for transactional mailer
│   ├── reset-rate-limit.js         # Rate-limit testing reset handler
│   └── orders/
│       └── reserve.js              # Insured checkout & order dossier endpoint
│
├── server/
│   ├── mailer.js                   # Nodemailer SMTP engine with 6 luxury templates
│   └── security.js                 # Sliding-window rate limiting & sanitization
│
├── src/
│   ├── components/
│   │   ├── cart.js                 # Slide-over acquisition drawer & bag engine
│   │   ├── cart.css                # Obsidian & Gold drawer aesthetics
│   │   ├── authModal.js            # Video split-screen auth & 3-key quorum modal
│   │   ├── authModal.css           # Auth dialog and video layout styles
│   │   ├── adminStudio.js          # Admin Master Studio & live card editor
│   │   ├── adminStudio.css         # Admin dock and studio modal styles
│   │   ├── craftsmanshipPage.js    # Ken Burns macro component auto-rotator
│   │   └── craftsmanshipPage.css   # Savoir-faire slider layout styles
│   ├── lib/
│   │   ├── supabaseClient.js       # Initialized Supabase client
│   │   └── watchApi.js             # High-level auth, quota & reservation API
│   ├── services/
│   │   └── supabaseService.js      # Supabase reservation inserts & edge hooks
│   ├── utils/
│   │   ├── security.js             # Client-side input sanitization & validation
│   │   └── vaultDiagnostics.js     # DevTools automated security test suite
│   ├── data/
│   │   └── heritageData.js         # Milestone records & atelier founding specs
│   └── morphingNav.js              # Signature morphing dropdown navigation
│
├── supabase/
│   └── migrations/
│       ├── 20261017000000_password_reset_flow.sql
│       └── 20261020000000_security_hardening.sql  # RLS policies & RBAC rules
│
└── public/
    └── assets/
        ├── 3d/                     # GLB 3D models & EXR environment maps
        ├── photo/                  # High-resolution photography & textures
        └── video/                  # Mechanical watch movement video footage
```

---

## 📜 Provenance & Attribution

Created for **Maison Gujarat Time Company (GTC)**. All rights reserved.  
*Surat Atelier · Haute Horlogerie Manufacture (Est. 2026).*
