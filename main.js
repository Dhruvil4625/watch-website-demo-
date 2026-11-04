import { initMorphingNavigation } from './src/morphingNav.js';
import { initAuthModal, triggerPostPreloaderAuth } from './src/components/authModal.js';
import { initAdminStudio, getWatchById, openDetailsModalWithWatch } from './src/components/adminStudio.js';
import './src/components/cart.js';
import './src/utils/vaultDiagnostics.js';
/* ═══════════════════════════════════════════════════════════
   GTC HIMALAYAN — MAIN JAVASCRIPT
   Gujarat Time Company Pvt. Ltd. · Horizon Collection
   Three.js + GLTFLoader + EXRLoader + GSAP + ScrollTrigger + Lenis
   ═══════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { submitPrivateReservation } from './src/services/supabaseService.js';

gsap.registerPlugin(ScrollTrigger);

/* ─── LENIS SMOOTH SCROLL INIT ─────────────────────────── */
const isMobileDevice = typeof window !== 'undefined' && (window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

const lenis = new Lenis({
  lerp: isMobileDevice ? 0.12 : 0.1,
  wheelMultiplier: 1,
  infinite: false,
  gestureOrientation: 'vertical',
  normalizeWheel: true,
  smoothWheel: true,
  smoothTouch: false, // Ensures native 120Hz/60Hz smooth inertial scroll on mobile
  touchMultiplier: 1.0, // Clean 1:1 finger tracking without laggy over-multiplication
  prevent: (node) => {
    return Boolean(
      node?.closest?.(
        '#reserve-modal, .modal-container, #dossier-panel, #details-modal-overlay, .details-modal-card, #gtc-auth-modal, .gtc-admin-modal-backdrop, #sheet, [data-lenis-prevent]'
      )
    );
  },
});

lenis.on('scroll', ScrollTrigger.update);
window.gtcLenis = lenis;

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

// Intelligent GSAP lag smoothing: smoothly interpolates frame drops on mobile instead of stuttering
gsap.ticker.lagSmoothing(500, 33);

/* ─── 1. HERO ANIMATIONS ──────────────────────────────── */
const initHeroAnimations = (isSkipped = false) => {
  const heroSection = document.querySelector('.hero');
  const heroTitle = heroSection?.querySelector('.hero-title');
  const heroSubtitle = heroSection?.querySelector('.hero-subtitle');
  const heroCta = heroSection?.querySelector('.hero-cta-group');
  const heroBgText = heroSection?.querySelector('.hero-text-bg');
  const heroPill = heroSection?.querySelector('.hero-pill-tag');
  const nav = document.querySelector('.nav');

  // Entrance timeline for Top Hero & Navigation
  if (nav) {
    if (isSkipped) {
      gsap.set(nav, { y: 0, opacity: 1 });
    } else {
      gsap.set(nav, { y: -100, opacity: 0 });
      gsap.to(nav, { y: 0, opacity: 1, duration: 1.1, ease: 'power4.out', delay: 0.2 });
    }
  }

  if (heroSection && heroTitle) {
    const entranceElements = [heroPill, heroTitle, heroSubtitle, heroCta].filter(Boolean);
    if (isSkipped) {
      gsap.set(entranceElements, { y: 0, opacity: 1 });
      if (heroBgText) gsap.set(heroBgText, { scale: 1, opacity: 1 });
    } else {
      gsap.set(entranceElements, { y: 45, opacity: 0 });
      if (heroBgText) gsap.set(heroBgText, { scale: 0.7, opacity: 0 });

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' }, delay: 0.1 });
      if (heroBgText) {
        tl.to(heroBgText, { scale: 1, opacity: 1, duration: 1.8 });
      }
      tl.to(entranceElements, { y: 0, opacity: 1, duration: 1.1, stagger: 0.15 }, heroBgText ? '-=1.4' : 0);
    }

    // Parallax on top hero elements when user scrolls down
    const heroDetails = heroSection.querySelector('.hero-details');
    if (heroDetails) {
      gsap.to(heroDetails, {
        y: -120,
        opacity: 0.3,
        scrollTrigger: {
          trigger: heroSection,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }
  }

  // ─── 1B. CINEMA SHOWCASE (RELOCATED BRAND FILM VIDEO) ───
  const cinemaSection = document.querySelector('.cinema-showcase');
  if (cinemaSection) {
    const cinemaVideo = cinemaSection.querySelector('.bg-video') || document.querySelector('.bg-video');
    const cinemaTitle = cinemaSection.querySelector('.cinema-title');
    const cinemaSubtitle = cinemaSection.querySelector('.cinema-subtitle');
    const cinemaCta = cinemaSection.querySelector('.cinema-cta-group');
    const cinemaTextBg = cinemaSection.querySelector('.cinema-text-bg');

    // Guarantee reliable video playback across all browsers
    if (cinemaVideo) {
      cinemaVideo.muted = true;
      const playPromise = cinemaVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const resumeOnInteract = () => {
            cinemaVideo.play().catch(() => {});
            document.removeEventListener('click', resumeOnInteract);
            document.removeEventListener('scroll', resumeOnInteract);
            document.removeEventListener('touchstart', resumeOnInteract);
          };
          document.addEventListener('click', resumeOnInteract, { once: true });
          document.addEventListener('scroll', resumeOnInteract, { once: true });
          document.addEventListener('touchstart', resumeOnInteract, { once: true });
        });
      }
    }

    // Parallax on cinema background video
    if (cinemaVideo) {
      gsap.to(cinemaVideo, {
        scale: 1.15,
        ease: 'none',
        scrollTrigger: {
          trigger: cinemaSection,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      });
    }

    // Parallax on watermark text
    if (cinemaTextBg) {
      gsap.to(cinemaTextBg, {
        y: -150,
        ease: 'none',
        scrollTrigger: {
          trigger: cinemaSection,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      });
    }

    // Cinematic copy reveal on scroll
    if (cinemaTitle) {
      gsap.from([cinemaSection.querySelector('.cinema-badge'), cinemaTitle, cinemaSubtitle, cinemaCta].filter(Boolean), {
        y: 50,
        opacity: 0,
        duration: 1.2,
        stagger: 0.16,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: cinemaSection,
          start: 'top 65%',
          toggleActions: 'play none none reverse',
        },
      });
    }
  }

  // Smooth anchor scrolling to Brand Film if film link clicked
  const filmLink = document.querySelector('.hero-film-link');
  if (filmLink && cinemaSection) {
    filmLink.addEventListener('click', (e) => {
      e.preventDefault();
      lenis.scrollTo(cinemaSection, { offset: 0, duration: 1.6 });
    });
  }
};

/* ─── 2. PRODUCT REVEAL ANIMATIONS ────────────────────── */
const initProductRevealAnimations = () => {
  const section = document.querySelector('.product-reveal');
  if (!section) return;

  const stickySide = section.querySelector('.reveal-sticky-side');
  const cards = section.querySelectorAll('.reveal-card');
  const chapterItems = section.querySelectorAll('.chapter-item');
  const video = section.querySelector('.product-reveal-video');

  // Entrance animations for sticky narrative
  if (stickySide) {
    const textElements = stickySide.querySelectorAll('.reveal-tag-pill, .product-reveal-title, .product-reveal-subtitle, .reveal-chapters, .product-reveal-cta-group');
    gsap.from(textElements, {
      y: 40,
      opacity: 0,
      duration: 1.1,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  // Smooth scroll parallax on the background video
  if (video) {
    gsap.to(video, {
      scale: 1.12,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2,
      },
    });
  }

  // Chapter active state updater with Antique Gold styling
  const updateActiveChapter = (index) => {
    chapterItems.forEach((item, i) => {
      const isActive = i === index;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  };

  // IntersectionObserver to smoothly sync sticky navigation items with scrolling cards
  if ('IntersectionObserver' in window && cards.length) {
    const cardVisibilityMap = new Map();

    const chapterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const index = parseInt(entry.target.dataset.index, 10);
        if (!isNaN(index)) {
          if (entry.isIntersecting) {
            cardVisibilityMap.set(index, entry.intersectionRatio);
          } else {
            cardVisibilityMap.delete(index);
          }
        }
      });

      // Highlight the card that currently has the largest visible presence in the observation zone
      let bestIdx = -1;
      let maxRatio = 0;
      cardVisibilityMap.forEach((ratio, idx) => {
        if (ratio > maxRatio) {
          maxRatio = ratio;
          bestIdx = idx;
        }
      });

      if (bestIdx !== -1) {
        updateActiveChapter(bestIdx);
      }
    }, {
      rootMargin: '-15% 0px -25% 0px',
      threshold: [0.1, 0.25, 0.5, 0.75],
    });

    cards.forEach((card) => chapterObserver.observe(card));
  }

  // Click on chapter item to scroll to that card
  chapterItems.forEach((item, i) => {
    item.addEventListener('click', () => {
      if (cards[i]) {
        updateActiveChapter(i);
        lenis.scrollTo(cards[i], {
          offset: -120,
          duration: 1.2,
        });
      }
    });
  });

  // Smooth 3D hover tilt on the 4 architecture cards
  const hasHoverCapability = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Smooth 3D hover tilt on architecture cards (Only on desktop mouse pointers to eliminate mobile scroll lag)
  if (hasHoverCapability) {
    cards.forEach((card) => {
      const visual = card.querySelector('.reveal-card-visual');
      const glare = card.querySelector('.reveal-card-glare');

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const tiltX = ((y - centerY) / centerY) * -7;
        const tiltY = ((x - centerX) / centerX) * 7;

        gsap.to(card, {
          rotateX: tiltX,
          rotateY: tiltY,
          transformPerspective: 1000,
          scale: 1.02,
          duration: 0.35,
          ease: 'power2.out',
          overwrite: 'auto',
        });

        if (glare) {
          const glareX = (x / rect.width) * 100;
          const glareY = (y / rect.height) * 100;
          glare.style.background = `radial-gradient(circle 280px at ${glareX}% ${glareY}%, rgba(201, 168, 76, 0.22) 0%, transparent 70%)`;
          glare.style.opacity = '1';
        }
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          scale: 1,
          duration: 0.6,
          ease: 'power3.out',
          overwrite: 'auto',
        });
        if (glare) {
          glare.style.opacity = '0';
        }
      });
    });
  }

  // Staggered 3D scroll entrance transition for each architecture card
  cards.forEach((card) => {
    gsap.from(card, {
      y: 90,
      opacity: 0,
      scale: 0.94,
      rotateX: 8,
      transformPerspective: 1000,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: card,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    });
  });
};

/* ─── 3. HERITAGE ANIMATIONS ──────────────────────────── */
const initHeritageAnimations = () => {
  const eyebrow = document.querySelector('.heritage-eyebrow');
  const title = document.querySelector('.heritage-title');
  const divider = document.querySelector('.heritage-divider');
  const bodies = document.querySelectorAll('.heritage-body');
  const link = document.querySelector('.heritage-link');
  const stats = document.querySelectorAll('.heritage-stat');

  if (!title) return;

  const elements = [eyebrow, title, divider, ...bodies, link];

  elements.forEach((el, i) => {
    if (!el) return;
    gsap.from(el, {
      y: 35,
      opacity: 0,
      duration: 1,
      delay: i * 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.heritage',
        start: 'top 55%',
        toggleActions: 'play none none reverse',
      },
    });
  });

  stats.forEach((stat, i) => {
    gsap.from(stat, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      delay: 0.3 + i * 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.heritage',
        start: 'top 50%',
        toggleActions: 'play none none reverse',
      },
    });
  });
};

/* ─── 4. COLLECTION (ETHOS) ANIMATIONS ────────────────── */
const initEthosAnimations = () => {
  // Background parallax
  gsap.utils.toArray('.ethos-bg-img').forEach((img) => {
    gsap.to(img, {
      scale: 1.1,
      yPercent: 10,
      scrollTrigger: {
        trigger: '.ethos',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  });

  // Entrance animations for active variant
  const activeText = document.querySelector('.ethos-main.active .ethos-text-side');
  const activeWatch = document.querySelector('.ethos-main.active .ethos-watch-img');

  if (activeText) {
    gsap.from(activeText.children, {
      y: 40,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.ethos',
        start: 'top 55%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  if (activeWatch) {
    gsap.from(activeWatch, {
      x: -80,
      opacity: 0,
      duration: 1.4,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.ethos',
        start: 'top 55%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  // Variant switcher
  const nextBtns = document.querySelectorAll('.ethos-next-btn');
  let isAnimating = false;

  nextBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (isAnimating) return;
      isAnimating = true;

      const target = btn.dataset.target;
      const currentVariant = document.querySelector('.ethos-main.active');
      const nextVariant = document.querySelector(`.variant-${target}`);
      const currentBg = document.querySelector('.ethos-bg-img.active');
      const nextBg = document.querySelector(`.ethos-bg-${target}`);

      if (!currentVariant || !nextVariant) {
        isAnimating = false;
        return;
      }

      const currentTextEls = currentVariant.querySelector('.ethos-text-side').children;
      const currentWatchEl = currentVariant.querySelector('.ethos-watch-img');
      const nextTextEls = nextVariant.querySelector('.ethos-text-side').children;
      const nextWatchEl = nextVariant.querySelector('.ethos-watch-img');

      const tl = gsap.timeline({
        onComplete: () => {
          isAnimating = false;
        },
      });

      // Animate current out
      tl.to(Array.from(currentTextEls), {
        x: -100,
        opacity: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power2.in',
      })
        .to(
          currentWatchEl,
          {
            x: -150,
            opacity: 0,
            duration: 0.5,
            ease: 'power2.in',
          },
          '-=0.4'
        )
        .add(() => {
          currentVariant.classList.remove('active');
          nextVariant.classList.add('active');
          if (currentBg) currentBg.classList.remove('active');
          if (nextBg) nextBg.classList.add('active');

          gsap.set(Array.from(nextTextEls), { x: 100, opacity: 0 });
          gsap.set(nextWatchEl, { x: 150, opacity: 0 });
        })
        .to(Array.from(nextTextEls), {
          x: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.06,
          ease: 'power2.out',
        })
        .to(
          nextWatchEl,
          {
            x: 0,
            opacity: 0.85,
            duration: 0.7,
            ease: 'power2.out',
          },
          '-=0.5'
        );
    });
  });
};

/* ─── 5. CRAFTSMANSHIP (CALIBRE ARCHITECTURE) ANIMATIONS ─── */
const initCraftsmanshipAnimations = () => {
  const section = document.querySelector('.craftsmanship-section');
  if (!section) return;

  // Header entrance
  const headerElements = section.querySelectorAll('.craft-eyebrow, .craft-header .section-title, .craft-header .section-subtitle');
  if (headerElements.length) {
    gsap.from(headerElements, {
      y: 35,
      opacity: 0,
      stagger: 0.15,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  // Specs bar items stagger
  const specItems = section.querySelectorAll('.craft-spec-item');
  if (specItems.length) {
    gsap.from(specItems, {
      y: 25,
      opacity: 0,
      stagger: 0.1,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.craft-specs-bar',
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  // Hotspot navigation pills bar entrance
  const navPillsBar = section.querySelector('.craft-hotspot-nav');
  const navPills = section.querySelectorAll('.hotspot-nav-pill');
  if (navPillsBar && navPills.length) {
    gsap.from(navPills, {
      y: 20,
      opacity: 0,
      stagger: 0.08,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: navPillsBar,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  // Exhibition stage visual reveal
  const stage = section.querySelector('.craft-stage');
  const stageVisual = section.querySelector('.craft-stage-visual');
  const innerStage = section.querySelector('.craft-movement-stage-inner');
  const glareOverlay = section.querySelector('.craft-sapphire-glare');
  const activeTagEl = document.getElementById('craft-active-hotspot-tag');
  const hotspots = section.querySelectorAll('.craft-hotspot');

  if (stage && stageVisual) {
    gsap.from(stageVisual, {
      scale: 0.94,
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: stage,
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  // Hotspot Telemetry Titles Map
  const HOTSPOT_TAGS = [
    'CALIBRE GTC-2601 · 22K SOLID GOLD TOPOGRAPHIC ROTOR',
    'CALIBRE GTC-2601 · 4HZ VARIABLE-INERTIA BALANCE & ESCAPEMENT (28,800 VPH)',
    'CALIBRE GTC-2601 · 31 SYNTHETIC RUBY BEARINGS IN SOLID GOLD CHATONS',
    'CALIBRE GTC-2601 · TWIN-BARREL LINEAR TORQUE MAINSPRING ARCHITECTURE (68H)',
    'CALIBRE GTC-2601 · SURAT LAPIDARY 45° MIRROR ANGLAGE & CÔTES DE GENÈVE',
  ];

  const setActiveHotspot = (index) => {
    // Update Hotspots
    hotspots.forEach((spot) => {
      const spotIdx = parseInt(spot.dataset.index, 10);
      if (spotIdx === index) {
        spot.classList.add('active');
      } else {
        spot.classList.remove('active');
      }
    });

    // Update Navigation Pills
    navPills.forEach((pill) => {
      const pillTarget = parseInt(pill.dataset.targetHotspot, 10);
      const isMatch = pillTarget === index;
      pill.classList.toggle('active', isMatch);
      pill.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    // Update Telemetry Caption Tag
    if (activeTagEl && HOTSPOT_TAGS[index]) {
      activeTagEl.textContent = HOTSPOT_TAGS[index];
    }
  };

  // Nav pills click handlers
  navPills.forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetIdx = parseInt(pill.dataset.targetHotspot, 10);
      setActiveHotspot(targetIdx);
    });
  });

  // Hotspots pop-in animation & interaction
  if (hotspots.length) {
    gsap.from(hotspots, {
      scale: 0,
      opacity: 0,
      stagger: 0.15,
      duration: 0.8,
      ease: 'back.out(1.8)',
      scrollTrigger: {
        trigger: stage,
        start: 'top 65%',
        toggleActions: 'play none none reverse',
      },
    });

    hotspots.forEach((spot) => {
      spot.addEventListener('click', (e) => {
        e.stopPropagation();
        const spotIdx = parseInt(spot.dataset.index, 10);
        const isAlreadyActive = spot.classList.contains('active');
        if (isAlreadyActive) {
          spot.classList.remove('active');
          navPills.forEach((p) => p.classList.remove('active'));
          if (activeTagEl) {
            activeTagEl.textContent = 'CALIBRE GTC-2601 · IN-HOUSE EXHIBITION CASEBACK · INTERACTIVE TELEMETRY';
          }
        } else {
          setActiveHotspot(spotIdx);
        }
      });
    });

    document.addEventListener('click', () => {
      hotspots.forEach((s) => s.classList.remove('active'));
      navPills.forEach((p) => p.classList.remove('active'));
      if (activeTagEl) {
        activeTagEl.textContent = 'CALIBRE GTC-2601 · IN-HOUSE EXHIBITION CASEBACK · INTERACTIVE TELEMETRY';
      }
    });
  }

  // 3D Mouse Parallax Tilt & Sapphire Crystal Sheen Tracking
  if (stage && innerStage) {
    let stageRect = null;
    let rafTilt = null;

    stage.addEventListener('mouseenter', () => {
      stageRect = stage.getBoundingClientRect();
    }, { passive: true });

    window.addEventListener('resize', () => {
      stageRect = null;
    }, { passive: true });

    stage.addEventListener('mousemove', (e) => {
      if (!stageRect) stageRect = stage.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (!rafTilt) {
        rafTilt = requestAnimationFrame(() => {
          if (!stageRect) stageRect = stage.getBoundingClientRect();
          const x = (clientX - stageRect.left) / stageRect.width;
          const y = (clientY - stageRect.top) / stageRect.height;
          const tiltX = (y - 0.5) * -10; // max 5 deg tilt
          const tiltY = (x - 0.5) * 10;
          innerStage.style.setProperty('--craft-tilt-x', `${tiltX.toFixed(2)}deg`);
          innerStage.style.setProperty('--craft-tilt-y', `${tiltY.toFixed(2)}deg`);
          if (glareOverlay) {
            glareOverlay.style.setProperty('--glare-x', `${(x * 100).toFixed(1)}%`);
            glareOverlay.style.setProperty('--glare-y', `${(y * 100).toFixed(1)}%`);
          }
          rafTilt = null;
        });
      }
    }, { passive: true });

    stage.addEventListener('mouseleave', () => {
      if (rafTilt) {
        cancelAnimationFrame(rafTilt);
        rafTilt = null;
      }
      stageRect = null;
      innerStage.style.setProperty('--craft-tilt-x', '0deg');
      innerStage.style.setProperty('--craft-tilt-y', '0deg');
      if (glareOverlay) {
        glareOverlay.style.setProperty('--glare-x', '50%');
        glareOverlay.style.setProperty('--glare-y', '45%');
      }
    }, { passive: true });
  }

  // 4 Pillars cards stagger
  const cards = section.querySelectorAll('.craft-card');
  if (cards.length) {
    gsap.from(cards, {
      y: 40,
      opacity: 0,
      stagger: 0.15,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.craft-pillars-grid',
        start: 'top 85%',
        once: true,
      },
    });
  }
};

/* ─── 6. SHOWCASE ANIMATIONS ──────────────────────────── */
const initShowcaseAnimations = () => {
  const eyebrow = document.querySelector('.showcase-eyebrow');
  const headline = document.querySelector('.showcase-headline');
  const body = document.querySelector('.showcase-body');
  const link = document.querySelector('.showcase-ig-link');

  if (!headline) return;

  [eyebrow, headline, body, link].forEach((el, i) => {
    if (!el) return;
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 1,
      delay: i * 0.12,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.showcase',
        start: 'top 55%',
        toggleActions: 'play none none reverse',
      },
    });
  });
};

/* ─── 7. NAV SCROLL BEHAVIOR ──────────────────────────── */
const initNavScroll = () => {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  let lastScrollY = 0;
  let ticking = false;

  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      nav.classList.add('hidden');
    } else {
      nav.classList.remove('hidden');
    }

    lastScrollY = currentScrollY;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(handleScroll);
      ticking = true;
    }
  });

  // Mobile Nav Drawer Toggle
  const mobileToggle = document.getElementById('nav-mobile-toggle');
  const mobileDrawer = document.getElementById('nav-mobile-drawer');
  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = mobileToggle.classList.toggle('active');
      mobileDrawer.classList.toggle('active', isActive);
      mobileDrawer.setAttribute('aria-hidden', (!isActive).toString());
    });

    // Auto-close mobile drawer when any link is clicked
    mobileDrawer.querySelectorAll('.mobile-nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        mobileDrawer.classList.remove('active');
        mobileDrawer.setAttribute('aria-hidden', 'true');
      });
    });

    // Close when clicking outside drawer
    document.addEventListener('click', (e) => {
      if (mobileDrawer.classList.contains('active') && !mobileDrawer.contains(e.target) && !mobileToggle.contains(e.target)) {
        mobileToggle.classList.remove('active');
        mobileDrawer.classList.remove('active');
        mobileDrawer.setAttribute('aria-hidden', 'true');
      }
    });
  }
};

/* ─── 8. MODAL & SMOOTH SCROLL ────────────────────────── */
/* ─── 8. UNIVERSAL TECHNICAL DOSSIER MODAL & REVEAL CHOREOGRAPHY ─── */
const initModal = () => {
  const modal = document.getElementById('reserve-modal');
  const container = document.getElementById('modal-container');
  const closeBtn = document.getElementById('modal-close');
  const openBtns = document.querySelectorAll('.open-reserve-modal');
  const watchImg = document.getElementById('dossier-watch-img');
  const inspectBtn = document.getElementById('btn-dossier-inspect-3d');
  const reserveBtn = document.getElementById('btn-dossier-reserve');
  const drawerBackBtn = document.getElementById('drawer-back-btn');
  const drawer = document.getElementById('dossier-reservation-drawer');
  const sections = document.getElementById('dossier-sections');

  if (!modal) return;

  const populateDossier = (watchData) => {
    if (!watchData) return;

    const eyebrowEl = document.getElementById('dossier-eyebrow');
    const titleEl = document.getElementById('dossier-title');
    const descEl = document.getElementById('dossier-description');
    const badgeRefEl = document.getElementById('dossier-badge-ref');
    const formWatchInput = document.getElementById('form-watch-model');
    const sectionsEl = document.getElementById('dossier-sections');

    if (eyebrowEl && (watchData.eyebrow || watchData.subtitle)) {
      eyebrowEl.textContent = watchData.eyebrow || watchData.subtitle;
    }
    if (titleEl && watchData.title) {
      titleEl.innerHTML = watchData.title.includes('<em>') ? watchData.title : `${watchData.title}`;
    }
    if (descEl && (watchData.description || watchData.desc)) {
      descEl.textContent = watchData.description || watchData.desc;
    }
    if (watchImg && (watchData.image || watchData.img)) {
      watchImg.src = watchData.image || watchData.img;
    }
    if (badgeRefEl && (watchData.ref || watchData.counter)) {
      badgeRefEl.textContent = watchData.ref || `${watchData.title} · ${watchData.counter}`;
    }
    if (formWatchInput && watchData.title) {
      formWatchInput.value = watchData.title;
    }

    // Dynamic spec groups if custom specs are provided
    if (watchData.customGroups && Array.isArray(watchData.customGroups) && sectionsEl) {
      sectionsEl.innerHTML = watchData.customGroups.map(group => `
        <section class="spec-group">
          <h3 class="spec-group-title">
            <span>${group.title}</span>
            ${group.pill ? `<span class="spec-group-pill">${group.pill}</span>` : ''}
          </h3>
          ${group.items.map(item => `
            <div class="spec-item">
              <span class="spec-label">${item.label}</span>
              <span class="spec-value">${item.value}</span>
            </div>
          `).join('')}
        </section>
      `).join('');
    } else if (watchData.case && watchData.calibre && sectionsEl) {
      // Build from standard watchData
      sectionsEl.innerHTML = `
        <section class="spec-group">
          <h3 class="spec-group-title">
            <span>CALIBRE &amp; ENGINEERING</span>
            <span class="spec-group-pill">MECHANICAL</span>
          </h3>
          <div class="spec-item">
            <span class="spec-label">Movement Architecture</span>
            <span class="spec-value">${watchData.calibre}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Autonomous Power Reserve</span>
            <span class="spec-value">${watchData.reserve || '70 Hours Autonomy'}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Water Resistance</span>
            <span class="spec-value">${watchData.water || '100 Metres'}</span>
          </div>
        </section>
        <section class="spec-group">
          <h3 class="spec-group-title">
            <span>CHASSIS &amp; METALLURGY</span>
            <span class="spec-group-pill">PRECISION</span>
          </h3>
          <div class="spec-item">
            <span class="spec-label">Case Profile &amp; Alloy</span>
            <span class="spec-value">${watchData.case}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Crystal Optics</span>
            <span class="spec-value">Dual-Domed Anti-Reflective Sapphire</span>
          </div>
        </section>
      `;
    }
  };

  const openModal = (watchData = null) => {
    // Cleanly close details modal overlay if open
    const detailsModal = document.getElementById('details-modal-overlay');
    if (detailsModal && detailsModal.classList.contains('active')) {
      detailsModal.classList.remove('active');
      detailsModal.setAttribute('aria-hidden', 'true');
    }

    if (watchData) {
      populateDossier(watchData);
    }

    // Reset concierge drawer back to technical specifications view
    if (drawer && sections) {
      drawer.classList.remove('active');
      sections.style.display = '';
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('data-lenis-prevent', 'true');
    modal.setAttribute('data-lenis-prevent-wheel', 'true');
    modal.setAttribute('data-lenis-prevent-touch', 'true');

    if (container) {
      container.setAttribute('data-lenis-prevent', 'true');
      container.setAttribute('data-lenis-prevent-wheel', 'true');
      container.setAttribute('data-lenis-prevent-touch', 'true');
    }

    const panel = document.getElementById('dossier-panel');
    if (panel) {
      panel.setAttribute('data-lenis-prevent', 'true');
      panel.setAttribute('data-lenis-prevent-wheel', 'true');
      panel.setAttribute('data-lenis-prevent-touch', 'true');
      panel.scrollTop = 0;
    }

    document.body.style.overflow = 'hidden';
    window.gtcLenis?.stop();

    // 4. GSAP CHOREOGRAPHY (MECHANICAL MICRO-INTERACTION REVEAL SEQUENCE)
    const header = modal.querySelector('.dossier-header');
    const specGroups = modal.querySelectorAll('.spec-group');
    const actionsFooter = modal.querySelector('.dossier-actions');

    gsap.killTweensOf([modal, container, watchImg, header, specGroups, actionsFooter]);

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    // Step 1: The overlay fades in (opacity: 0 to 1)
    tl.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' }, 0);

    // Step 2: The .modal-container slides up slightly (y: 40 to 0) and fades in (0.8s)
    if (container) {
      tl.fromTo(container, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power4.out' }, 0);
    }

    // Step 3: The watch image on the left scales down with hydrodynamic smoothness (scale: 1.05 to 1.0, 1.2s, power3.out)
    if (watchImg) {
      tl.fromTo(watchImg, { scale: 1.05 }, { scale: 1.0, duration: 1.2, ease: 'power3.out' }, 0);
    }

    // Step 4: Stagger the fade-in of .dossier-header, .spec-group blocks, and .dossier-actions (stagger 0.1s, y: 20 to 0)
    const staggerItems = [header, ...specGroups, actionsFooter].filter(Boolean);
    if (staggerItems.length) {
      tl.fromTo(
        staggerItems,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out' },
        0.18
      );
    }
  };

  const closeModal = () => {
    if (container) {
      gsap.to(container, {
        y: 30,
        opacity: 0,
        duration: 0.35,
        ease: 'power3.in',
      });
    }

    gsap.to(modal, {
      opacity: 0,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        window.gtcLenis?.start();
        if (container) gsap.set(container, { clearProps: 'all' });
        if (watchImg) gsap.set(watchImg, { clearProps: 'transform' });
      },
    });
  };

  // Expose to window for global access
  window.openTechnicalDossier = openModal;
  window.closeTechnicalDossier = closeModal;

  // Dual-Scroll Controller (Simultaneous Mouse Wheel & Scrollbar Drag Support)
  const dossierPanel = document.getElementById('dossier-panel');
  const dossierVisual = modal.querySelector('.dossier-visual');

  const scrollDossierTarget = (deltaY) => {
    const isMobile = window.innerWidth <= 1024;
    const targetScrollable = (isMobile && container && container.scrollHeight > container.clientHeight)
      ? container
      : dossierPanel;
    if (targetScrollable) {
      targetScrollable.scrollBy({ top: deltaY, behavior: 'auto' });
    }
  };

  // 1. Wheel over watch visual on left routes directly to dossier panel
  if (dossierVisual) {
    dossierVisual.addEventListener('wheel', (e) => {
      e.stopPropagation();
      scrollDossierTarget(e.deltaY);
    }, { passive: true });
  }

  // 2. Wheel over modal container routes to dossier panel
  if (container) {
    container.addEventListener('wheel', (e) => {
      e.stopPropagation();
      if (dossierPanel && e.target !== dossierPanel && !dossierPanel.contains(e.target)) {
        scrollDossierTarget(e.deltaY);
      }
    }, { passive: true });
  }

  // 3. Wheel over dossier panel directly scrolls with native GPU compositor smoothness
  if (dossierPanel) {
    dossierPanel.addEventListener('wheel', (e) => {
      e.stopPropagation();
    }, { passive: true });
  }

  // Open listeners
  openBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (btn.classList.contains('details-reserve-btn') && window._gtcCurrentDetailsWatch) {
        openModal(window._gtcCurrentDetailsWatch);
      } else {
        openModal();
      }
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });

  // Action: "INSPECT IN 3D"
  if (inspectBtn) {
    inspectBtn.addEventListener('click', () => {
      closeModal();
      const heroCanvas = document.getElementById('hero-canvas');
      const showcaseSection = document.getElementById('showcase-3d-section');
      if (heroCanvas) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (window.gtcHero3D && typeof window.gtcHero3D.toggleFocusZoom === 'function') {
          setTimeout(() => window.gtcHero3D.toggleFocusZoom(true), 600);
        }
      } else if (showcaseSection) {
        lenis.scrollTo(showcaseSection, { offset: 0, duration: 1.5 });
      }
    });
  }

  // Action: "RESERVE PIECE" (Smoothly reveals the concierge allocation form)
  if (reserveBtn) {
    reserveBtn.addEventListener('click', () => {
      if (drawer && sections) {
        sections.style.display = 'none';
        drawer.classList.add('active');
        const panel = document.getElementById('dossier-panel');
        if (panel) {
          panel.scrollTo({ top: panel.scrollHeight, behavior: 'smooth' });
        }
      }
    });
  }

  // Action: "Back to Technical Specs"
  if (drawerBackBtn) {
    drawerBackBtn.addEventListener('click', () => {
      if (drawer && sections) {
        drawer.classList.remove('active');
        sections.style.display = '';
      }
    });
  }

  // Action: Private Reservation Form Submit Handler (Supabase & Edge Function Checkout)
  const reserveForm = document.getElementById('reserve-form');
  if (reserveForm) {
    reserveForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = reserveForm.querySelector('.form-submit-btn');
      const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'CONFIRM ALLOCATION REQUEST';

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `
            <span class="btn-spinner" style="display:inline-block; animation: spin 1s linear infinite;">❖</span>
            <span>VERIFYING ALLOCATION...</span>
          `;
          submitBtn.style.opacity = '0.75';
        }

        const formData = new FormData(reserveForm);
        const reservationPayload = {
          firstName: formData.get('first-name') || '',
          lastName: formData.get('last-name') || '',
          email: formData.get('email') || '',
          phone: formData.get('phone') || '',
          variant: formData.get('variant') || '',
          watchModel: formData.get('selected-watch') || 'GTC Himalayan',
          message: formData.get('message') || '',
        };

        const result = await submitPrivateReservation(reservationPayload);

        if (result && result.success) {
          // Render Haute Horlogerie Confirmed Reservation Receipt in Drawer
          const drawerContainer = document.getElementById('dossier-reservation-drawer');
          if (drawerContainer) {
            drawerContainer.innerHTML = `
              <div class="reservation-success-receipt" style="text-align: center; padding: 2rem 0.5rem; animation: fadeIn 0.5s ease;">
                <div style="display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; border-radius: 50%; border: 1px solid #c9a84c; color: #c9a84c; font-size: 1.3rem; margin-bottom: 1.2rem; background: rgba(201, 168, 76, 0.1);">
                  ✓
                </div>
                <div style="font-family: var(--font-accent, 'Outfit', sans-serif); font-size: 0.68rem; letter-spacing: 0.25em; color: #c9a84c; text-transform: uppercase; margin-bottom: 0.5rem;">
                  GENESIS ALLOCATION SECURED · SURAT MASTER VAULT
                </div>
                <h3 style="font-family: var(--font-serif, 'Playfair Display', serif); font-size: 1.6rem; color: #f8f5ef; margin: 0 0 1rem; text-transform: uppercase;">
                  ALLOCATION REF: <span style="color: #c9a84c;">${result.allocationCode}</span>
                </h3>
                <p style="font-size: 0.88rem; color: rgba(248, 245, 239, 0.75); line-height: 1.6; max-width: 440px; margin: 0 auto 1.8rem;">
                  Your private reservation for <strong>${reservationPayload.watchModel} (${(reservationPayload.variant.split('·')[1] || reservationPayload.variant).trim()})</strong> has been registered in the Surat Atelier master registry. A Maison Client Advisor will establish private contact within 24 hours.
                </p>
                <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                  ${result.checkoutUrl ? `
                    <a href="${result.checkoutUrl}" class="form-submit-btn" style="text-decoration: none; padding: 12px 28px;">
                      <span>PROCEED TO SECURE CHECKOUT</span>
                      <span>→</span>
                    </a>
                  ` : ''}
                  <button type="button" class="drawer-back-btn" id="receipt-close-btn" style="border: 1px solid rgba(201, 168, 76, 0.4); padding: 10px 24px; border-radius: 2px;">
                    <span>RETURN TO ATELIER</span>
                  </button>
                </div>
              </div>
            `;

            const receiptCloseBtn = document.getElementById('receipt-close-btn');
            if (receiptCloseBtn) {
              receiptCloseBtn.addEventListener('click', () => {
                if (window.closeTechnicalDossier) window.closeTechnicalDossier();
              });
            }
          }
        }
      } catch (err) {
        console.error('[GTC Reservation] Submission error:', err);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;
          submitBtn.style.opacity = '1';
        }
      }
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          lenis.scrollTo(targetEl, {
            offset: -72,
            duration: 1.5,
          });
        }
      }
    });
  });
};

/* ═══════════════════════════════════════════════════════════
   9. 3D HYBRID LUXURY SHOWCASE ENGINE (COLLECTION SUBPAGE)
   Three.js + GLTFLoader + EXRLoader + GSAP Carousel
   ═══════════════════════════════════════════════════════════ */

const WATCH_COLLECTION_DATA = [
  {
    id: 'glacial',
    sectionName: 'Section A',
    angleRad: 0, // 0 rad (0°)
    angleDeg: '0°',
    title: 'GLACIAL TWILIGHT',
    subtitle: 'REF. HIM-GT-2601 · ICE BLUE SUNBURST',
    counter: '01 / 03',
    specs: ['Calibre GTC-2601', '68h Reserve', 'Fluted Bezel', '100m Water-Resistant'],
    paths: ['/assets/3d/watch_1.glb', '/assets/3d/rolex_datejust.glb', '/assets/photo/3D/rolex_datejust.glb'],
    scaleMultiplier: 1.05,
    tiltX: 10,
    tiltY: -22,
    description: 'Cold-forged 904L steel monobloc architecture crowned with an ice blue sunburst dial, reflecting glacial twilight at extreme altitudes.',
    image: '/assets/photo/ethos-watch.webp',
    case: '41mm Cold-Forged 904L Steel',
    calibre: 'Calibre GTC-2601 In-House Automatic',
    reserve: '68 Hours Autonomous Reserve',
    water: '100 Metres / 10 ATM Chronometer',
  },
  {
    id: 'mineral',
    sectionName: 'Section B',
    angleRad: (2 * Math.PI) / 3, // 120° (approx 2.0944 rad)
    angleDeg: '120°',
    title: 'MINERAL SLATE',
    subtitle: 'REF. HIM-MS-2602 · ANTHRACITE FLUTED',
    counter: '02 / 03',
    specs: ['Calibre GTC-2601', '68h Reserve', 'Hand-Anglage', '100m Water-Resistant'],
    paths: ['/assets/3d/watch_2.glb', '/assets/3d/seiko_watch.glb', '/assets/photo/3D/seiko_watch.glb'],
    scaleMultiplier: 1.05,
    tiltX: 10,
    tiltY: -22,
    description: 'Hand-Anglage & High-Luster Flat Polishing paired with an anthracite fluted dial, reflecting rock-face strata with crystalline purity.',
    image: '/assets/photo/ethos-watch-rs.webp',
    case: '41mm Cold-Forged 904L Steel',
    calibre: 'Calibre GTC-2601 In-House Automatic',
    reserve: '68 Hours Autonomous Reserve',
    water: '100 Metres / 10 ATM Chronometer',
  },
  {
    id: 'summit',
    sectionName: 'Section C',
    angleRad: (4 * Math.PI) / 3, // 240° / -120° (approx 4.1888 rad)
    angleDeg: '240°',
    title: 'SUMMIT ICE',
    subtitle: 'REF. HIM-SI-2603 · ARCTIC MATTE WHITE',
    counter: '03 / 03',
    specs: ['Calibre GTC-2601', '68h Reserve', 'Cryo-Forged 904L', '100m Water-Resistant'],
    paths: ['/assets/3d/watch_3.glb', '/assets/3d/watch_tissot_t-race_motogp_limited_edition_sdc.glb', '/assets/photo/3D/watch_tissot_t-race_motogp_limited_edition_sdc.glb'],
    scaleMultiplier: 0.98,
    tiltX: 10,
    tiltY: -22,
    description: 'Arctic matte white dial with circular Côtes de Surat finishing and black mirror-polished screws, built for extreme sub-zero peak ascents.',
    image: '/assets/photo/gtc-front-watch.webp',
    case: '41mm Cold-Forged 904L Steel',
    calibre: 'Calibre GTC-2601 In-House Automatic',
    reserve: '68 Hours Autonomous Reserve',
    water: '100 Metres / 10 ATM Chronometer',
  },
];

class HybridShowcase3D {
  constructor() {
    this.container = document.getElementById('webgl-container');
    if (!this.container) return;

    this.activeSectionIndex = 0; // Current active watch index (0, 1, or 2)
    this.targetSectionIndex = 0;
    this.modelGroups = [];
    this.isTransitioning = false;
    this.isPanningCamera = false;
    this.lastTime = performance.now();
    this.animId = null;

    // UI Elements
    this.titleEl = document.getElementById('watch-title');
    this.subtitleEl = document.getElementById('watch-subtitle');
    this.counterEl = document.getElementById('watch-counter');
    this.specsPillEl = document.getElementById('watch-specs-pill');
    this.prevBtn = document.getElementById('carousel-prev');
    this.nextBtn = document.getElementById('carousel-next');
    this.discoverBtn = document.getElementById('discover-btn');
    this.pips = document.querySelectorAll('.spatial-nav-pip');
    this.autoTourBtn = document.getElementById('btn-auto-tour');
    this.macroFocusBtn = document.getElementById('btn-macro-focus');
    this.resetStageBtn = document.getElementById('btn-reset-stage');
    this.isAutoTouring = false;
    this.isMacroFocused = false;
    this.loaderEl = document.getElementById('showcase-loader');
    this.loaderStatusEl = document.getElementById('showcase-loader-status');
    this.loaderFillEl = document.getElementById('showcase-loader-fill');

    this.gltfLoader = new GLTFLoader();
    this.exrLoader = new EXRLoader();

    this.init();
  }

  init() {
    this.setupScene();
    this.setupLighting();
    this.setupPedestal();
    this.setupSparkles();
    this.setupControls();
    this.loadEnvironmentPanorama();
    this.loadModelsSpatially();
    this.bindEvents();
    this.setupScrollTransition();
    this.setupVisibilityObserver();
    this.animate();
  }

  setupScene() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    // User lands firmly at eye-level looking directly at the center stage
    this.camera.position.set(0, 0.15, 3.35);

    const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !isMobile, // Enable antialias on desktop; on high-DPI mobile disable to maintain 120Hz/60Hz
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.35 : 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    if (isMobile) {
      this.renderer.shadowMap.enabled = false; // Massive mobile GPU performance saver
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
    }

    console.log("Max Texture Size:", this.renderer.capabilities.maxTextureSize);
    console.log("Device Pixel Ratio:", window.devicePixelRatio, "Active Pixel Ratio:", this.renderer.getPixelRatio());

    this.container.appendChild(this.renderer.domElement);

    // Initial instant fallback environment: rich luxury noir radial gradient canvas
    this.createInstantStudioEnvironment();
  }

  createInstantStudioEnvironment() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#1c1c1c');
    grad.addColorStop(0.35, '#262626');
    grad.addColorStop(0.7, '#121212');
    grad.addColorStop(1, '#080808');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    this.scene.background = texture;
  }

  setupPedestal() {
    // Luxury Obsidian Exhibition Plinth (grounds the watch so it is NOT floating in air)
    const plinthGeo = new THREE.CylinderGeometry(1.3, 1.4, 0.08, 64);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x141414,
      roughness: 0.38,
      metalness: 0.82,
    });
    this.plinth = new THREE.Mesh(plinthGeo, plinthMat);
    this.plinth.position.y = -0.86;
    this.plinth.receiveShadow = true;
    this.scene.add(this.plinth);

    // Antique Gold Beveled Accent Ring around Plinth
    const ringGeo = new THREE.TorusGeometry(1.31, 0.012, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xc9a84c,
      roughness: 0.22,
      metalness: 0.95,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.82;
    this.scene.add(ring);

    // Feathered Soft Radial Contact Shadow on Top of Plinth
    const shadowGeo = new THREE.PlaneGeometry(2.3, 2.3);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: this.createRadialShadowTexture(),
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = -0.815;
    this.scene.add(contactShadow);
  }

  createRadialShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.88)');
    grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.52)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(64, 64, 64, 0, Math.PI * 2);
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
  }

  setupLighting() {
    // Warm Ambient Light
    const ambientLight = new THREE.AmbientLight(0xe8d6b3, 0.95);
    this.scene.add(ambientLight);

    // Key Light (Ivory)
    const keyLight = new THREE.DirectionalLight(0xf8f5ef, 2.6);
    keyLight.position.set(4.5, 5, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    this.scene.add(keyLight);

    // Fill Light (Antique Gold)
    const fillLight = new THREE.DirectionalLight(0xc9a84c, 1.6);
    fillLight.position.set(-4.5, 3.5, 3);
    this.scene.add(fillLight);

    // Rim Light (Champagne)
    const rimLight = new THREE.DirectionalLight(0xe8d6b3, 2.2);
    rimLight.position.set(0, 4.5, -4);
    this.scene.add(rimLight);

    // Bottom Bounce
    const bounceLight = new THREE.DirectionalLight(0x2e2e2e, 0.7);
    bounceLight.position.set(0, -3.5, 2);
    this.scene.add(bounceLight);
  }

  setupSparkles() {
    const particleCount = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    this.particleData = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;

      this.particleData.push({
        vx: (Math.random() - 0.5) * 0.002,
        vy: Math.random() * 0.0035 + 0.0012,
        vz: (Math.random() - 0.5) * 0.002,
        phase: Math.random() * Math.PI * 2,
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(212, 175, 55, 1)');
    grad.addColorStop(0.35, 'rgba(212, 175, 55, 0.7)');
    grad.addColorStop(0.75, 'rgba(201, 168, 76, 0.2)');
    grad.addColorStop(1, 'rgba(201, 168, 76, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();

    const sparkleTexture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      color: 0xd4af37,
      size: 0.14,
      map: sparkleTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.sparkles = new THREE.Points(geometry, material);
    this.scene.add(this.sparkles);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.75;
    // Allow natural mouse wheel / touchpad scrolling to flow down to CTA cards without canvas scroll hijack
    this.controls.enableZoom = false;

    // Center target on the watch plinth stage
    this.controls.target.set(0, -0.05, 0);

    // Keep camera at eye-level viewing height
    this.controls.minPolarAngle = Math.PI * 0.44; // ~79°
    this.controls.maxPolarAngle = Math.PI * 0.56; // ~101°

    // Clamped distance for rich macro inspection to wide panorama
    this.controls.minDistance = 1.6;
    this.controls.maxDistance = 4.6;

    // Infinite 360 horizontal panning
    this.controls.minAzimuthAngle = -Infinity;
    this.controls.maxAzimuthAngle = Infinity;
  }

  loadEnvironmentPanorama() {
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const scene = this.scene;

    // 1. VISIBLE PANORAMA (Sharp Background)
    // Loaded via THREE.TextureLoader (WebP 566KB vs 35.2MB PNG)
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/assets/3d/hdr_high.webp',
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        // Apply exclusively to scene.background
        scene.background = texture;
        console.log('[3D Panorama] Background panorama loaded and applied to scene.background.');
      },
      undefined,
      (err) => {
        console.warn('[3D Panorama] TextureLoader failed loading /assets/3d/hdr_high.webp:', err);
      }
    );

    // 2. LIGHTING & METALLIC REFLECTIONS (EXRLoader -> PMREMGenerator -> scene.environment only)
    const onExrLoaded = (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;

      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = envMap;
      this.envMap = envMap;

      pmremGenerator.dispose();
      texture.dispose();

      this.updateAllMaterialsEnv();
      console.log('[3D Lighting] Radiance environment map generated and applied to scene.environment.');
    };

    // On mobile devices, avoid stalling the mobile network & GPU with 10MB EXR parsing.
    const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 128);
        grad.addColorStop(0, '#2e3d4c');
        grad.addColorStop(0.5, '#161c22');
        grad.addColorStop(1, '#050709');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 128);

        const softbox = ctx.createRadialGradient(128, 25, 2, 128, 25, 60);
        softbox.addColorStop(0, 'rgba(255, 248, 230, 0.95)');
        softbox.addColorStop(0.5, 'rgba(201, 168, 76, 0.4)');
        softbox.addColorStop(1, 'transparent');
        ctx.fillStyle = softbox;
        ctx.fillRect(0, 0, 256, 85);

        const texture = new THREE.CanvasTexture(canvas);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        this.envMap = envMap;
        pmremGenerator.dispose();
        texture.dispose();
        this.updateAllMaterialsEnv();
      } catch (e) {
        console.warn('[3D Lighting] Procedural mobile envMap fallback failed:', e);
      }
    } else {
      new EXRLoader().load(
        '/assets/3d/hde.exr',
        onExrLoaded,
        undefined,
        (err) => {
          console.warn('[3D Panorama] Could not load /assets/3d/hde.exr, trying /assets/3d/hdr.exr fallback:', err);
          new EXRLoader().load(
            '/assets/3d/hdr.exr',
            onExrLoaded,
            undefined,
            (fallbackErr) => {
              console.error('[3D Panorama] EXRLoader failed loading HDR maps:', fallbackErr);
            }
          );
        }
      );
    }
  }

  loadModelsSpatially() {
    let loadedCount = 0;
    const totalModels = WATCH_COLLECTION_DATA.length;

    WATCH_COLLECTION_DATA.forEach((watchData, index) => {
      const loadWithFallback = (pathIdx) => {
        if (pathIdx >= watchData.paths.length) {
          console.error(`[3D] Failed loading model for ${watchData.title}`);
          return;
        }

        this.gltfLoader.load(
          watchData.paths[pathIdx],
          (gltf) => {
            const group = this.normalizeModel(gltf.scene, watchData);
            this.modelGroups[index] = group;
            this.scene.add(group);

            // ONLY show the initial active watch (Section A · GLACIAL TWILIGHT).
            // Inactive watches are hidden so they NEVER float awkwardly in the background!
            if (index === 0) {
              group.visible = true;
            } else {
              group.visible = false;
            }

            loadedCount++;
            const pct = Math.round((loadedCount / totalModels) * 100);
            this.updateLoaderProgress(pct, `Assembling ${watchData.title} Calibre (${loadedCount}/${totalModels})...`);

            if (loadedCount === totalModels) {
              this.hideLoader();
              this.updateHUDText(0, false);
              this.updatePips(0);
            }
          },
          undefined,
          () => loadWithFallback(pathIdx + 1)
        );
      };

      loadWithFallback(0);
    });
  }

  normalizeModel(rawScene, config) {
    rawScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          if (this.envMap) {
            child.material.envMap = this.envMap;
          }
          child.material.envMapIntensity = 1.45;
          child.material.roughness = Math.min(0.85, child.material.roughness !== undefined ? child.material.roughness : 0.28);
          child.material.needsUpdate = true;
        }
      }
    });

    const box = new THREE.Box3().setFromObject(rawScene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    rawScene.position.x = -center.x;
    rawScene.position.y = -center.y;
    rawScene.position.z = -center.z;

    const pivot = new THREE.Group();
    pivot.add(rawScene);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    // Boutique exhibition scale: 1.45 units (crisp, elegant, perfectly framed in viewport)
    const targetScale = (1.45 / maxDim) * (config.scaleMultiplier || 1.0);
    pivot.scale.setScalar(targetScale);

    pivot.userData = {
      baseScale: targetScale,
      defaultTiltX: THREE.MathUtils.degToRad(config.tiltX || 10),
      defaultTiltY: THREE.MathUtils.degToRad(config.tiltY || -22),
    };

    // Position directly in the CENTER right above the luxury pedestal
    pivot.position.set(0, -0.05, 0);
    pivot.rotation.x = pivot.userData.defaultTiltX;
    pivot.rotation.y = pivot.userData.defaultTiltY;

    return pivot;
  }

  updateAllMaterialsEnv() {
    if (!this.envMap) return;
    this.modelGroups.forEach((group) => {
      if (group) {
        group.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.envMap = this.envMap;
            child.material.envMapIntensity = 1.45;
            child.material.needsUpdate = true;
          }
        });
      }
    });
  }

  /* ─── Seamless One-After-One Appearance on Panorama Turn ─ */
  checkAzimuthalDiscovery() {
    if (this.isTransitioning || this.modelGroups.length < 3) return;

    // Current horizontal camera angle in radians [-PI, +PI]
    const angle = this.controls.getAzimuthalAngle();

    // Map 360-degree panorama into 3 equal 120-degree sectors:
    // Sector 0: [-60°, +60°] -> Section A · GLACIAL TWILIGHT
    // Sector 1: [+60°, +180°] -> Section B · MINERAL SLATE
    // Sector 2: [-180°, -60°] -> Section C · SUMMIT ICE
    let sector = 0;
    if (angle >= -Math.PI / 3 && angle < Math.PI / 3) {
      sector = 0;
    } else if (angle >= Math.PI / 3 && angle <= Math.PI) {
      sector = 1;
    } else {
      sector = 2;
    }

    if (sector !== this.activeSectionIndex) {
      this.transitionToWatch(sector);
    }
  }

  transitionToWatch(newIndex) {
    if (newIndex === this.activeSectionIndex && this.modelGroups[newIndex]?.visible) return;
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const prevIndex = this.activeSectionIndex;
    this.activeSectionIndex = newIndex;

    const prevModel = this.modelGroups[prevIndex];
    const nextModel = this.modelGroups[newIndex];

    const tl = gsap.timeline({
      onComplete: () => {
        if (prevModel && prevIndex !== newIndex) {
          prevModel.visible = false;
        }
        this.isTransitioning = false;
      },
    });

    // Previous watch smoothly fades/scales down and leaves stage
    if (prevModel && prevIndex !== newIndex) {
      tl.to(prevModel.scale, {
        x: prevModel.userData.baseScale * 0.7,
        y: prevModel.userData.baseScale * 0.7,
        z: prevModel.userData.baseScale * 0.7,
        duration: 0.32,
        ease: 'power2.in',
      }, 0);

      tl.to(prevModel.position, {
        y: -0.22,
        duration: 0.32,
        ease: 'power2.in',
      }, 0);
    }

    // Next watch appears in the center, perfectly oriented to current camera perspective
    if (nextModel) {
      nextModel.visible = true;
      nextModel.position.set(0, -0.2, 0);
      nextModel.scale.setScalar(nextModel.userData.baseScale * 0.75);

      const camAzimuth = this.controls.getAzimuthalAngle();
      nextModel.rotation.y = camAzimuth + nextModel.userData.defaultTiltY;
      nextModel.rotation.x = nextModel.userData.defaultTiltX;

      tl.to(nextModel.scale, {
        x: nextModel.userData.baseScale,
        y: nextModel.userData.baseScale,
        z: nextModel.userData.baseScale,
        duration: 0.5,
        ease: 'power3.out',
      }, 0.18);

      tl.to(nextModel.position, {
        y: -0.05,
        duration: 0.5,
        ease: 'power3.out',
      }, 0.18);
    }

    this.updateHUDText(newIndex, true);
    this.updatePips(newIndex);
  }

  /* ─── Smooth Camera Panning to Sector ────────────────── */
  panCameraToSection(targetIndex) {
    if (targetIndex < 0 || targetIndex >= WATCH_COLLECTION_DATA.length) return;
    if (this.isPanningCamera && targetIndex === this.targetSectionIndex) return;

    this.targetSectionIndex = targetIndex;
    this.isPanningCamera = true;

    // Target angle for each sector:
    // Sector 0: 0 rad (0°)
    // Sector 1: 2*PI/3 rad (120°)
    // Sector 2: -2*PI/3 rad (-120° / 240°)
    let targetAngle = 0;
    if (targetIndex === 1) targetAngle = (2 * Math.PI) / 3;
    if (targetIndex === 2) targetAngle = (-2 * Math.PI) / 3;

    const currentAngle = this.controls.getAzimuthalAngle();
    let diff = (targetAngle - currentAngle) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;

    const startAngle = currentAngle;
    const endAngle = currentAngle + diff;
    const radius = 3.35;
    const phi = this.controls.getPolarAngle() || (Math.PI / 2);

    const tweenProxy = { angle: startAngle };

    // Trigger watch appearance
    this.transitionToWatch(targetIndex);

    gsap.to(tweenProxy, {
      angle: endAngle,
      duration: 1.1,
      ease: 'power2.inOut',
      onUpdate: () => {
        const a = tweenProxy.angle;
        this.camera.position.x = radius * Math.sin(a) * Math.sin(phi);
        this.camera.position.z = radius * Math.cos(a) * Math.sin(phi);
        this.camera.position.y = radius * Math.cos(phi);
        this.controls.update();
      },
      onComplete: () => {
        this.isPanningCamera = false;
      },
    });
  }

  navigateCarousel(direction) {
    const nextIndex =
      (this.activeSectionIndex + direction + WATCH_COLLECTION_DATA.length) % WATCH_COLLECTION_DATA.length;
    this.panCameraToSection(nextIndex);
  }

  /* ─── HUD and Navigation UI Updates ───────────────────── */
  updatePips(activeIndex) {
    if (!this.pips || !this.pips.length) return;
    this.pips.forEach((pip, idx) => {
      const isMatch = idx === activeIndex;
      pip.classList.toggle('active', isMatch);
      pip.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
  }

  updateHUDText(index, animate = true) {
    const data = WATCH_COLLECTION_DATA[index];
    if (!data) return;

    const els = [this.counterEl, this.titleEl, this.subtitleEl, this.specsPillEl].filter(Boolean);

    if (!animate) {
      if (this.counterEl) this.counterEl.textContent = data.counter;
      if (this.titleEl) this.titleEl.textContent = data.title;
      if (this.subtitleEl) this.subtitleEl.textContent = data.subtitle;
      if (this.specsPillEl) {
        this.specsPillEl.innerHTML = data.specs
          .map((s, i) => `<span>${s}</span>${i < data.specs.length - 1 ? '<span class="dot-sep">•</span>' : ''}`)
          .join('');
      }
      return;
    }

    gsap.to(els, {
      y: -18,
      opacity: 0,
      duration: 0.22,
      stagger: 0.04,
      ease: 'power2.in',
      onComplete: () => {
        if (this.counterEl) this.counterEl.textContent = data.counter;
        if (this.titleEl) this.titleEl.textContent = data.title;
        if (this.subtitleEl) this.subtitleEl.textContent = data.subtitle;
        if (this.specsPillEl) {
          this.specsPillEl.innerHTML = data.specs
            .map((s, i) => `<span>${s}</span>${i < data.specs.length - 1 ? '<span class="dot-sep">•</span>' : ''}`)
            .join('');
        }

        gsap.fromTo(
          els,
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.42, stagger: 0.05, ease: 'power3.out' }
        );
      },
    });
  }

  updateLoaderProgress(percent, statusText) {
    if (this.loaderFillEl) {
      this.loaderFillEl.style.width = `${Math.min(100, Math.max(10, percent))}%`;
    }
    if (this.loaderStatusEl && statusText) {
      this.loaderStatusEl.textContent = statusText;
    }
  }

  hideLoader() {
    if (!this.loaderEl) return;
    if (this.loaderFillEl) this.loaderFillEl.style.width = '100%';
    setTimeout(() => {
      this.loaderEl.style.opacity = '0';
      this.loaderEl.style.pointerEvents = 'none';
    }, 350);
  }

  bindEvents() {
    // Next / Previous Carousel Buttons
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.navigateCarousel(-1));
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.navigateCarousel(1));
    }

    // Spatial Compass Navigation Pips
    if (this.pips && this.pips.length) {
      this.pips.forEach((pip, idx) => {
        pip.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetSection = parseInt(pip.dataset.section || String(idx), 10);
          this.panCameraToSection(targetSection);
        });
      });
    }

    // Keyboard Arrow Keys
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.navigateCarousel(-1);
      if (e.key === 'ArrowRight') this.navigateCarousel(1);
    });

    // Auto Tour Toggle Button
    if (this.autoTourBtn) {
      this.autoTourBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isAutoTouring = !this.isAutoTouring;
        this.controls.autoRotate = this.isAutoTouring;
        this.controls.autoRotateSpeed = 0.85;
        this.autoTourBtn.classList.toggle('active', this.isAutoTouring);
      });
    }

    // Macro Focus Button
    if (this.macroFocusBtn) {
      this.macroFocusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMacroFocus();
      });
    }

    // Reset Stage View Button
    if (this.resetStageBtn) {
      this.resetStageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resetStageView();
      });
    }

    // Discover Pill Button
    if (this.discoverBtn) {
      this.discoverBtn.addEventListener('click', () => this.triggerDiscoverZoom());
    }

    // Atelier Telemetry Strip Quick-Jump Cards
    const telemetryCards = document.querySelectorAll('.telemetry-card[data-section-target]');
    telemetryCards.forEach((card) => {
      card.addEventListener('click', () => {
        const targetSection = parseInt(card.dataset.sectionTarget, 10);
        const section = document.getElementById('showcase-3d-section');
        if (section) {
          lenis.scrollTo(section, { duration: 1.1 });
        }
        this.panCameraToSection(targetSection);
      });
    });

    // Scroll Cue to smooth scroll directly to CTA Cards Grid
    const scrollCue = document.querySelector('.scroll-cue');
    if (scrollCue) {
      scrollCue.style.cursor = 'pointer';
      scrollCue.addEventListener('click', () => {
        const gridSection = document.getElementById('grid-section');
        if (gridSection) {
          lenis.scrollTo(gridSection, { offset: -30, duration: 1.2 });
        }
      });
    }

    // Telemetry CTA to Scroll Cards
    const telemetryScrollBtn = document.getElementById('telemetry-scroll-cards');
    if (telemetryScrollBtn) {
      telemetryScrollBtn.addEventListener('click', () => {
        const gridSection = document.getElementById('grid-section');
        if (gridSection) {
          lenis.scrollTo(gridSection, { offset: -30, duration: 1.2 });
        }
      });
    }

    // Window Resize
    window.addEventListener('resize', () => this.handleResize());
  }

  toggleMacroFocus() {
    this.isMacroFocused = !this.isMacroFocused;
    if (this.macroFocusBtn) {
      this.macroFocusBtn.classList.toggle('active', this.isMacroFocused);
    }
    const targetDist = this.isMacroFocused ? 1.85 : 3.35;
    const currentAngle = this.controls.getAzimuthalAngle();
    const phi = this.controls.getPolarAngle() || (Math.PI / 2);

    gsap.to(this.camera.position, {
      x: targetDist * Math.sin(currentAngle) * Math.sin(phi),
      z: targetDist * Math.cos(currentAngle) * Math.sin(phi),
      y: this.isMacroFocused ? 0.02 : 0.15,
      duration: 1.1,
      ease: 'power2.inOut',
      onUpdate: () => this.controls.update(),
    });
  }

  resetStageView() {
    this.isMacroFocused = false;
    this.isAutoTouring = false;
    this.controls.autoRotate = false;
    if (this.macroFocusBtn) this.macroFocusBtn.classList.remove('active');
    if (this.autoTourBtn) this.autoTourBtn.classList.remove('active');

    gsap.to(this.camera.position, {
      x: 0,
      y: 0.15,
      z: 3.35,
      duration: 1.1,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.controls.target.set(0, -0.05, 0);
        this.controls.update();
      },
    });
  }

  triggerDiscoverZoom() {
    const activeModel = this.modelGroups[this.activeSectionIndex];
    if (!activeModel) return;

    // Zoom camera in toward the watch in the center
    const currentAngle = this.controls.getAzimuthalAngle();
    const zoomDist = 2.05;
    const phi = this.controls.getPolarAngle() || (Math.PI / 2);

    gsap.to(this.camera.position, {
      x: zoomDist * Math.sin(currentAngle) * Math.sin(phi),
      z: zoomDist * Math.cos(currentAngle) * Math.sin(phi),
      y: 0.05,
      duration: 1.1,
      ease: 'power2.inOut',
      onUpdate: () => this.controls.update(),
    });

    gsap.to(activeModel.rotation, {
      y: activeModel.rotation.y + 0.35,
      duration: 1.1,
      ease: 'power2.inOut',
    });

    // After zoom, smoothly scroll down into #atelier-telemetry-strip and #grid-section
    setTimeout(() => {
      const gridSection = document.getElementById('grid-section');
      if (gridSection) {
        lenis.scrollTo(gridSection, {
          offset: -40,
          duration: 1.3,
        });

        const cards = document.querySelectorAll('.cta-product-card');
        const targetCard = Array.from(cards).find(
          (c) => c.dataset.modelIndex === String(this.activeSectionIndex)
        );
        if (targetCard) {
          targetCard.classList.add('active-focus');
          setTimeout(() => targetCard.classList.remove('active-focus'), 3000);
        }
      }
    }, 1100);
  }

  setupScrollTransition() {
    const section = document.getElementById('showcase-3d-section');
    const container = this.container;
    const overlay = document.getElementById('showcase-overlay');
    const telemetryStrip = document.getElementById('atelier-telemetry-strip');
    const gridSection = document.getElementById('grid-section');

    if (!section || !container) return;

    // Smooth continuous parallax without ANY dead pin gap
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.5,
      onUpdate: (self) => {
        const progress = self.progress;

        // Cinematic camera elevation: overview of 8K pavilion and pedestal
        if (!this.isPanningCamera && !this.isMacroFocused && !this.isAutoTouring) {
          this.camera.position.y = 0.15 + progress * 0.35;
          this.camera.position.z = 3.35 + progress * 0.45;
          this.controls.update();
        }

        // Fade HUD overlay gracefully as user scrolls into telemetry section
        if (overlay) {
          overlay.style.opacity = Math.max(0, 1 - progress * 1.5);
          overlay.style.transform = `translateY(${-progress * 50}px)`;
        }
      },
    });

    // Reveal animation for Telemetry Strip cards
    if (telemetryStrip) {
      const cards = telemetryStrip.querySelectorAll('.telemetry-card');
      if (cards.length) {
        gsap.from(cards, {
          y: 35,
          opacity: 0,
          duration: 0.75,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: telemetryStrip,
            start: 'top 85%',
            once: true,
          },
        });
      }
    }

    // Smooth Stagger arrival for CTA cards in the grid (Runs once cleanly, clears inline transforms)
    if (gridSection) {
      const cards = gridSection.querySelectorAll('.cta-product-card');
      if (cards.length) {
        gsap.from(cards, {
          y: 35,
          opacity: 0,
          scale: 0.98,
          stagger: 0.06,
          duration: 0.65,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: gridSection,
            start: 'top 85%',
            once: true,
          },
          onComplete: () => {
            gsap.set(cards, { clearProps: 'transform,opacity,scale' });
          },
        });
      }
    }
  }

  setupVisibilityObserver() {
    this.isVisible = true;
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const section = document.getElementById('showcase-3d-section') || this.container;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const wasVisible = this.isVisible;
            this.isVisible = entry.isIntersecting;
            if (!wasVisible && this.isVisible) {
              this.lastTime = performance.now();
              if (!this.animId) {
                this.animate();
              }
            } else if (wasVisible && !this.isVisible) {
              if (this.animId) {
                cancelAnimationFrame(this.animId);
                this.animId = null;
              }
            }
          });
        },
        { threshold: 0.05 }
      );
      observer.observe(section);
    }
  }

  handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.35 : 2));
  }

  animate() {
    if (!this.isVisible) {
      this.animId = null;
      return;
    }
    this.animId = requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const elapsedTime = now / 1000;

    // Check camera horizontal azimuthal angle for sector discovery
    this.checkAzimuthalDiscovery();

    // Subtle idle floating bob on active watch
    const activeModel = this.modelGroups[this.activeSectionIndex];
    if (activeModel && activeModel.visible && !this.isTransitioning) {
      activeModel.position.y = -0.05 + Math.sin(elapsedTime * 1.5) * 0.025;
      activeModel.rotation.x =
        activeModel.userData.defaultTiltX + Math.cos(elapsedTime * 1.2) * 0.01;
      activeModel.rotation.y += 0.002;
    }

    // Drifting floating sparkles particle system
    if (this.sparkles) {
      const positions = this.sparkles.geometry.attributes.position.array;
      for (let i = 0; i < this.particleData.length; i++) {
        const data = this.particleData[i];
        positions[i * 3 + 1] += data.vy; // Drift upward
        positions[i * 3] += Math.sin(elapsedTime * 0.8 + data.phase) * 0.0025;
        positions[i * 3 + 2] += Math.cos(elapsedTime * 0.8 + data.phase) * 0.0025;

        if (positions[i * 3 + 1] > 4.5) {
          positions[i * 3 + 1] = -4.5;
        }
      }
      this.sparkles.geometry.attributes.position.needsUpdate = true;
    }

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  switchToModel(index) {
    this.panCameraToSection(index);
  }

  resetCamera() {
    this.panCameraToSection(this.activeSectionIndex);
  }
}

/* ─── 10. HYDRODYNAMIC HOVER EFFECTS ON CTA CARDS ──────── */
const initHydrodynamicCards = () => {
  const hasHoverCapability = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!hasHoverCapability) return; // Completely bypass mouse tilt on touch screens to maximize scroll performance

  const cards = document.querySelectorAll('.cta-product-card');
  cards.forEach((card) => {
    let rafId = null;
    let targetX = 0;
    let targetY = 0;
    let cardRect = null;

    const renderTilt = () => {
      if (!cardRect) return;
      card.style.setProperty('--mouse-x', `${targetX}px`);
      card.style.setProperty('--mouse-y', `${targetY}px`);
      const centerX = cardRect.width / 2;
      const centerY = cardRect.height / 2;
      const tiltX = ((targetY - centerY) / centerY) * -5;
      const tiltY = ((targetX - centerX) / centerX) * 5;
      card.style.setProperty('--card-tilt-x', `${tiltX.toFixed(2)}deg`);
      card.style.setProperty('--card-tilt-y', `${tiltY.toFixed(2)}deg`);
      rafId = null;
    };

    card.addEventListener('mouseenter', () => {
      cardRect = card.getBoundingClientRect();
    }, { passive: true });

    card.addEventListener('mousemove', (e) => {
      if (!cardRect) cardRect = card.getBoundingClientRect();
      targetX = e.clientX - cardRect.left;
      targetY = e.clientY - cardRect.top;
      if (!rafId) {
        rafId = requestAnimationFrame(renderTilt);
      }
    }, { passive: true });

    card.addEventListener('mouseleave', () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      cardRect = null;
      card.style.setProperty('--card-tilt-x', '0deg');
      card.style.setProperty('--card-tilt-y', '0deg');
    }, { passive: true });
  });
};

/* ─── 11. PRODUCT DETAILS MODAL DRAWER ─────────────────── */
const initProductDetailsModal = (showcaseInstance) => {
  const modal = document.getElementById('details-modal-overlay');
  const closeBtn = document.getElementById('details-modal-close');
  const jumpBtn = document.getElementById('details-3d-jump-btn');
  const ctaBtns = document.querySelectorAll('.card-cta-btn');

  if (!modal) return;

  const titleEl = document.getElementById('details-modal-title');
  const descEl = document.getElementById('details-modal-desc');
  const imgEl = document.getElementById('details-modal-img');
  const caseEl = document.getElementById('spec-val-case');
  const calibreEl = document.getElementById('spec-val-calibre');
  const reserveEl = document.getElementById('spec-val-reserve');
  const waterEl = document.getElementById('spec-val-water');

  let activeModelIndex = 0;
  const detailsCard = modal.querySelector('.details-modal-card');
  const detailsVisual = modal.querySelector('.details-modal-visual');
  const detailsReserveBtn = modal.querySelector('.details-reserve-btn');

  const openDetails = (watchData, modelIdx) => {
    activeModelIndex = modelIdx !== undefined ? modelIdx : 0;
    window._gtcCurrentDetailsWatch = watchData;

    if (titleEl) titleEl.textContent = watchData.title;
    if (descEl) descEl.textContent = watchData.description;
    if (imgEl) imgEl.src = watchData.image;
    if (caseEl) caseEl.textContent = watchData.case || '39mm Surgical 316L Steel';
    if (calibreEl) calibreEl.textContent = watchData.calibre || 'In-House Calibre GTC-2601';
    if (reserveEl) reserveEl.textContent = watchData.reserve || '68 Hours Autonomy';
    if (waterEl) waterEl.textContent = watchData.water || '10 ATM Water Resistance';

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('data-lenis-prevent', 'true');
    modal.setAttribute('data-lenis-prevent-wheel', 'true');
    modal.setAttribute('data-lenis-prevent-touch', 'true');

    if (detailsCard) {
      detailsCard.setAttribute('data-lenis-prevent', 'true');
      detailsCard.setAttribute('data-lenis-prevent-wheel', 'true');
      detailsCard.setAttribute('data-lenis-prevent-touch', 'true');
      detailsCard.scrollTop = 0;
    }
    document.body.style.overflow = 'hidden';
    window.gtcLenis?.stop();
  };

  const closeDetails = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    window.gtcLenis?.start();
  };

  // Dual-Scroll Support on CTA Details Modal (Mouse Wheel & Scrollbar Drag)
  if (modal && detailsCard) {
    modal.addEventListener('wheel', (e) => {
      e.stopPropagation();
      // If mouse is on backdrop or visual half, forward scroll smoothly to detailsCard
      if (e.target === modal || (detailsVisual && (e.target === detailsVisual || detailsVisual.contains(e.target)))) {
        detailsCard.scrollBy({ top: e.deltaY, behavior: 'auto' });
      }
    }, { passive: true });

    detailsCard.addEventListener('wheel', (e) => {
      e.stopPropagation();
    }, { passive: true });
  }

  // Smooth CTA modal -> Reserve modal handoff
  if (detailsReserveBtn) {
    detailsReserveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentWatch = window._gtcCurrentDetailsWatch || WATCH_COLLECTION_DATA[activeModelIndex];
      closeDetails();
      if (window.openTechnicalDossier) {
        window.openTechnicalDossier(currentWatch);
      }
    });
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.card-cta-btn');
    const card = e.target.closest('.cta-product-card');
    if (!btn && !card) return;
    if (e.target.closest('.admin-delete-watch-btn, .admin-card-edit-btn, input, textarea, .btn-quick-add')) return;

    e.stopPropagation();
    const effectiveBtn = btn || card.querySelector('.card-cta-btn');
    const watchId = effectiveBtn?.getAttribute('data-target-watch-id') || card?.getAttribute('data-watch-id');
    const targetWatch = watchId ? getWatchById(watchId) : null;
    if (targetWatch) {
      window._gtcCurrentDetailsWatch = targetWatch;
      openDetailsModalWithWatch(targetWatch);
      return;
    }
    const targetWatchIdx = parseInt(effectiveBtn?.dataset?.targetWatch || '0', 10);
    const watchData = WATCH_COLLECTION_DATA[targetWatchIdx] || WATCH_COLLECTION_DATA[0];
    openDetails(watchData, targetWatchIdx);
  });

  // Modal quick acquire button
  const modalQuickAddBtn = document.getElementById('details-modal-quick-add');
  if (modalQuickAddBtn) {
    modalQuickAddBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentWatch = window._gtcCurrentDetailsWatch || WATCH_COLLECTION_DATA[activeModelIndex];
      if (currentWatch && window.addToGtcCart) {
        window.addToGtcCart({
          id: currentWatch.id || `gtc-watch-${activeModelIndex}`,
          name: currentWatch.title || currentWatch.name || 'GTC Himalayan Edition',
          ref: currentWatch.ref || 'REF. HIM-GT-2001',
          price: currentWatch.price || '₹2,45,000 INR',
          numericPrice: currentWatch.numericPrice || 245000,
          img: currentWatch.image || currentWatch.img || '/assets/photo/ethos-watch.webp',
        });
        closeDetails();
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeDetails);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeDetails();
  });

  // "Inspect in 3D ↺" button: Scrolls back to 3D showcase & activates that model
  if (jumpBtn) {
    jumpBtn.addEventListener('click', () => {
      closeDetails();
      const showcaseSection = document.getElementById('showcase-3d-section');
      if (showcaseSection) {
        lenis.scrollTo(showcaseSection, {
          offset: 0,
          duration: 1.5,
        });
      }
      if (showcaseInstance) {
        setTimeout(() => {
          showcaseInstance.switchToModel(activeModelIndex);
          showcaseInstance.resetCamera();
        }, 500);
      }
    });
  }
};

/* ─── 12. PROCEDURAL HOROLOGY AUDIO & CINEMATIC PRELOADER ─── */
// Procedural Horology Audio Synthesizer (Web Audio API)
class HorologyAudio {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  // Mechanical escapement watch click
  playTick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(3200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.02);

    filter.type = 'bandpass';
    filter.frequency.value = 2400;

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.02);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.025);
  }
  // Rising energy hum for the gold seam flare
  playCharge() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.45);
  }
  // Deep pneumatic whoosh and vault release
  playVaultOpen() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.9);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.9);
  }
}

const audio = new HorologyAudio();

function initPreloader(onCompleteCallback) {
  const loaderEl = document.getElementById('preloader');

  // If preloader is not on current page (e.g. collection.html), chain immediately
  if (!loaderEl) {
    if (typeof onCompleteCallback === 'function') onCompleteCallback(false);
    return;
  }

  // Check if visitor has already experienced the loading animation in this session
  let hasSeenPreloader = false;
  try {
    hasSeenPreloader = sessionStorage.getItem('gtc_preloader_seen') === 'true';
  } catch (e) {
    hasSeenPreloader = false;
  }

  if (hasSeenPreloader) {
    // Already viewed in this session: remove preloader immediately without replaying
    loaderEl.style.display = 'none';
    loaderEl.style.pointerEvents = 'none';
    if (loaderEl.parentNode) {
      loaderEl.parentNode.removeChild(loaderEl);
    }
    if (typeof onCompleteCallback === 'function') onCompleteCallback(true);
    return;
  }

  // First time in session: mark as seen so future page switches skip the preloader
  try {
    sessionStorage.setItem('gtc_preloader_seen', 'true');
  } catch (e) {}

  const numberEl = document.getElementById('loader-num');
  const progressCircle = document.querySelector('.dial-progress');
  const minuteHand = document.getElementById('dial-hand-minute') || document.querySelector('.dial-hand-minute') || document.querySelector('.dial-hand');
  const hourHand = document.getElementById('dial-hand-hour') || document.querySelector('.dial-hand-hour');
  const seam = document.querySelector('.vault-seam-line');
  const topPanel = document.querySelector('.vault-top');
  const bottomPanel = document.querySelector('.vault-bottom');
  const core = document.querySelector('.preloader-core');
  const soundBtn = document.getElementById('preloader-sound-toggle');
  const soundStatus = document.getElementById('sound-status');
  const statusEl = document.querySelector('.status-indicator');
  const ambientGlow = document.querySelector('.preloader-ambient');

  // Audio Toggle Button
  if (soundBtn) {
    soundBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      audio.enabled = !audio.enabled;
      soundStatus.textContent = audio.enabled ? 'ON' : 'OFF';
      if (audio.enabled) audio.init();
    });
  }

  // Attempt to resume audio context on any early click
  window.addEventListener('click', () => audio.init(), { once: true });

  const counter = { val: 0 };
  const dialRadius = 137.25;
  const circumference = 2 * Math.PI * dialRadius; // ~862.367 for r=137.25
  let lastTick = 0;

  // Set initial hand positions (Hour stick at 11 o'clock [330deg], Big Minute hand at 12 o'clock [0deg])
  if (hourHand) gsap.set(hourHand, { rotation: 330 });
  if (minuteHand) gsap.set(minuteHand, { rotation: 0 });

  const masterTl = gsap.timeline({
    onComplete: () => {
      loaderEl.style.pointerEvents = 'none';
      if (typeof onCompleteCallback === 'function') onCompleteCallback(false);
    }
  });

  // Stage 1: Calibration - Big Minute Hand completes whole 360deg cycle while Hour Stick travels into 12 o'clock alignment
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  masterTl.to(counter, {
    val: 100,
    duration: 0.6,
    ease: "power2.inOut",
    onUpdate: () => {
      const current = Math.floor(counter.val);
      numberEl.textContent = current.toString().padStart(3, '0');
      
      const offset = circumference - (counter.val / 100) * circumference;
      if (progressCircle) gsap.set(progressCircle, { strokeDashoffset: offset });
      
      // Big minute completes whole 360deg cycle
      if (minuteHand) gsap.set(minuteHand, { rotation: (counter.val / 100) * 360 });
      // Hour stick sweeps into 12 o'clock (330deg -> 360deg)
      if (hourHand) gsap.set(hourHand, { rotation: 330 + (counter.val / 100) * 30 });

      // Dynamic Movement Status Updates
      if (statusEl) {
        if (current < 25) {
          statusEl.textContent = "CALIBRATING BALANCE WHEEL";
        } else if (current < 55) {
          statusEl.textContent = "ENGAGING ESCAPEMENT CADENCE";
        } else if (current < 85) {
          statusEl.textContent = "REGULATING HORIZON CALIBRE";
        } else {
          statusEl.textContent = "STRIKING 12 O'CLOCK CHRONOMETER";
        }
      }

      // Trigger a mechanical tick sound every 2%
      if (current - lastTick >= 2) {
        audio.playTick();
        lastTick = current;
      }
    }
  })
  // Stage 2: Mechanical Lock Pulse at 12:00, Gold Seam Expansion & Energy Charge Sound
  .to([minuteHand, hourHand].filter(Boolean), {
    boxShadow: "0 0 18px rgba(201, 168, 76, 1), 0 0 35px rgba(245, 232, 199, 0.9)",
    duration: 0.15,
    ease: "power2.out"
  })
  .to(core, { scale: 1.03, duration: 0.15, ease: "power2.out" }, "<")
  .call(() => audio.playCharge())
  .to(seam, { opacity: 1, scaleX: 1, duration: 0.35, ease: "power3.out" }, "-=0.08")
  .to(core, { scale: 0.92, opacity: 0, duration: 0.35, ease: "power2.in" }, "+=0.02")
  .to(seam, { 
    boxShadow: "0 0 70px 20px rgba(201, 168, 76, 0.95), 0 0 120px 40px rgba(232, 214, 179, 0.7)",
    height: 4,
    duration: 0.2,
    ease: "power1.in"
  })
  // Stage 3: Watch Box Vault Split Open with Pneumatic Cushion Release
  .call(() => audio.playVaultOpen())
  .to(topPanel, { yPercent: -100, duration: 0.4, ease: "expo.inOut" })
  .to(bottomPanel, { yPercent: 100, duration: isMobile ? 0.7 : 0.95, ease: "expo.inOut" }, "<")
  .to(ambientGlow, { opacity: 0, duration: 0.6, ease: "power2.out" }, "<")
  .to(seam, { opacity: 0, duration: 0.25, ease: "power2.out" }, "<0.15")
  .set(loaderEl, { display: 'none' });
}

/* ─── INIT ALL ON DOM READY ────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Luxury Horology Preloader chains into Maison animations
  initPreloader((isSkipped) => {
    initHeroAnimations(isSkipped);
    // Automatically pops up Login after preloader finishes if user is not logged in
    // triggerPostPreloaderAuth(); // Disabled auto login popup in demo mode
  });

  initProductRevealAnimations();
  // initHeritageAnimations();
  initEthosAnimations();
  // initCraftsmanshipAnimations();
  initShowcaseAnimations();
  initNavScroll();
  initMorphingNavigation();
  initModal();
  initAuthModal();
  initAdminStudio();

  // 3D Hybrid Luxury Showcase (Collection Subpage)
  let showcaseInstance = null;
  const webglContainer = document.getElementById('webgl-container');
  if (webglContainer) {
    showcaseInstance = new HybridShowcase3D();
  }

  // Hydrodynamic Cards and Details Modal
  initHydrodynamicCards();
  initProductDetailsModal(showcaseInstance);
});

