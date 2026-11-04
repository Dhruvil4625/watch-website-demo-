const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. UPDATE STYLE.CSS WITH NEW COLLECTION PANEL & GOLD HOVER TRANSITIONS
const stylePath = path.join(rootDir, 'style.css');
let styleCss = fs.readFileSync(stylePath, 'utf8');

const section17Marker = '/* ═══════════════════════════════════════════════════════════\n   17. MAISON SIGNATURE MORPHING DROPDOWN NAVIGATION';

const newSection17 = `/* ═══════════════════════════════════════════════════════════
   17. MAISON SIGNATURE MORPHING DROPDOWN NAVIGATION (GILDED NOIR)
   ═══════════════════════════════════════════════════════════ */
:root {
  --ink: #111111;
  --panel: rgba(22, 22, 25, 0.96);
  --line: rgba(201, 168, 76, 0.24);
  --hover: rgba(201, 168, 76, 0.12);
  --text: #F8F5EF;
  --soft: rgba(248, 245, 239, 0.78);
  --muted: rgba(232, 214, 179, 0.75);
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --morph: 0.5s;
}

:focus-visible {
  outline: 2px solid var(--primary-color, #C9A84C);
  outline-offset: 3px;
  border-radius: 6px;
}

.header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.bar {
  height: 76px;
  padding: 0 clamp(20px, 3.4vw, 52px);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  background: linear-gradient(180deg, rgba(28, 28, 28, 0.94) 0%, rgba(17, 17, 17, 0.88) 100%);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--line);
  transition: background 0.3s ease, border-color 0.3s ease;
}

/* Entrance Animations */
.header .logo {
  animation: navFadeDown 0.9s var(--ease) 0.35s backwards;
  justify-self: start;
  display: inline-flex;
  align-items: center;
}

.header .desktop-nav {
  animation: navFadeIn 0.9s ease 0.45s backwards;
  position: relative;
  display: flex;
  align-items: center;
}

.header .actions {
  animation: navFadeDown 0.9s var(--ease) 0.55s backwards;
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 12px;
}

@keyframes navFadeDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes navFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Logo */
.header .logo .nav-logo-img {
  width: 110px;
  height: auto;
  display: block;
  transition: transform 0.3s ease, filter 0.3s ease;
}

.header .logo:hover .nav-logo-img {
  transform: scale(1.03);
  filter: drop-shadow(0 0 10px rgba(201, 168, 76, 0.35));
}

/* Centre Nav Links */
.desktop-nav .links {
  display: flex;
  align-items: center;
  gap: 32px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.desktop-nav .trigger,
.desktop-nav .nav-link,
.desktop-nav .plain-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 4px;
  font-family: var(--font-accent);
  font-size: 14.5px;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: var(--soft);
  text-decoration: none;
  cursor: pointer;
  transition: color 0.28s ease, transform 0.28s ease, text-shadow 0.28s ease;
  background: transparent;
  border: none;
}

/* Gold Theme Color Transition on Hover */
.desktop-nav .trigger:hover,
.desktop-nav .trigger[aria-expanded="true"],
.desktop-nav .nav-link:hover,
.desktop-nav .nav-link.active,
.desktop-nav .plain-link:hover {
  color: var(--primary-color, #C9A84C) !important;
  text-shadow: 0 0 14px rgba(201, 168, 76, 0.55);
  transform: translateY(-1px);
}

.desktop-nav .chevron {
  transition: transform 0.35s var(--ease), color 0.28s ease;
  color: var(--soft);
}

.desktop-nav .trigger:hover .chevron,
.desktop-nav .trigger[aria-expanded="true"] .chevron {
  color: var(--primary-color, #C9A84C) !important;
  transform: rotate(180deg);
}

/* Gold Bottom Hairline Indicator on Hover */
.desktop-nav .trigger::after,
.desktop-nav .nav-link::after {
  content: '';
  position: absolute;
  bottom: 0px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, var(--primary-color, #C9A84C) 50%, transparent 100%);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.3s var(--ease);
  box-shadow: 0 0 8px rgba(201, 168, 76, 0.6);
}

.desktop-nav .trigger:hover::after,
.desktop-nav .trigger[aria-expanded="true"]::after,
.desktop-nav .nav-link:hover::after,
.desktop-nav .nav-link.active::after {
  transform: scaleX(1);
}

/* Right Actions */
.actions .cta {
  height: 34px;
  padding: 0 18px;
  border-radius: 999px;
  background: var(--primary-color, #C9A84C);
  color: #111111;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid var(--border-active);
  transition: all 0.25s ease;
}

.actions .cta:hover {
  background: var(--accent-color, #E8D6B3);
  color: #111111;
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(201, 168, 76, 0.4);
}

.actions .menu-btn {
  display: none;
  width: 36px;
  height: 32px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--border-glass);
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.actions .menu-btn:hover {
  background: rgba(201, 168, 76, 0.15);
  border-color: var(--primary-color, #C9A84C);
}

/* ─── MORPHING DROPDOWN CONTAINER ──────────────────────── */
.dd {
  --x: 0px;
  --w: 400px;
  --h: 300px;
  --s: 0.97;
  position: absolute;
  top: 64px;
  left: 0;
  width: var(--w);
  height: var(--h);
  transform: translateX(var(--x)) scale(var(--s));
  transform-origin: 50% 0;
  opacity: 0;
  pointer-events: none;
  border-radius: 16px;
  background: var(--panel);
  border: 1px solid var(--line);
  box-shadow: 0 30px 70px -25px rgba(0, 0, 0, 0.85), 0 2px 10px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(24px) saturate(140%);
  -webkit-backdrop-filter: blur(24px) saturate(140%);
  overflow: hidden;
  transition: transform var(--morph) var(--ease), width var(--morph) var(--ease), height var(--morph) var(--ease), opacity 0.3s ease;
  z-index: 100;
}

.dd.open {
  --s: 1;
  opacity: 1;
  pointer-events: auto;
}

.dd.instant {
  transition: opacity 0.3s ease, transform var(--morph) var(--ease);
}

.dd.instant.snap {
  transition: none;
}

/* Panels */
.panel {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  visibility: hidden;
  filter: blur(8px);
  transform: translateX(0);
  transition: opacity 0.26s ease, transform var(--morph) var(--ease), filter 0.4s ease, visibility 0s linear var(--morph);
}

.panel[data-state="exit-left"] {
  transform: translateX(-56px);
}

.panel[data-state="exit-right"] {
  transform: translateX(56px);
}

.panel[data-state="active"] {
  opacity: 1;
  visibility: visible;
  filter: blur(0);
  transform: translateX(0);
  transition: opacity 0.36s ease 0.06s, transform var(--morph) var(--ease), filter 0.45s ease 0.04s, visibility 0s;
}

.panel.snap {
  transition: none !important;
}

/* ─── COLLECTION DROPDOWN PANEL (3 SUB-PAGES) ───────────── */
.p-collection {
  width: 680px;
  height: 330px;
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.p-collection .collection-card {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 18px 14px;
  isolation: isolate;
  text-decoration: none;
  color: var(--text);
  border: 1px solid var(--border-subtle);
  background: rgba(30, 30, 32, 0.7);
  transition: transform 0.4s var(--ease), border-color 0.3s ease, box-shadow 0.4s ease;
}

.p-collection .collection-card img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -2;
  transform: scale(1);
  transition: transform 0.8s var(--ease), filter 0.4s ease;
  filter: brightness(0.85);
}

.p-collection .collection-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(14, 14, 16, 0.96) 0%, rgba(14, 14, 16, 0.45) 50%, rgba(14, 14, 16, 0.1) 100%);
  z-index: -1;
  transition: background 0.3s ease;
}

.p-collection .collection-card:hover {
  transform: translateY(-3px);
  border-color: var(--primary-color, #C9A84C);
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.75), 0 0 25px rgba(201, 168, 76, 0.25);
}

.p-collection .collection-card:hover img {
  transform: scale(1.06);
  filter: brightness(1);
}

.p-collection .collection-card:hover::after {
  background: linear-gradient(to top, rgba(14, 14, 16, 0.98) 0%, rgba(14, 14, 16, 0.35) 50%, rgba(14, 14, 16, 0.05) 100%);
}

.p-collection .collection-badge {
  display: inline-block;
  align-self: flex-start;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent-color, #E8D6B3);
  padding: 3px 9px;
  background: rgba(17, 17, 17, 0.75);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  margin-bottom: auto;
  transition: color 0.3s ease, border-color 0.3s ease;
}

.p-collection .collection-card:hover .collection-badge {
  color: var(--primary-color, #C9A84C);
  border-color: var(--primary-color, #C9A84C);
}

.p-collection .collection-card .card-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.p-collection .collection-card strong {
  font-family: var(--font-accent);
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #ffffff;
  margin-bottom: 2px;
  transition: color 0.28s ease, transform 0.28s ease;
}

.p-collection .collection-card:hover strong {
  color: var(--primary-color, #C9A84C);
  transform: translateX(2px);
}

.p-collection .collection-card span {
  font-family: var(--font-sans);
  font-size: 11.5px;
  line-height: 1.42;
  color: var(--muted, #E8D6B3);
  opacity: 0.85;
}

/* ─── MOBILE SHEET (<= 860px) ──────────────────────────── */
.sheet {
  position: absolute;
  top: 68px;
  left: 12px;
  right: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--panel);
  border: 1px solid var(--line);
  backdrop-filter: blur(24px) saturate(140%);
  -webkit-backdrop-filter: blur(24px) saturate(140%);
  max-height: calc(100svh - 90px);
  overflow-y: auto;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-6px) scale(0.98);
  transform-origin: 50% 0;
  transition: opacity 0.3s ease, transform 0.45s var(--ease), visibility 0s linear 0.45s;
  z-index: 999;
}

.sheet.open {
  opacity: 1;
  visibility: visible;
  transform: none;
  transition: opacity 0.3s ease, transform 0.45s var(--ease), visibility 0s;
}

.sheet h3 {
  font-family: var(--font-accent);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--primary-color, #C9A84C);
  margin: 14px 12px 8px;
}

.sheet h3:first-child {
  margin-top: 4px;
}

.sheet a {
  display: block;
  padding: 10px 12px;
  border-radius: 9px;
  font-family: var(--font-sans);
  font-size: 15px;
  color: var(--text);
  text-decoration: none;
  transition: background 0.25s ease, color 0.25s ease;
}

.sheet a:hover {
  background: var(--hover);
  color: var(--primary-color, #C9A84C);
}

@media (max-width: 860px) {
  .bar {
    grid-template-columns: 1fr auto;
  }
  .desktop-nav {
    display: none !important;
  }
  .actions .menu-btn {
    display: flex !important;
  }
}

@media (min-width: 861px) {
  .actions .menu-btn {
    display: none;
  }
  .sheet {
    display: none !important;
  }
}

/* Reduced motion accessibility */
@media (prefers-reduced-motion: reduce) {
  :root {
    --morph: 0.01s;
  }
  .header .logo, .header .desktop-nav, .header .actions {
    animation-duration: 0.01s !important;
    animation-delay: 0s !important;
  }
  .panel, .collection-card img {
    filter: none !important;
    transition-duration: 0.01s !important;
  }
}
`;

if (styleCss.includes(section17Marker)) {
  const idx = styleCss.indexOf(section17Marker);
  styleCss = styleCss.substring(0, idx) + newSection17;
  console.log('Replaced Section 17 with new Collection dropdown styles');
} else {
  styleCss += '\n' + newSection17;
  console.log('Appended new Section 17 to style.css');
}

fs.writeFileSync(stylePath, styleCss, 'utf8');
console.log('Updated style.css successfully!');


// 2. NAV HTML SNIPPET FOR ALL PAGES
function getHeaderHtml(activePage) {
  return `<!-- ═══════════════════════════════════════════
       MAISON SIGNATURE MORPHING DROPDOWN NAVIGATION
  ═══════════════════════════════════════════ -->
  <header class="header" id="header">
    <div class="bar">
      <!-- Logo (Left) -->
      <a class="logo" href="index.html" aria-label="GTC Home">
        <img class="nav-logo-img" src="/assets/photo/logo.svg" alt="Gujarat Time Company" />
      </a>

      <!-- Desktop Morphing Nav (Centre: 4 Items) -->
      <nav class="desktop-nav" id="nav" aria-label="Main">
        <ul class="links">
          <!-- 1. Maison (Direct Page Link) -->
          <li>
            <a class="nav-link \${activePage === 'maison' ? 'active' : ''}" id="nav-maison" href="index.html">Maison</a>
          </li>

          <!-- 2. Collection (Morphing Dropdown: Main Collection, Himalayan, CTC/GTC) -->
          <li>
            <button class="trigger \${activePage === 'collection' ? 'active' : ''}" data-menu="collection" aria-expanded="false">
              <span>Collection</span>
              <svg class="chevron" width="8" height="5" viewBox="0 0 8 5" fill="none">
                <path d="M1 1l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </li>

          <!-- 3. Heritage (Direct Page Link) -->
          <li>
            <a class="nav-link \${activePage === 'heritage' ? 'active' : ''}" id="nav-heritage" href="heritage.html">Heritage</a>
          </li>

          <!-- 4. Craftsmanship (Direct Section Link) -->
          <li>
            <a class="nav-link" id="nav-craftsmanship" href="index.html#craftsmanship">Craftsmanship</a>
          </li>
        </ul>

        <!-- Morphing Dropdown Container for Collection -->
        <div class="dd" id="dd" aria-hidden="true">
          <div class="panel p-collection" id="p-collection" data-panel="collection">
            <!-- Sub-page 1: Main Collection Page -->
            <a class="collection-card" href="collection.html">
              <span class="collection-badge">ATELIER 360°</span>
              <img src="/assets/photo/z1.png" alt="Main Collection Atelier" loading="lazy" />
              <div class="card-meta">
                <strong>Main Collection</strong>
                <span>Interactive 360° virtual horology showcase in Surat.</span>
              </div>
            </a>

            <!-- Sub-page 2: Himalayan Sub-page -->
            <a class="collection-card" href="index.html#hero">
              <span class="collection-badge">HORIZON 300</span>
              <img src="/assets/photo/bg1.png" alt="GTC Himalayan Edition" loading="lazy" />
              <div class="card-meta">
                <strong>GTC Himalayan</strong>
                <span>Numbered edition of 300 high-altitude alpine chronometers.</span>
              </div>
            </a>

            <!-- Sub-page 3: CTC / GTC Sub-page -->
            <a class="collection-card" href="index.html#craftsmanship">
              <span class="collection-badge">CALIBRE 2601</span>
              <img src="/assets/photo/gtc-calibre-movement.jpg" alt="CTC GTC Calibre Manufacture" loading="lazy" />
              <div class="card-meta">
                <strong>CTC / GTC Calibre</strong>
                <span>In-house monobloc engineering, movements &amp; dossiers.</span>
              </div>
            </a>
          </div>
        </div>
      </nav>

      <!-- Actions (Right) -->
      <div class="actions">
        <button class="cta open-reserve-modal">Reserve Now</button>
        <button class="menu-btn" id="mobile-menu-btn" aria-label="Open menu" aria-expanded="false">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 5.5h12M2 10.5h12" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Slide-Down Sheet -->
    <div class="sheet" id="sheet" aria-hidden="true">
      <h3>Maison</h3>
      <a href="index.html">Maison Overview</a>

      <h3>Collection</h3>
      <a href="collection.html">Main Collection Page (360° Atelier)</a>
      <a href="index.html#hero">GTC Himalayan Sub-page</a>
      <a href="index.html#craftsmanship">CTC / GTC Calibre Atelier</a>

      <h3>Heritage</h3>
      <a href="heritage.html">Heritage Coffret Vault</a>

      <h3>Craftsmanship</h3>
      <a href="index.html#craftsmanship">Craftsmanship &amp; Engineering</a>

      <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--line);">
        <button class="cta open-reserve-modal" style="width: 100%; justify-content: center;">Reserve Timepiece</button>
      </div>
    </div>
  </header>`;
}

// 3. UPDATE INDEX.HTML
const indexPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

const headerRegex = /<!-- ═+[\s\S]*?MAISON SIGNATURE MORPHING DROPDOWN NAVIGATION[\s\S]*?═+ -->[\s\S]*?<\/header>/;
if (headerRegex.test(indexHtml)) {
  indexHtml = indexHtml.replace(headerRegex, getHeaderHtml('maison'));
  fs.writeFileSync(indexPath, indexHtml, 'utf8');
  console.log('Updated index.html header navigation successfully!');
} else {
  console.warn('Could not match headerRegex in index.html');
}

// 4. UPDATE COLLECTION.HTML
const collectionPath = path.join(rootDir, 'collection.html');
let collectionHtml = fs.readFileSync(collectionPath, 'utf8');
const oldCollectionNavRegex = /<!-- ═+[\s\S]*?NAVIGATION[\s\S]*?═+ -->[\s\S]*?<nav class="nav">[\s\S]*?<\/div>\s*<\/div>/;

if (oldCollectionNavRegex.test(collectionHtml)) {
  collectionHtml = collectionHtml.replace(oldCollectionNavRegex, getHeaderHtml('collection'));
  fs.writeFileSync(collectionPath, collectionHtml, 'utf8');
  console.log('Updated collection.html navigation successfully!');
}

// 5. UPDATE HERITAGE.HTML
const heritagePath = path.join(rootDir, 'heritage.html');
let heritageHtml = fs.readFileSync(heritagePath, 'utf8');
const oldHeritageNavRegex = /<!-- ═+[\s\S]*?MAISON NAVIGATION[\s\S]*?═+ -->[\s\S]*?<nav class="nav">[\s\S]*?<\/nav>/;

if (oldHeritageNavRegex.test(heritageHtml)) {
  heritageHtml = heritageHtml.replace(oldHeritageNavRegex, getHeaderHtml('heritage'));
  fs.writeFileSync(heritagePath, heritageHtml, 'utf8');
  console.log('Updated heritage.html navigation successfully!');
}
