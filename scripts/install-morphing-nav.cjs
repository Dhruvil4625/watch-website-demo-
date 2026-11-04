const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. APPEND MORPHING NAV STYLES TO STYLE.CSS
const stylePath = path.join(rootDir, 'style.css');
let styleCss = fs.readFileSync(stylePath, 'utf8');

const navStylesMarker = '/* 17. MAISON SIGNATURE MORPHING DROPDOWN NAVIGATION (GILDED NOIR) */';

const navCss = `

/* ═══════════════════════════════════════════════════════════
   17. MAISON SIGNATURE MORPHING DROPDOWN NAVIGATION (GILDED NOIR)
   ═══════════════════════════════════════════════════════════ */
:root {
  --ink: #111111;
  --panel: rgba(24, 24, 26, 0.94);
  --line: rgba(201, 168, 76, 0.22);
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
}

/* Centre Nav Links */
.desktop-nav .links {
  display: flex;
  align-items: center;
  gap: 26px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.desktop-nav .trigger,
.desktop-nav .plain-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  font-family: var(--font-accent);
  font-size: 14.5px;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: var(--soft);
  text-decoration: none;
  cursor: pointer;
  transition: color 0.25s ease;
  background: transparent;
  border: none;
}

.desktop-nav .trigger:hover,
.desktop-nav .trigger[aria-expanded="true"],
.desktop-nav .plain-link:hover {
  color: #ffffff;
}

.desktop-nav .chevron {
  transition: transform 0.35s var(--ease);
  color: var(--primary-color);
}

.desktop-nav .trigger[aria-expanded="true"] .chevron {
  transform: rotate(180deg);
}

/* Right Actions */
.actions .cta {
  height: 34px;
  padding: 0 18px;
  border-radius: 999px;
  background: var(--primary-color);
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
  background: var(--accent-color);
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
  transition: background 0.2s ease;
}

.actions .menu-btn:hover {
  background: rgba(255, 255, 255, 0.2);
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
  box-shadow: 0 30px 70px -25px rgba(0, 0, 0, 0.8), 0 2px 10px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(22px) saturate(140%);
  -webkit-backdrop-filter: blur(22px) saturate(140%);
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

/* Panel A: Timepieces (664 x 358px) */
.p-timepieces {
  width: 664px;
  height: 358px;
  display: grid;
  grid-template-columns: 236px 1fr;
}

.d-list {
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 2px;
}

.d-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 12px;
  border-radius: 10px;
  text-decoration: none;
  color: var(--text);
  transition: background 0.3s ease;
}

.d-item.is-active,
.d-item:hover,
.d-item:focus-visible {
  background: var(--hover);
}

.d-item strong {
  font-family: var(--font-accent);
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #ffffff;
  letter-spacing: 0.04em;
}

.d-item span {
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1.42;
  color: var(--muted);
}

.d-media {
  position: relative;
  overflow: hidden;
  border-radius: 0 15px 15px 0;
}

.d-media::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 70px;
  background: linear-gradient(to right, rgba(22, 22, 24, 0.75), rgba(22, 22, 24, 0));
  z-index: 2;
  pointer-events: none;
}

.d-media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.06);
  filter: blur(10px);
  transition: opacity 0.6s ease, transform 0.9s var(--ease), filter 0.6s ease;
}

.d-media img.is-active {
  opacity: 1;
  transform: scale(1);
  filter: blur(0);
  z-index: 1;
}

/* Panel B: Collections (446 x 308px) */
.p-collections {
  width: 446px;
  height: 308px;
  padding: 7px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}

.p-collections .card {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 14px;
  isolation: isolate;
  text-decoration: none;
  color: #fff;
  border: 1px solid var(--border-glass);
}

.p-collections .card img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -2;
  transition: transform 0.9s var(--ease), filter 0.5s ease;
}

.p-collections .card:hover img,
.p-collections .card:focus-visible img {
  transform: scale(1.05);
  filter: brightness(1.08);
}

.p-collections .card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(14, 14, 16, 0.95) 0%, rgba(14, 14, 16, 0.4) 40%, rgba(14, 14, 16, 0) 65%);
  z-index: -1;
}

.p-collections .card strong {
  font-family: var(--font-accent);
  font-size: 15.5px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #ffffff;
}

.p-collections .card span {
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1.42;
  color: var(--muted);
}

/* Panel C: Maison (232 x 218px) */
.p-maison {
  width: 232px;
  height: 218px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.p-maison .r-link {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 9px;
  font-family: var(--font-accent);
  font-size: 14.5px;
  color: var(--text);
  text-decoration: none;
  transition: background 0.25s ease, color 0.25s ease;
}

.p-maison .r-link:hover,
.p-maison .r-link:focus-visible {
  background: var(--hover);
  color: var(--primary-color);
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
  backdrop-filter: blur(22px) saturate(140%);
  -webkit-backdrop-filter: blur(22px) saturate(140%);
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
  color: var(--primary-color);
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
  transition: background 0.2s ease;
}

.sheet a:hover {
  background: var(--hover);
  color: #fff;
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
  .panel, .d-media img {
    filter: none !important;
    transition-duration: 0.01s !important;
  }
}
`;

if (!styleCss.includes('17. MAISON SIGNATURE MORPHING DROPDOWN NAVIGATION')) {
  fs.writeFileSync(stylePath, styleCss + navCss, 'utf8');
  console.log('Appended morphing nav CSS to style.css');
} else {
  console.log('Morphing nav CSS already present in style.css');
}


// 2. CREATE MORPHING NAV JS MODULE
const morphingJsPath = path.join(rootDir, 'src', 'morphingNav.js');
const morphingJsContent = `/**
 * GTC Maison Signature Morphing Dropdown Navigation
 * Physics-based morphing container with smooth x/w/h morphing, directional sliding,
 * blur crossfade, and full keyboard/mouse accessibility.
 */
export function initMorphingNavigation() {
  const header = document.getElementById('header');
  const nav = document.getElementById('nav');
  const dd = document.getElementById('dd');
  if (!header || !nav || !dd) return;

  const triggers = Array.from(nav.querySelectorAll('.trigger'));
  const panels = Array.from(dd.querySelectorAll('.panel'));
  const storyLink = document.getElementById('story-link');
  const menuBtn = document.getElementById('mobile-menu-btn');
  const sheet = document.getElementById('sheet');

  const menuOrder = ['timepieces', 'collections', 'maison'];
  const PAD = 20;

  let current = null;
  let closeTimer = null;

  function place(id) {
    const panel = document.getElementById('p-' + id);
    const trigger = triggers.find(t => t.dataset.menu === id);
    if (!panel || !trigger) return;

    const panelWidth = panel.offsetWidth;
    const panelHeight = panel.offsetHeight;
    const triggerRect = trigger.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const navRect = (dd.offsetParent || header).getBoundingClientRect();

    let x = triggerRect.left - PAD;
    const minX = headerRect.left + 12;
    const maxX = headerRect.right - panelWidth - 12;
    x = Math.max(minX, Math.min(x, maxX)) - navRect.left;

    dd.style.setProperty('--x', Math.round(x) + 'px');
    dd.style.setProperty('--w', panelWidth + 'px');
    dd.style.setProperty('--h', panelHeight + 'px');
  }

  function open(id) {
    clearTimeout(closeTimer);
    if (id === current) return;

    const newPanel = document.getElementById('p-' + id);
    if (!newPanel) return;

    const newIdx = menuOrder.indexOf(id);

    if (!current) {
      // First open
      dd.classList.add('instant', 'snap');
      panels.forEach(p => {
        p.classList.add('snap');
        p.removeAttribute('data-state');
      });
      place(id);
      void dd.offsetWidth; // Force reflow
      dd.classList.remove('snap');
      panels.forEach(p => p.classList.remove('snap'));
      dd.classList.add('open');
      requestAnimationFrame(() => {
        dd.classList.remove('instant');
      });
    } else {
      // Directional switch
      const oldIdx = menuOrder.indexOf(current);
      const dir = newIdx > oldIdx ? 1 : -1;
      const oldPanel = document.getElementById('p-' + current);
      if (oldPanel) {
        oldPanel.setAttribute('data-state', dir > 0 ? 'exit-left' : 'exit-right');
      }
      newPanel.classList.add('snap');
      newPanel.setAttribute('data-state', dir > 0 ? 'exit-right' : 'exit-left');
      void newPanel.offsetWidth; // Force reflow
      newPanel.classList.remove('snap');
      place(id);
    }

    newPanel.setAttribute('data-state', 'active');
    triggers.forEach(t => {
      const isActive = t.dataset.menu === id;
      t.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });
    current = id;
  }

  function close() {
    dd.classList.remove('open');
    if (current) {
      const oldPanel = document.getElementById('p-' + current);
      if (oldPanel) oldPanel.removeAttribute('data-state');
    }
    triggers.forEach(t => t.setAttribute('aria-expanded', 'false'));
    current = null;
  }

  function scheduleClose(ms = 140) {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(close, ms);
  }

  // Trigger interactions
  triggers.forEach(trig => {
    const menu = trig.dataset.menu;
    trig.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') open(menu);
    });
    trig.addEventListener('click', (e) => {
      e.preventDefault();
      if (current === menu) close();
      else open(menu);
    });
  });

  if (storyLink) {
    storyLink.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') scheduleClose(60);
    });
  }

  nav.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  nav.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') scheduleClose(140);
  });

  nav.addEventListener('focusout', (e) => {
    if (!nav.contains(e.relatedTarget)) {
      scheduleClose(0);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (current) {
        const openTrigger = triggers.find(t => t.dataset.menu === current);
        close();
        if (openTrigger) openTrigger.focus();
      }
      if (sheet && sheet.classList.contains('open')) {
        sheet.classList.remove('open');
        sheet.setAttribute('aria-hidden', 'true');
        if (menuBtn) {
          menuBtn.setAttribute('aria-expanded', 'false');
          menuBtn.focus();
        }
      }
    }
  });

  document.addEventListener('pointerdown', (e) => {
    if (!nav.contains(e.target)) close();
  });

  window.addEventListener('resize', () => {
    if (current) place(current);
  });

  // Timepieces items crossfade
  const dItems = Array.from(dd.querySelectorAll('.d-item'));
  const dImgs = Array.from(dd.querySelectorAll('.d-media img'));

  dItems.forEach(item => {
    function activateItem() {
      const imgIdx = parseInt(item.dataset.img, 10);
      dItems.forEach(i => i.classList.toggle('is-active', i === item));
      dImgs.forEach((img, idx) => img.classList.toggle('is-active', idx === imgIdx));
    }
    item.addEventListener('pointerenter', activateItem);
    item.addEventListener('focus', activateItem);
  });

  // Mobile Sheet Toggle
  if (menuBtn && sheet) {
    menuBtn.addEventListener('click', () => {
      const isOpen = sheet.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      sheet.setAttribute('aria-hidden', (!isOpen).toString());
    });
    sheet.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        sheet.classList.remove('open');
        sheet.setAttribute('aria-hidden', 'true');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
}
`;

fs.writeFileSync(morphingJsPath, morphingJsContent, 'utf8');
console.log('Created src/morphingNav.js');


// 3. UPDATE INDEX.HTML NAVBAR
const indexPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

const oldNavRegex = /<!-- ═+[\s\S]*?NAVIGATION[\s\S]*?═+ -->[\s\S]*?<nav class="nav">[\s\S]*?<\/div>\s*<\/div>/;

const newNavHtml = `<!-- ═══════════════════════════════════════════
       MAISON SIGNATURE MORPHING DROPDOWN NAVIGATION
  ═══════════════════════════════════════════ -->
  <header class="header" id="header">
    <div class="bar">
      <!-- Logo (Left) -->
      <a class="logo" href="index.html" aria-label="GTC Home">
        <img class="nav-logo-img" src="/assets/photo/logo.svg" alt="Gujarat Time Company" />
      </a>

      <!-- Desktop Morphing Nav (Centre) -->
      <nav class="desktop-nav" id="nav" aria-label="Main">
        <ul class="links">
          <li>
            <button class="trigger" data-menu="timepieces" aria-expanded="false">
              <span>Timepieces</span>
              <svg class="chevron" width="8" height="5" viewBox="0 0 8 5" fill="none">
                <path d="M1 1l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </li>
          <li>
            <button class="trigger" data-menu="collections" aria-expanded="false">
              <span>Collections</span>
              <svg class="chevron" width="8" height="5" viewBox="0 0 8 5" fill="none">
                <path d="M1 1l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </li>
          <li>
            <button class="trigger" data-menu="maison" aria-expanded="false">
              <span>Maison</span>
              <svg class="chevron" width="8" height="5" viewBox="0 0 8 5" fill="none">
                <path d="M1 1l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </li>
          <li>
            <a class="plain-link" id="story-link" href="#craftsmanship">Craftsmanship</a>
          </li>
        </ul>

        <!-- Morphing Dropdown Container -->
        <div class="dd" id="dd" aria-hidden="true">
          <!-- Panel 1: Timepieces (664 x 358px) -->
          <div class="panel p-timepieces" id="p-timepieces" data-panel="timepieces">
            <div class="d-list">
              <a class="d-item is-active" data-img="0" href="#hero">
                <strong>Glacial Twilight</strong>
                <span>Karakoram glacial blue dial · Titanium monobloc.</span>
              </a>
              <a class="d-item" data-img="1" href="#hero">
                <strong>Mineral Slate</strong>
                <span>Everest dark slate rock with 22K gold bezel.</span>
              </a>
              <a class="d-item" data-img="2" href="#hero">
                <strong>Summit Ice</strong>
                <span>Pure alpine snow-peak dial with champagne accents.</span>
              </a>
              <a class="d-item" data-img="3" href="#hero">
                <strong>Alpine Pine</strong>
                <span>Parvati valley deep evergreen dial with fluted crown.</span>
              </a>
            </div>
            <div class="d-media" aria-hidden="true">
              <img class="is-active" src="/assets/photo/z1.png" alt="" />
              <img src="/assets/photo/gtc-calibre-movement.jpg" alt="" />
              <img src="/assets/photo/bg1.png" alt="" />
              <img src="/assets/photo/gtc-front-watch.png" alt="" />
            </div>
          </div>

          <!-- Panel 2: Collections (446 x 308px) -->
          <div class="panel p-collections" id="p-collections" data-panel="collections">
            <a class="card" href="collection.html">
              <img src="/assets/photo/z1.png" alt="Collection Atelier" />
              <strong>Collection Atelier</strong>
              <span>360° Hybrid 3D virtual luxury showcase in Surat.</span>
            </a>
            <a class="card" href="heritage.html">
              <img src="/assets/photo/q1.png" alt="Heritage Coffret Vault" />
              <strong>Heritage Vault</strong>
              <span>Genesis 2026 archival coffrets and foundational dossiers.</span>
            </a>
          </div>

          <!-- Panel 3: Maison (232 x 218px) -->
          <div class="panel p-maison" id="p-maison" data-panel="maison">
            <a class="r-link" href="#ethos">The Himalayan Ethos</a>
            <a class="r-link" href="#craftsmanship">Calibre GTC-2601</a>
            <a class="r-link" href="heritage.html">Genesis Dossiers</a>
            <a class="r-link open-reserve-modal" href="#reserve">Private Allocation</a>
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
      <h3>Timepieces</h3>
      <a href="#hero">Glacial Twilight</a>
      <a href="#hero">Mineral Slate</a>
      <a href="#hero">Summit Ice</a>
      <a href="#hero">Alpine Pine</a>

      <h3>Collections</h3>
      <a href="collection.html">Collection Atelier (360°)</a>
      <a href="heritage.html">Heritage Coffret Vault</a>

      <h3>Maison</h3>
      <a href="#ethos">The Himalayan Ethos</a>
      <a href="#craftsmanship">Craftsmanship &amp; Calibre</a>
      <a href="heritage.html">Foundational Archives</a>
      <a href="#reserve" class="open-reserve-modal" style="color: var(--primary-color);">Reserve Timepiece</a>
    </div>
  </header>`;

if (oldNavRegex.test(indexHtml)) {
  indexHtml = indexHtml.replace(oldNavRegex, newNavHtml);
  fs.writeFileSync(indexPath, indexHtml, 'utf8');
  console.log('Successfully replaced navigation in index.html');
} else {
  console.warn('Could not match old nav with regex in index.html, checking alternate slice');
}


// 4. WIRE MORPHING NAV INTO MAIN.JS
const mainJsPath = path.join(rootDir, 'main.js');
let mainJs = fs.readFileSync(mainJsPath, 'utf8');

if (!mainJs.includes('initMorphingNavigation')) {
  mainJs = "import { initMorphingNavigation } from './src/morphingNav.js';\n" + mainJs;
  mainJs = mainJs.replace(
    'initNavScroll();',
    'initNavScroll();\n  initMorphingNavigation();'
  );
  fs.writeFileSync(mainJsPath, mainJs, 'utf8');
  console.log('Wired initMorphingNavigation in main.js');
} else {
  console.log('initMorphingNavigation already present in main.js');
}
