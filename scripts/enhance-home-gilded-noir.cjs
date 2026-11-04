const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. UPDATE STYLE.CSS ROOT TO GILDED NOIR & ELEVATE HOME/HERO
const stylePath = path.join(rootDir, 'style.css');
let styleCss = fs.readFileSync(stylePath, 'utf8');

// Replace :root block with the canonical Gilded Noir system
const rootMatch = /:root\s*\{[\s\S]*?--border-active:\s*rgba\(199,\s*156,\s*90,\s*0\.55\);\s*\}/;

const newGildedNoirRoot = `:root {
  /* ═══════════════════════════════════════════════════════════
     GTC HIMALAYAN · THE GILDED NOIR LUXURY HOROLOGY SYSTEM
     Noir Black - #111111 (Primary Body & Canvas Background)
     Charcoal   - #2E2E2E (Surfaces, Elevated Panels & Docks)
     Antique Gold - #C9A84C (Primary Metallic Highlight, Buttons, Hairlines)
     Champagne  - #E8D6B3 (Secondary Accents, Metadata, Eyebrows)
     Ivory      - #F8F5EF (Primary Headings, Typography, Body Text)
     ═══════════════════════════════════════════════════════════ */
  --bg-color: #111111;            /* Noir Black — primary body/canvas background */
  --surface-color: #2E2E2E;       /* Charcoal — cards, elevated surfaces, panels */
  --surface-elevated: #3A3A3A;    /* Lighter Charcoal for active/hover states */
  --primary-color: #C9A84C;       /* Antique Gold — highlight/CTA/badges */
  --accent-color: #E8D6B3;        /* Champagne — secondary borders, metadata, eyebrows */
  --text-color: #F8F5EF;          /* Ivory — primary headings, paragraphs, general text */
  --btn-text: #111111;            /* Noir Black text on solid gold buttons */

  --bg-rgb: 17, 17, 17;
  --surface-rgb: 46, 46, 46;
  --primary-rgb: 201, 168, 76;
  --accent-rgb: 232, 214, 179;
  --text-rgb: 248, 245, 239;

  /* Aliases for backwards compatibility */
  --accent-gold: var(--primary-color);
  --accent-champagne: var(--accent-color);
  --charcoal: var(--surface-color);

  --font-hero: 'Playfair Display', 'Cinzel', serif;
  --font-serif: 'Playfair Display', 'Cormorant Garamond', serif;
  --font-sans: 'Inter', 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'Outfit', 'DM Mono', monospace;
  --font-accent: 'Outfit', 'Montserrat', sans-serif;
  --nav-bg: rgba(46, 46, 46, 0.88);

  /* Subdued luxury hairline borders */
  --border-subtle: rgba(201, 168, 76, 0.18);
  --border-glass: rgba(248, 245, 239, 0.08);
  --border-active: rgba(201, 168, 76, 0.48);
}`;

if (rootMatch.test(styleCss)) {
  styleCss = styleCss.replace(rootMatch, newGildedNoirRoot);
  console.log('Successfully set :root to Gilded Noir in style.css');
} else {
  console.warn('Could not match :root with regex, checking alternate pattern');
}

// 2. REVISE SECTION 16 AT THE BOTTOM OF STYLE.CSS FOR GILDED NOIR HOME & HERO
const section16Marker = '/* ═══════════════════════════════════════════════════════════\n   16. OPULENT SECTION-SPECIFIC HARMONIES';
const section16Replacement = `/* ═══════════════════════════════════════════════════════════
   16. OPULENT SECTION-SPECIFIC HARMONIES (Gilded Noir Home & Hero)
   ═══════════════════════════════════════════════════════════ */

/* ─── A. ELEVATED CHARCOAL & ANTIQUE GOLD HEADER ────────── */
.nav {
  background: linear-gradient(180deg, rgba(46, 46, 46, 0.94) 0%, rgba(22, 22, 22, 0.9) 100%) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  border-bottom: 1px solid rgba(201, 168, 76, 0.24) !important;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.55);
}

.nav.scrolled {
  background: rgba(30, 30, 30, 0.98) !important;
  border-bottom-color: rgba(201, 168, 76, 0.4) !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8) !important;
}

.nav-cta {
  border-color: rgba(201, 168, 76, 0.4) !important;
  color: #C9A84C !important;
}

.nav-cta:hover {
  background: rgba(201, 168, 76, 0.12) !important;
  border-color: #C9A84C !important;
  color: #E8D6B3 !important;
  box-shadow: 0 0 20px rgba(201, 168, 76, 0.25);
}

/* ─── B. GILDED NOIR 3D HERO STAGE ──────────────────────── */
.hero-3d-section {
  background-color: #111111 !important;
  transition: background-color 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-canvas-overlay {
  background: radial-gradient(circle at 50% 50%, transparent 35%, #111111 95%),
              linear-gradient(to bottom, rgba(17, 17, 17, 0.45) 0%, transparent 40%, #111111 100%) !important;
  transition: background 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-pill-badge {
  background: rgba(46, 46, 46, 0.78) !important;
  border: 1px solid rgba(201, 168, 76, 0.28) !important;
  color: #C9A84C !important;
}

.hero-variant-selector-dock {
  background: rgba(36, 36, 36, 0.88) !important;
  backdrop-filter: blur(18px) !important;
  -webkit-backdrop-filter: blur(18px) !important;
  border: 1px solid rgba(201, 168, 76, 0.28) !important;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.75), 0 0 25px rgba(201, 168, 76, 0.08) !important;
}

.editorial-narrative-badge {
  background: rgba(38, 38, 38, 0.92) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(201, 168, 76, 0.25) !important;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(201, 168, 76, 0.1) !important;
}

/* ─── C. BESPOKE REVEAL CARDS (Charcoal Enclosures with Gold Trims) ─── */
.reveal-card {
  background: linear-gradient(150deg, rgba(46, 46, 46, 0.9) 0%, rgba(24, 24, 24, 0.96) 100%) !important;
  border: 1px solid rgba(201, 168, 76, 0.22) !important;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75), 0 0 30px rgba(201, 168, 76, 0.06) !important;
}

.reveal-card .reveal-card-body {
  background: linear-gradient(to bottom, rgba(38, 38, 38, 0.96), rgba(20, 20, 20, 0.98)) !important;
}

.reveal-card .reveal-card-step {
  color: #C9A84C !important;
}

.reveal-card .reveal-card-badge {
  background: rgba(201, 168, 76, 0.1) !important;
  border-color: rgba(201, 168, 76, 0.25) !important;
  color: #E8D6B3 !important;
}

.reveal-card[data-index="0"] {
  border-color: rgba(201, 168, 76, 0.3) !important;
}

.reveal-card[data-index="1"] {
  border-color: rgba(201, 168, 76, 0.3) !important;
}

.reveal-card[data-index="2"] {
  border-color: rgba(56, 189, 248, 0.32) !important;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75), 0 0 30px rgba(56, 189, 248, 0.15) !important;
}
.reveal-card[data-index="2"] .reveal-card-step {
  color: #38bdf8 !important;
}
.reveal-card[data-index="2"] .reveal-card-badge {
  background: rgba(56, 189, 248, 0.1) !important;
  border-color: rgba(56, 189, 248, 0.3) !important;
  color: #7dd3fc !important;
}

.reveal-card[data-index="3"] {
  border-color: rgba(232, 214, 179, 0.3) !important;
}

/* ─── D. BESPOKE CTA PRODUCT CARDS (LAVISH GRID) ──────── */
.cta-product-card {
  background: linear-gradient(150deg, rgba(46, 46, 46, 0.92) 0%, rgba(24, 24, 24, 0.98) 100%) !important;
  border: 1px solid rgba(201, 168, 76, 0.22) !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(201, 168, 76, 0.08) !important;
}

.cta-product-card:hover {
  border-color: #C9A84C !important;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(201, 168, 76, 0.25) !important;
}

.cta-product-card .card-edition-badge {
  background: rgba(30, 30, 30, 0.85) !important;
  border: 1px solid rgba(201, 168, 76, 0.3) !important;
  color: #E8D6B3 !important;
}

.card-cta-btn:hover {
  background: #C9A84C !important;
  color: #111111 !important;
  box-shadow: 0 4px 18px rgba(201, 168, 76, 0.4) !important;
}

/* ─── E. GROUNDED CHARCOAL NOIR FOOTER ──────────────────── */
footer.footer,
.footer {
  position: relative;
  z-index: 20;
  background: #141414 !important;
  background-color: #141414 !important;
  border-top: 1px solid rgba(201, 168, 76, 0.2) !important;
  color: #F8F5EF !important;
  padding: 0 5% 2rem;
}

.footer-top-rule {
  background: linear-gradient(
    to right,
    transparent 0%,
    #C9A84C 30%,
    #C9A84C 70%,
    transparent 100%
  ) !important;
}

.footer-tagline {
  color: #E8D6B3 !important;
}

.footer-col-desc {
  color: rgba(248, 245, 239, 0.72) !important;
}

.footer-reserve-btn {
  background: #C9A84C !important;
  color: #111111 !important;
  border: 1px solid rgba(201, 168, 76, 0.5) !important;
  font-weight: 600;
  transition: all 0.3s ease;
}

.footer-reserve-btn:hover {
  background: #E8D6B3 !important;
  color: #111111 !important;
  box-shadow: 0 4px 20px rgba(201, 168, 76, 0.4) !important;
}

/* ─── F. COLLECTION ATELIER (ALPINE EMERALD WORKSHOP) ──── */
body.collection-page {
  --bg-color: #0A2219 !important;
  --surface-color: #163B2F !important;
  --primary-color: #C9A84C !important;
  --accent-color: #D9CDBA !important;
  --text-color: #F5F0E6 !important;
  --btn-text: #0A2219 !important;
  background-color: #0A2219 !important;
  color: #F5F0E6 !important;
}

body.collection-page .nav {
  background: linear-gradient(180deg, rgba(22, 59, 47, 0.95) 0%, rgba(10, 34, 25, 0.9) 100%) !important;
  border-bottom: 1px solid rgba(201, 168, 76, 0.28) !important;
}

/* ─── G. HERITAGE ARCHIVES (HAVANA WOOD & VINTAGE LEATHER) ─ */
body.heritage-page {
  --noir-black: #1A1614 !important;
  --charcoal: #382420 !important;
  --charcoal-light: #543730 !important;
  --antique-gold: #C6A58D !important;
  --champagne: #D9CDBA !important;
  --ivory: #EFE3D6 !important;
  background-color: #1A1614 !important;
  color: #EFE3D6 !important;
}

body.heritage-page .nav {
  background: linear-gradient(180deg, rgba(56, 36, 32, 0.95) 0%, rgba(26, 22, 20, 0.9) 100%) !important;
  border-bottom: 1px solid rgba(198, 165, 141, 0.3) !important;
}
`;

if (styleCss.includes(section16Marker)) {
  const idx = styleCss.indexOf(section16Marker);
  styleCss = styleCss.substring(0, idx) + section16Replacement;
  console.log('Replaced Section 16 with Gilded Noir Home & Hero in style.css');
} else {
  styleCss += '\n' + section16Replacement;
  console.log('Appended Gilded Noir Home & Hero to style.css');
}

fs.writeFileSync(stylePath, styleCss, 'utf8');
console.log('Updated style.css successfully!');
