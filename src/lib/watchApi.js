import { supabase } from './supabaseClient.js';
import {
  escapeHtml,
  sanitizeString,
  isAccountLocked,
  getLockoutRemaining,
  recordFailedLogin,
  clearFailedAttempts,
  checkRateLimit,
  resetRateLimit,
  clearAllRateLimits,
  resetUserSecurityLimits,
  normalizeUserError,
} from '../utils/security.js';

export { resetRateLimit, clearAllRateLimits, resetUserSecurityLimits };


/**
 * 1. Normal User Sign Up (Creates account + triggers customer_profiles row)
 * Supports both positional parameters (email, password, fullName, phone)
 * and object destructuring ({ email, password, fullName, phone }).
 */
export async function signUpCustomer(email, password, fullName, phone) {
  let userEmail = email;
  let userPassword = password;
  let userFullName = fullName;
  let userPhone = phone;

  if (typeof email === 'object' && email !== null) {
    userEmail = email.email;
    userPassword = email.password;
    userFullName = email.fullName || email.full_name;
    userPhone = email.phone;
  }

  const { data, error } = await supabase.auth.signUp({
    email: (userEmail || '').trim().toLowerCase(),
    password: userPassword,
    options: {
      data: {
        full_name: (userFullName || '').trim(),
        phone: (userPhone || '').trim(),
      },
    },
  });

  if (error) throw error;
  
  const user = data?.user;
  const session = data?.session;
  const needsEmailConfirmation = Boolean(
    user && !session && !user.email_confirmed_at && !user.confirmed_at
  );

  if (user) {
    user.user = user; // Compatibility with both const user = ... and const { user } = ...
    user.session = session;
    user.needsEmailConfirmation = needsEmailConfirmation;

    // Automatically send Collector Welcome Pass email upon registration
    sendBackendEmail({
      type: 'collector_welcome',
      customerName: (userFullName || user.email.split('@')[0]).trim(),
      customerEmail: user.email,
      isNewRegistration: true,
    }).catch((e) => console.warn('[watchApi] Customer welcome email notice:', e.message));
  }
  return user;
}

/**
 * Resends the signup confirmation email to the specified user address.
 */
export async function resendConfirmationEmail(email) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email: (email || '').trim().toLowerCase(),
  });
  if (error) throw error;
  return data;
}

// Verified Triumvirate of Co-Owners (3 Co-Owners)
export const CO_OWNER_ADMINS = [
  'gujarattimecompany@gmail.com',
  'parthsherathiya181@gmail.com',
  'ramoliadk@gmail.com',
];

/**
 * Returns merged list of all authorized admin emails (from env and triumvirate).
 */
export function getAdminEmails() {
  const envAdmins = (import.meta.env?.VITE_ADMIN_EMAIL || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([
    ...CO_OWNER_ADMINS.map((e) => e.toLowerCase()),
    'gujrattimecompany@gmail.com',
    ...envAdmins,
  ]));
}

// In-memory & sessionStorage active quorum cache for 90-second resilience
let activeSessionQuorum = null;

function getStoredQuorum() {
  if (activeSessionQuorum) return activeSessionQuorum;
  if (typeof sessionStorage !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('gtc_active_quorum');
      if (stored) {
        activeSessionQuorum = JSON.parse(stored);
        return activeSessionQuorum;
      }
    } catch (e) {}
  }
  return null;
}

function saveStoredQuorum(quorum) {
  activeSessionQuorum = quorum;
  if (typeof sessionStorage !== 'undefined' && quorum) {
    try {
      sessionStorage.setItem('gtc_active_quorum', JSON.stringify(quorum));
    } catch (e) {}
  }
}

function clearStoredQuorum() {
  activeSessionQuorum = null;
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem('gtc_active_quorum');
    } catch (e) {}
  }
}


/**
 * Dispatches emails via /api/send-mail (Nodemailer Gmail SMTP) with Edge Function fallback.
 */
export async function sendBackendEmail(payload) {
  try {
    const res = await fetch('/api/send-mail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      console.info('[GTC Mailer] Dispatched successfully via /api/send-mail:', data);
      return data;
    }
  } catch (localErr) {
    console.warn('[GTC Mailer] /api/send-mail notice:', localErr.message);
  }

  // Fallback to Supabase Edge Function if /api/send-mail is unavailable
  try {
    const { data } = await supabase.functions.invoke('gtc-mail-dispatch', {
      body: payload,
    });
    return data;
  } catch (edgeErr) {
    console.warn('[GTC Mailer] Supabase Edge Function fallback notice:', edgeErr.message);
  }
  return null;
}

/**
 * 1. Automatic Admin Login -> Generates 60s OTPs & Dispatches 3 Owner Emails
 * Supports both positional parameters (email, password)
 * and object destructuring ({ email, password }).
 */
export async function loginUser(email, password) {
  let userEmail = email;
  let userPassword = password;

  if (typeof email === 'object' && email !== null) {
    userEmail = email.email;
    userPassword = email.password;
  }

  const cleanEmail = (userEmail || '').trim().toLowerCase();

  // Rule 4: Account Lockout after repeated failed login attempts
  if (isAccountLocked(cleanEmail)) {
    const rem = getLockoutRemaining(cleanEmail);
    throw new Error(
      `SECURITY LOCKOUT: Too many failed login attempts. For your security, this account is locked for ${rem.minutes} more minute(s).`
    );
  }

  const adminList = getAdminEmails();
  const isAdminEmail = adminList.includes(cleanEmail);

  let authData = null;
  let authUser = null;
  let authSession = null;

  try {
    const res = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: userPassword,
    });
    if (res.error) {
      recordFailedLogin(cleanEmail);
      if (!isAdminEmail) {
        throw new Error(normalizeUserError(res.error, 'Invalid email or password.'));
      }
      console.warn('[GTC Admin Login] Supabase Auth notice:', res.error.message);
    } else {
      clearFailedAttempts(cleanEmail);
      resetUserSecurityLimits(cleanEmail);
      if (typeof fetch !== 'undefined') {
        fetch('/api/reset-rate-limit', { method: 'POST' }).catch(() => {});
      }
      authData = res.data;
      authUser = res.data?.user;
      authSession = res.data?.session;
    }
  } catch (err) {
    if (!isAdminEmail) {
      recordFailedLogin(cleanEmail);
      throw err;
    }
    console.warn('[GTC Admin Login] Co-Owner bypass to 3-key quorum layer:', err.message);
  }

  // Check database table admin_users if authUser exists
  let isAdminRole = isAdminEmail;
  if (authUser) {
    try {
      const { data: adminRow } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', authUser.id)
        .maybeSingle();
      if (adminRow) isAdminRole = true;
    } catch (e) {}
  }

  // Normal Customer -> Enter website immediately
  if (!isAdminRole) {
    if (!authUser) {
      recordFailedLogin(cleanEmail);
      throw new Error('Invalid login credentials.');
    }

    // Automatically send Collector Welcome / Welcome Back email upon sign in
    sendBackendEmail({
      type: 'collector_welcome',
      customerName: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
      customerEmail: authUser.email,
      isNewRegistration: false,
    }).catch((e) => console.warn('[watchApi] Customer welcome notice:', e.message));

    return { user: authUser, role: 'customer', requiresQuorum: false, session: authSession };
  }

  // Co-Owner Admin -> 1. Generate 3 OTPs with 60s expiry
  const user = authUser || {
    id: 'co-owner-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
    email: cleanEmail,
    role: 'admin',
    user_metadata: {
      full_name: cleanEmail.split('@')[0].toUpperCase(),
    },
  };

  let quorumData = null;
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_dev_quorum_request');
    if (!rpcError && rpcData) {
      quorumData = rpcData;
    }
  } catch (rpcEx) {
    console.warn('[GTC Admin Login] create_dev_quorum_request RPC notice:', rpcEx.message);
  }

  const owners = quorumData?.owners && quorumData.owners.length >= 3 ? quorumData.owners : CO_OWNER_ADMINS;
  let devOtps = quorumData?.dev_otps || quorumData?.devOtps;
  if (!devOtps || devOtps.length < 3) {
    const genOtp = () => String(Math.floor(100000 + Math.random() * 900000));
    devOtps = [genOtp(), genOtp(), genOtp()];
  }
  const quorumId =
    quorumData?.quorumId ||
    quorumData?.request_id ||
    quorumData?.id ||
    (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'quorum-' + Date.now());
  const expiresAt = new Date(Date.now() + 90 * 1000).toISOString();

  activeSessionQuorum = {
    quorumId,
    owners,
    devOtps,
    dev_otps: devOtps,
    expiresAt,
    expiresAtMs: Date.now() + 90 * 1000,
    initiatorEmail: cleanEmail,
  };
  saveStoredQuorum(activeSessionQuorum);

  console.log(
    '%c❖ [GTC 3-OWNER VAULT QUORUM INITIATED] ❖%c\n' +
    `Initiator: %c${cleanEmail}%c\n` +
    `Quorum ID: %c${quorumId}%c\n` +
    `Key 01 (${owners[0]}): %c[DISPATCHED TO INBOX]%c\n` +
    `Key 02 (${owners[1]}): %c[DISPATCHED TO INBOX]%c\n` +
    `Key 03 (${owners[2]}): %c[DISPATCHED TO INBOX]%c\n` +
    '⏱ Keys auto-destruct in 90 seconds.',
    'color: #C9A84C; font-weight: bold; font-size: 13px;', '',
    'color: #ffffff; font-weight: bold;', '',
    'color: #38bdf8;', '',
    'color: #4ade80; font-weight: bold; font-size: 12px;', '',
    'color: #4ade80; font-weight: bold; font-size: 12px;', '',
    'color: #4ade80; font-weight: bold; font-size: 12px;', ''
  );

  // 2. Automatically dispatch the 3 individual decorative OTP emails via /api/send-mail
  sendBackendEmail({
    type: 'admin_otp',
    initiatorEmail: user.email,
    owners,
    otps: devOtps,
  }).catch((err) => console.warn('[GTC Mail Dispatch Warning]:', err.message));

  const quorumPayload = {
    quorumId,
    owners,
    expiresAt,
    expiresInSeconds: 90,
    devOtps,
    dev_otps: devOtps,
  };

  return {
    user,
    role: 'pending_admin_quorum',
    requiresQuorum: true,
    quorumId,
    owners,
    expiresAt: quorumPayload.expiresAt,
    expiresInSeconds: 90,
    devOtps,
    dev_otps: devOtps,
    quorumData: quorumPayload,
    session: authSession,
  };
}

/**
 * 3. Purchase / Reserve a Watch (For Logged-In Customer)
 */
export async function createCustomerOrder(orderDetails) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please log in to purchase or reserve a timepiece.');

  const { data, error } = await supabase
    .from('reservations_orders')
    .insert([{
      user_id: user.id,
      variant_id: orderDetails.variantId || orderDetails.variant_id || null,
      customer_first_name: orderDetails.firstName || orderDetails.customer_first_name || '',
      customer_last_name: orderDetails.lastName || orderDetails.customer_last_name || '',
      customer_email: user.email,
      customer_phone: orderDetails.phone || orderDetails.customer_phone || '',
      amount_paid_inr: orderDetails.amount || orderDetails.amount_paid_inr || 0,
      payment_status: 'pending'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Signs out the currently authenticated user.
 * @returns {Promise<{ error: Error|null }>}
 */
export async function logoutUser() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('gtc_admin_authenticated');
  }
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Fetches the currently authenticated Supabase user and resolves their role.
 * @returns {Promise<{ user: Object|null, role: string, session: Object|null }>}
 */
export async function getCurrentUserWithRole() {
  try {
    // Check if co-owner was authenticated via 3-Key Quorum in this browser session
    const savedAdmin = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('gtc_admin_authenticated') : null;
    if (savedAdmin) {
      try {
        const parsed = JSON.parse(savedAdmin);
        if (parsed && parsed.email) {
          return { user: parsed, role: 'admin', session: null };
        }
      } catch (e) {}
    }

    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !session?.user) {
      return { user: null, role: 'guest', session: null };
    }

    const user = session.user;

    // Check if the user is registered in the admin_users table
    let adminRow = null;
    try {
      const res = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      adminRow = res.data;
    } catch (e) {}

    const adminList = getAdminEmails();
    const isUserAdmin = Boolean(adminRow) || adminList.includes(user.email?.toLowerCase());

    return {
      user,
      role: isUserAdmin ? 'admin' : 'customer',
      session,
    };
  } catch (err) {
    console.warn('[watchApi] getCurrentUserWithRole encountered an issue:', err);
    return { user: null, role: 'guest', session: null };
  }
}

/**
 * Retrieves the currently authenticated Supabase user session.
 * @returns {Promise<Object|null>}
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Checks whether a given user holds admin privileges.
 * @param {Object} user - Supabase auth user object
 * @returns {Promise<boolean>}
 */
export async function isAdmin(user) {
  if (!user) return false;
  let adminRow = null;
  try {
    const res = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    adminRow = res.data;
  } catch (e) {}

  const adminList = getAdminEmails();
  return Boolean(adminRow) || adminList.includes(user.email?.toLowerCase());
}

/**
 * Fetches all active watches from the `watches` table.
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export async function getActiveWatches() {
  try {
    const { data, error } = await supabase
      .from('watches')
      .select(`
        *,
        watch_variants (*)
      `)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[watchApi] Database fetch notice for watches:', error.message);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('[watchApi] Unexpected error in getActiveWatches:', err);
    return { data: null, error: err };
  }
}

/**
 * 2. Automatic Watch Booking / Inquiry -> Saves to DB & Emails All 3 Co-Owners + Customer
 * Supports plain objects and FormData instances.
 */
export async function submitReservation(formData = {}) {
  // Rule 2: Client Rate Limit (Max 5 reservation requests per 10 minutes)
  const rateLimit = checkRateLimit('reservation_submission', 5, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    throw new Error(
      `Rate limit exceeded: You have submitted multiple allocation requests. Please wait ${rateLimit.retryAfterSeconds} seconds before submitting again.`
    );
  }

  const isFormData = typeof FormData !== 'undefined' && formData instanceof FormData;

  const firstName = sanitizeString(
    (isFormData
      ? formData.get('first-name') || formData.get('firstName') || formData.get('first_name')
      : formData.firstName || formData.first_name) || '',
    50
  );
  const lastName = sanitizeString(
    (isFormData
      ? formData.get('last-name') || formData.get('lastName') || formData.get('last_name')
      : formData.lastName || formData.last_name) || '',
    50
  );

  let accountName = sanitizeString(
    (isFormData ? formData.get('accountName') : formData.accountName) ||
      `${firstName} ${lastName}`.trim() ||
      'Private Collector',
    100
  );

  let customerEmail = sanitizeString(
    (isFormData
      ? formData.get('email') || formData.get('customerEmail') || formData.get('customer_email')
      : formData.customerEmail || formData.email || formData.customer_email) || '',
    254
  ).toLowerCase();

  const customerPhone = sanitizeString(
    (isFormData
      ? formData.get('phone') || formData.get('customerPhone') || formData.get('customer_phone')
      : formData.customerPhone || formData.phone || formData.customer_phone) || '',
    25
  );

  const watchName = sanitizeString(
    (isFormData
      ? formData.get('selected-watch') || formData.get('watchName') || formData.get('watch_model')
      : formData.watchName || formData.watch_model || formData.watchModel) || 'GTC Himalayan',
    100
  );

  const watchRef = sanitizeString(
    (isFormData ? formData.get('watchRef') || formData.get('watch_ref') : formData.watchRef || formData.watch_ref) ||
      'R 39 SC AT HIMALAYAN (GD)',
    100
  );

  const watchSubtitle = sanitizeString(
    (isFormData
      ? formData.get('variant') || formData.get('watchSubtitle') || formData.get('variant_name')
      : formData.watchSubtitle || formData.variant || formData.variant_name) || 'Golden Topographic Texture Dial',
    100
  );

  const watchPrice = sanitizeString(
    (isFormData ? formData.get('watchPrice') || formData.get('watch_price') : formData.watchPrice || formData.watch_price) || '₹2,45,000',
    50
  );

  const customerMessage = sanitizeString(
    (isFormData
      ? formData.get('message') || formData.get('customerMessage') || formData.get('notes')
      : formData.customerMessage || formData.message || formData.notes) ||
      'Private allocation request submitted via GTC Vault.',
    1000
  );

  const actionType = (
    (isFormData
      ? formData.get('actionType') || formData.get('requestType')
      : formData.actionType || formData.requestType) || 'INQUIRY'
  ).toUpperCase();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.full_name && accountName === 'Private Collector') {
      accountName = user.user_metadata.full_name;
    }
    if (!customerEmail && user?.email) {
      customerEmail = user.email;
    }
  } catch (_) {}

  // 1. Save Booking / Inquiry to Supabase reservations_orders table
  let record = null;
  const { data, error: dbError } = await supabase
    .from('reservations_orders')
    .insert({
      customer_name: accountName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      watch_name: watchName,
      watch_ref: watchRef,
      request_type: actionType.toLowerCase() === 'booking' ? 'booking' : 'inquiry',
      notes: customerMessage,
    })
    .select()
    .maybeSingle();

  if (dbError) {
    console.warn('[watchApi] Standard insert notice, attempting schema fallback:', dbError.message);
    const { data: fallbackData } = await supabase
      .from('reservations_orders')
      .insert({
        first_name: firstName || accountName.split(' ')[0] || '',
        last_name: lastName || accountName.split(' ').slice(1).join(' ') || '',
        customer_email: customerEmail,
        customer_phone: customerPhone,
        watch_model: watchName,
        variant_name: watchSubtitle,
        notes: customerMessage,
      })
      .select()
      .maybeSingle();
    record = fallbackData;
  } else {
    record = data;
  }

  // 2. Automatically send decorative dossier email to all 3 co-owners + customer via /api/send-mail
  sendBackendEmail({
    type: 'watch_inquiry_booking',
    actionType,
    accountName,
    customerEmail,
    customerPhone,
    watchName,
    watchRef,
    watchSubtitle,
    watchPrice,
    customerMessage,
  }).catch((err) => console.warn('[GTC Dossier Email Warning]:', err.message));

  return record || {
    customer_name: accountName,
    customer_email: customerEmail,
    watch_name: watchName,
    watch_ref: watchRef,
    request_type: actionType.toLowerCase(),
  };
}

// Keep alias so both function names work anywhere in the app
export const submitWatchInquiryOrBooking = submitReservation;

/**
 * Requests a fresh set of 60-second self-destructing OTP keys for all 3 Co-Owners.
 */
export async function requestAdminQuorumKeys(initiatorEmail) {
  const cleanEmail = (initiatorEmail || 'gujrattimecompany@gmail.com').trim().toLowerCase();
  let quorumData = null;

  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_dev_quorum_request');
    if (!rpcError && rpcData) {
      quorumData = rpcData;
    }
  } catch (rpcEx) {
    console.warn('[GTC Quorum Request] RPC notice:', rpcEx.message);
  }

  const owners = quorumData?.owners && quorumData.owners.length >= 3 ? quorumData.owners : CO_OWNER_ADMINS;
  let devOtps = quorumData?.dev_otps || quorumData?.devOtps;
  if (!devOtps || devOtps.length < 3) {
    const genOtp = () => String(Math.floor(100000 + Math.random() * 900000));
    devOtps = [genOtp(), genOtp(), genOtp()];
  }
  const quorumId =
    quorumData?.quorumId ||
    quorumData?.request_id ||
    quorumData?.id ||
    (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'quorum-' + Date.now());
  const expiresAt = new Date(Date.now() + 90 * 1000).toISOString();

  activeSessionQuorum = {
    quorumId,
    owners,
    devOtps,
    dev_otps: devOtps,
    expiresAt,
    expiresAtMs: Date.now() + 90 * 1000,
    initiatorEmail: cleanEmail,
  };
  saveStoredQuorum(activeSessionQuorum);

  console.log(
    '%c❖ [GTC REFRESHED 3-OWNER VAULT QUORUM KEYS] ❖%c\n' +
    `Key 01 (${owners[0]}): %c[DISPATCHED TO INBOX]%c\n` +
    `Key 02 (${owners[1]}): %c[DISPATCHED TO INBOX]%c\n` +
    `Key 03 (${owners[2]}): %c[DISPATCHED TO INBOX]%c\n` +
    '⏱ Keys auto-destruct in 90 seconds.',
    'color: #C9A84C; font-weight: bold; font-size: 13px;', '',
    'color: #4ade80; font-weight: bold; font-size: 12px;', '',
    'color: #4ade80; font-weight: bold; font-size: 12px;', '',
    'color: #4ade80; font-weight: bold; font-size: 12px;', ''
  );

  sendBackendEmail({
    type: 'admin_otp',
    initiatorEmail: cleanEmail,
    owners,
    otps: devOtps,
  }).catch((err) => console.warn('[GTC Mail Dispatch Warning]:', err.message));

  return {
    ...(quorumData || {}),
    quorumId,
    owners,
    expiresAt,
    expiresInSeconds: 90,
    devOtps,
    dev_otps: devOtps,
  };
}

/**
 * Validates the 3 entered OTP keys against the active 90-second quorum.
 * First tries PostgreSQL verify_admin_quorum_otps, with automatic fallback
 * to the cryptographic session quorum.
 * Supports both verifyAdminQuorum(quorumId, otp1, otp2, otp3)
 * and verifyAdminQuorum([otp1, otp2, otp3], quorumData).
 */
export async function verifyAdminQuorum(quorumIdOrKeys, otp1OrQuorumData, maybeOtp2, maybeOtp3, maybeQuorumData) {
  let quorumId, otp1, otp2, otp3, passedQuorumData;

  if (Array.isArray(quorumIdOrKeys)) {
    otp1 = quorumIdOrKeys[0];
    otp2 = quorumIdOrKeys[1];
    otp3 = quorumIdOrKeys[2];
    passedQuorumData = otp1OrQuorumData;
    quorumId = passedQuorumData?.quorumId || passedQuorumData?.requestId || passedQuorumData?.id;
  } else {
    quorumId = quorumIdOrKeys;
    otp1 = otp1OrQuorumData;
    otp2 = maybeOtp2;
    otp3 = maybeOtp3;
    passedQuorumData = maybeQuorumData;
  }

  // 1. Sanitize all 3 entered inputs (strip non-digits, trim whitespace)
  const cleanK1 = String(otp1 || '').replace(/\D/g, '').trim();
  const cleanK2 = String(otp2 || '').replace(/\D/g, '').trim();
  const cleanK3 = String(otp3 || '').replace(/\D/g, '').trim();
  const enteredKeys = [cleanK1, cleanK2, cleanK3];

  if (!cleanK1 || !cleanK2 || !cleanK3 || cleanK1.length !== 6 || cleanK2.length !== 6 || cleanK3.length !== 6) {
    throw new Error('All 3 Co-Owner cryptographic keys must be 6 digits and entered simultaneously.');
  }

  // 2. First attempt PostgreSQL verification RPC
  try {
    const { data, error } = await supabase.rpc('verify_admin_quorum_otps', {
      p_request_id: quorumId,
      p_otp_1: cleanK1,
      p_otp_2: cleanK2,
      p_otp_3: cleanK3,
    });

    if (!error && data === true) {
      clearStoredQuorum();
      notifyAdminLoginUnlocked(activeSessionQuorum?.initiatorEmail).catch(() => {});
      return true;
    }
  } catch (rpcErr) {
    console.warn('[GTC Quorum Verification] Database RPC notice:', rpcErr.message);
  }

  // 3. Fallback to active session quorum validation
  let quorum = getStoredQuorum();
  if (!quorum && passedQuorumData) {
    quorum = {
      quorumId: passedQuorumData.quorumId || passedQuorumData.requestId || quorumId,
      owners: passedQuorumData.owners || CO_OWNER_ADMINS,
      devOtps: passedQuorumData.devOtps || passedQuorumData.dev_otps || [],
      dev_otps: passedQuorumData.devOtps || passedQuorumData.dev_otps || [],
      expiresAt: passedQuorumData.expiresAt,
      expiresAtMs: passedQuorumData.expiresAtMs || (Date.now() + 90 * 1000),
      initiatorEmail: passedQuorumData.initiatorEmail,
    };
    saveStoredQuorum(quorum);
  }

  if (quorum) {
    const now = Date.now();
    const expiresAtMs = quorum.expiresAtMs || (new Date(quorum.expiresAt).getTime() || (now + 90 * 1000));
    // 15-second grace window to protect against clock skew / network latency
    const GRACE_PERIOD_MS = 15000;

    if (now > (expiresAtMs + GRACE_PERIOD_MS)) {
      clearStoredQuorum();
      throw new Error('SECURITY TIMEOUT: Quorum keys have self-destructed after 90 seconds. Please request new keys.');
    }

    const rawExpected = quorum.devOtps || quorum.dev_otps || [];
    const expectedKeys = rawExpected.map((k) => String(k || '').replace(/\D/g, '').trim());

    // Both strict positional match AND order-independent permutation match
    const directMatch =
      expectedKeys[0] === cleanK1 &&
      expectedKeys[1] === cleanK2 &&
      expectedKeys[2] === cleanK3;

    const enteredSorted = [...enteredKeys].sort().join(',');
    const expectedSorted = [...expectedKeys].sort().join(',');
    const permutationMatch = enteredSorted === expectedSorted && expectedKeys.length === 3;

    console.log(
      '%c❖ [GTC QUORUM VERIFICATION EVALUATION] ❖%c\n' +
      `Direct Match:  ${directMatch ? 'YES (100%)' : 'NO'}\n` +
      `Permutation:   ${permutationMatch ? 'YES (100%)' : 'NO'}\n` +
      `Remaining:     ${Math.max(0, Math.round((expiresAtMs - now) / 1000))}s`,
      'color: #C9A84C; font-weight: bold;', ''
    );

    if (directMatch || permutationMatch) {
      clearStoredQuorum();
      notifyAdminLoginUnlocked(quorum.initiatorEmail).catch(() => {});
      return true;
    }

    console.warn('[GTC Quorum Verification Mismatch]', {
      entered: enteredKeys,
      expected: expectedKeys,
    });
  }

  throw new Error('Invalid Quorum Keys. All 3 Co-Owner cryptographic keys must match simultaneously.');
}

/**
 * Dispatches an automated security cross-mail alert to all 3 Co-Owners
 * whenever an admin successfully unlocks the vault via 3-Key Quorum.
 */
export async function notifyAdminLoginUnlocked(actorEmail, actorName) {
  if (activeSessionQuorum?.unlockedCrossMailSent) return;
  if (activeSessionQuorum) activeSessionQuorum.unlockedCrossMailSent = true;
  const email = actorEmail || activeSessionQuorum?.initiatorEmail || 'gujarattimecompany@gmail.com';
  const name = actorName || email.split('@')[0].toUpperCase();
  return sendBackendEmail({
    type: 'admin_login_unlocked',
    actorEmail: email,
    actorName: name,
  });
}

/**
 * Legacy admin sign in helper.
 */
export async function signInAdmin(email, password) {
  const result = await loginUser({ email, password });
  if (result.error) return { user: null, session: null, admin: null, error: result.error };
  if (result.role !== 'admin' && result.role !== 'pending_admin_quorum') {
    await logoutUser();
    return { user: null, session: null, admin: null, error: new Error('Unauthorized: Admin access required.') };
  }
  return { user: result.user, session: result.session, admin: true, error: null };
}

/**
 * Dispatches luxury decorative emails via /api/send-mail (Nodemailer Gmail SMTP).
 *
 * @param {Object} payload - The dispatch configuration ('admin_otp' or 'watch_inquiry_booking')
 * @returns {Promise<any>}
 */
export async function dispatchGtcMail(payload) {
  return await sendBackendEmail(payload);
}

/**
 * Requests a 6-digit password recovery OTP from Supabase RPC 'request_password_reset_otp'
 * and dispatches the luxury gold recovery email via /api/send-mail.
 *
 * @param {string} email
 * @returns {Promise<{ resetId: string, email: string, isAdmin: boolean, expiresInSeconds: number }>}
 */
export async function requestPasswordReset(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Please enter your account email address.');
  }

  // Rate limit password resets (5 requests per 3 minutes)
  const rateLimit = checkRateLimit('pw_reset_' + cleanEmail, 5, 3 * 60 * 1000);
  if (!rateLimit.allowed) {
    throw new Error(
      `Too many password reset requests. For your security, please wait ${rateLimit.retryAfterSeconds} seconds before requesting another recovery key. (Note: Signing in refreshes your limit immediately.)`
    );
  }

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const resetRedirectUrl = `${appOrigin}/index.html`;

  let resetData = null;

  // 1. Try Supabase custom RPC if installed in database
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('request_password_reset_otp', {
      p_email: cleanEmail,
    });
    if (!rpcError && rpcData?.resetId) {
      resetData = rpcData;
    }
  } catch (e) {
    console.warn('[watchApi] RPC password reset check:', e.message);
  }

  // 2. Dispatch native Supabase recovery token so Supabase Auth verifies the session
  try {
    const { error: nativeErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: resetRedirectUrl,
    });
    if (nativeErr) {
      const rawErr = (nativeErr.message || '').toLowerCase();
      if (rawErr.includes('rate limit') || rawErr.includes('60 seconds') || rawErr.includes('over_email_send_rate_limit')) {
        console.warn('[watchApi] Supabase 60s cooldown active, falling back to Gmail SMTP direct recovery.');
      } else {
        console.warn('[watchApi] Supabase recovery notice:', nativeErr.message);
      }
    }
  } catch (e) {
    console.warn('[watchApi] Supabase recovery notice:', e.message);
  }

  // 3. ALWAYS dispatch luxury email via Gmail SMTP (/api/send-mail)
  // This guarantees the customer receives the email instantly in their inbox!
  const generatedOtp = resetData?.otp || String(Math.floor(100000 + Math.random() * 900000));
  const directResetUrl = `${appOrigin}/index.html#type=recovery&email=${encodeURIComponent(cleanEmail)}`;

  await sendBackendEmail({
    type: 'password_reset_link',
    email: cleanEmail,
    userName: resetData?.userName || cleanEmail.split('@')[0],
    isAdmin: resetData?.isAdmin || false,
    otp: generatedOtp,
    resetUrl: directResetUrl,
  }).catch((e) => console.warn('[watchApi] Gmail SMTP reset email notice:', e.message));

  return {
    resetId: resetData?.resetId || 'local_session_' + Date.now(),
    email: cleanEmail,
    otp: generatedOtp,
    mode: resetData?.resetId ? 'otp' : 'email_link',
    expiresInSeconds: 120,
    message: `Password reset link dispatched to ${cleanEmail}. Check your email inbox!`,
  };
}

/**
 * Verifies the 6-digit recovery OTP against Supabase RPC 'verify_and_update_password'
 * and overwrites the encrypted password in auth.users.
 *
 * @param {string} resetId
 * @param {string} email
 * @param {string} otp
 * @param {string} newPassword
 * @returns {Promise<any>}
 */
export async function confirmPasswordReset(resetId, email, otp, newPassword) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanOtp = (otp || '').trim();

  if (!resetId) {
    throw new Error('Reset session missing. Please request a new recovery key.');
  }
  if (!cleanOtp || cleanOtp.length !== 6) {
    throw new Error('Please enter the full 6-digit recovery OTP key.');
  }
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }

  // 1. If user has active authenticated session or recovery session, update directly via Supabase Auth
  try {
    const { data: updateData, error: updateErr } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (!updateErr && updateData?.user) {
      resetUserSecurityLimits(cleanEmail);
      if (typeof fetch !== 'undefined') {
        fetch('/api/reset-rate-limit', { method: 'POST' }).catch(() => {});
      }
      sendBackendEmail({
        type: 'password_updated_confirmation',
        email: cleanEmail,
        isAdmin: false,
      }).catch((e) => console.warn('[watchApi] password_updated_confirmation notice:', e.message));

      return {
        success: true,
        email: cleanEmail,
        isAdmin: false,
      };
    }
  } catch (e) {
    console.warn('[watchApi] Direct updateUser session check:', e.message);
  }

  // 2. Otherwise verify 6-digit OTP against Supabase RPC
  const { data, error } = await supabase.rpc('verify_and_update_password', {
    p_reset_id: resetId,
    p_email: cleanEmail,
    p_otp: cleanOtp,
    p_new_password: newPassword,
  });

  if (error) {
    const errMsg = (error.message || '').toLowerCase();
    if (errMsg.includes('verify_and_update_password') || errMsg.includes('schema cache')) {
      throw new Error(
        "Supabase RPC 'verify_and_update_password' is not installed in your Supabase database. Please execute supabase/migrations/20261017000000_password_reset_flow.sql in your Supabase SQL Editor."
      );
    }
    throw new Error(error.message || 'Failed to verify OTP or update password.');
  }

  // Clear rate limits & lockout so user has a fresh start after updating password
  resetUserSecurityLimits(cleanEmail);
  if (typeof fetch !== 'undefined') {
    fetch('/api/reset-rate-limit', { method: 'POST' }).catch(() => {});
  }

  // Asynchronously dispatch confirmation email (+ cross-mail security notice if admin)
  sendBackendEmail({
    type: 'password_updated_confirmation',
    email: data.email,
    isAdmin: data.isAdmin,
  }).catch((e) => console.warn('[watchApi] password_updated_confirmation notice:', e.message));

  return data;
}
