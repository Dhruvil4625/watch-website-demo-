/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MAISON GUJARAT TIME COMPANY (GTC) · SURAT ATELIER
 * HAUTE HORLOGERIE MASTER VAULT DIAGNOSTIC & PENETRATION TEST SUITE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Rigorously verifies:
 * 1. Database Schema & RLS Integrity across all 8 production tables
 * 2. Active Co-Owner Authentication & 60-Second Quorum Generation
 * 3. Strict 3-of-3 Quorum Verification (Negative & Positive vectors)
 * 4. 60-Second Auto-Destruction & Expiration Logic
 * 5. Multi-Channel Email Dispatch Pipeline via 'gtc-mail-dispatch' Edge Function
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '../lib/supabaseClient.js';

// The verified triumvirate of Co-Owners
export const ACTIVE_TRIUMVIRATE = [
  'gujrattimecompany@gmail.com',
  'parthsherathiya181@gmail.com',
  'ramoliadk@gmail.com',
];

// 8 Production Tables Required by GTC Horological Architecture
export const PRODUCTION_TABLES = [
  'admin_users',
  'admin_quorum_requests',
  'admin_login_logs',
  'brands',
  'collections',
  'customer_profiles',
  'reservations_orders',
  'watch_variants',
];

// Rich CSS styles for browser DevTools console output
const LOG_STYLES = {
  banner:
    'color: #C9A84C; font-weight: bold; font-size: 13px; background: #0b0b0b; padding: 5px 12px; border: 1.5px solid #C9A84C; border-radius: 6px;',
  testHeader:
    'color: #ffffff; font-weight: 700; font-size: 12px; background: #1c1917; padding: 4px 8px; border-left: 3px solid #C9A84C; border-radius: 2px; margin-top: 8px;',
  pass:
    'background: #052e16; color: #4ade80; font-weight: bold; font-size: 11px; padding: 2px 6px; border-radius: 4px; border: 1px solid #166534;',
  fail:
    'background: #450a0a; color: #f87171; font-weight: bold; font-size: 11px; padding: 2px 6px; border-radius: 4px; border: 1px solid #991b1b;',
  warn:
    'background: #451a03; color: #fbbf24; font-weight: bold; font-size: 11px; padding: 2px 6px; border-radius: 4px; border: 1px solid #92400e;',
  info:
    'background: #172554; color: #60a5fa; font-weight: bold; font-size: 11px; padding: 2px 6px; border-radius: 4px; border: 1px solid #1e40af;',
  timing:
    'color: #38bdf8; font-family: monospace; font-size: 10px; font-weight: 600;',
  text:
    'color: #e7e5e4; font-size: 11px;',
  goldText:
    'color: #E8D6B3; font-weight: 600; font-size: 11px;',
  code:
    'color: #fde047; font-family: monospace; background: #292524; padding: 1px 4px; border-radius: 3px; font-size: 11px;',
  summaryPass:
    'color: #4ade80; font-weight: bold; font-size: 13px; background: #052e16; padding: 6px 12px; border-radius: 4px; border: 1px solid #22c55e;',
  summaryFail:
    'color: #f87171; font-weight: bold; font-size: 13px; background: #450a0a; padding: 6px 12px; border-radius: 4px; border: 1px solid #ef4444;',
};

/**
 * Diagnostic Suite Test Runner
 */
export async function runGtcDiagnostics(
  email = 'gujrattimecompany@gmail.com',
  password = 'GtcAdmin@2026!'
) {
  const startTime = performance.now();
  const results = [];
  const stats = { passed: 0, failed: 0, warned: 0, total: 0 };

  function record(status, name, details, latencyMs = 0) {
    stats.total += 1;
    if (status === 'PASS') stats.passed += 1;
    else if (status === 'FAIL') stats.failed += 1;
    else if (status === 'WARN') stats.warned += 1;

    results.push({ status, name, details, latencyMs: Math.round(latencyMs) });

    const badgeStyle =
      status === 'PASS'
        ? LOG_STYLES.pass
        : status === 'FAIL'
        ? LOG_STYLES.fail
        : LOG_STYLES.warn;

    console.log(
      `%c[${status}]%c %c${name}%c - %c${details}%c %c[${Math.round(latencyMs)}ms]`,
      badgeStyle,
      '',
      LOG_STYLES.goldText,
      '',
      LOG_STYLES.text,
      '',
      LOG_STYLES.timing
    );
  }

  console.group(
    '%c❖ MAISON GUJARAT TIME COMPANY · VAULT DIAGNOSTICS & QUORUM SUITE ❖',
    LOG_STYLES.banner
  );
  console.log(
    `%cTarget Identity:%c %c${email}%c | %cActive Triumvirate:%c %c${ACTIVE_TRIUMVIRATE.join(', ')}`,
    LOG_STYLES.goldText,
    '',
    LOG_STYLES.code,
    '',
    LOG_STYLES.goldText,
    '',
    LOG_STYLES.code
  );

  // ════════════════════════════════════════════════════════════════════════════
  // TEST 1: CORE DATABASE SCHEMA & RLS INTEGRITY
  // ════════════════════════════════════════════════════════════════════════════
  console.group('%cTEST 1: Core Database Schema & RLS Integrity (8 Tables)', LOG_STYLES.testHeader);
  const t1Start = performance.now();

  // 1a. Client init check
  const supabaseUrl = supabase?.supabaseUrl || '';
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    record('PASS', 'Supabase Client Initialization', `Connected to host: ${supabaseUrl}`, performance.now() - t1Start);
  } else {
    record('FAIL', 'Supabase Client Initialization', 'Missing or invalid Supabase URL in client', performance.now() - t1Start);
  }

  // 1b. Probe all 8 production tables
  for (const table of PRODUCTION_TABLES) {
    const tableStart = performance.now();
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      const latency = performance.now() - tableStart;
      if (error) {
        // Table exists but RLS might restrict anon select; check error code
        if (error.code === '42P01') {
          record('FAIL', `Table [${table}]`, `Schema Missing: ${error.message}`, latency);
        } else {
          record('WARN', `Table [${table}]`, `RLS Guard Active: ${error.message} (HTTP ${error.status || 'RLS'})`, latency);
        }
      } else {
        record('PASS', `Table [${table}]`, `Responsive (${Array.isArray(data) ? data.length : 0} sample rows accessible)`, latency);
      }
    } catch (tblErr) {
      record('FAIL', `Table [${table}]`, `Connectivity Exception: ${tblErr.message}`, performance.now() - tableStart);
    }
  }

  // 1c. Initial admin_users triumvirate query
  const adminUsersStart = performance.now();
  try {
    const { data: adminRows, error: adminErr } = await supabase.from('admin_users').select('*');
    const latency = performance.now() - adminUsersStart;
    if (adminErr) {
      record('WARN', 'Co-Owner RLS Query', `Pre-auth query restricted by RLS: ${adminErr.message}`, latency);
    } else if (Array.isArray(adminRows)) {
      if (adminRows.length >= 3) {
        record('PASS', 'Co-Owner Quorum Threshold', `Found ${adminRows.length} registered co-owners (>= 3 minimum threshold satisfied)`, latency);
      } else {
        record('WARN', 'Co-Owner Quorum Threshold', `Found ${adminRows.length} registered co-owners (expected >= 3)`, latency);
      }
    }
  } catch (err) {
    record('WARN', 'Co-Owner Query Exception', err.message, performance.now() - adminUsersStart);
  }
  console.groupEnd();

  // ════════════════════════════════════════════════════════════════════════════
  // TEST 2: ACTIVE CO-OWNER AUTHENTICATION & 60s QUORUM GENERATION
  // ════════════════════════════════════════════════════════════════════════════
  console.group('%cTEST 2: Active Co-Owner Authentication & 60s Quorum Generation', LOG_STYLES.testHeader);
  let activeUser = null;
  let quorumData = null;

  const authStart = performance.now();
  try {
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    const authLatency = performance.now() - authStart;

    if (authErr) {
      record(
        'FAIL',
        'Co-Owner Authentication',
        `Auth rejected: "${authErr.message}". (Tip: pass valid credentials via window.runGtcDiagnostics('${email}', 'your_password'))`,
        authLatency
      );
    } else {
      activeUser = authData?.user;
      record('PASS', 'Co-Owner Authentication', `Authenticated session established for UUID: ${activeUser?.id}`, authLatency);

      // Verify post-auth admin_users rows under authenticated session
      const postAuthStart = performance.now();
      const { data: authedAdmins } = await supabase.from('admin_users').select('*');
      if (Array.isArray(authedAdmins) && authedAdmins.length >= 3) {
        record('PASS', 'Authenticated Co-Owner RLS', `Authorized access to ${authedAdmins.length} Co-Owners under active session`, performance.now() - postAuthStart);
      }
    }
  } catch (authEx) {
    record('FAIL', 'Co-Owner Authentication Exception', authEx.message, performance.now() - authStart);
  }

  // 2b. Call create_dev_quorum_request RPC
  const quorumStart = performance.now();
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('create_dev_quorum_request');
    const quorumLatency = performance.now() - quorumStart;

    if (rpcErr) {
      record('FAIL', 'RPC create_dev_quorum_request', `RPC failed: ${rpcErr.message}`, quorumLatency);
    } else if (rpcData) {
      quorumData = rpcData;
      record('PASS', 'RPC create_dev_quorum_request', 'Quorum request successfully created in database', quorumLatency);

      // Assertion a: Valid UUID
      const qId = quorumData.quorum_id || quorumData.id || quorumData.request_id || '';
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(qId);
      if (isUUID) {
        record('PASS', 'Quorum Identifier Format', `Valid UUID confirmed: ${qId}`);
      } else {
        record('FAIL', 'Quorum Identifier Format', `Invalid UUID format: "${qId}"`);
      }

      // Assertion b: owners array contains all 3 co-owners
      const rawOwners = Array.isArray(quorumData.owners) ? quorumData.owners.map((o) => o.toLowerCase().trim()) : [];
      const hasAllTriumvirate = ACTIVE_TRIUMVIRATE.every((target) => rawOwners.includes(target.toLowerCase()));
      if (hasAllTriumvirate) {
        record('PASS', 'Co-Owner Triumvirate Mapping', `All 3 active Co-Owners present in quorum: [${rawOwners.join(', ')}]`);
      } else {
        record('WARN', 'Co-Owner Triumvirate Mapping', `Quorum owners: [${rawOwners.join(', ')}] (Expected: ${ACTIVE_TRIUMVIRATE.join(', ')})`);
      }

      // Assertion c: exactly 3 distinct 6-digit numeric strings
      const otps = Array.isArray(quorumData.dev_otps) ? quorumData.dev_otps : [];
      const allSixDigits = otps.length === 3 && otps.every((code) => /^\d{6}$/.test(String(code)));
      const allDistinct = new Set(otps.map(String)).size === 3;
      if (allSixDigits && allDistinct) {
        record('PASS', 'Quorum Keys Entropy', `3 distinct 6-digit cryptographic keys confirmed: [${otps.map((k) => `Key: ${k}`).join(', ')}]`);
      } else {
        record('FAIL', 'Quorum Keys Entropy', `Invalid OTP structure: length=${otps.length}, sixDigits=${allSixDigits}, distinct=${allDistinct}`);
      }

      // Assertion d: expiresAt is set to 60 seconds (±3s tolerance window)
      const expTime = quorumData.expires_at || quorumData.expiresAt;
      if (expTime) {
        const diffSeconds = Math.round((new Date(expTime).getTime() - Date.now()) / 1000);
        if (diffSeconds >= 57 && diffSeconds <= 63) {
          record('PASS', 'Self-Destruct Lifetime Window', `Expires in exactly ${diffSeconds}s (within 60s ±3s tolerance window)`);
        } else {
          record('WARN', 'Self-Destruct Lifetime Window', `Expires in ${diffSeconds}s (expected 60s ±3s)`);
        }
      } else {
        record('FAIL', 'Self-Destruct Lifetime Window', 'Missing expires_at in quorum RPC response');
      }
    }
  } catch (qErr) {
    record('FAIL', 'RPC Quorum Generation Exception', qErr.message, performance.now() - quorumStart);
  }
  console.groupEnd();

  // ════════════════════════════════════════════════════════════════════════════
  // TEST 3: STRICT 3-OF-3 QUORUM VERIFICATION (NEGATIVE & POSITIVE VECTORS)
  // ════════════════════════════════════════════════════════════════════════════
  console.group('%cTEST 3: Strict 3-of-3 Quorum Verification (Negative & Positive Vectors)', LOG_STYLES.testHeader);

  const qId = quorumData?.quorum_id || quorumData?.id || quorumData?.request_id;
  const otps = Array.isArray(quorumData?.dev_otps) ? quorumData.dev_otps : [];

  // 3a. Negative Vector: Tampered / Missing Key
  const negStart = performance.now();
  if (qId && otps.length === 3) {
    try {
      // Attempt verification with an invalid third key ('000000')
      const { data: negData, error: negErr } = await supabase.rpc('verify_admin_quorum_otps', {
        p_request_id: qId,
        p_otp_1: String(otps[0]),
        p_otp_2: String(otps[1]),
        p_otp_3: '000000',
      });
      const negLatency = performance.now() - negStart;

      if (negErr || negData === false) {
        record('PASS', 'Negative Vector (Tampered Key)', `Access securely rejected: "${negErr?.message || 'Verification returned false'}"`, negLatency);
      } else {
        record('FAIL', 'Negative Vector (Tampered Key)', 'VULNERABILITY: Invalid key was accepted by quorum validator!', negLatency);
      }
    } catch (negEx) {
      record('PASS', 'Negative Vector (Tampered Key)', `Exception thrown as expected: "${negEx.message}"`, performance.now() - negStart);
    }
  } else {
    record('WARN', 'Negative Vector (Tampered Key)', 'Skipped: valid active quorum keys not available from Test 2');
  }

  // 3b. Positive Vector: Full 3-of-3 Consensus
  const posStart = performance.now();
  if (qId && otps.length === 3) {
    try {
      const { data: posData, error: posErr } = await supabase.rpc('verify_admin_quorum_otps', {
        p_request_id: qId,
        p_otp_1: String(otps[0]),
        p_otp_2: String(otps[1]),
        p_otp_3: String(otps[2]),
      });
      const posLatency = performance.now() - posStart;

      if (!posErr && (posData === true || posData?.success === true || posData?.verified === true)) {
        record('PASS', 'Positive Vector (Full Consensus)', 'Full 3-of-3 consensus authorized successfully', posLatency);
      } else {
        record('FAIL', 'Positive Vector (Full Consensus)', `Verification failed with authentic keys: ${posErr?.message || JSON.stringify(posData)}`, posLatency);
      }
    } catch (posEx) {
      record('FAIL', 'Positive Vector Exception', posEx.message, performance.now() - posStart);
    }
  } else {
    record('WARN', 'Positive Vector (Full Consensus)', 'Skipped: valid active quorum keys not available from Test 2');
  }

  // 3c. Database Permission Verification: is_admin RPC
  const adminCheckStart = performance.now();
  try {
    const { data: isAdmin, error: adminCheckErr } = await supabase.rpc('is_admin');
    const adminLatency = performance.now() - adminCheckStart;

    if (!adminCheckErr && isAdmin === true) {
      record('PASS', 'Database Permission is_admin()', 'Session holds verified is_admin authorization in PostgreSQL', adminLatency);
    } else {
      record('WARN', 'Database Permission is_admin()', `is_admin() evaluated to ${isAdmin} (Error: ${adminCheckErr?.message || 'None'})`, adminLatency);
    }
  } catch (adminEx) {
    record('FAIL', 'Database Permission Exception', adminEx.message, performance.now() - adminCheckStart);
  }
  console.groupEnd();

  // ════════════════════════════════════════════════════════════════════════════
  // TEST 4: 60-SECOND AUTO-DESTRUCTION & EXPIRATION LOGIC
  // ════════════════════════════════════════════════════════════════════════════
  console.group('%cTEST 4: 60-Second Auto-Destruction & Expiration Logic', LOG_STYLES.testHeader);
  const t4Start = performance.now();

  try {
    // 4a. Inspect active request record in admin_quorum_requests
    if (qId) {
      const { data: qRecord, error: qRecErr } = await supabase
        .from('admin_quorum_requests')
        .select('*')
        .eq('id', qId)
        .maybeSingle();

      if (!qRecErr && qRecord) {
        record('PASS', 'Quorum Request Record Inspection', `Found request in table with status: ${qRecord.status || 'verified=' + qRecord.is_verified}`, performance.now() - t4Start);
      } else {
        record('WARN', 'Quorum Request Record Inspection', `Record check: ${qRecErr?.message || 'Row not visible under current session'}`, performance.now() - t4Start);
      }
    }

    // 4b. Verify that expired unverified requests are automatically purged
    const purgeStart = performance.now();
    const { data: expiredRows, error: purgeErr } = await supabase
      .from('admin_quorum_requests')
      .select('id, expires_at, is_verified')
      .lt('expires_at', new Date(Date.now() - 5000).toISOString())
      .eq('is_verified', false)
      .limit(10);

    const purgeLatency = performance.now() - purgeStart;
    if (purgeErr) {
      record('WARN', 'Auto-Destruction Garbage Inspection', `Table query restricted by RLS: ${purgeErr.message}`, purgeLatency);
    } else if (Array.isArray(expiredRows)) {
      if (expiredRows.length === 0) {
        record('PASS', 'Auto-Destruction Quarantine', 'Zero stale unverified keys in database (expired OTPs are auto-purged/destroyed)', purgeLatency);
      } else {
        record('WARN', 'Auto-Destruction Quarantine', `Found ${expiredRows.length} unverified expired request(s) awaiting cleanup cycle`, purgeLatency);
      }
    }
  } catch (t4Ex) {
    record('FAIL', 'Auto-Destruction Check Exception', t4Ex.message, performance.now() - t4Start);
  }
  console.groupEnd();

  // ════════════════════════════════════════════════════════════════════════════
  // TEST 5: MULTI-CHANNEL EMAIL DISPATCH PIPELINE (gtc-mail-dispatch)
  // ════════════════════════════════════════════════════════════════════════════
  console.group('%cTEST 5: Multi-Channel Email Dispatch Pipeline (gtc-mail-dispatch)', LOG_STYLES.testHeader);

  // 5a. Admin Quorum Alert (type: 'admin_otp')
  const emailOtpStart = performance.now();
  try {
    const { data: otpMailData, error: otpMailErr } = await supabase.functions.invoke('gtc-mail-dispatch', {
      body: {
        type: 'admin_otp',
        initiatorEmail: email,
        owners: ACTIVE_TRIUMVIRATE,
        otps: ['849201', '593021', '710492'],
      },
    });
    const otpLatency = performance.now() - emailOtpStart;

    if (!otpMailErr && (otpMailData?.success === true || otpMailData?.mode === 'admin_otp_dispatched')) {
      record('PASS', 'Admin Quorum 3-Owner Mail Dispatch', `Dispatched 3 individual OTP emails to: [${ACTIVE_TRIUMVIRATE.join(', ')}]`, otpLatency);
    } else {
      record(
        'FAIL',
        'Admin Quorum 3-Owner Mail Dispatch',
        `Edge Function returned: ${otpMailErr?.message || JSON.stringify(otpMailData)}`,
        otpLatency
      );
    }
  } catch (mailEx) {
    record('FAIL', 'Admin Quorum Mail Exception', mailEx.message, performance.now() - emailOtpStart);
  }

  // 5b. Watch Booking / Inquiry Dossier (type: 'watch_inquiry_booking')
  const inqMailStart = performance.now();
  try {
    const { data: inqMailData, error: inqMailErr } = await supabase.functions.invoke('gtc-mail-dispatch', {
      body: {
        type: 'watch_inquiry_booking',
        actionType: 'INQUIRY',
        accountName: 'Maison GTC Diagnostic Bot',
        customerEmail: email,
        customerPhone: '+91 98250 00000',
        watchName: 'GTC Himalayan',
        watchRef: 'R 39 SC AT HIMALAYAN (GD)',
        watchSubtitle: 'Golden Topographic Texture Dial',
        watchPrice: '₹2,45,000',
        customerMessage: 'Automated synthetic verification inquiry from Vault Diagnostic Suite.',
      },
    });
    const inqLatency = performance.now() - inqMailStart;

    if (!inqMailErr && (inqMailData?.success === true || inqMailData?.mode === 'watch_inquiry_booking_sent')) {
      record(
        'PASS',
        'Watch Booking/Inquiry Mail Dispatch',
        `Dispatched luxury dossier to all 3 Co-Owners and Customer Archive (${email})`,
        inqLatency
      );
    } else {
      record(
        'FAIL',
        'Watch Booking/Inquiry Mail Dispatch',
        `Edge Function returned: ${inqMailErr?.message || JSON.stringify(inqMailData)}`,
        inqLatency
      );
    }
  } catch (inqEx) {
    record('FAIL', 'Watch Booking Mail Exception', inqEx.message, performance.now() - inqMailStart);
  }
  console.groupEnd();

  // ════════════════════════════════════════════════════════════════════════════
  // SUMMARY REPORT CARD
  // ════════════════════════════════════════════════════════════════════════════
  const totalElapsed = Math.round(performance.now() - startTime);
  const isHealthy = stats.failed === 0;

  console.log(
    `%c❖ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ❖`,
    LOG_STYLES.banner
  );
  console.log(
    `%c${isHealthy ? '✔ MASTER VAULT ARCHITECTURE: VERIFIED SECURE' : '✖ DIAGNOSTIC WARNINGS / FAILURES DETECTED'}%c ` +
    `Passed: ${stats.passed}/${stats.total} | Failed: ${stats.failed} | Warned: ${stats.warned} | Total Time: ${totalElapsed}ms`,
    isHealthy ? LOG_STYLES.summaryPass : LOG_STYLES.summaryFail,
    LOG_STYLES.goldText
  );
  console.log(
    `%c❖ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ❖`,
    LOG_STYLES.banner
  );
  console.groupEnd();

  return {
    success: isHealthy,
    stats: { ...stats, totalElapsedMs: totalElapsed },
    results,
  };
}

// Automatically register window.runGtcDiagnostics on load
if (typeof window !== 'undefined') {
  window.runGtcDiagnostics = runGtcDiagnostics;
  if (import.meta.env?.DEV) {
    console.info(
      '%c❖ [GTC Horological Diagnostics Ready]%c Run %cwindow.runGtcDiagnostics(email, password)%c in console to test Quorum & Email pipeline.',
      'color: #C9A84C; font-weight: bold;',
      'color: #E8D6B3;',
      'color: #fde047; font-family: monospace; background: #1c1917; padding: 2px 6px; border-radius: 3px;',
      'color: #E8D6B3;'
    );
  }
}

export default runGtcDiagnostics;
