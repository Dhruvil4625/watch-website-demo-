/**
 * ============================================================================
 * GTC MAISON EDITORIAL & CLIENT SERVICES — CONTROLLER SCRIPT
 * Supports: about.html, contact.html, privacy.html, terms.html, warranty.html
 * ============================================================================
 */

import Lenis from 'lenis';
import '../style.css';
import './components/editorialPage.css';
import { initMorphingNavigation } from './morphingNav.js';
import './components/cart.js';
import { initAuthModal } from './components/authModal.js';

// 1. Initialize Lenis Smooth Scroll
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  touchMultiplier: 1.0,
  prevent: (node) => {
    return Boolean(
      node?.closest?.(
        '#reserve-modal, .modal-container, #gtc-auth-modal, [data-lenis-prevent]'
      )
    );
  },
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// 2. Reservation Technical Dossier Modal Initialization
function initReservationModal() {
  const modal = document.getElementById('reserve-modal');
  const closeBtn = document.getElementById('modal-close');
  const openBtns = document.querySelectorAll('.open-reserve-modal');

  if (!modal) return;

  const openModal = () => {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lenis.stop();
  };

  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lenis.start();
  };

  openBtns.forEach((btn) => btn.addEventListener('click', openModal));
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

// 3. Contact Salon Appointment Form Handler
function initSalonBookingForm() {
  const form = document.getElementById('salon-booking-form');
  if (!form) return;

  // Set minimum selectable date to today
  const dateInput = document.getElementById('salon-date');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  // Interactive Concierge Protocol Pills -> Append to #salon-notes
  const notesField = document.getElementById('salon-notes');
  document.querySelectorAll('.protocol-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      if (!notesField) return;
      const protocolText = pill.dataset.protocol || '';
      if (!notesField.value.includes(protocolText)) {
        notesField.value = notesField.value.trim()
          ? `${notesField.value.trim()}\n• ${protocolText}`
          : `• ${protocolText}`;
        pill.classList.add('is-active');
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const origText = btn ? btn.textContent : 'REQUEST PRIVATE APPOINTMENT';
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'TRANSMITTING TO CONCIERGE...';
    }

    const payload = {
      name: document.getElementById('salon-name')?.value?.trim() || 'Valued Patron',
      email: document.getElementById('salon-email')?.value?.trim() || '',
      phone: document.getElementById('salon-phone')?.value?.trim() || 'Not Provided',
      preferredDate: document.getElementById('salon-date')?.value || 'Upcoming Horizon Week',
      inquiryType: document.getElementById('salon-type')?.value || 'Private Salon Viewing',
      notes: document.getElementById('salon-notes')?.value?.trim() || '',
      deliveryMode: 'salon',
      city: 'Surat Atelier',
    };

    try {
      await fetch('/api/orders/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('[Concierge] Network dispatch notice:', err);
    }

    alert(
      `❖ APPOINTMENT DOSSIER REGISTERED\n\nThank you, ${payload.name}.\nYour request for a private salon consultation at the Surat Atelier has been dispatched.\n\nOur Chief Concierge will coordinate with you directly via WhatsApp / phone to confirm your schedule and arrange STV Airport valet transfer if required.`
    );
    form.reset();
    document.querySelectorAll('.protocol-pill.is-active').forEach((p) => p.classList.remove('is-active'));
    if (btn) {
      btn.disabled = false;
      btn.textContent = origText;
    }
  });
}

// 4. Warranty Serial Lookup Handler
function initWarrantyLookup() {
  const btn = document.getElementById('btn-warranty-lookup');
  const input = document.getElementById('warranty-serial-input');
  if (!btn || !input) return;

  const handleLookup = () => {
    const val = input.value.trim();
    if (!val) {
      alert(
        'Please enter your chronometer serial or allocation reference (e.g., #042 / 300 or GTC-2601).'
      );
      return;
    }
    // Redirect to Heritage Archives with serial parameter
    window.location.href = `heritage.html?serial=${encodeURIComponent(val)}#archive-search`;
  };

  btn.addEventListener('click', handleLookup);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLookup();
    }
  });
}

// 5. Active Sidebar Navigation Highlight on Scroll (Legal pages)
function initLegalNavHighlight() {
  const sections = document.querySelectorAll('.legal-section');
  const navLinks = document.querySelectorAll('.legal-nav-link');
  if (sections.length === 0 || navLinks.length === 0) return;

  window.addEventListener(
    'scroll',
    () => {
      let current = '';
      const scrollPos = window.scrollY + 140;

      sections.forEach((sec) => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          current = sec.getAttribute('id');
        }
      });

      navLinks.forEach((link) => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('active');
        }
      });
    },
    { passive: true }
  );
}

// 6. Staggered Hero Entrance & Horological Telemetry Counters
function initHeroEntrance() {
  const heroItems = document.querySelectorAll('[data-hero-reveal]');
  if (heroItems.length > 0) {
    heroItems.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('is-visible');
      }, 130 * index + 80);
    });
  }

  const counters = document.querySelectorAll('.counter');
  if (counters.length === 0) return;

  counters.forEach((counter) => {
    const target = parseFloat(counter.dataset.target || '0');
    const decimals = parseInt(counter.dataset.decimals || '0', 10);
    const duration = 2100;
    const startTime = performance.now();

    function updateCounter(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // EaseOutExpo curve for precision instrument deceleration
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = (target * eased).toFixed(decimals);
      counter.textContent =
        decimals === 0 ? Number(current).toLocaleString() : current;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    }

    setTimeout(() => requestAnimationFrame(updateCounter), 450);
  });
}

// 7. Sub-Micron Diamond Dust Canvas (Auto-Pauses Offscreen)
function initDiamondDustCanvas() {
  const canvas = document.getElementById('diamond-dust-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let isVisible = true;
  let rafId = null;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  resize();
  window.addEventListener('resize', resize, { passive: true });

  const particles = Array.from({ length: 55 }, () => ({
    x: Math.random() * (width || window.innerWidth),
    y: Math.random() * (height || window.innerHeight),
    r: Math.random() * 1.5 + 0.4,
    vx: (Math.random() - 0.5) * 0.22,
    vy: -Math.random() * 0.32 - 0.08,
    alpha: Math.random() * 0.65 + 0.15,
    twinkleSpeed: Math.random() * 0.02 + 0.008,
    phase: Math.random() * Math.PI * 2,
    gold: Math.random() > 0.32,
  }));

  function render() {
    if (!isVisible) {
      rafId = null;
      return;
    }

    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.phase += p.twinkleSpeed;

      if (p.y < -4) p.y = height + 4;
      if (p.x < -4) p.x = width + 4;
      if (p.x > width + 4) p.x = -4;

      const currentAlpha = p.alpha * (0.65 + 0.35 * Math.sin(p.phase));

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.gold
        ? `rgba(201, 168, 76, ${currentAlpha})`
        : `rgba(232, 214, 179, ${currentAlpha * 0.8})`;
      ctx.fill();
    }

    rafId = requestAnimationFrame(render);
  }

  // Pause canvas loop when scrolled past hero section
  const observer = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible && !rafId) {
        rafId = requestAnimationFrame(render);
      }
    },
    { threshold: 0.05 }
  );

  observer.observe(canvas);
  rafId = requestAnimationFrame(render);
}

// 8. Mouse-Reactive Astrolabe Ring Parallax
function initHeroAstrolabeParallax() {
  const hero = document.getElementById('about-hero');
  const astrolabe = document.getElementById('hero-astrolabe');
  if (!hero || !astrolabe) return;

  hero.addEventListener(
    'mousemove',
    (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      astrolabe.style.transform = `translate(calc(-50% + ${x * -28}px), calc(-50% + ${y * -28}px))`;
    },
    { passive: true }
  );

  hero.addEventListener('mouseleave', () => {
    astrolabe.style.transform = 'translate(-50%, -50%)';
  });
}

// 9. IntersectionObserver Scroll Reveal for Chapters & Pillars
function initScrollReveals() {
  const revealElements = document.querySelectorAll('[data-reveal]');
  if (revealElements.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay || '0', 10);
          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealElements.forEach((el) => observer.observe(el));
}

// 10. 3D Magnetic Tilt & Radial Gold Spotlight on Pillar Cards
function initPillarTiltAndGlow() {
  const cards = document.querySelectorAll('.tilt-card');
  if (cards.length === 0) return;

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      const rotateX = (y / rect.height - 0.5) * -6;
      const rotateY = (x / rect.width - 0.5) * 6;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform =
        'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  });
}

// 11. Lenis Smooth Anchor Navigation & Editorial Image Parallax
function initLenisAnchorAndParallax() {
  // Smooth scroll for in-page hash links (#manufacture, legal sidebar links, etc.)
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        lenis.scrollTo(targetEl, { offset: -90, duration: 1.35 });
      }
    });
  });

  // Subtle vertical parallax on .parallax-img inside .luxury-frame
  const parallaxImgs = document.querySelectorAll('.parallax-img');
  if (parallaxImgs.length === 0) return;

  lenis.on('scroll', () => {
    const vh = window.innerHeight;
    parallaxImgs.forEach((img) => {
      const rect = img.getBoundingClientRect();
      if (rect.top < vh && rect.bottom > 0) {
        const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2);
        const shift = Math.max(-18, Math.min(18, progress * -14));
        img.style.transform = `scale(1.06) translateY(${shift}px)`;
      }
    });
  });
}

// Main Initialization
document.addEventListener('DOMContentLoaded', () => {
  initMorphingNavigation();
  initAuthModal();
  initReservationModal();
  initSalonBookingForm();
  initWarrantyLookup();
  initLegalNavHighlight();

  // Editorial & About Page Enhancements
  initHeroEntrance();
  initDiamondDustCanvas();
  initHeroAstrolabeParallax();
  initScrollReveals();
  initPillarTiltAndGlow();
  initLenisAnchorAndParallax();
});