/**
 * Maison Gujarat Time Company (GTC)
 * Global Cart Drawer Engine (cart.js)
 *
 * Stores allocated timepieces in localStorage ('gtc_collector_cart'),
 * syncs the gold header counter across all pages, and provides a fluid
 * slide-over Obsidian & Antique Gold acquisition bag.
 */
import './cart.css';

export const GTC_CART_STORAGE_KEY = 'gtc_collector_cart';

/**
 * Returns array of currently allocated items from localStorage.
 */
export function getGtcCart() {
  try {
    return JSON.parse(localStorage.getItem(GTC_CART_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * Saves cart array to localStorage and triggers updates.
 */
export function saveGtcCart(cart) {
  try {
    localStorage.setItem(GTC_CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    console.warn('[GTC Cart] Failed to persist cart:', e);
  }
  updateCartBadge();
  renderCartItems();
  window.dispatchEvent(new CustomEvent('gtc:cart-changed', { detail: { cart } }));
}

/**
 * Updates all cart badge counters in the UI.
 */
export function updateCartBadge() {
  const cart = getGtcCart();
  const badges = document.querySelectorAll('#gtc-cart-badge, .gtc-cart-count');
  badges.forEach((badge) => {
    badge.textContent = cart.length;
    badge.style.display = cart.length > 0 ? 'flex' : 'none';
  });
}

/**
 * Ensures cart drawer and backdrop DOM nodes exist in document.body.
 */
export function ensureCartDrawerDOM() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('gtc-cart-drawer')) return;

  const drawerMarkup = `
    <!-- CART SLIDE-OVER DRAWER -->
    <div class="gtc-cart-backdrop" id="gtc-cart-backdrop" aria-hidden="true"></div>

    <aside class="gtc-cart-drawer" id="gtc-cart-drawer" aria-label="Collector Acquisition Bag">
      <div class="cart-drawer-header">
        <div>
          <span class="cart-eyebrow">❖ ALLOCATION DOSSIER</span>
          <h2 class="cart-title">Acquisition Bag</h2>
        </div>
        <button type="button" class="cart-close-btn" id="gtc-cart-close" aria-label="Close Bag">&times;</button>
      </div>

      <div class="cart-items-container" id="gtc-cart-items">
        <!-- Populated dynamically via renderCartItems() -->
      </div>

      <div class="cart-drawer-footer">
        <div class="cart-summary-line">
          <span>Subtotal</span>
          <strong id="gtc-cart-subtotal">₹0 INR</strong>
        </div>
        <div class="cart-summary-sub">
          Insured white-glove transport &amp; Surat Atelier provenance certificate included.
        </div>
        <button type="button" class="cart-purchase-btn" id="gtc-btn-checkout">
          PROCEED TO ALLOCATION &amp; SHIPPING →
        </button>
      </div>
    </aside>
  `;

  document.body.insertAdjacentHTML('beforeend', drawerMarkup);

  // Wire up close listeners
  document.getElementById('gtc-cart-backdrop')?.addEventListener('click', () => toggleGtcCart(false));
  document.getElementById('gtc-cart-close')?.addEventListener('click', () => toggleGtcCart(false));
  document.getElementById('gtc-btn-checkout')?.addEventListener('click', () => proceedToCheckout());
}

/**
 * Slides the drawer open or closed.
 */
export function toggleGtcCart(open) {
  ensureCartDrawerDOM();
  const drawer = document.getElementById('gtc-cart-drawer');
  const backdrop = document.getElementById('gtc-cart-backdrop');
  if (!drawer || !backdrop) return;

  if (open) {
    renderCartItems();
    drawer.classList.add('open');
    backdrop.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    window.gtcLenis?.stop();
  } else {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    window.gtcLenis?.start();
  }
}

/**
 * Adds a timepiece reference to the bag and opens the drawer.
 */
export function addToGtcCart(item) {
  if (!item || !item.id) return;
  ensureCartDrawerDOM();

  const cart = getGtcCart();
  // Check if reference is already allocated
  const existing = cart.find((i) => i.id === item.id);
  if (existing) {
    toggleGtcCart(true);
    return;
  }

  // Parse numeric price cleanly
  let numericPrice = item.numericPrice;
  if (!numericPrice && item.price) {
    const raw = String(item.price).replace(/[^0-9]/g, '');
    numericPrice = parseInt(raw, 10) || 0;
  }

  cart.push({
    id: item.id,
    name: item.name || 'GTC Himalayan Timepiece',
    ref: item.ref || 'REF. HIM-GT-2001',
    price: item.price || `₹${(numericPrice || 245000).toLocaleString('en-IN')} INR`,
    numericPrice: numericPrice || 245000,
    img: item.img || '/assets/photo/ethos-watch.webp',
  });

  saveGtcCart(cart);
  toggleGtcCart(true);
}

/**
 * Releases an item allocation from the bag.
 */
export function removeFromGtcCart(id) {
  let cart = getGtcCart();
  cart = cart.filter((item) => item.id !== id);
  saveGtcCart(cart);
}

/**
 * Re-renders all items inside the drawer.
 */
export function renderCartItems() {
  ensureCartDrawerDOM();
  const container = document.getElementById('gtc-cart-items');
  const subtotalEl = document.getElementById('gtc-cart-subtotal');
  const checkoutBtn = document.getElementById('gtc-btn-checkout');
  if (!container) return;

  const cart = getGtcCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        ❖ NO TIMEPIECES CURRENTLY ALLOCATED<br>
        Select an edition from the Horizon collection to begin reservation.
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = '₹0 INR';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  if (checkoutBtn) checkoutBtn.disabled = false;

  let subtotal = 0;
  container.innerHTML = cart
    .map((item) => {
      subtotal += item.numericPrice || 0;
      return `
        <div class="cart-item-row" data-cart-id="${item.id}">
          <img
            src="${item.img}"
            alt="${item.name}"
            class="cart-item-img"
            onerror="this.src='/assets/photo/ethos-watch.webp'"
          />
          <div>
            <h4 class="cart-item-title">${item.name}</h4>
            <div class="cart-item-ref">${item.ref}</div>
            <div class="cart-item-price">${item.price}</div>
          </div>
          <button
            type="button"
            class="cart-remove-btn"
            data-remove-id="${item.id}"
            onclick="removeFromGtcCart('${item.id}')"
            title="Release Allocation"
            aria-label="Remove ${item.name} from Bag"
          >&times;</button>
        </div>
      `;
    })
    .join('');

  if (subtotalEl) {
    subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')} INR`;
  }
}

/**
 * Navigates to checkout.html.
 */
export function proceedToCheckout() {
  toggleGtcCart(false);
  window.location.href = '/checkout.html';
}

/**
 * Global Window bindings so HTML onclick attributes function everywhere.
 */
if (typeof window !== 'undefined') {
  window.toggleGtcCart = toggleGtcCart;
  window.addToGtcCart = addToGtcCart;
  window.removeFromGtcCart = removeFromGtcCart;
  window.proceedToCheckout = proceedToCheckout;
  window.getGtcCart = getGtcCart;
  window.updateCartBadge = updateCartBadge;

  // Close drawer on Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const drawer = document.getElementById('gtc-cart-drawer');
      if (drawer?.classList.contains('open')) {
        toggleGtcCart(false);
      }
    }
  });

  // Sync cart badge when page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureCartDrawerDOM();
      updateCartBadge();
    });
  } else {
    ensureCartDrawerDOM();
    updateCartBadge();
  }
}
