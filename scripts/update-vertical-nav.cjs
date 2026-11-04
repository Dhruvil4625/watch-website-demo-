const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. UPDATE MORPHING NAV JS TO CENTER AND DYNAMICALLY SIZE THE VERTICAL DROPDOWN
const morphingJsPath = path.join(rootDir, 'src', 'morphingNav.js');
const morphingJsContent = `/**
 * GTC Maison Signature Morphing Dropdown Navigation
 * Features vertical slide & cascade animations, dynamic auto-sizing for future sub-pages,
 * and theme-gold hover transitions.
 */
export function initMorphingNavigation() {
  const header = document.getElementById('header');
  const nav = document.getElementById('nav');
  const dd = document.getElementById('dd');
  if (!header || !nav || !dd) return;

  const triggers = Array.from(nav.querySelectorAll('.trigger'));
  const navLinks = Array.from(nav.querySelectorAll('.nav-link'));
  const panels = Array.from(dd.querySelectorAll('.panel'));
  const menuBtn = document.getElementById('mobile-menu-btn');
  const sheet = document.getElementById('sheet');

  const menuOrder = ['collection'];
  let current = null;
  let closeTimer = null;

  function place(id) {
    const panel = document.getElementById('p-' + id);
    const trigger = triggers.find(t => t.dataset.menu === id);
    if (!panel || !trigger) return;

    // Read natural dimensions
    const panelWidth = panel.offsetWidth;
    const panelHeight = panel.offsetHeight;
    const triggerRect = trigger.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const navRect = (dd.offsetParent || header).getBoundingClientRect();

    // Center the vertical dropdown box directly under the Collection trigger
    let x = (triggerRect.left + (triggerRect.width / 2)) - (panelWidth / 2);
    const minX = headerRect.left + 16;
    const maxX = headerRect.right - panelWidth - 16;
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
      // First open with vertical slide-down
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
      // Directional switch if more menus are added
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

  // Trigger interactions (e.g. Collection)
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

  // Direct page links (Maison, Heritage, Craftsmanship)
  navLinks.forEach(link => {
    link.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') scheduleClose(70);
    });
  });

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

// Auto-run on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMorphingNavigation);
  } else {
    initMorphingNavigation();
  }
}
`;

fs.writeFileSync(morphingJsPath, morphingJsContent, 'utf8');
console.log('Updated src/morphingNav.js');


// 2. UPDATE STYLE.CSS WITH VERTICAL ANIMATION AND SCALABLE VERTICAL STACK
const stylePath = path.join(rootDir, 'style.css');
let styleCss = fs.readFileSync(stylePath, 'utf8');

const section17Marker = '/* ═══════════════════════════════════════════════════════════\n   17. MAISON SIGNATURE MORPHING DROPDOWN NAVIGATION';

const newSection17 = `/* ═══════════════════════════════════════════════════════════
   17. MAISON SIGNATURE MORPHING DROPDOWN NAVIGATION (VERTICAL ANIMATION)
   ═══════════════════════════════════════════════════════════ */
:root {
  --ink: #111111;
  --panel: rgba(20, 20, 23, 0.96);
  --line: rgba(201, 168, 76, 0.24);
  --hover: rgba(201, 168, 76, 0.12);
  --text: #F8F5EF;
  --soft: rgba(248, 245, 239, 0.78);
  --muted: rgba(232, 214, 179, 0.75);
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
  --morph: 0.42s;
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
  background: linear-gradient(180deg, rgba(28, 28, 28, 0.95) 0%, rgba(17, 17, 17, 0.9) 100%);
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

/* ─── MORPHING DROPDOWN CONTAINER (VERTICAL ANIMATION) ──── */
.dd {
  --x: 0px;
  --w: 430px;
  --h: auto;
  --s: 0.96;
  --ty: -12px;
  position: absolute;
  top: 66px;
  left: 0;
  width: var(--w);
  height: var(--h);
  transform: translateX(var(--x)) translateY(var(--ty)) scale(var(--s));
  transform-origin: 50% 0;
  opacity: 0;
  pointer-events: none;
  border-radius: 16px;
  background: var(--panel);
  border: 1px solid var(--line);
  box-shadow: 0 30px 70px -20px rgba(0, 0, 0, 0.9), 0 0 30px rgba(201, 168, 76, 0.12);
  backdrop-filter: blur(26px) saturate(140%);
  -webkit-backdrop-filter: blur(26px) saturate(140%);
  overflow: hidden;
  transition: transform var(--morph) var(--ease),
              width var(--morph) var(--ease),
              height var(--morph) var(--ease),
              opacity 0.28s ease;
  z-index: 100;
}

/* Smooth Vertical Unfurl on Open */
.dd.open {
  --s: 1;
  --ty: 0px;
  opacity: 1;
  pointer-events: auto;
}

.dd.instant {
  transition: opacity 0.28s ease, transform var(--morph) var(--ease);
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
  transform: translateY(-8px);
  transition: opacity 0.24s ease, transform var(--morph) var(--ease), visibility 0s linear var(--morph);
}

.panel[data-state="exit-left"],
.panel[data-state="exit-right"] {
  transform: translateY(-12px);
  opacity: 0;
}

.panel[data-state="active"] {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  transition: opacity 0.32s ease 0.04s, transform var(--morph) var(--ease), visibility 0s;
}

.panel.snap {
  transition: none !important;
}

/* ─── SCALABLE VERTICAL COLLECTION DROPDOWN PANEL ───────── */
.p-collection {
  width: 430px;
  display: flex;
  flex-direction: column;
  padding: 12px 14px 14px;
  box-sizing: border-box;
}

/* Header strip */
.collection-vertical-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 8px;
}

.collection-header-title {
  font-family: var(--font-accent);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--primary-color, #C9A84C);
}

.collection-header-count {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  color: var(--muted, #E8D6B3);
  opacity: 0.8;
}

/* Vertical items stack (Scales infinitely for 3, 4, 5, 8+ sub-pages!) */
.collection-items-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 440px;
  overflow-y: auto;
  padding-right: 2px;
}

/* Subtle luxury scrollbar */
.collection-items-list::-webkit-scrollbar {
  width: 4px;
}
.collection-items-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
}
.collection-items-list::-webkit-scrollbar-thumb {
  background: rgba(201, 168, 76, 0.3);
  border-radius: 4px;
}
.collection-items-list::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color, #C9A84C);
}

/* Vertical Staggered Cascade Animation when opening */
.panel[data-state="active"] .collection-item {
  animation: verticalItemFadeIn 0.36s var(--ease) both;
}
.panel[data-state="active"] .collection-item:nth-child(1) { animation-delay: 0.05s; }
.panel[data-state="active"] .collection-item:nth-child(2) { animation-delay: 0.10s; }
.panel[data-state="active"] .collection-item:nth-child(3) { animation-delay: 0.15s; }
.panel[data-state="active"] .collection-item:nth-child(4) { animation-delay: 0.20s; }
.panel[data-state="active"] .collection-item:nth-child(5) { animation-delay: 0.25s; }
.panel[data-state="active"] .collection-item:nth-child(6) { animation-delay: 0.30s; }

@keyframes verticalItemFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Individual Vertical Item Row */
.collection-item {
  position: relative;
  display: grid;
  grid-template-columns: 52px 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
  border-radius: 12px;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  transition: all 0.28s ease;
  box-sizing: border-box;
}

.collection-item:hover,
.collection-item:focus-visible {
  background: rgba(201, 168, 76, 0.1);
  border-color: rgba(201, 168, 76, 0.35);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 16px rgba(201, 168, 76, 0.15);
  transform: translateX(2px);
}

/* Thumbnail Visual */
.collection-item .item-visual {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #0d0d0f;
  flex-shrink: 0;
}

.collection-item .item-visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s var(--ease), filter 0.3s ease;
  filter: brightness(0.9);
}

.collection-item:hover .item-visual {
  border-color: rgba(201, 168, 76, 0.5);
}

.collection-item:hover .item-visual img {
  transform: scale(1.08);
  filter: brightness(1.05);
}

/* Item Content */
.collection-item .item-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.collection-item .item-top {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}

.collection-item .item-badge {
  font-family: var(--font-mono);
  font-size: 0.58rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--primary-color, #C9A84C);
  padding: 1px 6px;
  background: rgba(201, 168, 76, 0.08);
  border: 1px solid rgba(201, 168, 76, 0.2);
  border-radius: 4px;
}

.collection-item strong.item-title {
  font-family: var(--font-accent);
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.25s ease;
}

.collection-item:hover strong.item-title {
  color: var(--primary-color, #C9A84C);
}

.collection-item p.item-desc {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 11.5px;
  line-height: 1.38;
  color: var(--muted, #E8D6B3);
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Arrow indicator */
.collection-item .item-arrow {
  color: rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.25s ease, transform 0.25s ease;
  padding-right: 2px;
}

.collection-item:hover .item-arrow {
  color: var(--primary-color, #C9A84C);
  transform: translateX(3px);
}

/* Footer strip */
.collection-vertical-footer {
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.collection-footer-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 8px;
  font-family: var(--font-accent);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--soft);
  text-decoration: none;
  transition: color 0.25s ease, background 0.25s ease;
}

.collection-footer-link:hover {
  color: var(--primary-color, #C9A84C);
  background: rgba(201, 168, 76, 0.08);
}

.collection-footer-link .footer-arrow {
  transition: transform 0.25s ease;
}

.collection-footer-link:hover .footer-arrow {
  transform: translateX(3px);
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
  transform: translateY(-8px) scale(0.98);
  transform-origin: 50% 0;
  transition: opacity 0.3s ease, transform 0.4s var(--ease), visibility 0s linear 0.4s;
  z-index: 999;
}

.sheet.open {
  opacity: 1;
  visibility: visible;
  transform: none;
  transition: opacity 0.3s ease, transform 0.4s var(--ease), visibility 0s;
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
  .panel, .collection-item, .collection-item .item-visual img {
    filter: none !important;
    transition-duration: 0.01s !important;
    animation: none !important;
  }
}
`;

if (styleCss.includes(section17Marker)) {
  const idx = styleCss.indexOf(section17Marker);
  styleCss = styleCss.substring(0, idx) + newSection17;
  console.log('Replaced Section 17 with Vertical Dropdown styles in style.css');
} else {
  styleCss += '\n' + newSection17;
  console.log('Appended new Section 17 to style.css');
}

fs.writeFileSync(stylePath, styleCss, 'utf8');
console.log('Updated style.css successfully!');


// 3. GENERATE VERTICAL NAV HTML SNIPPET FOR ALL PAGES
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

          <!-- 2. Collection (Vertical Morphing Dropdown for Infinite Scalable Sub-pages) -->
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

        <!-- Morphing Dropdown Container for Collection (Vertical Animation & Scalable Box) -->
        <div class="dd" id="dd" aria-hidden="true">
          <div class="panel p-collection" id="p-collection" data-panel="collection">
            <div class="collection-vertical-header">
              <span class="collection-header-title">Maison Collections</span>
              <span class="collection-header-count">3 Sub-Pages</span>
            </div>

            <div class="collection-items-list">
              <!-- Sub-page 1: Main Collection Page -->
              <a class="collection-item" href="collection.html">
                <div class="item-visual">
                  <img src="/assets/photo/z1.png" alt="Main Collection Atelier" loading="lazy" />
                </div>
                <div class="item-content">
                  <div class="item-top">
                    <span class="item-badge">ATELIER 360°</span>
                  </div>
                  <strong class="item-title">Main Collection</strong>
                  <p class="item-desc">Interactive 360° virtual horology showcase in Surat.</p>
                </div>
                <div class="item-arrow" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </a>

              <!-- Sub-page 2: Himalayan Sub-page -->
              <a class="collection-item" href="index.html#hero">
                <div class="item-visual">
                  <img src="/assets/photo/bg1.png" alt="GTC Himalayan Edition" loading="lazy" />
                </div>
                <div class="item-content">
                  <div class="item-top">
                    <span class="item-badge">HORIZON 300</span>
                  </div>
                  <strong class="item-title">GTC Himalayan</strong>
                  <p class="item-desc">Numbered edition of 300 high-altitude alpine chronometers.</p>
                </div>
                <div class="item-arrow" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </a>

              <!-- Sub-page 3: CTC / GTC Sub-page -->
              <a class="collection-item" href="index.html#craftsmanship">
                <div class="item-visual">
                  <img src="/assets/photo/gtc-calibre-movement.jpg" alt="CTC GTC Calibre Manufacture" loading="lazy" />
                </div>
                <div class="item-content">
                  <div class="item-top">
                    <span class="item-badge">CALIBRE 2601</span>
                  </div>
                  <strong class="item-title">CTC / GTC Calibre</strong>
                  <p class="item-desc">In-house monobloc engineering, movements &amp; dossiers.</p>
                </div>
                <div class="item-arrow" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </a>
            </div>

            <div class="collection-vertical-footer">
              <a href="collection.html" class="collection-footer-link">
                <span>Explore Full Timepiece Gallery</span>
                <span class="footer-arrow">→</span>
              </a>
            </div>
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

// 4. UPDATE INDEX.HTML
const indexPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

const headerRegex = /<!-- ═+[\s\S]*?MAISON SIGNATURE MORPHING DROPDOWN NAVIGATION[\s\S]*?═+ -->[\s\S]*?<\/header>/;
if (headerRegex.test(indexHtml)) {
  indexHtml = indexHtml.replace(headerRegex, getHeaderHtml('maison'));
  fs.writeFileSync(indexPath, indexHtml, 'utf8');
  console.log('Updated index.html with vertical collection dropdown!');
}

// 5. UPDATE COLLECTION.HTML
const collectionPath = path.join(rootDir, 'collection.html');
let collectionHtml = fs.readFileSync(collectionPath, 'utf8');

if (headerRegex.test(collectionHtml)) {
  collectionHtml = collectionHtml.replace(headerRegex, getHeaderHtml('collection'));
  fs.writeFileSync(collectionPath, collectionHtml, 'utf8');
  console.log('Updated collection.html with vertical collection dropdown!');
}

// 6. UPDATE HERITAGE.HTML
const heritagePath = path.join(rootDir, 'heritage.html');
let heritageHtml = fs.readFileSync(heritagePath, 'utf8');

if (headerRegex.test(heritageHtml)) {
  heritageHtml = heritageHtml.replace(headerRegex, getHeaderHtml('heritage'));
  fs.writeFileSync(heritagePath, heritageHtml, 'utf8');
  console.log('Updated heritage.html with vertical collection dropdown!');
}
