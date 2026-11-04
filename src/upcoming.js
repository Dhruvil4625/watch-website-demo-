/**
 * ============================================================================
 * GTC UPCOMING & PROTOTYPE LAB — CONTROLLER SCRIPT
 * ============================================================================
 */

import Lenis from 'lenis';
import '../style.css';
import './components/editorialPage.css';
import './components/upcomingPage.css';
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

// 2. Live Countdown Timer for Next Upcoming Drop (e.g. 84 days out)
function initCountdownTimer() {
  const daysEl = document.getElementById('count-days');
  const hoursEl = document.getElementById('count-hours');
  const minsEl = document.getElementById('count-mins');
  const secsEl = document.getElementById('count-secs');

  if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

  // Target date: 75 days from now
  const targetDate = new Date(Date.now() + 75 * 24 * 60 * 60 * 1000 + 14 * 3600 * 1000);

  function update() {
    const now = new Date().getTime();
    const diff = targetDate.getTime() - now;

    if (diff <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minsEl.textContent = '00';
      secsEl.textContent = '00';
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = String(d).padStart(2, '0');
    hoursEl.textContent = String(h).padStart(2, '0');
    minsEl.textContent = String(m).padStart(2, '0');
    secsEl.textContent = String(s).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}

// 3. Category Filter Pills
function initFilters() {
  const pills = document.querySelectorAll('.filter-pill');
  const cards = document.querySelectorAll('.upcoming-card');

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');

      const filter = pill.dataset.filter || 'all';

      cards.forEach((card) => {
        const category = card.dataset.category || 'all';
        if (filter === 'all' || category === filter) {
          card.style.display = 'flex';
          card.style.opacity = '1';
        } else {
          card.style.display = 'none';
          card.style.opacity = '0';
        }
      });
    });
  });
}

// 4. Interactive Waitlist RSVP Form Handler
function initWaitlistForm() {
  const form = document.getElementById('upcoming-rsvp-form');
  const successCard = document.getElementById('rsvp-success-card');
  const ticketBadge = document.getElementById('rsvp-ticket-num');

  if (!form || !successCard) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('rsvp-name');
    const watchInput = document.getElementById('rsvp-watch');

    const name = nameInput ? nameInput.value.trim() : 'Collector';
    const chosenWatch = watchInput ? watchInput.value : 'GTC Thar Desert Chronograph';

    // Generate unique priority ticket
    const randomTicket = 'GTC-PROT-' + Math.floor(1000 + Math.random() * 9000);
    if (ticketBadge) ticketBadge.textContent = randomTicket;

    const detailsEl = document.getElementById('rsvp-details');
    if (detailsEl) {
      detailsEl.textContent = `Priority spot secured for ${name} for the ${chosenWatch}. You will receive prototype telemetry and pre-order window notifications.`;
    }

    form.style.display = 'none';
    successCard.classList.add('active');
  });
}

// 5. Reservation Technical Dossier Modal Initialization
function initReservationModal() {
  const modal = document.getElementById('reserve-modal');
  const closeBtn = document.getElementById('modal-close');
  const openBtns = document.querySelectorAll('.open-reserve-modal');

  if (!modal) return;

  const openModal = (watchName = 'GTC Himalayan') => {
    const titleEl = document.getElementById('dossier-title');
    if (titleEl && typeof watchName === 'string') {
      titleEl.textContent = watchName.toUpperCase();
    }
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

  openBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetWatch = btn.dataset.watch || 'GTC Himalayan';
      openModal(targetWatch);
    });
  });

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

// 6. Preload / Quick Watch Selection into RSVP Form
function initQuickSelectWatch() {
  document.querySelectorAll('.quick-notify-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetWatch = btn.dataset.watch;
      const selectEl = document.getElementById('rsvp-watch');
      const waitlistSection = document.getElementById('waitlist');

      if (selectEl && targetWatch) {
        selectEl.value = targetWatch;
      }
      if (waitlistSection) {
        waitlistSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMorphingNavigation();
  initCountdownTimer();
  initFilters();
  initWaitlistForm();
  initReservationModal();
  initQuickSelectWatch();
  initAuthModal();
});

