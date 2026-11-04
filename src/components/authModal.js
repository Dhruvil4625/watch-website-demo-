import {
  signUpCustomer,
  loginUser,
  logoutUser,
  getCurrentUserWithRole,
  resendConfirmationEmail,
  requestAdminQuorumKeys,
  verifyAdminQuorum,
  notifyAdminLoginUnlocked,
  requestPasswordReset,
  confirmPasswordReset,
  resetUserSecurityLimits,
  clearAllRateLimits,
  resetRateLimit,
} from '../lib/watchApi.js';
import { supabase } from '../lib/supabaseClient.js';
import { validateEmail, validatePhone } from '../utils/security.js';
import './authModal.css';

// 1. Point directly to your video in public/assets/video/
const FALCON_VIDEO_URL = '/assets/video/watch-movement.mp4';

// 2. Poster Fallback (Option A: Local WebP image from public/assets/photo/)
const FALCON_POSTER = '/assets/photo/watch-poster.webp';

// (Option B: If you haven't exported a poster image yet, keep this ultra-tiny 
// dark obsidian base64 WebP so the panel stays dark #0b0b0b while the video buffers)
const OBSIDIAN_FALLBACK_POSTER =
  'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAACwAQCdASoBAAEAAUAmJYgCdAEO/gHOAAD++P7+//74/v7//vj+/v/++P7+//74/v4AAAA=';

let activeAnimations = [];
let currentMode = '';

// Track current user state & any blocked Purchase/Inquiry button click
let activeUser = null;
let activeRole = 'customer';
let pendingActionElement = null;
let isGatekeeperSetup = false;

// 60-Second Quorum Timer State
let quorumTimerInterval = null;
let activeQuorumData = null;
let currentAdminUser = null;
let quorumTimeRemaining = 60;

// Selector matching all Purchase, Reserve, and Inquiry buttons on your site
const PROTECTED_CTA_SELECTOR = [
  '.open-reserve-modal',
  '.reserve-btn',
  '.purchase-btn',
  '.inquiry-btn',
  '[data-action="reserve"]',
  '[data-action="purchase"]',
  '[data-action="inquiry"]',
  '[data-require-auth="true"]'
].join(', ');

/**
 * Creates and injects the Split-Screen Luxury Auth Modal into the DOM if not present.
 */
function ensureAuthModalDOM() {
  if (document.getElementById('gtc-auth-modal')) return;

  const modalMarkup = `
    <div id="gtc-auth-modal" class="gtc-auth-modal-backdrop" aria-hidden="true">
      <div class="gtc-stage" id="gtc-stage" role="dialog" aria-modal="true" aria-labelledby="h1">
        
        <!-- Close Button -->
        <button type="button" class="gtc-auth-close-btn" id="gtc-auth-close-btn" aria-label="Close Authentication Modal">✕</button>

        <!-- LEFT / TOP PANEL: Watch Movement Video + Badge + Clip-Path Headlines -->
        <section class="gtc-photo" id="gtc-photo" style="background-color: #0b0b0b;">
          <video 
            class="photo-img photo-img--tall" 
            autoplay 
            muted 
            loop 
            playsinline 
            preload="auto" 
            poster="${FALCON_POSTER}"
            style="background: #0b0b0b url('${OBSIDIAN_FALLBACK_POSTER}') center/cover no-repeat;"
          >
            <source src="${FALCON_VIDEO_URL}" type="video/mp4" />
          </video>
          <video 
            class="photo-img photo-img--wide" 
            aria-hidden="true" 
            autoplay 
            muted 
            loop 
            playsinline 
            preload="auto" 
            poster="${FALCON_POSTER}"
            style="background: #0b0b0b url('${OBSIDIAN_FALLBACK_POSTER}') center/cover no-repeat;"
          >
            <source src="${FALCON_VIDEO_URL}" type="video/mp4" />
          </video>
          <div class="gtc-scrim"></div>

          <div class="gtc-hero" id="gtc-hero">
            <div class="gtc-badge" id="gtc-badge">
              <svg class="gtc-badge-glyph" viewBox="0 0 582 557" aria-hidden="true">
                <path fill="#ffffff" fill-rule="evenodd" d="M449.0 0.0 435.0 0.0 415.0 10.0 200.0 249.0 187.0 276.0 189.0 299.0 212.0 326.0 232.0 332.0 289.0 334.0 289.0 516.0 301.0 543.0 324.0 556.0 346.0 556.0 374.0 536.0 573.0 311.0 582.0 288.0 579.0 264.0 559.0 240.0 539.0 233.0 478.0 230.0 478.0 32.0 470.0 13.0ZM442.0 38.0 446.0 250.0 466.0 267.0 540.0 270.0 547.0 285.0 341.0 520.0 332.0 522.0 324.0 514.0 321.0 314.0 307.0 300.0 295.0 297.0 233.0 297.0 224.0 291.0 221.0 282.0ZM1.0 67.0 4.0 81.0 17.0 90.0 216.0 90.0 223.0 87.0 232.0 74.0 228.0 57.0 215.0 49.0 18.0 49.0 5.0 57.0ZM0.0 285.0 4.0 300.0 17.0 308.0 105.0 308.0 118.0 299.0 121.0 291.0 119.0 278.0 111.0 270.0 103.0 267.0 17.0 267.0 4.0 275.0ZM1.0 495.0 4.0 511.0 10.0 517.0 23.0 520.0 179.0 520.0 191.0 516.0 200.0 500.0 196.0 488.0 182.0 479.0 18.0 479.0 9.0 483.0Z"/>
              </svg>
              <span id="badgeTxt">Maison Gujarat Time Company</span>
            </div>
            <div class="gtc-hl-wrap" id="gtc-hl-wrap">
              <span class="gtc-hl" id="hl1">Precision Built for</span>
              <span class="gtc-hl" id="hl2">Generations</span>
            </div>
          </div>
        </section>

        <!-- RIGHT / BOTTOM PANE: Calibrated Card -->
        <section class="gtc-pane" id="gtc-pane">
          <div class="gtc-card" id="gtc-card">
            <div class="gtc-card-in" id="gtc-card-in">

              <!-- Dynamic H1 & Subtitle -->
              <h1 class="gtc-col gtc-center" id="h1">Welcome Back!</h1>
              <p class="gtc-col gtc-center" id="sub">
                <b>Log in</b> to access private allocations &amp; the vault.
              </p>

              <!-- Switchable Mode Tabs -->
              <div class="gtc-auth-tabs" id="gtc-auth-tabs" role="tablist">
                <button type="button" class="gtc-auth-tab-btn active" id="tab-signin-btn" data-tab="signin" role="tab" aria-selected="true">
                  COLLECTOR SIGN IN
                </button>
                <button type="button" class="gtc-auth-tab-btn" id="tab-signup-btn" data-tab="signup" role="tab" aria-selected="false">
                  CREATE ACCOUNT
                </button>
              </div>

              <!-- Unified Status Alert (Error or Success) -->
              <div id="gtc-auth-alert" class="gtc-auth-alert" role="alert"></div>

              <!-- 1. SIGN IN VIEW -->
              <div id="gtc-auth-signin-view" class="gtc-auth-view active">
                <form id="gtc-signin-form" class="gtc-auth-form" novalidate>
                  <div class="gtc-field gtc-field--email" id="email-field-wrap">
                    <input
                      type="email"
                      id="auth-signin-email"
                      class="gtc-auth-input gtc-input-email"
                      placeholder="Eg. collector@horology.com"
                      autocomplete="email"
                      aria-label="Email address"
                      required
                    />
                  </div>

                  <div class="gtc-field gtc-field--pw" id="pw-field-wrap">
                    <input
                      type="password"
                      id="auth-signin-password"
                      class="gtc-auth-input gtc-input-pw"
                      placeholder="Password"
                      autocomplete="current-password"
                      aria-label="Password"
                      required
                    />
                    <button type="button" class="btn-toggle-pw" data-target="auth-signin-password" aria-label="Toggle password visibility" title="Show/Hide Password">
                      <svg class="eye-icon eye-show" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      <svg class="eye-icon eye-hide" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    </button>
                  </div>

                  <div class="gtc-forgot-pw-wrap">
                    <button type="button" id="btn-forgot-password" class="gtc-forgot-pw-link">Forgot Password?</button>
                  </div>

                  <button type="submit" id="btn-submit-signin" class="gtc-login-btn">
                    <span class="btn-text">Enter the Vault</span>
                    <svg class="gtc-login-arrow" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                      <path d="M3 11h15.4M11 3.3l7.7 7.7-7.7 7.7" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </form>
              </div>

              <!-- 2. CREATE ACCOUNT VIEW -->
              <div id="gtc-auth-signup-view" class="gtc-auth-view">
                <form id="gtc-signup-form" class="gtc-auth-form" novalidate>
                  <div class="gtc-signup-grid">
                    <div class="gtc-field gtc-field--email">
                      <input
                        type="text"
                        id="auth-signup-name"
                        class="gtc-auth-input gtc-input-email"
                        placeholder="Full Name (Eg. Vikram Patel)"
                        autocomplete="name"
                        aria-label="Full Name"
                        required
                      />
                    </div>

                    <div class="gtc-field gtc-field--pw">
                      <input
                        type="tel"
                        id="auth-signup-phone"
                        class="gtc-auth-input gtc-input-pw"
                        placeholder="Phone (+91 98250 00000)"
                        autocomplete="tel"
                        aria-label="Phone Number"
                        required
                      />
                    </div>

                    <div class="gtc-field gtc-field--email">
                      <input
                        type="email"
                        id="auth-signup-email"
                        class="gtc-auth-input gtc-input-email"
                        placeholder="Email Address"
                        autocomplete="email"
                        aria-label="Email address"
                        required
                      />
                    </div>

                    <div class="gtc-field gtc-field--pw">
                      <input
                        type="password"
                        id="auth-signup-password"
                        class="gtc-auth-input gtc-input-pw"
                        placeholder="Password (Min 6 characters)"
                        minlength="6"
                        autocomplete="new-password"
                        aria-label="Password"
                        required
                      />
                      <button type="button" class="btn-toggle-pw" data-target="auth-signup-password" aria-label="Toggle password visibility" title="Show/Hide Password">
                        <svg class="eye-icon eye-show" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        <svg class="eye-icon eye-hide" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      </button>
                    </div>
                  </div>

                  <button type="submit" id="btn-submit-signup" class="gtc-login-btn">
                    <span class="btn-text">Register Collector Profile</span>
                    <svg class="gtc-login-arrow" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                      <path d="M3 11h15.4M11 3.3l7.7 7.7-7.7 7.7" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </form>
              </div>

              <!-- 3. ADMIN QUORUM VIEW (3-CO-OWNER 90s OTP VERIFICATION) -->
              <div id="gtc-auth-quorum-view" class="gtc-auth-view">
                <div class="gtc-quorum-container">
                  <!-- Live Gold Countdown Badge -->
                  <div id="quorum-timer-badge" class="quorum-badge">
                    ⏱ QUORUM KEYS SELF-DESTRUCT IN: <span id="quorum-countdown">01:30</span>
                  </div>

                  <p class="quorum-instruction">
                    Enter the 6-digit cryptographic keys dispatched to all 3 Co-Owners to unlock the Master Vault.
                  </p>

                  <form id="gtc-quorum-form" class="gtc-auth-form" novalidate>
                    <div class="quorum-inputs-grid">
                      <div class="quorum-field">
                        <label for="quorum-otp-1">
                          <span class="quorum-key-tag">KEY 01</span>
                          <span class="quorum-owner-email" id="quorum-owner-1">gujarattimecompany@gmail.com</span>
                        </label>
                        <input type="text" id="quorum-otp-1" class="gtc-auth-input quorum-input" placeholder="••••••" maxlength="10" autocomplete="one-time-code" required />
                      </div>
                      <div class="quorum-field">
                        <label for="quorum-otp-2">
                          <span class="quorum-key-tag">KEY 02</span>
                          <span class="quorum-owner-email" id="quorum-owner-2">parthsherathiya181@gmail.com</span>
                        </label>
                        <input type="text" id="quorum-otp-2" class="gtc-auth-input quorum-input" placeholder="••••••" maxlength="10" autocomplete="one-time-code" required />
                      </div>
                      <div class="quorum-field">
                        <label for="quorum-otp-3">
                          <span class="quorum-key-tag">KEY 03</span>
                          <span class="quorum-owner-email" id="quorum-owner-3">ramoliadk@gmail.com</span>
                        </label>
                        <input type="text" id="quorum-otp-3" class="gtc-auth-input quorum-input" placeholder="••••••" maxlength="10" autocomplete="one-time-code" required />
                      </div>
                    </div>

                    <button type="submit" id="btn-submit-quorum" class="gtc-login-btn quorum-submit-btn">
                      <span class="btn-text">Authorize Quorum &amp; Enter Studio</span>
                      <svg class="gtc-login-arrow" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                        <path d="M3 11h15.4M11 3.3l7.7 7.7-7.7 7.7" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>

                    <div class="quorum-actions-row">
                      <button type="button" id="btn-resend-quorum" class="gtc-quorum-resend-btn" title="Resend 90s OTPs to all 3 Co-Owners">
                        <span class="resend-icon">↻</span>
                        <span class="resend-text">Resend 90s OTP Keys</span>
                      </button>
                      <button type="button" id="btn-cancel-quorum" class="gtc-quorum-back-btn" title="Return to collector login">
                        <span>← Collector Login</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <!-- 4. FORGOT PASSWORD RECOVERY VIEW (2-STEP OTP & OVERWRITE) -->
              <div id="gtc-auth-reset-view" class="gtc-auth-view">
                <div class="gtc-reset-container">
                  <!-- Live Gold Countdown Badge -->
                  <div id="reset-timer-badge" class="quorum-badge" style="display:none; margin-bottom: 14px;">
                    ⏱ RECOVERY KEY EXPIRES IN: <span id="reset-countdown">02:00</span>
                  </div>

                  <!-- Step A: Enter Email & Request OTP -->
                  <div id="reset-step-a" class="reset-step active">
                    <p class="gtc-reset-desc">
                      Enter your account email. We will dispatch a 6-digit recovery key to reset your vault password.
                    </p>
                    <form id="gtc-reset-email-form" class="gtc-auth-form" novalidate>
                      <div class="gtc-field gtc-field--email">
                        <input
                          type="email"
                          id="reset-email-input"
                          class="gtc-auth-input gtc-input-email"
                          placeholder="Eg. collector@horology.com"
                          autocomplete="email"
                          aria-label="Account Email Address"
                          required
                        />
                      </div>
                      <button type="submit" id="btn-send-reset-otp" class="gtc-login-btn">
                        <span class="btn-text">Send Recovery OTP</span>
                        <svg class="gtc-login-arrow" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                          <path d="M3 11h15.4M11 3.3l7.7 7.7-7.7 7.7" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    </form>
                  </div>

                  <!-- Step B: Verify OTP & Overwrite Password -->
                  <div id="reset-step-b" class="reset-step" style="display:none;">
                    <p class="gtc-reset-desc">
                      Enter the 6-digit key received at <strong id="reset-target-email-txt" style="color:#C9A84C;"></strong> along with your new password.
                    </p>
                    <form id="gtc-reset-verify-form" class="gtc-auth-form" novalidate>
                      <div class="gtc-field gtc-field--pw">
                        <input
                          type="text"
                          id="reset-otp-input"
                          class="gtc-auth-input quorum-input"
                          placeholder="••••••"
                          maxlength="6"
                          inputmode="numeric"
                          pattern="[0-9]*"
                          autocomplete="one-time-code"
                          style="letter-spacing: 0.28em; text-align: center; font-family: 'DM Mono', monospace; font-size: 1.15rem; font-weight: 700;"
                          required
                        />
                      </div>

                      <div class="gtc-field gtc-field--pw">
                        <input
                          type="password"
                          id="reset-new-password"
                          class="gtc-auth-input gtc-input-pw"
                          placeholder="New Password (Min 6 chars)"
                          minlength="6"
                          autocomplete="new-password"
                          required
                        />
                        <button type="button" class="btn-toggle-pw" data-target="reset-new-password" aria-label="Toggle password visibility" title="Show/Hide Password">
                          <svg class="eye-icon eye-show" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          <svg class="eye-icon eye-hide" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        </button>
                      </div>

                      <div class="gtc-field gtc-field--pw">
                        <input
                          type="password"
                          id="reset-confirm-password"
                          class="gtc-auth-input gtc-input-pw"
                          placeholder="Confirm New Password"
                          minlength="6"
                          autocomplete="new-password"
                          required
                        />
                        <button type="button" class="btn-toggle-pw" data-target="reset-confirm-password" aria-label="Toggle password visibility" title="Show/Hide Password">
                          <svg class="eye-icon eye-show" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          <svg class="eye-icon eye-hide" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        </button>
                      </div>

                      <div id="reset-pw-match-hint" style="font-size: 0.74rem; font-family: 'DM Mono', monospace; display: none; margin-top: -4px; text-align: left; padding: 0 4px;"></div>

                      <button type="submit" id="btn-submit-new-password" class="gtc-login-btn">
                        <span class="btn-text">Save &amp; Update Password</span>
                        <svg class="gtc-login-arrow" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                          <path d="M3 11h15.4M11 3.3l7.7 7.7-7.7 7.7" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>

                      <div id="reset-resend-wrap" style="margin-top: 10px; text-align: center;">
                        <button type="button" id="btn-resend-reset-otp" class="gtc-quorum-resend-btn" style="font-size:0.75rem;">
                          <span>↻ Resend Recovery Key</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  <div class="reset-actions-row" style="margin-top: 16px; text-align: center;">
                    <button type="button" id="btn-back-to-signin" class="gtc-quorum-back-btn">
                      <span>← Back to Collector Sign In</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Divider Rule (205px / 204px asymmetry) -->
              <div class="gtc-divider" id="gtc-divider">
                <i class="gtc-div-l"></i>
                <b>OR</b>
                <i class="gtc-div-r"></i>
              </div>

              <!-- Secondary Action Button: Quick Mode Switch / VIP Concierge -->
              <button type="button" id="gtc-secondary-btn" class="gtc-g-btn">
                <span class="gtc-crest- emblem">❖</span>
                <span id="gtc-secondary-btn-txt">Create a Private Collector Profile</span>
              </button>

              <!-- Footer Quick Toggle -->
              <p id="bottom" class="gtc-bottom">
                <span id="bottom-prompt">Don&#8217;t have an account? </span>
                <a href="#signup" id="bottom-toggle-link">Start Free</a>
              </p>

            </div>
          </div>
        </section>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalMarkup);
}

/**
 * Responsive stage cleanup engine.
 */
function initResponsiveStageEngine() {
  function clearInline() {
    const ids = ['gtc-photo', 'gtc-pane', 'gtc-card', 'gtc-card-in', 'gtc-hero'];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.cssText = '';
    });
  }

  window.addEventListener('resize', clearInline, { passive: true });
  clearInline();
  return clearInline;
}

/**
 * Lightweight instant entrance helper.
 */
function playEntranceTimeline() {
  activeAnimations.forEach((a) => {
    try { a.cancel(); } catch (_) {}
  });
  activeAnimations = [];
}

/**
 * Pre-populates the Watch Reservation Modal with authenticated collector information.
 */
function autoFillReservationForm(user) {
  if (!user) return;
  const fullName = user.user_metadata?.full_name || '';
  const phone = user.user_metadata?.phone || '';
  const email = user.email || '';

  const firstNameInput = document.getElementById('first-name');
  const lastNameInput = document.getElementById('last-name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');

  if (firstNameInput && fullName) {
    const parts = fullName.trim().split(' ');
    firstNameInput.value = parts[0] || '';
    if (lastNameInput && parts.length > 1) {
      lastNameInput.value = parts.slice(1).join(' ') || '';
    }
  }
  if (emailInput && email) emailInput.value = email;
  if (phoneInput && phone) phoneInput.value = phone;
}

/**
 * Renders the active user authentication state in the navigation bar.
 */
export function updateNavbarAuthState(user, role = 'customer') {
  const containers = document.querySelectorAll('.auth-nav-container');
  if (!containers.length) return;

  // Persist session to localStorage so profile.html can hydrate seamlessly
  if (user) {
    try {
      localStorage.setItem('gtc_user_session', JSON.stringify({
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Collector',
        email: user.email,
        role: role || 'customer',
        id: user.id
      }));
    } catch (e) {}
  } else {
    try {
      localStorage.removeItem('gtc_user_session');
    } catch (e) {}
  }

  containers.forEach((container) => {
    if (user) {
      const displayName = user.user_metadata?.full_name || user.email.split('@')[0];

      if (role === 'admin') {
        container.innerHTML = `
          <div class="auth-profile-badge">
            <button class="auth-role-tag auth-role-admin-btn" data-action="open-admin-studio" type="button" title="Open GTC Admin Studio" style="background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;padding:0;">
              <span class="admin-pulse-dot" style="display:inline-block;width:6px;height:6px;background:#4ade80;border-radius:50%;margin-right:6px;box-shadow:0 0 6px #4ade80;"></span>
              [ ADMIN VAULT ]
            </button>
            <button class="auth-admin-add-nav-btn" data-action="open-admin-add" type="button" title="List New Timepiece" style="background:#C9A84C;color:#0b0b0b;font-weight:700;font-size:0.62rem;border:none;border-radius:4px;padding:3px 7px;cursor:pointer;font-family:'DM Mono',monospace;letter-spacing:0.06em;margin:0 2px;">
              + WATCH
            </button>
            <a href="/profile.html" class="auth-user-name" title="Collector Sanctuary (${user.email})">${displayName}</a>
            <button class="auth-signout-btn" data-action="signout" type="button" title="Sign Out">SIGN OUT</button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="auth-profile-badge">
            <span class="auth-icon">✦</span>
            <a href="/profile.html" class="auth-user-name" title="Collector Sanctuary (${user.email})">${displayName}</a>
            <button class="auth-signout-btn" data-action="signout" type="button" title="Sign Out">SIGN OUT</button>
          </div>
        `;
      }

      window.dispatchEvent(new CustomEvent('gtc:admin-state-changed', { detail: { isAdmin: role === 'admin', user } }));

      const signoutBtn = container.querySelector('[data-action="signout"]');
      if (signoutBtn) {
        signoutBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            sessionStorage.removeItem('gtc_admin_authenticated');
            localStorage.removeItem('gtc_user_session');
          } catch (e) {}
          await logoutUser();
          activeUser = null;
          activeRole = 'customer';
          updateNavbarAuthState(null, 'customer');
          window.dispatchEvent(new CustomEvent('gtc:admin-locked'));
          window.dispatchEvent(new CustomEvent('gtc:admin-state-changed', { detail: { isAdmin: false, user: null } }));
        });
      }
    } else {
      container.innerHTML = `
        <button class="auth-nav-btn" data-action="open-auth" type="button">
          <span class="auth-icon">✦</span>
          <span class="auth-label">CLIENT LOGIN</span>
        </button>
      `;

      const loginBtn = container.querySelector('[data-action="open-auth"]');
      if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openAuthModal();
        });
      }
    }
  });

  if (user) {
    autoFillReservationForm(user);
    document.querySelectorAll('.open-reserve-modal').forEach((btn) => {
      btn.addEventListener('click', () => autoFillReservationForm(user), { passive: true });
    });
  }
}

let triggerLayout = null;

/**
 * Opens the Auth Modal, runs layout pass, plays WAAPI entrance, and locks background scrolling.
 */
export function openAuthModal(defaultTab = 'signin') {
  ensureAuthModalDOM();
  const modal = document.getElementById('gtc-auth-modal');
  if (!modal) return;

  switchAuthTab(defaultTab);
  clearAuthAlert();

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  modal.setAttribute('data-lenis-prevent', 'true');
  document.body.style.overflow = 'hidden';
  window.gtcLenis?.stop();

  if (triggerLayout) triggerLayout();

  // Ensure falcon video plays smoothly
  modal.querySelectorAll('video').forEach((v) => {
    v.play().catch(() => {});
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      playEntranceTimeline();
    });
  });

  setTimeout(() => {
    const input =
      defaultTab === 'signin'
        ? document.getElementById('auth-signin-email')
        : document.getElementById('auth-signup-name');
    if (input) input.focus();
  }, 150);
}

/**
 * Closes the Auth Modal and restores background scrolling.
 */
export function closeAuthModal() {
  const modal = document.getElementById('gtc-auth-modal');
  if (!modal) return;

  modal.classList.remove('quorum-active');

  // Clear quorum timer interval if running
  if (quorumTimerInterval) {
    clearInterval(quorumTimerInterval);
    quorumTimerInterval = null;
  }

  sessionStorage.setItem('gtc_auth_dismissed', 'true');

  // 1. Instantly cancel any active WAAPI animations to eliminate GPU burden
  if (Array.isArray(activeAnimations) && activeAnimations.length > 0) {
    activeAnimations.forEach((a) => {
      try {
        a.cancel();
      } catch (_) {}
    });
    activeAnimations = [];
  }

  // 2. Pause background videos to halt decoder and GPU rendering immediately
  modal.querySelectorAll('video').forEach((v) => {
    try {
      v.pause();
    } catch (_) {}
  });

  // 3. Dismiss modal and restore background scrolling instantly
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  window.gtcLenis?.start();
  clearAuthAlert();
}

/**
 * 1. Call this inside initPreloader's onComplete callback in main.js
 * Pops up the Login Modal on first entry after the loading screen finishes.
 */
export async function triggerPostPreloaderAuth() {
  const { user, role } = await getCurrentUserWithRole();
  activeUser = user;
  activeRole = role;
  updateNavbarAuthState(user, role);

  // If not logged in and hasn't clicked 'X' yet in this tab session, open Login
  if (!activeUser && !sessionStorage.getItem('gtc_auth_dismissed')) {
    setTimeout(() => {
      openAuthModal('signin');
    }, 600);
  }
}

/**
 * 2. Intercepts clicks on any Purchase, Reserve, or Inquiry button.
 * If logged out, blocks the action and reopens the Login Modal immediately.
 */
export function setupProtectedActionGate() {
  if (isGatekeeperSetup) return;
  isGatekeeperSetup = true;

  // Capture-phase listener (true) runs BEFORE your reservation modal open listeners
  document.addEventListener(
    'click',
    (e) => {
      const protectedBtn = e.target.closest(PROTECTED_CTA_SELECTOR);
      if (!protectedBtn) return;

      // If user is NOT logged in, block purchase/inquiry and force login modal
      if (!activeUser) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Remember which Purchase / Inquiry button they clicked
        pendingActionElement = protectedBtn;

        openAuthModal('signin');
        showAuthAlert(
          'Collector authentication is required to reserve a timepiece or submit an inquiry.',
          'error'
        );
      } else {
        // User is logged in: ensure their details are auto-filled
        autoFillReservationForm(activeUser);
      }
    },
    true // <-- Capture phase ensures guest clicks are always intercepted first
  );
}

/**
 * Switches between 'signin' and 'signup' tabs and updates calibrated header/footer text.
 */
let resetTimerInterval = null;
let resetTimeRemaining = 120;
let activeResetSession = null;

function formatResetTimer(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const mins = String(Math.floor(s / 60)).padStart(2, '0');
  const secs = String(s % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function startResetCountdown(totalSeconds = 120) {
  if (resetTimerInterval) {
    clearInterval(resetTimerInterval);
    resetTimerInterval = null;
  }
  resetTimeRemaining = totalSeconds;
  const badgeEl = document.getElementById('reset-timer-badge');
  const countEl = document.getElementById('reset-countdown');
  if (badgeEl) badgeEl.style.display = 'block';
  if (countEl) countEl.textContent = formatResetTimer(resetTimeRemaining);

  resetTimerInterval = setInterval(() => {
    resetTimeRemaining -= 1;
    if (countEl) countEl.textContent = formatResetTimer(resetTimeRemaining);
    if (resetTimeRemaining <= 0) {
      clearInterval(resetTimerInterval);
      resetTimerInterval = null;
      showAuthAlert('⏱ Recovery OTP has expired (2-minute limit). Please request a new OTP.', 'error');
      const submitBtn = document.getElementById('btn-submit-new-password');
      if (submitBtn) submitBtn.disabled = true;
    }
  }, 1000);
}

function stopResetCountdown() {
  if (resetTimerInterval) {
    clearInterval(resetTimerInterval);
    resetTimerInterval = null;
  }
  const badgeEl = document.getElementById('reset-timer-badge');
  if (badgeEl) badgeEl.style.display = 'none';
}

function switchAuthTab(tab) {
  if (quorumTimerInterval) {
    clearInterval(quorumTimerInterval);
    quorumTimerInterval = null;
  }
  const modal = document.getElementById('gtc-auth-modal');
  modal?.classList.remove('quorum-active');

  document.getElementById('gtc-auth-quorum-view')?.classList.remove('active');
  const tabsWrap = document.getElementById('gtc-auth-tabs');
  const divider = document.getElementById('gtc-divider');
  const secondaryBtn = document.getElementById('gtc-secondary-btn');
  const bottom = document.getElementById('bottom');

  const tabSigninBtn = document.getElementById('tab-signin-btn');
  const tabSignupBtn = document.getElementById('tab-signup-btn');
  const viewSignin = document.getElementById('gtc-auth-signin-view');
  const viewSignup = document.getElementById('gtc-auth-signup-view');
  const viewReset = document.getElementById('gtc-auth-reset-view');
  const h1El = document.getElementById('h1');
  const subEl = document.getElementById('sub');
  const secondaryBtnTxt = document.getElementById('gtc-secondary-btn-txt');
  const bottomPrompt = document.getElementById('bottom-prompt');
  const bottomLink = document.getElementById('bottom-toggle-link');

  clearAuthAlert();

  if (tab === 'reset') {
    tabSigninBtn?.classList.remove('active');
    tabSigninBtn?.setAttribute('aria-selected', 'false');
    tabSignupBtn?.classList.remove('active');
    tabSignupBtn?.setAttribute('aria-selected', 'false');

    if (tabsWrap) tabsWrap.style.display = 'none';
    if (divider) divider.style.display = 'none';
    if (secondaryBtn) secondaryBtn.style.display = 'none';
    if (bottom) bottom.style.display = 'none';

    viewSignin?.classList.remove('active');
    viewSignup?.classList.remove('active');
    document.getElementById('gtc-auth-quorum-view')?.classList.remove('active');
    viewReset?.classList.add('active');

    if (h1El) h1El.textContent = 'Vault Password Recovery';
    if (subEl) subEl.innerHTML = '<b>Reset Credentials</b> via 2-Minute Email OTP.';
    return;
  }

  // Restore common controls when returning to signin or signup
  if (tabsWrap) tabsWrap.style.display = '';
  if (divider) divider.style.display = '';
  if (secondaryBtn) secondaryBtn.style.display = '';
  if (bottom) bottom.style.display = '';
  viewReset?.classList.remove('active');
  stopResetCountdown();

  if (tab === 'signup') {
    tabSigninBtn?.classList.remove('active');
    tabSigninBtn?.setAttribute('aria-selected', 'false');
    tabSignupBtn?.classList.add('active');
    tabSignupBtn?.setAttribute('aria-selected', 'true');

    viewSignin?.classList.remove('active');
    viewSignup?.classList.add('active');

    if (h1El) h1El.textContent = 'Collector Registry';
    if (subEl) subEl.innerHTML = '<b>Register</b> to reserve limited edition timepieces.';
    if (secondaryBtnTxt) secondaryBtnTxt.textContent = 'Already Registered? Collector Sign In';
    if (bottomPrompt) bottomPrompt.innerHTML = 'Already hold a vault key? ';
    if (bottomLink) bottomLink.textContent = 'Sign In';
  } else {
    tabSignupBtn?.classList.remove('active');
    tabSignupBtn?.setAttribute('aria-selected', 'false');
    tabSigninBtn?.classList.add('active');
    tabSigninBtn?.setAttribute('aria-selected', 'true');

    viewSignup?.classList.remove('active');
    viewSignin?.classList.add('active');

    if (h1El) h1El.textContent = 'Welcome Back!';
    if (subEl) subEl.innerHTML = '<b>Log in</b> to access private allocations &amp; the vault.';
    if (secondaryBtnTxt) secondaryBtnTxt.textContent = 'Create a Private Collector Profile';
    if (bottomPrompt) bottomPrompt.innerHTML = 'Don&#8217;t have an account? ';
    if (bottomLink) bottomLink.textContent = 'Start Free';
  }
}

/**
 * Initiates the 60-Second Quorum Countdown & Interface.
 */
function formatQuorumTimer(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const mins = String(Math.floor(s / 60)).padStart(2, '0');
  const secs = String(s % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

/**
 * Initiates the 90-Second Quorum Countdown & Interface.
 */
function startQuorumCountdown(quorumData, adminUser) {
  if (quorumTimerInterval) {
    clearInterval(quorumTimerInterval);
    quorumTimerInterval = null;
  }

  activeQuorumData = quorumData;
  currentAdminUser = adminUser;
  quorumTimeRemaining = 90;
  if (typeof sessionStorage !== 'undefined' && adminUser) {
    try {
      sessionStorage.setItem('gtc_current_admin', JSON.stringify(adminUser));
    } catch (e) {}
  }

  clearAuthAlert();

  const modal = document.getElementById('gtc-auth-modal');
  modal?.classList.add('quorum-active');

  // Switch to Quorum view
  document.getElementById('gtc-auth-signin-view')?.classList.remove('active');
  document.getElementById('gtc-auth-signup-view')?.classList.remove('active');
  const viewQuorum = document.getElementById('gtc-auth-quorum-view');
  viewQuorum?.classList.add('active');

  const h1El = document.getElementById('h1');
  const subEl = document.getElementById('sub');
  if (h1El) h1El.textContent = '3-Key Vault Quorum';
  if (subEl) subEl.innerHTML = '<b>90-Second Quorum Protocol</b> for Studio Vault Access.';

  // Dynamic labels for the 3 Co-Owners
  const owners = quorumData?.owners || [
    'gujarattimecompany@gmail.com',
    'parthsherathiya181@gmail.com',
    'ramoliadk@gmail.com',
  ];
  const o1 = document.getElementById('quorum-owner-1');
  const o2 = document.getElementById('quorum-owner-2');
  const o3 = document.getElementById('quorum-owner-3');
  if (o1) { o1.textContent = owners[0] || 'gujarattimecompany@gmail.com'; o1.title = owners[0] || ''; }
  if (o2) { o2.textContent = owners[1] || 'parthsherathiya181@gmail.com'; o2.title = owners[1] || ''; }
  if (o3) { o3.textContent = owners[2] || 'ramoliadk@gmail.com'; o3.title = owners[2] || ''; }

  // Reset inputs and submit button
  const otp1 = document.getElementById('quorum-otp-1');
  const otp2 = document.getElementById('quorum-otp-2');
  const otp3 = document.getElementById('quorum-otp-3');
  const submitBtn = document.getElementById('btn-submit-quorum');
  const btnText = submitBtn?.querySelector('.btn-text');

  if (otp1) { otp1.value = ''; otp1.disabled = false; }
  if (otp2) { otp2.value = ''; otp2.disabled = false; }
  if (otp3) { otp3.value = ''; otp3.disabled = false; }
  if (otp1) otp1.focus();

  if (submitBtn) {
    submitBtn.disabled = false;
    delete submitBtn.dataset.action;
  }
  if (btnText) btnText.textContent = 'Authorize Quorum & Enter Studio';

  const countdownEl = document.getElementById('quorum-countdown');
  if (countdownEl) countdownEl.textContent = '01:30';

  showAuthAlert('3-Key Quorum generated. 90-second OTP keys dispatched via Gmail SMTP.', 'success');

  quorumTimerInterval = setInterval(() => {
    quorumTimeRemaining -= 1;
    const badgeEl = document.getElementById('quorum-countdown');
    if (badgeEl) badgeEl.textContent = formatQuorumTimer(quorumTimeRemaining);

    if (quorumTimeRemaining <= 0) {
      clearInterval(quorumTimerInterval);
      quorumTimerInterval = null;

      // 1. Clear all three OTP inputs and disable them
      if (otp1) { otp1.value = ''; otp1.disabled = true; }
      if (otp2) { otp2.value = ''; otp2.disabled = true; }
      if (otp3) { otp3.value = ''; otp3.disabled = true; }

      // 2. Change the alert message to crimson
      showAuthAlert(
        '⚠️ SECURITY TIMEOUT: The 3 Co-Owner OTP keys have self-destructed after 90 seconds.',
        'error'
      );

      // 3. Change primary button text to "REQUEST NEW 90s QUORUM KEYS"
      if (btnText) btnText.textContent = 'REQUEST NEW 90s QUORUM KEYS';
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.dataset.action = 'request_new';
      }
    }
  }, 1000);
}

function showAuthAlert(message, type = 'error') {
  const alertEl = document.getElementById('gtc-auth-alert');
  if (!alertEl) return;
  alertEl.innerHTML = message;
  alertEl.className = `gtc-auth-alert ${type}`;
}

function clearAuthAlert() {
  const alertEl = document.getElementById('gtc-auth-alert');
  if (!alertEl) return;
  alertEl.textContent = '';
  alertEl.className = 'gtc-auth-alert';
}

/**
 * Initializes Auth Modal listeners, responsive layout engine, and initial session check.
 */
export function initAuthModal() {
  ensureAuthModalDOM();
  triggerLayout = initResponsiveStageEngine();

  const modal = document.getElementById('gtc-auth-modal');
  const closeBtn = document.getElementById('gtc-auth-close-btn');
  const tabSigninBtn = document.getElementById('tab-signin-btn');
  const tabSignupBtn = document.getElementById('tab-signup-btn');
  const secondaryBtn = document.getElementById('gtc-secondary-btn');
  const bottomLink = document.getElementById('bottom-toggle-link');
  const signinForm = document.getElementById('gtc-signin-form');
  const signupForm = document.getElementById('gtc-signup-form');

  tabSigninBtn?.addEventListener('click', () => switchAuthTab('signin'));
  tabSignupBtn?.addEventListener('click', () => switchAuthTab('signup'));

  secondaryBtn?.addEventListener('click', () => {
    const isSignin = tabSigninBtn?.classList.contains('active');
    switchAuthTab(isSignin ? 'signup' : 'signin');
  });

  bottomLink?.addEventListener('click', (e) => {
    e.preventDefault();
    const isSignin = tabSigninBtn?.classList.contains('active');
    switchAuthTab(isSignin ? 'signup' : 'signin');
  });

  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeAuthModal();
  };

  // Immediate close on pointerdown (removes 300ms mobile touch delay) + click fallback
  closeBtn?.addEventListener('pointerdown', handleClose);
  closeBtn?.addEventListener('click', handleClose);
  modal?.addEventListener('pointerdown', (e) => {
    if (e.target === modal) handleClose(e);
  });
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) handleClose(e);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('active')) {
      closeAuthModal();
    }
  });

  // 1. Sign In Submission
  signinForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthAlert();

    const email = document.getElementById('auth-signin-email')?.value || '';
    const password = document.getElementById('auth-signin-password')?.value || '';
    const submitBtn = document.getElementById('btn-submit-signin');
    const btnText = submitBtn?.querySelector('.btn-text');

    if (!email || !password) {
      showAuthAlert('Please provide both your collector email and password.', 'error');
      return;
    }

    if (!validateEmail(email)) {
      showAuthAlert('Please enter a valid email address.', 'error');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        if (btnText) btnText.textContent = 'Verifying Credentials...';
      }

      const loginResult = await loginUser(email, password);
      const { user, role, requiresQuorum } = loginResult;
      const quorumData = loginResult.quorumData || loginResult;

      if ((role === 'admin' || role === 'pending_admin_quorum') && requiresQuorum) {
        startQuorumCountdown(quorumData, user);
        if (submitBtn) {
          submitBtn.disabled = false;
          if (btnText) btnText.textContent = 'Enter the Vault';
        }
        return;
      }

      activeUser = user;
      activeRole = role;

      // When customer logs in successfully, their limits refresh and become a fresh start
      if (email) resetUserSecurityLimits(email);
      clearAllRateLimits();
      if (typeof fetch !== 'undefined') {
        fetch('/api/reset-rate-limit', { method: 'POST' }).catch(() => {});
      }

      showAuthAlert('Credentials verified. Welcome to the Master Vault.', 'success');
      updateNavbarAuthState(user, role);

      setTimeout(() => {
        closeAuthModal();
        signinForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          if (btnText) btnText.textContent = 'Enter the Vault';
        }

        // If they were trying to click Purchase or Inquiry, resume that click automatically!
        if (pendingActionElement) {
          const elToTrigger = pendingActionElement;
          pendingActionElement = null;
          elToTrigger.click();
        }
      }, 700);
    } catch (err) {
      const isEmailNotConfirmed =
        err?.code === 'email_not_confirmed' ||
        /email not confirmed/i.test(err?.message || '');

      if (isEmailNotConfirmed) {
        showAuthAlert(
          `Email not confirmed yet. <button type="button" id="resend-confirmation-btn" style="background:none;border:none;color:#C9A84C;text-decoration:underline;cursor:pointer;font-family:inherit;font-size:inherit;font-weight:600;padding:0;margin-left:4px;">Resend confirmation email</button>`,
          'error'
        );

        const resendBtn = document.getElementById('resend-confirmation-btn');
        if (resendBtn) {
          resendBtn.addEventListener('click', async (btnEvt) => {
            btnEvt.preventDefault();
            btnEvt.stopPropagation();
            resendBtn.disabled = true;
            resendBtn.textContent = 'Sending...';
            try {
              await resendConfirmationEmail(email);
              showAuthAlert('Confirmation link resent! Please check your email inbox.', 'success');
            } catch (resendErr) {
              showAuthAlert(resendErr.message || 'Unable to resend email.', 'error');
            }
          });
        }
      } else {
        showAuthAlert(err.message || 'Authentication error. Please verify your credentials.', 'error');
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Enter the Vault';
      }
    }
  });

  // 2. Sign Up Submission
  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthAlert();

    const fullName = document.getElementById('auth-signup-name')?.value || '';
    const phone = document.getElementById('auth-signup-phone')?.value || '';
    const email = document.getElementById('auth-signup-email')?.value || '';
    const password = document.getElementById('auth-signup-password')?.value || '';
    const submitBtn = document.getElementById('btn-submit-signup');
    const btnText = submitBtn?.querySelector('.btn-text');

    if (!fullName || !phone || !email || !password) {
      showAuthAlert('All fields are required to register a collector profile.', 'error');
      return;
    }

    if (!validateEmail(email)) {
      showAuthAlert('Please enter a valid email address.', 'error');
      return;
    }

    if (!validatePhone(phone)) {
      showAuthAlert('Please enter a valid phone number (e.g. +91 98250 00000).', 'error');
      return;
    }

    if (password.length < 8) {
      showAuthAlert('Password must be at least 8 characters in length for vault security.', 'error');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        if (btnText) btnText.textContent = 'Registering Profile...';
      }

      const user = await signUpCustomer(email, password, fullName, phone);

      if (user?.needsEmailConfirmation) {
        showAuthAlert(
          'Account created! A confirmation link has been sent to your email. Please verify your email before logging in.',
          'success'
        );

        if (submitBtn) {
          submitBtn.disabled = false;
          if (btnText) btnText.textContent = 'Register Collector Profile';
        }

        setTimeout(() => {
          switchAuthTab('signin');
          const signinEmail = document.getElementById('auth-signin-email');
          if (signinEmail) signinEmail.value = email;
        }, 1800);

        return;
      }

      activeUser = user;
      activeRole = 'customer';

      showAuthAlert('Collector profile established. Welcome to Maison GTC.', 'success');
      updateNavbarAuthState(user, 'customer');

      setTimeout(() => {
        closeAuthModal();
        signupForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          if (btnText) btnText.textContent = 'Register Collector Profile';
        }

        // If they were trying to click Purchase or Inquiry, resume that click automatically!
        if (pendingActionElement) {
          const elToTrigger = pendingActionElement;
          pendingActionElement = null;
          elToTrigger.click();
        }
      }, 900);
    } catch (err) {
      showAuthAlert(err.message || 'Unable to register collector profile.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Register Collector Profile';
      }
    }
  });

  // 3. Admin Quorum Form Submission
  const quorumForm = document.getElementById('gtc-quorum-form');
  quorumForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthAlert();

    const submitBtn = document.getElementById('btn-submit-quorum');
    const btnText = submitBtn?.querySelector('.btn-text');

    // If timed out, clicking requests new keys
    if (submitBtn?.dataset.action === 'request_new' || quorumTimeRemaining <= 0) {
      if (btnText) btnText.textContent = 'Dispatching 3 Keys...';
      if (submitBtn) submitBtn.disabled = true;

      try {
        const newQuorum = await requestAdminQuorumKeys(currentAdminUser?.email || 'gujrattimecompany@gmail.com');
        startQuorumCountdown(newQuorum, currentAdminUser);
      } catch (reqErr) {
        showAuthAlert(reqErr.message || 'Unable to generate new quorum keys.', 'error');
        if (btnText) btnText.textContent = 'REQUEST NEW 90s QUORUM KEYS';
        if (submitBtn) submitBtn.disabled = false;
      }
      return;
    }

    const otp1 = document.getElementById('quorum-otp-1')?.value || '';
    const otp2 = document.getElementById('quorum-otp-2')?.value || '';
    const otp3 = document.getElementById('quorum-otp-3')?.value || '';

    const clean1 = String(otp1).replace(/\D/g, '').trim();
    const clean2 = String(otp2).replace(/\D/g, '').trim();
    const clean3 = String(otp3).replace(/\D/g, '').trim();

    if (!clean1 || !clean2 || !clean3 || clean1.length !== 6 || clean2.length !== 6 || clean3.length !== 6) {
      showAuthAlert('All 3 Co-Owner cryptographic keys must be 6 digits and entered simultaneously.', 'error');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        if (btnText) btnText.textContent = 'Validating 3-Key Quorum...';
      }

      const qId = activeQuorumData?.quorumId || activeQuorumData?.requestId || activeQuorumData?.id;
      await verifyAdminQuorum(qId, clean1, clean2, clean3, activeQuorumData);

      if (quorumTimerInterval) {
        clearInterval(quorumTimerInterval);
        quorumTimerInterval = null;
      }

      if (!currentAdminUser && typeof sessionStorage !== 'undefined') {
        try {
          const saved = sessionStorage.getItem('gtc_current_admin');
          if (saved) currentAdminUser = JSON.parse(saved);
        } catch (e) {}
      }

      activeUser = currentAdminUser;
      activeRole = 'admin';
      try {
        sessionStorage.setItem('gtc_admin_authenticated', JSON.stringify(currentAdminUser));
      } catch (e) {}

      showAuthAlert('3-Key Quorum Verified. Access granted to Admin Master Vault.', 'success');
      updateNavbarAuthState(currentAdminUser, 'admin');
      notifyAdminLoginUnlocked(
        currentAdminUser?.email,
        currentAdminUser?.user_metadata?.full_name || currentAdminUser?.email?.split('@')[0]
      ).catch(() => {});
      window.dispatchEvent(new CustomEvent('gtc:admin-unlocked', { detail: { user: currentAdminUser } }));

      setTimeout(() => {
        closeAuthModal();
        quorumForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          if (btnText) btnText.textContent = 'Authorize Quorum & Enter Studio';
        }
      }, 800);
    } catch (err) {
      showAuthAlert(err.message || 'Quorum authentication rejected.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Authorize Quorum & Enter Studio';
      }
    }
  });

  // 4. Resend Quorum Keys Button
  const resendQuorumBtn = document.getElementById('btn-resend-quorum');
  resendQuorumBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    resendQuorumBtn.disabled = true;
    const resendText = resendQuorumBtn.querySelector('.resend-text');
    if (resendText) resendText.textContent = 'Dispatching 3 Keys...';
    showAuthAlert('Generating fresh 90s keys and emailing all 3 Co-Owners...', 'success');

    try {
      const emailToUse = currentAdminUser?.email || 'gujarattimecompany@gmail.com';
      const newQuorum = await requestAdminQuorumKeys(emailToUse);
      startQuorumCountdown(newQuorum, currentAdminUser);
      showAuthAlert('Fresh 90s OTP keys dispatched to all 3 Co-Owners!', 'success');
    } catch (err) {
      showAuthAlert(err.message || 'Unable to refresh quorum keys.', 'error');
    } finally {
      resendQuorumBtn.disabled = false;
      if (resendText) resendText.textContent = 'Resend 90s OTP Keys';
    }
  });

  // 5. Cancel Quorum / Back to Login Button
  const cancelQuorumBtn = document.getElementById('btn-cancel-quorum');
  cancelQuorumBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    switchAuthTab('signin');
  });

  // 6. Quorum OTP auto-advance, smart paste & numeric sanitize
  const otpIds = ['quorum-otp-1', 'quorum-otp-2', 'quorum-otp-3'];
  otpIds.forEach((id, idx) => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData)?.getData('text') || '';
      // Support multi-key paste (e.g. copying 3 OTPs from console or email: "123456 654321 789012")
      const tokens = text.replace(/[^\d,\s-]/g, '').trim().split(/[\s,\-]+/).map(t => t.replace(/\D/g, '')).filter(t => t.length === 6);

      if (tokens.length >= 3) {
        tokens.slice(0, 3).forEach((token, tIdx) => {
          const targetInput = document.getElementById(otpIds[tIdx]);
          if (targetInput) targetInput.value = token;
        });
        document.getElementById(otpIds[2])?.focus();
        return;
      }

      // Single 6-digit key pasted (strips spaces and non-digits)
      const cleaned = text.replace(/\D/g, '').slice(0, 6);
      input.value = cleaned;
      if (cleaned.length === 6 && idx < otpIds.length - 1) {
        document.getElementById(otpIds[idx + 1])?.focus();
      }
    });

    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, 6);
      if (input.value.length === 6 && idx < otpIds.length - 1) {
        document.getElementById(otpIds[idx + 1])?.focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && idx > 0) {
        document.getElementById(otpIds[idx - 1])?.focus();
      }
    });
  });

  // 7. Forgot Password Link Click
  const forgotPwBtn = document.getElementById('btn-forgot-password');
  forgotPwBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const signinEmail = document.getElementById('auth-signin-email')?.value || '';
    const resetEmailInput = document.getElementById('reset-email-input');
    if (resetEmailInput && signinEmail) {
      resetEmailInput.value = signinEmail.trim();
    }
    const stepA = document.getElementById('reset-step-a');
    const stepB = document.getElementById('reset-step-b');
    if (stepA) stepA.style.display = 'block';
    if (stepB) stepB.style.display = 'none';
    switchAuthTab('reset');
    setTimeout(() => {
      resetEmailInput?.focus();
    }, 150);
  });

  // 8. Back to Sign In from Reset
  const backToSigninBtn = document.getElementById('btn-back-to-signin');
  backToSigninBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    stopResetCountdown();
    switchAuthTab('signin');
  });

  // 9. Send Reset OTP Form Submission (Step A)
  const resetEmailForm = document.getElementById('gtc-reset-email-form');
  resetEmailForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthAlert();

    const emailInput = document.getElementById('reset-email-input');
    const email = (emailInput?.value || '').trim().toLowerCase();
    const sendBtn = document.getElementById('btn-send-reset-otp');
    const btnText = sendBtn?.querySelector('.btn-text');

    if (!email || !email.includes('@')) {
      showAuthAlert('Please enter a valid account email address.', 'error');
      emailInput?.focus();
      return;
    }

    try {
      if (sendBtn) {
        sendBtn.disabled = true;
        if (btnText) btnText.textContent = 'Dispatching Link...';
      }

      const resetData = await requestPasswordReset(email);
      activeResetSession = resetData;

      const targetEmailTxt = document.getElementById('reset-target-email-txt');
      if (targetEmailTxt) targetEmailTxt.textContent = resetData.email;

      // Reveal Step B (Visual Dialogue Box) and hide Step A
      const stepA = document.getElementById('reset-step-a');
      const stepB = document.getElementById('reset-step-b');
      if (stepA) stepA.style.display = 'none';
      if (stepB) stepB.style.display = 'block';

      // Start 2-minute countdown timer
      startResetCountdown(resetData.expiresInSeconds || 120);

      const resetDesc = document.querySelector('#reset-step-b .gtc-reset-desc');
      if (resetDesc) {
        resetDesc.innerHTML = `Recovery key dispatched to <strong style="color:#C9A84C;">${resetData.email}</strong>. Enter the 6-digit key and set your new password below:`;
      }

      showAuthAlert(
        `Password recovery email dispatched to ${resetData.email}! Check your inbox (or spam) and set your new password below.`,
        'success'
      );

      const otpInput = document.getElementById('reset-otp-input');
      if (otpInput) {
        otpInput.value = '';
        setTimeout(() => otpInput.focus(), 150);
      }
    } catch (err) {
      let errMsg = err.message || 'Unable to request password recovery.';
      if (errMsg.includes('Too many password reset requests') || errMsg.includes('limit')) {
        errMsg += ` <button type="button" id="btn-quick-reset-limit" style="background:none;border:none;color:#C9A84C;text-decoration:underline;cursor:pointer;font-family:inherit;font-size:inherit;font-weight:600;padding:0;margin-left:6px;">Reset Limit Now</button>`;
      }
      showAuthAlert(errMsg, 'error');

      const quickResetBtn = document.getElementById('btn-quick-reset-limit');
      if (quickResetBtn) {
        quickResetBtn.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          resetUserSecurityLimits(email);
          clearAllRateLimits();
          if (typeof fetch !== 'undefined') {
            fetch('/api/reset-rate-limit', { method: 'POST' }).catch(() => {});
          }
          showAuthAlert('Rate limit refreshed! Please click "Send Recovery OTP" to continue.', 'success');
        });
      }
    } finally {
      if (sendBtn && (!activeResetSession || activeResetSession.mode !== 'email_link')) {
        sendBtn.disabled = false;
        if (btnText) btnText.textContent = 'Send Recovery OTP';
      }
    }
  });

  // 10. Resend Reset OTP (Inside Step B)
  const resendResetOtpBtn = document.getElementById('btn-resend-reset-otp');
  resendResetOtpBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearAuthAlert();

    const email = activeResetSession?.email || (document.getElementById('reset-email-input')?.value || '').trim();
    if (!email) {
      showAuthAlert('Account email missing. Please return to Step 1.', 'error');
      return;
    }

    resendResetOtpBtn.disabled = true;
    showAuthAlert('Dispatching fresh recovery key...', 'success');

    try {
      const resetData = await requestPasswordReset(email);
      activeResetSession = resetData;
      if (resetData.mode === 'email_link') {
        showAuthAlert(`Fresh password reset link dispatched to ${resetData.email}. Check your email!`, 'success');
      } else {
        startResetCountdown(resetData.expiresInSeconds || 120);
        showAuthAlert('Fresh 6-digit recovery key dispatched! Check your email.', 'success');
      }
      const submitBtn = document.getElementById('btn-submit-new-password');
      if (submitBtn) submitBtn.disabled = false;
    } catch (err) {
      let errMsg = err.message || 'Unable to resend recovery email.';
      if (errMsg.includes('Too many password reset requests') || errMsg.includes('limit')) {
        errMsg += ` <button type="button" id="btn-quick-resend-reset" style="background:none;border:none;color:#C9A84C;text-decoration:underline;cursor:pointer;font-family:inherit;font-size:inherit;font-weight:600;padding:0;margin-left:6px;">Reset Limit Now</button>`;
      }
      showAuthAlert(errMsg, 'error');

      const quickResendReset = document.getElementById('btn-quick-resend-reset');
      if (quickResendReset) {
        quickResendReset.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          resetUserSecurityLimits(email);
          clearAllRateLimits();
          if (typeof fetch !== 'undefined') {
            fetch('/api/reset-rate-limit', { method: 'POST' }).catch(() => {});
          }
          showAuthAlert('Rate limit refreshed! Please click "Resend Recovery Key" to continue.', 'success');
        });
      }
    } finally {
      resendResetOtpBtn.disabled = false;
    }
  });

  // 11. Verify OTP & Overwrite Password Form Submission (Step B)
  const resetVerifyForm = document.getElementById('gtc-reset-verify-form');
  resetVerifyForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthAlert();

    const otpInput = document.getElementById('reset-otp-input');
    const newPwInput = document.getElementById('reset-new-password');
    const confirmPwInput = document.getElementById('reset-confirm-password');
    const submitBtn = document.getElementById('btn-submit-new-password');
    const btnText = submitBtn?.querySelector('.btn-text');

    const otp = (otpInput?.value || '').replace(/\D/g, '').trim();
    const newPassword = (newPwInput?.value || '').trim();
    const confirmPassword = (confirmPwInput?.value || '').trim();

    const isDirectLinkMode = activeResetSession?.mode === 'authenticated_recovery';

    if (!isDirectLinkMode && !activeResetSession?.resetId) {
      showAuthAlert('Recovery session expired or missing. Please request a new recovery link.', 'error');
      return;
    }

    if (!isDirectLinkMode && (!otp || otp.length !== 6)) {
      showAuthAlert('Please enter the full 6-digit recovery OTP key.', 'error');
      otpInput?.focus();
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      showAuthAlert('New password must be at least 6 characters long.', 'error');
      newPwInput?.focus();
      return;
    }

    if (newPassword !== confirmPassword) {
      showAuthAlert('Passwords do not match. Please ensure both passwords match.', 'error');
      confirmPwInput?.focus();
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        if (btnText) btnText.textContent = 'Updating Vault Password...';
      }

      if (isDirectLinkMode) {
        // Authenticated customer directly updating password via email link
        const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
        if (updateErr) throw updateErr;
      } else {
        await confirmPasswordReset(
          activeResetSession.resetId,
          activeResetSession.email,
          otp,
          newPassword
        );
      }

      stopResetCountdown();

      // Clear rate limits & lockout so customer has a clean fresh start after updating password
      const finishedEmail = activeResetSession?.email || '';
      if (finishedEmail) resetUserSecurityLimits(finishedEmail);
      clearAllRateLimits();
      if (typeof fetch !== 'undefined') {
        fetch('/api/reset-rate-limit', { method: 'POST' }).catch(() => {});
      }

      showAuthAlert('Your password was successfully changed! Your new password has been automatically updated in the database.', 'success');

      // Populate sign-in email field and switch back to sign-in view
      const signinEmailInput = document.getElementById('auth-signin-email');
      const signinPwInput = document.getElementById('auth-signin-password');
      if (signinEmailInput && finishedEmail) {
        signinEmailInput.value = finishedEmail;
      }
      if (signinPwInput) signinPwInput.value = '';

      resetEmailForm?.reset();
      resetVerifyForm?.reset();
      activeResetSession = null;

      // Restore OTP field visibility if hidden
      const otpField = document.getElementById('reset-otp-input')?.closest('.gtc-field');
      if (otpField) otpField.style.display = 'block';

      const matchHintEl = document.getElementById('reset-pw-match-hint');
      if (matchHintEl) matchHintEl.style.display = 'none';

      setTimeout(() => {
        switchAuthTab('signin');
        if (signinPwInput) signinPwInput.focus();
        if (submitBtn) {
          submitBtn.disabled = false;
          if (btnText) btnText.textContent = 'Save & Update Password';
        }
      }, 1800);
    } catch (err) {
      showAuthAlert(err.message || 'Failed to update password.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Save & Update Password';
      }
    }
  });

  // 12. Password Strength & Match Real-Time Indicator
  const newPwInputEl = document.getElementById('reset-new-password');
  const confirmPwInputEl = document.getElementById('reset-confirm-password');
  const matchHintEl = document.getElementById('reset-pw-match-hint');

  function updateMatchHint() {
    if (!matchHintEl || !newPwInputEl || !confirmPwInputEl) return;
    const v1 = newPwInputEl.value;
    const v2 = confirmPwInputEl.value;
    if (!v1 && !v2) {
      matchHintEl.style.display = 'none';
      return;
    }
    matchHintEl.style.display = 'block';
    if (v1.length < 6) {
      matchHintEl.textContent = 'Password must be at least 6 characters.';
      matchHintEl.style.color = '#fca5a5';
    } else if (v2 && v1 !== v2) {
      matchHintEl.textContent = 'Passwords do not match yet.';
      matchHintEl.style.color = '#fca5a5';
    } else if (v2 && v1 === v2) {
      matchHintEl.textContent = 'Passwords match perfectly ✓';
      matchHintEl.style.color = '#4ade80';
    } else {
      matchHintEl.textContent = 'Minimum 6 characters requirement met.';
      matchHintEl.style.color = 'var(--gtc-gold)';
    }
  }

  newPwInputEl?.addEventListener('input', updateMatchHint);
  confirmPwInputEl?.addEventListener('input', updateMatchHint);

  // 13. Universal Password Visibility Eye Toggle Handler
  document.querySelectorAll('.btn-toggle-pw').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.getAttribute('type') === 'password';
      input.setAttribute('type', isPassword ? 'text' : 'password');

      const eyeShow = btn.querySelector('.eye-show');
      const eyeHide = btn.querySelector('.eye-hide');
      if (eyeShow && eyeHide) {
        eyeShow.style.display = isPassword ? 'none' : 'block';
        eyeHide.style.display = isPassword ? 'block' : 'none';
      }
    });
  });

  // 14. Reset OTP numeric sanitizer & auto-paste
  const resetOtpInput = document.getElementById('reset-otp-input');
  if (resetOtpInput) {
    resetOtpInput.addEventListener('input', () => {
      resetOtpInput.value = resetOtpInput.value.replace(/\D/g, '').slice(0, 6);
    });
    resetOtpInput.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData)?.getData('text') || '';
      resetOtpInput.value = text.replace(/\D/g, '').slice(0, 6);
    });
  }

  // 13. Automatic Email Recovery Link Detection
  function activateEmailRecoveryMode(userEmail = '') {
    ensureAuthModalDOM();
    openAuthModal();
    switchAuthTab('reset');

    const stepA = document.getElementById('reset-step-a');
    const stepB = document.getElementById('reset-step-b');
    if (stepA) stepA.style.display = 'none';
    if (stepB) stepB.style.display = 'block';

    const otpField = document.getElementById('reset-otp-input')?.closest('.gtc-field');
    if (otpField) otpField.style.display = 'none';

    activeResetSession = {
      mode: 'authenticated_recovery',
      email: userEmail
    };

    const targetEmailTxt = document.getElementById('reset-target-email-txt');
    if (targetEmailTxt) {
      targetEmailTxt.textContent = userEmail || 'your verified email';
    }

    const resetDesc = document.querySelector('#reset-step-b .gtc-reset-desc');
    if (resetDesc) {
      resetDesc.innerHTML = 'Email link verified! Enter your new vault password below:';
    }

    // Reset limits since customer proved email ownership
    if (userEmail) resetUserSecurityLimits(userEmail);
    clearAllRateLimits();
    if (typeof fetch !== 'undefined') {
      fetch('/api/reset-rate-limit', { method: 'POST' }).catch(() => {});
    }

    showAuthAlert('Email recovery verified. Please enter your new password.', 'success');
  }

  // Check on initial load if URL contains recovery token from email click
  if (typeof window !== 'undefined') {
    const isRecoveryHash = window.location.hash.includes('type=recovery') || window.location.href.includes('type=recovery');
    if (isRecoveryHash) {
      setTimeout(() => activateEmailRecoveryMode(), 250);
    }

    // Listen to Supabase PASSWORD_RECOVERY and SIGNED_IN events
    if (supabase) {
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          activateEmailRecoveryMode(session?.user?.email || '');
        } else if (event === 'SIGNED_IN') {
          const userEmail = session?.user?.email;
          if (userEmail) resetUserSecurityLimits(userEmail);
          clearAllRateLimits();
          if (typeof fetch !== 'undefined') {
            fetch('/api/reset-rate-limit', { method: 'POST' }).catch(() => {});
          }
        }
      });
    }
  }

  // Activate the protected action gatekeeper
  setupProtectedActionGate();

  getCurrentUserWithRole().then(({ user, role }) => {
    activeUser = user;
    activeRole = role;
    updateNavbarAuthState(user, role);
  });
}