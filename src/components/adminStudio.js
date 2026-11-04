/**
 * ═══════════════════════════════════════════════════════════
 * GTC HIMALAYAN · ADMIN MASTER STUDIO & WATCH MANAGEMENT SUITE
 * Haute Horlogerie Manufacture · Surat Atelier (Est. 2026)
 * Three-Image + 3D GLB Timepiece Creation, Card Editing & Vault Control
 * ═══════════════════════════════════════════════════════════
 */

import { supabase } from '../lib/supabaseClient.js';
import { sendBackendEmail } from '../lib/watchApi.js';
import { escapeHtml, sanitizeString, validateImageUpload } from '../utils/security.js';
import './adminStudio.css';

const STORAGE_KEY = 'gtc_master_watches';
const ADMIN_AUTH_KEY = 'gtc_admin_authenticated';

export const EMPTY_IMAGE_PLACEHOLDER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300"><rect width="100%" height="100%" fill="%2312110e"/><circle cx="150" cy="150" r="110" fill="none" stroke="%23c9a84c" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.4"/><circle cx="150" cy="150" r="90" fill="none" stroke="%23c9a84c" stroke-width="1" opacity="0.6"/><circle cx="150" cy="150" r="4" fill="%23c9a84c"/><line x1="150" y1="90" x2="150" y2="150" stroke="%23c9a84c" stroke-width="2" stroke-linecap="round"/><line x1="150" y1="150" x2="195" y2="150" stroke="%23c9a84c" stroke-width="1.5" stroke-linecap="round"/><text x="150" y="210" fill="%23c9a84c" font-family="monospace" font-size="10" letter-spacing="3" text-anchor="middle" opacity="0.8">IMAGE CLEARED</text><text x="150" y="226" fill="%238c8270" font-family="sans-serif" font-size="8" text-anchor="middle">Click Edit to upload</text></svg>`;

// 6 Canonical Genesis & Horizon Timepieces (Demo range: ₹5,000 - ₹7,000)
export const INITIAL_WATCH_CATALOG = [
  {
    id: 'glacial',
    title: 'GLACIAL TWILIGHT',
    subtitle: 'REF. HIM-GT-2601 · ICE BLUE SUNBURST',
    badge: 'LIMITED · 001/300',
    price: '₹5,499',
    collection: 'Horizon 300',
    description: 'Cold-forged 904L steel monobloc architecture crowned with an ice blue sunburst dial, reflecting glacial twilight at extreme altitudes.',
    images: {
      dial: '/assets/photo/ethos-watch.webp',
      profile: '/assets/photo/z1.webp',
      movement: '/assets/photo/gtc-calibre-movement.webp',
    },
    glbPath: '/assets/3d/watch_1.glb',
    specs: {
      case: '41mm Cold-Forged 904L Steel',
      calibre: 'Calibre GTC-2601 In-House Automatic',
      reserve: '68 Hours Autonomous Reserve',
      water: '100 Metres / 10 ATM Chronometer',
      dial: 'Ice Blue Sunburst Finish',
      frequency: '28,800 VPH (4Hz)',
      crystal: 'Double-Domed Sapphire',
      strap: '904L Cold-Forged Jubilee Bracelet',
    },
    isCustom: false,
    modelIndex: 0,
  },
  {
    id: 'mineral',
    title: 'MINERAL SLATE',
    subtitle: 'REF. HIM-MS-2602 · ANTHRACITE FLUTED',
    badge: 'LIMITED · 042/300',
    price: '₹5,999',
    collection: 'Horizon 300',
    description: 'Hand-Anglage & High-Luster Flat Polishing paired with an anthracite fluted dial, reflecting rock-face strata with purity.',
    images: {
      dial: '/assets/photo/ethos-watch-rs.webp',
      profile: '/assets/photo/watch.webp',
      movement: '/assets/photo/gtc-calibre-movement.webp',
    },
    glbPath: '/assets/3d/watch_2.glb',
    specs: {
      case: '41mm Cold-Forged 904L Steel',
      calibre: 'Calibre GTC-2601 In-House Automatic',
      reserve: '68 Hours Autonomous Reserve',
      water: '100 Metres / 10 ATM Chronometer',
      dial: 'Anthracite Fluted Strata',
      frequency: '28,800 VPH (4Hz)',
      crystal: 'Double-Domed Sapphire',
      strap: '904L Cold-Forged Jubilee Bracelet',
    },
    isCustom: false,
    modelIndex: 1,
  },
  {
    id: 'summit',
    title: 'SUMMIT ICE',
    subtitle: 'REF. HIM-SI-2603 · ARCTIC MATTE WHITE',
    badge: 'LIMITED · 089/300',
    price: '₹5,299',
    collection: 'Horizon 300',
    description: 'Arctic matte white dial with circular Côtes de Surat finishing and black mirror-polished screws, built for extreme sub-zero peaks.',
    images: {
      dial: '/assets/photo/gtc-front-watch.webp',
      profile: '/assets/photo/bg1.webp',
      movement: '/assets/photo/gtc-calibre-movement.webp',
    },
    glbPath: '/assets/3d/watch_3.glb',
    specs: {
      case: '41mm Cold-Forged 904L Steel',
      calibre: 'Calibre GTC-2601 In-House Automatic',
      reserve: '68 Hours Autonomous Reserve',
      water: '100 Metres / 10 ATM Chronometer',
      dial: 'Arctic Matte White Finish',
      frequency: '28,800 VPH (4Hz)',
      crystal: 'Double-Domed Sapphire',
      strap: '904L Cold-Forged Jubilee Bracelet',
    },
    isCustom: false,
    modelIndex: 2,
  },
  {
    id: 'himalayan',
    title: 'HIMALAYAN HORIZON',
    subtitle: 'REF. R 39 SC AT HIMALAYAN (GD)',
    badge: 'MAISON PIECE · 001/300',
    price: '₹6,499',
    collection: 'Genesis Atelier',
    description: 'CNC micro-milled contours mimicking the 8,000m peaks, encased in 316L surgical steel with 22K gold rotor.',
    images: {
      dial: '/assets/photo/z1.webp',
      profile: '/assets/photo/ethos-watch.webp',
      movement: '/assets/photo/gtc-calibre-movement.webp',
    },
    glbPath: '/assets/3d/watch_1.glb',
    specs: {
      case: '39mm Surgical 316L Steel',
      calibre: 'Calibre GTC-2601 In-House Automatic',
      reserve: '68 Hours Autonomous Reserve',
      water: '100 Metres / 10 ATM Chronometer',
      dial: 'Golden Topographic Relief',
      frequency: '28,800 VPH (4Hz)',
      crystal: 'Double-Domed Sapphire',
      strap: 'Surat Hand-Brushed Steel',
    },
    isCustom: false,
    modelIndex: 0,
  },
  {
    id: 'himalayan-rs',
    title: 'HIMALAYAN RS',
    subtitle: 'REF. V 32 SC AT FO SMURFETTE (RS)',
    badge: 'NUMERÉE · 014/300',
    price: '₹6,299',
    collection: 'Genesis Atelier',
    description: 'A refined horological edition featuring perlage finishing, Côtes de Genève bridges, and subtle warmth.',
    images: {
      dial: '/assets/photo/watch.webp',
      profile: '/assets/photo/ethos-watch-rs.webp',
      movement: '/assets/photo/gtc-calibre-movement.webp',
    },
    glbPath: '/assets/3d/watch_2.glb',
    specs: {
      case: '39mm Surgical 316L Steel',
      calibre: 'Calibre GTC-2601 In-House Automatic',
      reserve: '68 Hours Autonomous Reserve',
      water: '100 Metres / 10 ATM Chronometer',
      dial: 'Antique Champagne Sunray',
      frequency: '28,800 VPH (4Hz)',
      crystal: 'Sapphire Exhibition Caseback',
      strap: 'Hand-Stitched Italian Leather',
    },
    isCustom: false,
    modelIndex: 1,
  },
  {
    id: 'nocturne',
    title: 'NOCTURNE SUMMIT',
    subtitle: 'REF. HIM-NS-2606 · CYAN NOCTURNE',
    badge: 'EXCLUSIF · 007/300',
    price: '₹6,999',
    collection: 'Horizon Exclusif',
    description: 'Diamond-faceted markers charged with high-intensity cyan Swiss lume for extraordinary alpine darkness visibility.',
    images: {
      dial: '/assets/photo/bg1.webp',
      profile: '/assets/photo/gtc-lume-night.webp',
      movement: '/assets/photo/gtc-calibre-movement.webp',
    },
    glbPath: '/assets/3d/watch_3.glb',
    specs: {
      case: '39mm Cold-Forged 904L Steel',
      calibre: 'Calibre GTC-2601 In-House Automatic',
      reserve: '68 Hours Autonomous Reserve',
      water: '15,000 Gauss Defended',
      dial: 'Cyan Grade X1 Super-LumiNova',
      frequency: '28,800 VPH (4Hz)',
      crystal: 'Double-Domed Sapphire',
      strap: 'Integrated Night Jubilee',
    },
    isCustom: false,
    modelIndex: 2,
  },
];

// Preset Asset Collections for Rapid Creation
export const PRESET_IMAGES = [
  { label: 'Glacial Ice Blue', path: '/assets/photo/ethos-watch.webp' },
  { label: 'Topographic Gold', path: '/assets/photo/z1.webp' },
  { label: 'Mineral Slate', path: '/assets/photo/ethos-watch-rs.webp' },
  { label: 'Champagne Sunray', path: '/assets/photo/watch.webp' },
  { label: 'Front Chassis Steel', path: '/assets/photo/gtc-front-watch.webp' },
  { label: 'Nocturne Lume Dial', path: '/assets/photo/bg1.webp' },
  { label: 'Calibre GTC Movement', path: '/assets/photo/gtc-calibre-movement.webp' },
  { label: 'Swiss Lume Night View', path: '/assets/photo/gtc-lume-night.webp' },
  { label: 'Expedition Field Watch', path: '/assets/photo/gtc-lume-night.webp' },
  { label: 'Heritage Horology Archive', path: '/assets/photo/ethos-watch-rs.webp' },
];

export const PRESET_GLB_MODELS = [
  { label: 'GTC Calibre 01 (/assets/3d/watch_1.glb)', path: '/assets/3d/watch_1.glb' },
  { label: 'GTC Calibre 02 (/assets/3d/watch_2.glb)', path: '/assets/3d/watch_2.glb' },
  { label: 'GTC Calibre 03 (/assets/3d/watch_3.glb)', path: '/assets/3d/watch_3.glb' },
  { label: 'Rolex Datejust 41mm (/assets/3d/rolex_datejust.glb)', path: '/assets/3d/rolex_datejust.glb' },
  { label: 'Seiko Heritage Artisan (/assets/3d/seiko_watch.glb)', path: '/assets/3d/seiko_watch.glb' },
  { label: 'Tissot T-Race MotoGP (/assets/3d/watch_tissot_t-race_motogp_limited_edition_sdc.glb)', path: '/assets/3d/watch_tissot_t-race_motogp_limited_edition_sdc.glb' },
];

// ═══════════════════════════════════════════════════════════
// CATALOG STORE ENGINE
// ═══════════════════════════════════════════════════════════

export function getAllWatches() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Enforce demo price range (₹5,000 - ₹7,000); if old luxury prices exist, reset to updated catalog
        const hasOldPrices = parsed.some((w) => {
          const num = parseInt(String(w.price || '').replace(/[^0-9]/g, ''), 10);
          return num > 10000;
        });
        if (!hasOldPrices) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('[AdminStudio] Error reading localStorage:', e.message);
  }
  // Initialize default seed
  saveAllWatches(INITIAL_WATCH_CATALOG);
  return INITIAL_WATCH_CATALOG;
}

export function saveAllWatches(watches) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watches));
    window.dispatchEvent(new CustomEvent('gtc:watches-updated', { detail: { watches } }));
  } catch (e) {
    console.warn('[AdminStudio] Error saving to localStorage:', e.message);
  }
}

export function getWatchById(id) {
  const all = getAllWatches();
  return all.find((w) => w.id === id) || null;
}

export function saveOrUpdateWatch(watchData) {
  const all = getAllWatches();
  const existingIdx = all.findIndex((w) => w.id === watchData.id);

  let updatedList;
  if (existingIdx !== -1) {
    all[existingIdx] = {
      ...all[existingIdx],
      ...watchData,
      updatedAt: new Date().toISOString(),
    };
    updatedList = all;
  } else {
    const newWatch = {
      ...watchData,
      id: watchData.id || `gtc-watch-${Date.now()}`,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updatedList = [newWatch, ...all];
  }

  saveAllWatches(updatedList);
  syncPageWithWatches();

  // Notify co-owners via background email
  try {
    sendBackendEmail({
      type: 'watch_inquiry_booking',
      customerName: 'GTC Admin Studio',
      customerEmail: 'gujarattimecompany@gmail.com',
      watchName: watchData.title,
      watchRef: watchData.subtitle,
      watchPrice: watchData.price,
      actionType: existingIdx !== -1 ? 'CATALOG_UPDATE' : 'NEW_TIMEPIECE_LISTED',
      notes: `Admin has ${existingIdx !== -1 ? 'updated specifications for' : 'listed a new timepiece'}: ${watchData.title} (${watchData.subtitle}) with 3 images & 3D GLB model ${watchData.glbPath}.`,
    }).catch(() => {});
  } catch (_) {}

  return watchData;
}

export function deleteWatch(id) {
  const all = getAllWatches();
  const filtered = all.filter((w) => w.id !== id);
  saveAllWatches(filtered);
  syncPageWithWatches();
  showToast(`Timepiece removed from Maison catalog.`, 'success');
}

export function deleteWatchImage(watchId, slotTarget = 'dial') {
  const all = getAllWatches();
  const watch = all.find((w) => w.id === watchId);
  if (!watch) return false;

  if (!watch.images) watch.images = {};

  if (slotTarget === 'dial' || slotTarget === 'front' || slotTarget === 'all') {
    watch.images.dial = '';
    watch.images.front = '';
    watch.image = '';
    watch.imageDeleted = true;
  }
  if (slotTarget === 'profile' || slotTarget === 'all') {
    watch.images.profile = '';
  }
  if (slotTarget === 'movement' || slotTarget === 'all') {
    watch.images.movement = '';
  }

  watch.isCustom = true;
  watch.updatedAt = new Date().toISOString();
  saveOrUpdateWatch(watch);
  syncPageWithWatches();
  showToast(`Image deleted successfully for "${watch.title}".`, 'success');
  return true;
}

// ═══════════════════════════════════════════════════════════
// AUTHENTICATION CHECK
// ═══════════════════════════════════════════════════════════

export function isAdminLoggedIn() {
  if (typeof sessionStorage === 'undefined') return false;
  try {
    const auth = sessionStorage.getItem(ADMIN_AUTH_KEY);
    if (!auth) return false;
    const parsed = JSON.parse(auth);
    return Boolean(parsed && (parsed.role === 'admin' || parsed.email));
  } catch (e) {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// DOM INJECTION & REAL-TIME CARD SYNC
// ═══════════════════════════════════════════════════════════

export function syncPageWithWatches() {
  const watches = getAllWatches();
  const isAdmin = isAdminLoggedIn();
  const grid = document.getElementById('cta-cards-grid');

  if (grid) {
    // 1. Update existing canonical cards
    watches.forEach((watch, idx) => {
      let card = grid.querySelector(`[data-watch-id="${watch.id}"]`);

      // If card doesn't exist, create it dynamically
      if (!card) {
        card = document.createElement('article');
        card.className = 'cta-product-card';
        card.setAttribute('data-watch-id', watch.id);
        card.setAttribute('data-model-index', String(watch.modelIndex || (idx % 3)));
        grid.appendChild(card);
      }

      const hasDialImg = Boolean(
        !watch.imageDeleted &&
        (watch.images?.dial || (!watch.isCustom && (watch.images?.front || watch.image)))
      );
      const dialImgSrc = hasDialImg ? (watch.images?.dial || watch.images?.front || watch.image) : '';

      card.innerHTML = `
        <div class="card-fluid-ripple"></div>
        <div class="card-edition-badge">${escapeHtml(watch.badge || 'GENESIS · NUMERÉE')}</div>
        <div class="card-image-wrap ${!hasDialImg ? 'has-no-image' : ''}">
          ${hasDialImg ? `
            <img src="${escapeHtml(dialImgSrc)}" alt="GTC ${escapeHtml(watch.title)}" class="card-watch-img" loading="lazy" />
            <div class="card-image-shadow"></div>
          ` : `
            <div class="card-empty-image-placeholder">
              <svg class="empty-placeholder-svg" viewBox="0 0 64 64" fill="none" stroke="currentColor">
                <circle cx="32" cy="32" r="26" stroke-width="1.5" stroke-dasharray="3 3"/>
                <circle cx="32" cy="32" r="18" stroke-width="1.2"/>
                <line x1="32" y1="18" x2="32" y2="32" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="32" y1="32" x2="42" y2="32" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="32" cy="32" r="3" fill="currentColor"/>
              </svg>
              <span class="empty-placeholder-label">IMAGE CLEARED</span>
              <span class="empty-placeholder-hint">Admin: Click Edit to upload asset</span>
            </div>
          `}
        </div>
        <div class="card-content">
          <span class="card-subtitle">${escapeHtml(watch.subtitle || 'IN-HOUSE CALIBRE GTC-2601')}</span>
          <h3 class="card-title">${escapeHtml(watch.title)}</h3>
          <p class="card-desc">${escapeHtml(watch.description || '')}</p>
          <div class="card-meta">
            <span>${escapeHtml(watch.specs?.case?.split(' ')[0] || '41mm')}</span>
            <span>·</span>
            <span>${escapeHtml(watch.specs?.reserve?.split(' ')[0] || '68h')} Reserve</span>
            <span>·</span>
            <span>${escapeHtml(watch.price || 'Allocation Only')}</span>
          </div>
          <button class="card-cta-btn" data-target-watch-id="${escapeHtml(watch.id)}">
            <span>VIEW DETAILS</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      `;

      // Inject Admin Toolbar on Card (Edit + Delete Image)
      if (isAdmin) {
        const toolbar = document.createElement('div');
        toolbar.className = 'gtc-card-admin-toolbar';
        toolbar.innerHTML = `
          <button type="button" class="gtc-card-edit-btn" data-action="edit-watch" title="Edit specifications & images">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>EDIT</span>
          </button>
          ${hasDialImg ? `
            <button type="button" class="gtc-card-delete-img-btn" data-action="delete-card-image" title="Delete existing image for this CTA card">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>DELETE IMAGE</span>
            </button>
          ` : ''}
        `;

        const editBtn = toolbar.querySelector('.gtc-card-edit-btn');
        editBtn?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openWatchEditor(watch.id);
        });

        const deleteImgBtn = toolbar.querySelector('.gtc-card-delete-img-btn');
        deleteImgBtn?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (confirm(`Confirm deletion of existing image for "${watch.title}"? This will clear the card visual.`)) {
            deleteWatchImage(watch.id, 'dial');
          }
        });

        card.appendChild(toolbar);
      }

      // Re-attach view details listener
      const viewBtn = card.querySelector('.card-cta-btn');
      if (viewBtn) {
        viewBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openDetailsModalWithWatch(watch);
        });
      }
    });

    // 2. Remove obsolete cards that are not in catalog
    const cardElements = grid.querySelectorAll('.cta-product-card');
    cardElements.forEach((cardEl) => {
      const id = cardEl.getAttribute('data-watch-id');
      if (id && !watches.some((w) => w.id === id)) {
        cardEl.remove();
      }
    });

    // 3. Add "+ LIST NEW TIMEPIECE" card inside Grid if admin
    const existingAddCard = grid.querySelector('.cta-add-watch-card');
    if (isAdmin && !existingAddCard) {
      const addCard = document.createElement('article');
      addCard.className = 'cta-product-card cta-add-watch-card';
      addCard.innerHTML = `
        <div class="add-watch-plus-icon">+</div>
        <h3 class="add-watch-title">LIST NEW TIMEPIECE</h3>
        <p class="add-watch-subtitle">Upload 3 bespoke images, 3D GLB model, and custom horological specifications.</p>
        <span class="dock-btn dock-btn-primary" style="margin-top:16px;">+ Open Studio Lister</span>
      `;
      addCard.addEventListener('click', () => {
        openAdminStudio('add');
      });
      grid.appendChild(addCard);
    } else if (!isAdmin && existingAddCard) {
      existingAddCard.remove();
    }
  }

  // Floating dock presence
  renderFloatingAdminDock(isAdmin);
}

// ═══════════════════════════════════════════════════════════
// DETAILS MODAL 3-IMAGE ENHANCEMENT
// ═══════════════════════════════════════════════════════════

export function openDetailsModalWithWatch(watch) {
  const modal = document.getElementById('details-modal-overlay');
  if (!modal) return;

  const titleEl = document.getElementById('details-modal-title');
  const descEl = document.getElementById('details-modal-desc');
  const visualContainer = modal.querySelector('.details-modal-visual');
  const caseEl = document.getElementById('spec-val-case');
  const calibreEl = document.getElementById('spec-val-calibre');
  const reserveEl = document.getElementById('spec-val-reserve');
  const waterEl = document.getElementById('spec-val-water');
  const eyebrowEl = document.getElementById('details-modal-eyebrow');

  if (titleEl) titleEl.textContent = watch.title;
  if (descEl) descEl.textContent = watch.description || '';
  if (eyebrowEl) eyebrowEl.textContent = `${watch.collection?.toUpperCase() || 'HIMALAYAN COLLECTION'} · ${watch.price || 'Allocation'}`;
  if (caseEl) caseEl.textContent = watch.specs?.case || '41mm Cold-Forged 904L Steel';
  if (calibreEl) calibreEl.textContent = watch.specs?.calibre || 'In-House Calibre GTC-2601';
  if (reserveEl) reserveEl.textContent = watch.specs?.reserve || '68 Hours Autonomy';
  if (waterEl) waterEl.textContent = watch.specs?.water || '100 Metres / 10 ATM';

  // Render 3-Image Tabbed Carousel inside modal visual
  if (visualContainer) {
    const hasDial = Boolean(!watch.imageDeleted && (watch.images?.dial || watch.images?.front || watch.image));
    const dialImg = hasDial ? (watch.images?.dial || watch.images?.front || watch.image) : EMPTY_IMAGE_PLACEHOLDER_SVG;
    const profileImg = watch.images?.profile || dialImg;
    const movementImg = watch.images?.movement || '/assets/photo/gtc-calibre-movement.webp';

    visualContainer.innerHTML = `
      <div class="details-images-carousel">
        <div class="details-image-view">
          <img id="details-carousel-display" src="${dialImg}" alt="${watch.title}" />
        </div>
        <div class="details-image-tabs">
          <button type="button" class="image-view-tab active" data-img-src="${dialImg}">✦ Dial View</button>
          <button type="button" class="image-view-tab" data-img-src="${profileImg}">⟲ Profile View</button>
          <button type="button" class="image-view-tab" data-img-src="${movementImg}">⚙ Movement View</button>
        </div>
      </div>
    `;

    const displayImg = document.getElementById('details-carousel-display');
    const tabs = visualContainer.querySelectorAll('.image-view-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        e.stopPropagation();
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        if (displayImg) displayImg.src = tab.dataset.imgSrc;
      });
    });
  }

  // If Admin, inject direct Edit button inside Details Modal Actions
  const actionsContainer = modal.querySelector('.details-modal-actions');
  if (actionsContainer) {
    let editBtn = actionsContainer.querySelector('#details-admin-edit-btn');
    if (isAdminLoggedIn()) {
      if (!editBtn) {
        editBtn = document.createElement('button');
        editBtn.id = 'details-admin-edit-btn';
        editBtn.className = 'dock-btn dock-btn-primary';
        editBtn.style.padding = '12px 20px';
        editBtn.style.borderRadius = '8px';
        editBtn.innerHTML = `✎ Edit Specifications`;
        actionsContainer.prepend(editBtn);
      }
      editBtn.onclick = (e) => {
        e.stopPropagation();
        modal.classList.remove('active');
        document.body.style.overflow = '';
        openWatchEditor(watch.id);
      };
    } else if (editBtn) {
      editBtn.remove();
    }
  }

  window._gtcCurrentDetailsWatch = watch;

  modal.setAttribute('data-lenis-prevent', 'true');
  modal.setAttribute('data-lenis-prevent-wheel', 'true');
  modal.setAttribute('data-lenis-prevent-touch', 'true');
  const modalCard = modal.querySelector('.details-modal-card');
  if (modalCard) {
    modalCard.setAttribute('data-lenis-prevent', 'true');
    modalCard.setAttribute('data-lenis-prevent-wheel', 'true');
    modalCard.setAttribute('data-lenis-prevent-touch', 'true');
    modalCard.scrollTop = 0;
  }

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  window.gtcLenis?.stop();

  const detailsCloseBtn = document.getElementById('details-modal-close');
  const handleModalClose = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    window.gtcLenis?.start();
  };
  if (detailsCloseBtn) detailsCloseBtn.onclick = handleModalClose;
  modal.onclick = (e) => {
    if (e.target === modal) handleModalClose();
  };

  const reserveBtn = modal.querySelector('.details-reserve-btn');
  if (reserveBtn) {
    reserveBtn.onclick = (e) => {
      e.stopPropagation();
      handleModalClose();
      if (window.openTechnicalDossier) {
        window.openTechnicalDossier(watch);
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════
// FLOATING DOCK INJECTION
// ═══════════════════════════════════════════════════════════

function renderFloatingAdminDock(isAdmin) {
  let dock = document.getElementById('gtc-admin-floating-dock');
  if (!isAdmin) {
    if (dock) dock.remove();
    return;
  }

  if (!dock) {
    dock = document.createElement('div');
    dock.id = 'gtc-admin-floating-dock';
    dock.className = 'gtc-admin-dock';
    document.body.appendChild(dock);
  }

  dock.innerHTML = `
    <div class="dock-badge" id="btn-dock-open-studio" title="Open GTC Admin Studio">
      <span class="dock-pulse-dot"></span>
      <span class="dock-title">❖ ADMIN VAULT</span>
    </div>
    <button type="button" class="dock-btn dock-btn-primary" id="btn-dock-add-watch" title="List New Timepiece">
      + New Watch
    </button>
    <button type="button" class="dock-btn" id="btn-dock-inquiries" title="View Collector Reservations">
      📋 Inquiries
    </button>
    <button type="button" class="dock-btn" id="btn-dock-studio-full" title="Open Full Studio">
      ⚡ Studio
    </button>
  `;

  document.getElementById('btn-dock-open-studio')?.addEventListener('click', () => openAdminStudio('inventory'));
  document.getElementById('btn-dock-studio-full')?.addEventListener('click', () => openAdminStudio('inventory'));
  document.getElementById('btn-dock-add-watch')?.addEventListener('click', () => openAdminStudio('add'));
  document.getElementById('btn-dock-inquiries')?.addEventListener('click', () => openAdminStudio('inquiries'));
}

// ═══════════════════════════════════════════════════════════
// GTC ADMIN STUDIO MASTER MODAL
// ═══════════════════════════════════════════════════════════

export function openAdminStudio(defaultTab = 'inventory') {
  ensureStudioModalDOM();
  const modal = document.getElementById('gtc-admin-studio-modal');
  if (!modal) return;

  modal.setAttribute('data-lenis-prevent', 'true');
  const dialog = modal.querySelector('.gtc-admin-dialog');
  if (dialog) dialog.setAttribute('data-lenis-prevent', 'true');
  const dialogBody = modal.querySelector('.dialog-body');
  if (dialogBody) dialogBody.setAttribute('data-lenis-prevent', 'true');

  switchStudioTab(defaultTab);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  window.gtcLenis?.stop();
}

export function closeAdminStudio() {
  const modal = document.getElementById('gtc-admin-studio-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    window.gtcLenis?.start();
  }
}

function ensureStudioModalDOM() {
  if (document.getElementById('gtc-admin-studio-modal')) return;

  const html = `
    <div id="gtc-admin-studio-modal" class="gtc-admin-modal-overlay" aria-hidden="true">
      <div class="gtc-admin-dialog" role="dialog" aria-labelledby="studio-title">
        
        <!-- Header -->
        <div class="dialog-header">
          <div class="dialog-header-left">
            <span class="dialog-eyebrow">❖ MAISON GUJARAT TIME COMPANY · SURAT ATELIER</span>
            <h2 class="dialog-title" id="studio-title">ADMIN MASTER STUDIO &amp; CATALOG VAULT</h2>
          </div>
          <button type="button" class="dialog-close-btn" id="studio-close-btn" aria-label="Close Studio">✕</button>
        </div>

        <!-- Navigation Tabs -->
        <div class="dialog-tabs-bar">
          <button type="button" class="dialog-tab-btn active" data-tab="inventory">1. Timepiece Catalog</button>
          <button type="button" class="dialog-tab-btn" data-tab="add">+ 2. List New Timepiece</button>
          <button type="button" class="dialog-tab-btn" data-tab="inquiries">3. Collector Bookings &amp; Inquiries</button>
          <button type="button" class="dialog-tab-btn" data-tab="security">4. Co-Owner Quorum Audit</button>
        </div>

        <!-- Body -->
        <div class="dialog-body">
          <!-- Tab 1: Inventory -->
          <div id="tab-content-inventory" class="studio-tab-content">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
              <p style="color:#b8aa91; margin:0; font-family:'DM Mono',monospace; font-size:0.75rem;">
                Showing all active timepieces in the Maison catalog. Edit specifications, 3D GLB models, or prices.
              </p>
              <button type="button" class="dock-btn dock-btn-primary" id="btn-studio-header-add">+ List New Watch</button>
            </div>
            <div class="inventory-grid" id="studio-inventory-grid"></div>
          </div>

          <!-- Tab 2: Add New Timepiece -->
          <div id="tab-content-add" class="studio-tab-content" style="display:none;">
            <form id="studio-add-watch-form" class="timepiece-form">
              <!-- Form rendered dynamically -->
            </form>
          </div>

          <!-- Tab 3: Collector Inquiries -->
          <div id="tab-content-inquiries" class="studio-tab-content" style="display:none;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 style="color:#ffffff; font-family:'Cinzel',serif; font-size:1.1rem; margin:0;">Active Client Reservations</h3>
              <button type="button" class="dock-btn" id="btn-refresh-inquiries">↻ Refresh Table</button>
            </div>
            <div id="studio-inquiries-table-container">
              <p style="color:#b8aa91; font-family:'DM Mono',monospace; font-size:0.8rem;">Loading reservations from Supabase...</p>
            </div>
          </div>

          <!-- Tab 4: Security Quorum Audit -->
          <div id="tab-content-security" class="studio-tab-content" style="display:none;">
            <div style="background:#141310; border:1px solid rgba(201,168,76,0.3); border-radius:12px; padding:24px;">
              <h3 style="color:#C9A84C; font-family:'Cinzel',serif; margin-top:0;">3-Co-Owner Cryptographic Quorum System</h3>
              <p style="color:#b8aa91; font-family:'DM Mono',monospace; font-size:0.8rem; line-height:1.6;">
                The Maison Gujarat Time Company administrative interface is defended by a 90-second tripartite consensus protocol. Any change to timepiece pricing, 3D GLB assets, or new inventory triggers cryptographic cross-mail notifications.
              </p>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:14px; margin-top:18px;">
                <div style="padding:14px; background:#0b0b0b; border:1px solid #C9A84C; border-radius:8px;">
                  <span style="color:#C9A84C; font-size:0.65rem; font-family:'DM Mono',monospace;">CO-OWNER 01</span>
                  <p style="color:#ffffff; font-weight:bold; margin:6px 0 0; font-family:'DM Mono',monospace; font-size:0.8rem;">gujarattimecompany@gmail.com</p>
                </div>
                <div style="padding:14px; background:#0b0b0b; border:1px solid #C9A84C; border-radius:8px;">
                  <span style="color:#C9A84C; font-size:0.65rem; font-family:'DM Mono',monospace;">CO-OWNER 02</span>
                  <p style="color:#ffffff; font-weight:bold; margin:6px 0 0; font-family:'DM Mono',monospace; font-size:0.8rem;">parthsherathiya181@gmail.com</p>
                </div>
                <div style="padding:14px; background:#0b0b0b; border:1px solid #C9A84C; border-radius:8px;">
                  <span style="color:#C9A84C; font-size:0.65rem; font-family:'DM Mono',monospace;">CO-OWNER 03</span>
                  <p style="color:#ffffff; font-weight:bold; margin:6px 0 0; font-family:'DM Mono',monospace; font-size:0.8rem;">ramoliadk@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);

  // Close triggers
  document.getElementById('studio-close-btn')?.addEventListener('click', closeAdminStudio);
  document.getElementById('gtc-admin-studio-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'gtc-admin-studio-modal') closeAdminStudio();
  });

  // Tab switching
  const tabs = document.querySelectorAll('#gtc-admin-studio-modal .dialog-tab-btn');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      switchStudioTab(tab.dataset.tab);
    });
  });

  document.getElementById('btn-studio-header-add')?.addEventListener('click', () => switchStudioTab('add'));
  document.getElementById('btn-refresh-inquiries')?.addEventListener('click', loadInquiriesTab);
}

function switchStudioTab(tabId) {
  const modal = document.getElementById('gtc-admin-studio-modal');
  if (!modal) return;

  const tabs = modal.querySelectorAll('.dialog-tab-btn');
  tabs.forEach((t) => {
    if (t.dataset.tab === tabId) t.classList.add('active');
    else t.classList.remove('active');
  });

  const contents = ['inventory', 'add', 'inquiries', 'security'];
  contents.forEach((c) => {
    const el = document.getElementById(`tab-content-${c}`);
    if (el) el.style.display = c === tabId ? 'block' : 'none';
  });

  if (tabId === 'inventory') renderStudioInventory();
  if (tabId === 'add') renderWatchForm('studio-add-watch-form', null);
  if (tabId === 'inquiries') loadInquiriesTab();
}

function renderStudioInventory() {
  const container = document.getElementById('studio-inventory-grid');
  if (!container) return;

  const watches = getAllWatches();
  container.innerHTML = watches
    .map((w) => {
      const hasImg = Boolean(!w.imageDeleted && (w.images?.dial || (!w.isCustom && (w.images?.front || w.image))));
      const thumbSrc = hasImg ? (w.images?.dial || w.images?.front || w.image) : EMPTY_IMAGE_PLACEHOLDER_SVG;

      return `
      <div class="inventory-card">
        <div class="inventory-card-top">
          <span class="inventory-badge">${w.badge || 'GENESIS'}</span>
          <img src="${thumbSrc}" alt="${w.title}" class="inventory-thumb" />
          <span class="inventory-price">${w.price || 'Allocation'}</span>
        </div>
        <div class="inventory-card-content">
          <h4 class="inventory-card-title">${w.title}</h4>
          <span class="inventory-card-sub">${w.subtitle || ''}</span>
          <div class="inventory-specs-pill">
            <span class="spec-pill">${w.specs?.case?.split(' ')[0] || '41mm'}</span>
            <span class="spec-pill">${w.specs?.reserve || '68h'}</span>
            <span class="spec-pill">${w.glbPath ? '3D Active' : 'No 3D'}</span>
          </div>
          <div class="inventory-actions">
            <button type="button" class="inventory-btn inventory-btn-edit" data-edit-id="${w.id}">✎ Edit Watch</button>
            ${hasImg ? `<button type="button" class="inventory-btn inventory-btn-clear-img" data-clear-img-id="${w.id}" title="Delete existing image">🗑 Delete Image</button>` : ''}
            ${w.isCustom ? `<button type="button" class="inventory-btn inventory-btn-delete" data-del-id="${w.id}">✕ Remove</button>` : ''}
          </div>
        </div>
      </div>
    `;
    })
    .join('');

  container.querySelectorAll('[data-edit-id]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openWatchEditor(btn.dataset.editId);
    });
  });

  container.querySelectorAll('[data-clear-img-id]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.clearImgId;
      const targetWatch = getWatchById(id);
      if (confirm(`Confirm deletion of existing image for "${targetWatch?.title || 'timepiece'}"?`)) {
        deleteWatchImage(id, 'dial');
        renderStudioInventory();
      }
    });
  });

  container.querySelectorAll('[data-del-id]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to remove this timepiece from the Maison catalog?')) {
        deleteWatch(btn.dataset.delId);
        renderStudioInventory();
      }
    });
  });
}

async function loadInquiriesTab() {
  const container = document.getElementById('studio-inquiries-table-container');
  if (!container) return;

  container.innerHTML = '<p style="color:#C9A84C; font-family:\'DM Mono\',monospace; font-size:0.8rem;">Querying database reservations...</p>';

  try {
    const { data, error } = await supabase
      .from('reservations_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data || data.length === 0) {
      container.innerHTML = `
        <div style="background:#141310; border:1px dashed rgba(201,168,76,0.3); border-radius:10px; padding:24px; text-align:center;">
          <p style="color:#E8D6B3; margin:0 0 6px; font-family:'Cinzel',serif;">No Reservations Found in Database Table</p>
          <p style="color:#8c8270; font-size:0.75rem; font-family:'DM Mono',monospace; margin:0;">
            When collectors click "Reserve Piece" on any watch card, their allocation requests and contact details will appear here live.
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-family:'DM Mono',monospace; font-size:0.75rem; text-align:left;">
          <thead>
            <tr style="border-bottom:1.5px solid #C9A84C; color:#C9A84C;">
              <th style="padding:10px;">Collector Name</th>
              <th style="padding:10px;">Email</th>
              <th style="padding:10px;">Phone</th>
              <th style="padding:10px;">Watch Model</th>
              <th style="padding:10px;">Status</th>
              <th style="padding:10px;">Created</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (row) => `
              <tr style="border-bottom:1px solid rgba(201,168,76,0.15); color:#ffffff;">
                <td style="padding:10px; font-weight:bold;">${escapeHtml((row.customer_first_name || '') + ' ' + (row.customer_last_name || ''))}</td>
                <td style="padding:10px; color:#60a5fa;">${escapeHtml(row.customer_email || '—')}</td>
                <td style="padding:10px;">${escapeHtml(row.customer_phone || '—')}</td>
                <td style="padding:10px; color:#C9A84C;">${escapeHtml(row.watch_name || 'GTC Himalayan')}</td>
                <td style="padding:10px;"><span style="background:rgba(74,222,128,0.15); color:#4ade80; padding:2px 8px; border-radius:10px;">${escapeHtml(row.payment_status || 'PENDING')}</span></td>
                <td style="padding:10px; color:#8c8270;">${escapeHtml(new Date(row.created_at).toLocaleDateString())}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p style="color:#f87171; font-family:'DM Mono',monospace;">Notice loading reservations. Please try again.</p>`;
  }
}

// ═══════════════════════════════════════════════════════════
// TIMEPIECE EDITOR MODAL (DIRECT FROM CARD OR STUDIO)
// ═══════════════════════════════════════════════════════════

export function openWatchEditor(watchId) {
  ensureEditorModalDOM();
  const watch = getWatchById(watchId);
  if (!watch) {
    showToast(`Timepiece not found in catalog.`, 'error');
    return;
  }

  const modal = document.getElementById('gtc-watch-edit-modal');
  if (!modal) return;

  modal.setAttribute('data-lenis-prevent', 'true');
  const dialog = modal.querySelector('.gtc-admin-dialog');
  if (dialog) dialog.setAttribute('data-lenis-prevent', 'true');
  const dialogBody = modal.querySelector('.dialog-body');
  if (dialogBody) dialogBody.setAttribute('data-lenis-prevent', 'true');

  renderWatchForm('modal-edit-watch-form', watch);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  window.gtcLenis?.stop();
}

export function closeWatchEditor() {
  const modal = document.getElementById('gtc-watch-edit-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    window.gtcLenis?.start();
  }
}

function ensureEditorModalDOM() {
  if (document.getElementById('gtc-watch-edit-modal')) return;

  const html = `
    <div id="gtc-watch-edit-modal" class="gtc-admin-modal-overlay" aria-hidden="true">
      <div class="gtc-admin-dialog" role="dialog" aria-labelledby="editor-title">
        
        <div class="dialog-header">
          <div class="dialog-header-left">
            <span class="dialog-eyebrow">❖ MAISON GUJARAT TIME COMPANY · TIMEPIECE EDITOR</span>
            <h2 class="dialog-title" id="editor-title">EDIT TIMEPIECE SPECIFICATIONS</h2>
          </div>
          <button type="button" class="dialog-close-btn" id="editor-close-btn" aria-label="Close Editor">✕</button>
        </div>

        <div class="dialog-body">
          <form id="modal-edit-watch-form" class="timepiece-form">
            <!-- Form populated dynamically -->
          </form>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);

  document.getElementById('editor-close-btn')?.addEventListener('click', closeWatchEditor);
  document.getElementById('gtc-watch-edit-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'gtc-watch-edit-modal') closeWatchEditor();
  });
}

// ═══════════════════════════════════════════════════════════
// REUSABLE TIMEPIECE FORM GENERATOR (3 IMAGES + 3D GLB)
// ═══════════════════════════════════════════════════════════

function renderWatchForm(formId, watch = null) {
  const form = document.getElementById(formId);
  if (!form) return;

  const isEdit = Boolean(watch);
  const data = watch || {
    id: `gtc-custom-${Date.now()}`,
    title: '',
    subtitle: '',
    badge: 'LIMITED · 001/300',
    price: '₹2,50,000',
    collection: 'Horizon 300',
    description: '',
    images: {
      dial: '/assets/photo/ethos-watch.webp',
      profile: '/assets/photo/z1.webp',
      movement: '/assets/photo/gtc-calibre-movement.webp',
    },
    glbPath: '/assets/3d/watch_1.glb',
    specs: {
      case: '41mm Cold-Forged 904L Steel',
      calibre: 'Calibre GTC-2601 In-House Automatic',
      reserve: '68 Hours Autonomous Reserve',
      water: '100 Metres / 10 ATM Chronometer',
      dial: 'Sunburst Finish',
      frequency: '28,800 VPH (4Hz)',
      crystal: 'Double-Domed Sapphire',
      strap: '904L Jubilee-Link Bracelet',
    },
  };

  const hasDial = Boolean(!data.imageDeleted && (data.images?.dial || (!data.isCustom && (data.images?.front || data.image))));
  const dialSrc = hasDial ? (data.images?.dial || data.images?.front || data.image) : EMPTY_IMAGE_PLACEHOLDER_SVG;
  const dialVal = hasDial ? (data.images?.dial || data.images?.front || data.image) : '';

  const hasProfile = Boolean(data.images?.profile);
  const profileSrc = hasProfile ? data.images.profile : EMPTY_IMAGE_PLACEHOLDER_SVG;
  const profileVal = hasProfile ? data.images.profile : '';

  const hasMovement = Boolean(data.images?.movement);
  const movementSrc = hasMovement ? data.images.movement : (data.isCustom ? EMPTY_IMAGE_PLACEHOLDER_SVG : '/assets/photo/gtc-calibre-movement.webp');
  const movementVal = hasMovement ? data.images.movement : (data.isCustom ? '' : '/assets/photo/gtc-calibre-movement.webp');

  form.innerHTML = `
    <input type="hidden" name="watch_id" value="${data.id}" />

    <!-- 1. Primary Information -->
    <div class="form-section-title">
      <span>1. Primary Horological Identity</span>
      <span style="font-size:0.65rem; color:#8c8270;">Ref &amp; Collection</span>
    </div>

    <div class="form-grid-2">
      <div class="gtc-input-group">
        <label>Timepiece Model Title *</label>
        <input type="text" name="title" class="gtc-admin-input" placeholder="e.g. GLACIAL TWILIGHT" value="${data.title || ''}" required />
      </div>
      <div class="gtc-input-group">
        <label>Reference Subtitle *</label>
        <input type="text" name="subtitle" class="gtc-admin-input" placeholder="e.g. REF. HIM-GT-2601 · ICE BLUE SUNBURST" value="${data.subtitle || ''}" required />
      </div>
    </div>

    <div class="form-grid-3">
      <div class="gtc-input-group">
        <label>Edition Badge</label>
        <input type="text" name="badge" class="gtc-admin-input" placeholder="e.g. LIMITED · 001/300" value="${data.badge || ''}" />
      </div>
      <div class="gtc-input-group">
        <label>Retail / Allocation Price *</label>
        <input type="text" name="price" class="gtc-admin-input" placeholder="e.g. ₹2,45,000" value="${data.price || '₹2,45,000'}" required />
      </div>
      <div class="gtc-input-group">
        <label>Maison Collection</label>
        <select name="collection" class="gtc-admin-select">
          <option value="Horizon 300" ${data.collection === 'Horizon 300' ? 'selected' : ''}>Horizon 300 (Himalayan)</option>
          <option value="Genesis Atelier" ${data.collection === 'Genesis Atelier' ? 'selected' : ''}>Genesis Atelier (39mm)</option>
          <option value="Heritage Vault" ${data.collection === 'Heritage Vault' ? 'selected' : ''}>Heritage Vault (Coffret)</option>
        </select>
      </div>
    </div>

    <div class="gtc-input-group">
      <label>Horological Narrative &amp; Description</label>
      <textarea name="description" class="gtc-admin-textarea" rows="3" placeholder="Description of the timepiece, architecture, and dial finishing...">${data.description || ''}</textarea>
    </div>

    <!-- 2. Three Bespoke Images (Dial, Profile, Movement) -->
    <div class="form-section-title">
      <span>2. Three Bespoke Images (Dial, Profile, Movement)</span>
      <span style="font-size:0.65rem; color:#8c8270;">Admins Can Upload, Change or Delete Existing Assets</span>
    </div>

    <div class="images-3-grid">
      <!-- Image 1: Dial View -->
      <div class="image-slot-card ${!hasDial ? 'is-cleared' : ''}" id="slot-card-dial">
        <div class="image-slot-header">
          <span class="slot-tag">IMAGE 01: DIAL VIEW (FRONT)</span>
          <button type="button" class="btn-delete-slot-image" data-clear-target="dial" title="Delete and clear dial image">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            <span>Delete</span>
          </button>
        </div>
        <div class="image-slot-preview" id="preview-box-dial">
          <img id="preview-img-dial" src="${dialSrc}" alt="Dial View" />
        </div>
        <input type="text" name="img_dial" id="input-img-dial" class="gtc-admin-input" value="${dialVal}" placeholder="Image Path or URL (leave blank to delete)" />
        <div class="slot-actions-row">
          <label class="file-upload-label">
            <span>Upload New File</span>
            <input type="file" accept="image/*" class="file-picker-input" data-target="dial" style="display:none;" />
          </label>
          <button type="button" class="btn-slot-clear-full" data-clear-target="dial" title="Delete current image">
            🗑 Delete Existing Image
          </button>
        </div>
        <div class="image-preset-picker">
          ${PRESET_IMAGES.slice(0, 4)
            .map((p) => `<button type="button" class="preset-chip" data-set-target="dial" data-val="${p.path}">${p.label.split(' ')[0]}</button>`)
            .join('')}
        </div>
      </div>

      <!-- Image 2: Profile / Side View -->
      <div class="image-slot-card ${!hasProfile ? 'is-cleared' : ''}" id="slot-card-profile">
        <div class="image-slot-header">
          <span class="slot-tag">IMAGE 02: PROFILE VIEW (ANGLE)</span>
          <button type="button" class="btn-delete-slot-image" data-clear-target="profile" title="Delete profile image">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            <span>Delete</span>
          </button>
        </div>
        <div class="image-slot-preview" id="preview-box-profile">
          <img id="preview-img-profile" src="${profileSrc}" alt="Profile View" />
        </div>
        <input type="text" name="img_profile" id="input-img-profile" class="gtc-admin-input" value="${profileVal}" placeholder="Image Path or URL (leave blank to delete)" />
        <div class="slot-actions-row">
          <label class="file-upload-label">
            <span>Upload New File</span>
            <input type="file" accept="image/*" class="file-picker-input" data-target="profile" style="display:none;" />
          </label>
          <button type="button" class="btn-slot-clear-full" data-clear-target="profile" title="Delete current image">
            🗑 Delete Existing Image
          </button>
        </div>
        <div class="image-preset-picker">
          ${PRESET_IMAGES.slice(4, 8)
            .map((p) => `<button type="button" class="preset-chip" data-set-target="profile" data-val="${p.path}">${p.label.split(' ')[0]}</button>`)
            .join('')}
        </div>
      </div>

      <!-- Image 3: Movement / Caseback View -->
      <div class="image-slot-card ${!hasMovement ? 'is-cleared' : ''}" id="slot-card-movement">
        <div class="image-slot-header">
          <span class="slot-tag">IMAGE 03: MOVEMENT / CASEBACK</span>
          <button type="button" class="btn-delete-slot-image" data-clear-target="movement" title="Delete movement image">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            <span>Delete</span>
          </button>
        </div>
        <div class="image-slot-preview" id="preview-box-movement">
          <img id="preview-img-movement" src="${movementSrc}" alt="Movement View" />
        </div>
        <input type="text" name="img_movement" id="input-img-movement" class="gtc-admin-input" value="${movementVal}" placeholder="Image Path or URL (leave blank to delete)" />
        <div class="slot-actions-row">
          <label class="file-upload-label">
            <span>Upload New File</span>
            <input type="file" accept="image/*" class="file-picker-input" data-target="movement" style="display:none;" />
          </label>
          <button type="button" class="btn-slot-clear-full" data-clear-target="movement" title="Delete current image">
            🗑 Delete Existing Image
          </button>
        </div>
        <div class="image-preset-picker">
          ${PRESET_IMAGES.slice(6, 10)
            .map((p) => `<button type="button" class="preset-chip" data-set-target="movement" data-val="${p.path}">${p.label.split(' ')[0]}</button>`)
            .join('')}
        </div>
      </div>
    </div>

    <!-- 3. 3D GLB Model Asset -->
    <div class="form-section-title">
      <span>3. 3D GLB Interactive Model File</span>
      <span style="font-size:0.65rem; color:#4ade80;">WebGL 360° Inspection</span>
    </div>

    <div class="form-grid-2">
      <div class="gtc-input-group">
        <label>Selected GLB Model Path *</label>
        <input type="text" name="glbPath" id="input-glb-path" class="gtc-admin-input" value="${data.glbPath || '/assets/3d/watch_1.glb'}" placeholder="/assets/3d/watch_1.glb" required />
      </div>
      <div class="gtc-input-group">
        <label>Select Preset GLB Model</label>
        <select id="select-glb-preset" class="gtc-admin-select">
          ${PRESET_GLB_MODELS.map((m) => `<option value="${m.path}" ${data.glbPath === m.path ? 'selected' : ''}>${m.label}</option>`).join('')}
        </select>
      </div>
    </div>

    <!-- 4. Detailed Technical Specifications -->
    <div class="form-section-title">
      <span>4. Technical Horological Specifications</span>
      <span style="font-size:0.65rem; color:#8c8270;">Card &amp; Drawer Details</span>
    </div>

    <div class="form-grid-2">
      <div class="gtc-input-group">
        <label>Case Chassis (Diameter &amp; Steel)</label>
        <input type="text" name="spec_case" class="gtc-admin-input" value="${data.specs?.case || '41mm Cold-Forged 904L Steel'}" placeholder="e.g. 41mm Cold-Forged 904L Steel" />
      </div>
      <div class="gtc-input-group">
        <label>Calibre / Movement</label>
        <input type="text" name="spec_calibre" class="gtc-admin-input" value="${data.specs?.calibre || 'Calibre GTC-2601 In-House Automatic'}" placeholder="e.g. Calibre GTC-2601 In-House Automatic" />
      </div>
    </div>

    <div class="form-grid-2">
      <div class="gtc-input-group">
        <label>Power Reserve</label>
        <input type="text" name="spec_reserve" class="gtc-admin-input" value="${data.specs?.reserve || '68 Hours Autonomous Reserve'}" placeholder="e.g. 68 Hours Autonomous Reserve" />
      </div>
      <div class="gtc-input-group">
        <label>Water Resistance</label>
        <input type="text" name="spec_water" class="gtc-admin-input" value="${data.specs?.water || '100 Metres / 10 ATM Chronometer'}" placeholder="e.g. 100 Metres / 10 ATM Chronometer" />
      </div>
    </div>

    <div class="form-grid-2">
      <div class="gtc-input-group">
        <label>Dial Texture &amp; Finishing</label>
        <input type="text" name="spec_dial" class="gtc-admin-input" value="${data.specs?.dial || 'Sunburst Glacial Finish'}" placeholder="e.g. Ice Blue Sunburst Finish" />
      </div>
      <div class="gtc-input-group">
        <label>Crystal &amp; Caseback Glass</label>
        <input type="text" name="spec_crystal" class="gtc-admin-input" value="${data.specs?.crystal || 'Double-Domed Sapphire'}" placeholder="e.g. Double-Domed Sapphire" />
      </div>
    </div>

    <!-- Actions Submit Row -->
    <div class="form-submit-row">
      <button type="button" class="admin-action-btn btn-cancel" id="${formId}-btn-cancel">Cancel</button>
      <button type="submit" class="admin-action-btn btn-save">
        ${isEdit ? 'Save Changes &amp; Publish to Atelier' : 'Publish Timepiece to Maison Atelier'}
      </button>
    </div>
  `;

  // Wire presets & file uploads
  setupFormInteractivePickers(form);

  // Wire submission
  form.onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const imgDial = (formData.get('img_dial') || '').trim();
    const imgProfile = (formData.get('img_profile') || '').trim();
    const imgMovement = (formData.get('img_movement') || '').trim();
    const isDialDeleted = !imgDial;

    const watchPayload = {
      id: formData.get('watch_id') || `gtc-watch-${Date.now()}`,
      title: (formData.get('title') || '').trim(),
      subtitle: (formData.get('subtitle') || '').trim(),
      badge: (formData.get('badge') || 'LIMITED EDITION').trim(),
      price: (formData.get('price') || '₹2,50,000').trim(),
      collection: formData.get('collection') || 'Horizon 300',
      description: (formData.get('description') || '').trim(),
      image: isDialDeleted ? '' : imgDial,
      imageDeleted: isDialDeleted,
      images: {
        dial: imgDial,
        front: imgDial,
        profile: imgProfile,
        movement: imgMovement,
      },
      glbPath: (formData.get('glbPath') || '/assets/3d/watch_1.glb').trim(),
      specs: {
        case: (formData.get('spec_case') || '41mm Cold-Forged 904L Steel').trim(),
        calibre: (formData.get('spec_calibre') || 'Calibre GTC-2601 In-House Automatic').trim(),
        reserve: (formData.get('spec_reserve') || '68 Hours Autonomous Reserve').trim(),
        water: (formData.get('spec_water') || '100 Metres / 10 ATM').trim(),
        dial: (formData.get('spec_dial') || '').trim(),
        crystal: (formData.get('spec_crystal') || 'Double-Domed Sapphire').trim(),
      },
      isCustom: true,
      updatedAt: new Date().toISOString(),
    };

    saveOrUpdateWatch(watchPayload);
    showToast(`Timepiece "${watchPayload.title}" saved successfully in Master Vault!`, 'success');

    if (formId === 'modal-edit-watch-form') {
      closeWatchEditor();
    } else {
      switchStudioTab('inventory');
    }
  };

  // Wire cancel
  document.getElementById(`${formId}-btn-cancel`)?.addEventListener('click', () => {
    if (formId === 'modal-edit-watch-form') closeWatchEditor();
    else switchStudioTab('inventory');
  });
}

function setupFormInteractivePickers(form) {
  // Delete/Clear image handlers for each slot
  form.querySelectorAll('[data-clear-target]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = btn.dataset.clearTarget;
      const input = form.querySelector(`#input-img-${target}`);
      const preview = form.querySelector(`#preview-img-${target}`);
      const slotCard = form.querySelector(`#slot-card-${target}`);
      if (input) input.value = '';
      if (preview) preview.src = EMPTY_IMAGE_PLACEHOLDER_SVG;
      if (slotCard) slotCard.classList.add('is-cleared');
      showToast(`Existing ${target} image marked as deleted. Click "Save Changes" to publish.`, 'info');
    });
  });

  // Preset chips
  form.querySelectorAll('.preset-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const target = chip.dataset.setTarget;
      const val = chip.dataset.val;
      const input = form.querySelector(`#input-img-${target}`);
      const preview = form.querySelector(`#preview-img-${target}`);
      const slotCard = form.querySelector(`#slot-card-${target}`);
      if (input) input.value = val;
      if (preview) preview.src = val;
      if (slotCard) slotCard.classList.remove('is-cleared');
    });
  });

  // URL input change triggers live preview
  ['dial', 'profile', 'movement'].forEach((target) => {
    const input = form.querySelector(`#input-img-${target}`);
    const preview = form.querySelector(`#preview-img-${target}`);
    const slotCard = form.querySelector(`#slot-card-${target}`);
    if (input && preview) {
      input.addEventListener('input', () => {
        if (input.value) {
          preview.src = input.value;
          if (slotCard) slotCard.classList.remove('is-cleared');
        } else {
          preview.src = EMPTY_IMAGE_PLACEHOLDER_SVG;
          if (slotCard) slotCard.classList.add('is-cleared');
        }
      });
    }
  });

  // File Upload picker (converts to Base64 Data URL with Rule 8 security validation)
  form.querySelectorAll('.file-picker-input').forEach((fileInput) => {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Rule 8: File Upload Security Validation (MIME type, size, extension)
      const validation = validateImageUpload(file);
      if (!validation.valid) {
        showToast(validation.error, 'error');
        fileInput.value = '';
        return;
      }

      const target = fileInput.dataset.target;
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const dataUrl = loadEvt.target.result;
        const input = form.querySelector(`#input-img-${target}`);
        const preview = form.querySelector(`#preview-img-${target}`);
        const slotCard = form.querySelector(`#slot-card-${target}`);
        if (input) input.value = dataUrl;
        if (preview) preview.src = dataUrl;
        if (slotCard) slotCard.classList.remove('is-cleared');
        showToast(`Image loaded securely for ${target} view.`, 'success');
      };
      reader.onerror = () => {
        showToast('Failed to process image file.', 'error');
      };
      reader.readAsDataURL(file);
    });
  });

  // GLB Preset dropdown
  const glbSelect = form.querySelector('#select-glb-preset');
  const glbInput = form.querySelector('#input-glb-path');
  if (glbSelect && glbInput) {
    glbSelect.addEventListener('change', () => {
      glbInput.value = glbSelect.value;
    });
  }
}

// ═══════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

export function showToast(message, type = 'success') {
  let toast = document.getElementById('gtc-admin-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'gtc-admin-toast';
    toast.className = 'gtc-admin-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <span style="font-size:16px;">${type === 'success' ? '❖' : '⚠️'}</span>
    <span>${message}</span>
  `;
  toast.className = `gtc-admin-toast active toast-${type}`;

  setTimeout(() => {
    toast.classList.remove('active');
  }, 4000);
}

// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════

export function initAdminStudio() {
  syncPageWithWatches();

  // Listen to unlock event from 3-Key Quorum
  window.addEventListener('gtc:admin-unlocked', () => {
    syncPageWithWatches();
    showToast('Admin Master Studio Unlocked. Hover over cards to edit.', 'success');
  });

  // Listen to navbar clicks on [ ADMIN VAULT ]
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action="open-admin-studio"]');
    if (target) {
      e.preventDefault();
      e.stopPropagation();
      openAdminStudio('inventory');
    }

    const addTarget = e.target.closest('[data-action="open-admin-add"]');
    if (addTarget) {
      e.preventDefault();
      e.stopPropagation();
      openAdminStudio('add');
    }
  });
}
