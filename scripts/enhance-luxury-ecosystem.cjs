const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. UPDATE STYLE.CSS WITH SECTION-SPECIFIC LUXURY HARMONY
const stylePath = path.join(rootDir, 'style.css');
let styleCss = fs.readFileSync(stylePath, 'utf8');

const sectionStyles = `

/* ═══════════════════════════════════════════════════════════
   16. OPULENT SECTION-SPECIFIC HARMONIES (Multi-Palette Synergy)
   ═══════════════════════════════════════════════════════════ */

/* ─── A. ELEVATED SAPPHIRE HEADER ──────────────────────── */
.nav {
  background: linear-gradient(180deg, rgba(30, 58, 95, 0.94) 0%, rgba(16, 37, 66, 0.88) 100%) !important;
  backdrop-filter: blur(14px) !important;
  -webkit-backdrop-filter: blur(14px) !important;
  border-bottom: 1px solid rgba(199, 156, 90, 0.3) !important;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.4);
}

.nav.scrolled {
  background: rgba(22, 46, 77, 0.97) !important;
  border-bottom-color: rgba(199, 156, 90, 0.45) !important;
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.65) !important;
}

/* ─── B. BESPOKE REVEAL CARDS (Individual Horological Enclosures) ─── */
.reveal-card[data-index="0"] {
  /* Sapphire & Alpine Glacier */
  background: linear-gradient(150deg, rgba(30, 58, 95, 0.9) 0%, rgba(16, 37, 66, 0.95) 100%);
  border: 1px solid rgba(199, 156, 90, 0.35);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(30, 58, 95, 0.3);
}
.reveal-card[data-index="0"] .reveal-card-body {
  background: linear-gradient(to bottom, rgba(24, 48, 80, 0.96), rgba(14, 30, 52, 0.98));
}
.reveal-card[data-index="0"] .reveal-card-step {
  color: #C79C5A;
}

.reveal-card[data-index="1"] {
  /* Horological Forest Emerald & Gold Calibre */
  background: linear-gradient(150deg, rgba(30, 71, 56, 0.9) 0%, rgba(15, 45, 36, 0.95) 100%);
  border: 1px solid rgba(201, 168, 76, 0.38);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(15, 91, 76, 0.25);
}
.reveal-card[data-index="1"] .reveal-card-body {
  background: linear-gradient(to bottom, rgba(22, 54, 43, 0.96), rgba(12, 34, 27, 0.98));
}
.reveal-card[data-index="1"] .reveal-card-step {
  color: #E0C068;
}

.reveal-card[data-index="2"] {
  /* Nocturne Super-LumiNova Cyan Abyss */
  background: linear-gradient(150deg, rgba(20, 36, 58, 0.9) 0%, rgba(10, 20, 34, 0.95) 100%);
  border: 1px solid rgba(56, 189, 248, 0.35);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.2);
}
.reveal-card[data-index="2"] .reveal-card-body {
  background: linear-gradient(to bottom, rgba(16, 32, 52, 0.96), rgba(8, 18, 30, 0.98));
}
.reveal-card[data-index="2"] .reveal-card-step {
  color: #38bdf8;
}

.reveal-card[data-index="3"] {
  /* Espresso & Hand-Brushed Surgical Steel */
  background: linear-gradient(150deg, rgba(58, 38, 34, 0.9) 0%, rgba(30, 24, 22, 0.95) 100%);
  border: 1px solid rgba(198, 165, 141, 0.35);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(122, 86, 69, 0.22);
}
.reveal-card[data-index="3"] .reveal-card-body {
  background: linear-gradient(to bottom, rgba(48, 32, 29, 0.96), rgba(24, 18, 17, 0.98));
}
.reveal-card[data-index="3"] .reveal-card-step {
  color: #C6A58D;
}

/* ─── C. BESPOKE CTA PRODUCT CARDS (LAVISH GRID) ──────── */
.cta-product-card:nth-child(1) {
  /* Sapphire Royal Edition */
  background: linear-gradient(150deg, rgba(30, 58, 95, 0.92) 0%, rgba(16, 37, 66, 0.98) 100%) !important;
  border-color: rgba(199, 156, 90, 0.32) !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(30, 58, 95, 0.25);
}
.cta-product-card:nth-child(1) .card-edition-badge {
  background: rgba(16, 37, 66, 0.85);
  border-color: rgba(199, 156, 90, 0.4);
  color: #D8C3A5;
}

.cta-product-card:nth-child(2) {
  /* Alpine Emerald Horology Edition */
  background: linear-gradient(150deg, rgba(30, 71, 56, 0.92) 0%, rgba(15, 45, 36, 0.98) 100%) !important;
  border-color: rgba(201, 168, 76, 0.35) !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(15, 91, 76, 0.22);
}
.cta-product-card:nth-child(2) .card-edition-badge {
  background: rgba(15, 45, 36, 0.85);
  border-color: rgba(201, 168, 76, 0.4);
  color: #F5F0E6;
}

.cta-product-card:nth-child(3) {
  /* Espresso & Havana Genesis Edition */
  background: linear-gradient(150deg, rgba(65, 42, 38, 0.92) 0%, rgba(30, 24, 22, 0.98) 100%) !important;
  border-color: rgba(198, 165, 141, 0.35) !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(122, 86, 69, 0.22);
}
.cta-product-card:nth-child(3) .card-edition-badge {
  background: rgba(30, 24, 22, 0.85);
  border-color: rgba(198, 165, 141, 0.4);
  color: #EFE3D6;
}

/* ─── D. GROUNDED OBSIDIAN ESPRESSO FOOTER ─────────────── */
footer.footer,
.footer {
  position: relative;
  z-index: 20;
  background: #141110 !important;
  background-color: #141110 !important;
  border-top: 1px solid rgba(198, 165, 141, 0.22) !important;
  color: #FAF8F5 !important;
  padding: 0 5% 2rem;
}

.footer-top-rule {
  background: linear-gradient(
    to right,
    transparent 0%,
    #C79C5A 30%,
    #C79C5A 70%,
    transparent 100%
  ) !important;
}

.footer-tagline {
  color: #C6A58D !important;
}

.footer-col-desc {
  color: #D9CDBA !important;
}

.footer-reserve-btn {
  background: #C79C5A !important;
  color: #141110 !important;
  border: 1px solid rgba(199, 156, 90, 0.5) !important;
  font-weight: 600;
  transition: all 0.3s ease;
}

.footer-reserve-btn:hover {
  background: #D8C3A5 !important;
  color: #141110 !important;
  box-shadow: 0 4px 20px rgba(199, 156, 90, 0.4) !important;
}

/* ─── E. COLLECTION ATELIER (ALPINE EMERALD WORKSHOP) ──── */
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

/* ─── F. HERITAGE ARCHIVES (HAVANA WOOD & VINTAGE LEATHER) ─ */
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

/* ─── G. DYNAMIC HERO WATCH MODEL AMBIENT LIGHTING ─────── */
.hero-3d-section {
  transition: background-color 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-canvas-overlay {
  transition: background 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}
`;

if (!styleCss.includes('16. OPULENT SECTION-SPECIFIC HARMONIES')) {
  fs.writeFileSync(stylePath, styleCss + sectionStyles, 'utf8');
  console.log('Appended section-specific luxury harmonies to style.css');
} else {
  console.log('Harmonies already present in style.css');
}
