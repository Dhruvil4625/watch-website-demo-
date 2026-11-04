/**
 * GTC Maison Signature Morphing Dropdown Navigation
 * Features vertical slide & cascade animations, dynamic auto-sizing for future sub-pages,
 * and theme-gold hover transitions.
 */
export function initMorphingNavigation() {
  if (window.__gtc_nav_initialized) return;
  window.__gtc_nav_initialized = true;

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

  // Handle outside taps without interfering with mobile hamburger menu or mobile drawer
  document.addEventListener('pointerdown', (e) => {
    // Close desktop dropdown if clicking outside #nav and outside #dd
    if (current && !nav.contains(e.target) && !dd.contains(e.target)) {
      close();
    }
    // Close mobile sheet if tapping outside #sheet and outside #mobile-menu-btn
    if (sheet && sheet.classList.contains('open')) {
      if (!sheet.contains(e.target) && !menuBtn?.contains(e.target)) {
        sheet.classList.remove('open');
        sheet.setAttribute('aria-hidden', 'true');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-sheet-open');
      }
    }
  });

  window.addEventListener('resize', () => {
    if (current) place(current);
    if (window.innerWidth > 860 && sheet && sheet.classList.contains('open')) {
      sheet.classList.remove('open');
      sheet.setAttribute('aria-hidden', 'true');
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-sheet-open');
    }
  }, { passive: true });

  // Resilient Mobile Sheet Toggle
  if (menuBtn && sheet) {
    let isToggling = false;

    const toggleSheet = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (isToggling) return;
      isToggling = true;

      const willOpen = !sheet.classList.contains('open');
      sheet.classList.toggle('open', willOpen);
      menuBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      sheet.setAttribute('aria-hidden', (!willOpen).toString());
      document.body.classList.toggle('nav-sheet-open', willOpen);

      setTimeout(() => {
        isToggling = false;
      }, 150);
    };

    menuBtn.addEventListener('click', toggleSheet);

    sheet.querySelectorAll('a, button').forEach((link) => {
      link.addEventListener('click', () => {
        sheet.classList.remove('open');
        sheet.setAttribute('aria-hidden', 'true');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-sheet-open');
      });
    });
  }

  // Instant Page Prefetching on Navigation Link Hover & Pointerenter
  const internalLinks = document.querySelectorAll('a[href$=".html"], a[href^="/"], a[href^="./"]');
  internalLinks.forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    const prefetchTarget = () => {
      const cleanPath = href.split('#')[0];
      if (!cleanPath) return;
      if (!document.querySelector(`link[rel="prefetch"][href="${cleanPath}"]`)) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = cleanPath;
        document.head.appendChild(link);
      }
    };

    a.addEventListener('pointerenter', prefetchTarget, { once: true, passive: true });
    a.addEventListener('focus', prefetchTarget, { once: true, passive: true });
  });
}

// Auto-run on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMorphingNavigation);
  } else {
    initMorphingNavigation();
  }
}
