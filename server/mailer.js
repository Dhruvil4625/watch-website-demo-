import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { sanitizeHtml } from './security.js';

const DEFAULT_ADMINS = [
  'gujarattimecompany@gmail.com',
  'gujrattimecompany@gmail.com',
  'parthsherathiya181@gmail.com',
  'ramoliadk@gmail.com',
];

/**
 * Loads environment variables from process.env or directly parses .env from project root.
 */
function getEnvConfig() {
  let user = process.env.GMAIL_USER;
  let pass = process.env.GMAIL_APP_PASSWORD;
  let adminEmailsRaw = process.env.ADMIN_EMAILS;

  if (!user || !pass) {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            if (key === 'GMAIL_USER' && !user) user = val;
            if (key === 'GMAIL_APP_PASSWORD' && !pass) pass = val;
            if (key === 'ADMIN_EMAILS' && !adminEmailsRaw) adminEmailsRaw = val;
          }
        });
      }
    } catch (e) {
      console.warn('[GTC Mailer] Notice reading .env:', e.message);
    }
  }

  const parsedAdmins = (adminEmailsRaw || DEFAULT_ADMINS.join(','))
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const adminEmails = Array.from(new Set([...DEFAULT_ADMINS, ...parsedAdmins]));

  return {
    user: (user || 'gujarattimecompany@gmail.com').trim(),
    pass: (pass || '').replace(/\s+/g, '').trim(),
    adminEmails,
  };
}

/**
 * Dispatches luxury Obsidian & Antique Gold emails via Gmail SMTP using Nodemailer.
 * Features:
 * - Anti-spam compliance: Multi-part (HTML + Plaintext) delivery
 * - High-deliverability headers & Reply-To binding
 * - Clean professional subject lines (avoids spam filter penalties)
 * - CAN-SPAM atelier footer & security attribution
 */
export async function sendMail(payload = {}) {
  const { user, pass, adminEmails } = getEnvConfig();

  if (!pass) {
    throw new Error('GMAIL_APP_PASSWORD is not configured in .env');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });

  const istTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // Sanitize all string inputs to prevent email HTML injection / XSS
  const cleanPayload = {};
  for (const [k, v] of Object.entries(payload)) {
    if (typeof v === 'string') {
      cleanPayload[k] = sanitizeHtml(v);
    } else {
      cleanPayload[k] = v;
    }
  }
  payload = cleanPayload;
  const { type } = payload;

  const senderIdentity = `"Maison Gujarat Time Company" <${user}>`;
  const companyFooterHtml = `
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid rgba(201,168,76,0.2);text-align:center;color:#8c8270;font-size:11px;line-height:1.6;">
      <p style="margin:0 0 4px;color:#a89f91;">Maison Gujarat Time Company · Haute Horlogerie Atelier</p>
      <p style="margin:0 0 4px;">Surat, Gujarat 395007, India</p>
      <p style="margin:0;color:#6b6456;">This transactional message was dispatched regarding an authorized action on gujarattimecompany.com.</p>
    </div>
  `;
  const companyFooterText = `\n---\nMaison Gujarat Time Company · Haute Horlogerie Atelier\nSurat, Gujarat 395007, India\nTransactional notification regarding your Gujarat Time Company account.`;

  // ===========================================================================
  // 1. 90-SECOND ADMIN QUORUM OTP EMAILS (1 UNIQUE KEY PER CO-OWNER)
  // ===========================================================================
  if (type === 'admin_otp' || type === 'admin_otp_request') {
    const { initiatorEmail, owners = adminEmails, otps = [] } = payload;

    const emailList = Array.isArray(owners) && owners.length >= 3 ? owners : [
      'gujarattimecompany@gmail.com',
      'parthsherathiya181@gmail.com',
      'ramoliadk@gmail.com',
    ];
    const codes = Array.isArray(otps) && otps.length >= 3 ? otps : ['000000', '000000', '000000'];

    const dispatches = [
      { key: 'Key 1', email: emailList[0], code: codes[0] },
      { key: 'Key 2', email: emailList[1], code: codes[1] },
      { key: 'Key 3', email: emailList[2], code: codes[2] },
    ];

    const sendResults = await Promise.all(
      dispatches.map((d) =>
        transporter.sendMail({
          from: senderIdentity,
          to: d.email,
          replyTo: user,
          subject: `Gujarat Time Company — Admin Authorization Key: ${d.code} (${d.key})`,
          text: `Maison Gujarat Time Company · Admin Vault Security\n\nCo-owner ${initiatorEmail || 'Admin'} has initiated admin vault access at ${istTime} IST.\n\nYOUR 90-SECOND AUTHORIZATION KEY:\n${d.code} (${d.key})\n\nThis key auto-destructs in 90 seconds. All three co-owner keys are required simultaneously to unlock Admin Studio controls.\n${companyFooterText}`,
          html: `
            <div style="background:#0b0b0b;color:#f5efe6;padding:32px;font-family:sans-serif;border:1px solid #C9A84C;border-radius:14px;max-width:480px;margin:auto;">
              <div style="color:#C9A84C;letter-spacing:0.2em;font-size:11px;margin-bottom:10px;">MAISON GUJARAT TIME COMPANY · SURAT</div>
              <h2 style="color:#ffffff;margin:0 0 12px;font-size:20px;">Admin Vault Authorization</h2>
              <p style="color:#b8aa91;font-size:14px;line-height:1.5;">
                Co-owner <strong style="color:#60a5fa;">${initiatorEmail || 'Admin'}</strong> has initiated admin vault access at ${istTime} IST.
              </p>
              <div style="margin:22px 0;padding:22px;background:#141310;border:1px solid rgba(201,168,76,0.45);border-radius:12px;text-align:center;">
                <div style="font-size:12px;color:#C9A84C;letter-spacing:0.18em;margin-bottom:8px;">${d.key} (${d.email})</div>
                <div style="font-size:38px;font-weight:bold;letter-spacing:0.28em;color:#ffffff;font-family:monospace;">${d.code}</div>
                <div style="color:#ff6b6b;font-size:12px;margin-top:10px;">⏱ Auto-destructs in 90 seconds</div>
              </div>
              <p style="color:#8c8270;font-size:12px;margin:0;">All three co-owner keys are required simultaneously to unlock Admin Studio controls.</p>
              ${companyFooterHtml}
            </div>
          `,
        })
      )
    );

    console.info(`[GTC Mailer] Dispatched 3 Quorum OTP emails to [${emailList.join(', ')}]`);
    return {
      success: true,
      message: '3 Quorum OTP emails dispatched successfully via Gmail SMTP.',
      results: sendResults.map((r) => r.messageId),
    };
  }

  // ===========================================================================
  // 2. ADMIN LOGIN UNLOCKED CROSS-MAIL (SENT TO ALL 3 CO-OWNERS)
  // ===========================================================================
  if (type === 'admin_login_unlocked') {
    const { actorEmail, actorName = 'Co-Owner' } = payload;

    const info = await transporter.sendMail({
      from: senderIdentity,
      to: adminEmails.join(', '),
      replyTo: user,
      subject: `Gujarat Time Company Alert: Admin Studio Unlocked by ${actorEmail}`,
      text: `Maison Gujarat Time Company · Vault Security Alert\n\nCo-Owner ${actorName} (${actorEmail}) has successfully logged into the website and unlocked full Admin Studio controls at ${istTime} IST.\n\nStatus: Active Admin Session Enabled\n${companyFooterText}`,
      html: `
        <div style="background:#0b0b0b;color:#f5efe6;padding:32px;font-family:sans-serif;border:1px solid #C9A84C;border-radius:14px;max-width:500px;margin:auto;">
          <div style="color:#C9A84C;letter-spacing:0.2em;font-size:11px;margin-bottom:10px;">MAISON GUJARAT TIME COMPANY · VAULT SECURITY</div>
          <h2 style="color:#ffffff;margin:0 0 12px;font-size:20px;">Admin Vault Session Active</h2>
          <p style="color:#b8aa91;font-size:14px;line-height:1.6;">
            Co-Owner <strong style="color:#ffffff;">${actorName}</strong> (<span style="color:#C9A84C;">${actorEmail}</span>) has successfully logged into the website and unlocked full Admin Studio controls at ${istTime} IST.
          </p>
          <div style="margin:20px 0;padding:18px;background:#141310;border:1px solid rgba(201,168,76,0.35);border-radius:10px;font-size:13px;">
            <p style="margin:6px 0;color:#E8D6B3;"><strong>Active Admin:</strong> ${actorName} (${actorEmail})</p>
            <p style="margin:6px 0;color:#E8D6B3;"><strong>Login Time (IST):</strong> ${istTime}</p>
            <p style="margin:6px 0;color:#4ade80;"><strong>Status:</strong> Full Watch &amp; 3D Asset Editing Enabled</p>
          </div>
          <p style="color:#787266;font-size:11px;margin:0;">Sent automatically to all 3 registered co-owners of Maison Gujarat Time Company.</p>
          ${companyFooterHtml}
        </div>
      `,
    });

    console.info(`[GTC Mailer] Dispatched Admin Login Unlocked cross-mail to [${adminEmails.join(', ')}]`);
    return {
      success: true,
      message: 'Admin login cross-mail dispatched successfully via Gmail SMTP.',
      messageId: info.messageId,
    };
  }

  // ===========================================================================
  // 3. CUSTOMER PURCHASE / INQUIRY CROSS-MAIL (ALL 3 ADMINS + CUSTOMER)
  // ===========================================================================
  if (type === 'watch_inquiry_booking') {
    const {
      actionType = 'INQUIRY',
      accountName = 'Valued Collector',
      customerEmail,
      customerPhone = 'Not Provided',
      watchName = 'GTC Himalayan',
      watchRef = 'R 39 SC AT HIMALAYAN',
      watchPrice = '₹2,45,000',
      customerMessage = 'Requested allocation via GTC website.',
    } = payload;

    const isPurchase =
      String(actionType).toUpperCase() === 'BOOKING' || String(actionType).toUpperCase() === 'PURCHASE';
    const badgeLabel = isPurchase ? 'PURCHASE / BOOKING' : 'WATCH INQUIRY';

    // A. Send Cross-Mail Alert to All 3 Co-Owners
    const adminInfo = await transporter.sendMail({
      from: senderIdentity,
      to: adminEmails.join(', '),
      replyTo: customerEmail || user,
      subject: `Gujarat Time Company: New ${isPurchase ? 'Order' : 'Inquiry'} from ${accountName} (${watchName})`,
      text: `Maison Gujarat Time Company · Owner Notification\n\nNew ${badgeLabel} received from ${accountName} (${customerEmail})\nTimepiece: ${watchName} (${watchRef})\nValuation: ${watchPrice}\nPhone: ${customerPhone}\nMessage: ${customerMessage}\nTime (IST): ${istTime}\n${companyFooterText}`,
      html: `
        <div style="background:#0b0b0b;color:#f5efe6;padding:34px;font-family:sans-serif;border:1px solid #C9A84C;border-radius:14px;max-width:540px;margin:auto;">
          <div style="color:#C9A84C;letter-spacing:0.2em;font-size:11px;margin-bottom:8px;">MAISON GUJARAT TIME COMPANY · OWNER ALERT</div>
          <h2 style="color:#ffffff;margin:0 0 10px;font-size:20px;">New Collector ${isPurchase ? 'Purchase / Booking' : 'Watch Inquiry'}</h2>
          <p style="color:#b8aa91;font-size:14px;line-height:1.6;">
            Collector <strong style="color:#ffffff;">${accountName}</strong> (<strong style="color:#C9A84C;">${customerEmail}</strong>) has submitted a <strong>${actionType}</strong> for <strong>${watchName} (${watchRef})</strong>.
          </p>
          <div style="margin:20px 0;padding:18px;background:#141310;border:1px solid #C9A84C;border-radius:10px;">
            <table width="100%" cellpadding="6" style="font-size:13px;color:#f5efe6;">
              <tr><td style="color:#8c8270;">Collector Username:</td><td style="font-weight:bold;color:#ffffff;">${accountName}</td></tr>
              <tr><td style="color:#8c8270;">Collector Email ID:</td><td style="color:#C9A84C;">${customerEmail}</td></tr>
              <tr><td style="color:#8c8270;">Phone Number:</td><td>${customerPhone}</td></tr>
              <tr><td style="color:#8c8270;">Action Type:</td><td style="color:#4ade80;font-weight:bold;">${badgeLabel}</td></tr>
              <tr><td style="color:#8c8270;">Watch Model:</td><td style="font-weight:bold;">${watchName}</td></tr>
              <tr><td style="color:#8c8270;">Reference:</td><td style="font-family:monospace;color:#E8D6B3;">${watchRef}</td></tr>
              <tr><td style="color:#8c8270;">Valuation / Price:</td><td>${watchPrice}</td></tr>
              <tr><td style="color:#8c8270;">Customer Message:</td><td>${customerMessage}</td></tr>
              <tr><td style="color:#8c8270;">Timestamp (IST):</td><td>${istTime}</td></tr>
            </table>
          </div>
          <p style="color:#787266;font-size:11px;margin:0;">Reply directly to this email to contact ${accountName} (${customerEmail}).</p>
          ${companyFooterHtml}
        </div>
      `,
    });

    // B. Send Official Confirmation Copy to the Customer
    let customerInfo = null;
    if (customerEmail) {
      customerInfo = await transporter.sendMail({
        from: senderIdentity,
        to: customerEmail,
        replyTo: user,
        subject: `Confirmation: Your ${watchName} ${isPurchase ? 'Allocation Booking' : 'Inquiry'} — Gujarat Time Company`,
        text: `Dear ${accountName},\n\nThank you for your ${isPurchase ? 'allocation booking' : 'private inquiry'} regarding the ${watchName} (${watchRef}).\n\nMaison Gujarat Time Company has received your dossier and our Master Horologists will contact you shortly.\n\nTimepiece: ${watchName}\nRef: ${watchRef} · ${watchPrice}\n${companyFooterText}`,
        html: `
          <div style="background:#0b0b0b;color:#f5efe6;padding:34px;font-family:sans-serif;border:1px solid #C9A84C;border-radius:14px;max-width:520px;margin:auto;">
            <div style="color:#C9A84C;letter-spacing:0.2em;font-size:11px;margin-bottom:8px;">MAISON GUJARAT TIME COMPANY · SURAT</div>
            <h2 style="color:#ffffff;margin:0 0 12px;font-size:20px;">Dossier Registered: ${watchName}</h2>
            <p style="color:#b8aa91;font-size:14px;line-height:1.6;">
              Dear <strong style="color:#ffffff;">${accountName}</strong>, thank you for your ${isPurchase ? 'allocation booking' : 'private inquiry'} regarding the <strong>${watchName} (${watchRef})</strong>. Maison Gujarat Time Company has received your dossier and our Master Horologists will contact you shortly.
            </p>
            <div style="margin:20px 0;padding:16px;background:#141310;border:1px solid rgba(201,168,76,0.4);border-radius:10px;text-align:center;">
              <div style="font-size:11px;color:#C9A84C;letter-spacing:0.18em;">TIMEPIECE REFERENCE</div>
              <div style="font-size:20px;color:#ffffff;font-weight:bold;margin:6px 0;">${watchName}</div>
              <div style="font-size:12px;color:#E8D6B3;font-family:monospace;">REF: ${watchRef} · ${watchPrice}</div>
            </div>
            ${companyFooterHtml}
          </div>
        `,
      });
    }

    console.info(`[GTC Mailer] Dispatched Watch Dossier to all 3 co-owners and customer [${customerEmail}]`);
    return {
      success: true,
      mode: 'watch_inquiry_booking_sent',
      adminMessageId: adminInfo.messageId,
      customerMessageId: customerInfo?.messageId,
    };
  }

  // ===========================================================================
  // 4. NORMAL CUSTOMER WELCOME EMAIL (SIGN-UP / LOGIN)
  // ===========================================================================
  if (type === 'collector_welcome') {
    const { customerName = 'Valued Collector', customerEmail, isNewRegistration } = payload;

    if (!customerEmail) {
      throw new Error('collector_welcome requires customerEmail');
    }

    const info = await transporter.sendMail({
      from: senderIdentity,
      to: customerEmail,
      replyTo: user,
      subject: isNewRegistration
        ? `Welcome to Gujarat Time Company, ${customerName}`
        : `Welcome Back to the Gujarat Time Company Sanctuary`,
      text: `Dear ${customerName},\n\nWelcome to Maison Gujarat Time Company. Your collector privileges are active.\n\nYou may now inspect our horological collection, view 3D calibers, reserve limited edition timepieces, and request private allocations.\n\nCollector Pass: ${customerEmail}\nAuthenticated at: ${istTime} IST\n${companyFooterText}`,
      html: `
        <div style="background:#0b0b0b;color:#f5efe6;padding:34px;font-family:sans-serif;border:1px solid #C9A84C;border-radius:14px;max-width:500px;margin:auto;">
          <div style="color:#C9A84C;letter-spacing:0.2em;font-size:11px;margin-bottom:10px;">MAISON GUJARAT TIME COMPANY · SURAT</div>
          <h2 style="color:#ffffff;margin:0 0 12px;font-size:20px;">${isNewRegistration ? 'Welcome to the Collector Vault' : 'Welcome Back, Collector'}</h2>
          <p style="color:#b8aa91;font-size:14px;line-height:1.6;">
            Dear <strong style="color:#ffffff;">${customerName}</strong>, your collector privileges are active on <strong>Maison Gujarat Time Company</strong>. You may now inspect our 3D horological movements, reserve limited edition timepieces, and request private allocations.
          </p>
          <div style="margin:20px 0;padding:18px;background:#141310;border:1px solid rgba(201,168,76,0.4);border-radius:10px;text-align:center;">
            <div style="font-size:11px;color:#C9A84C;letter-spacing:0.2em;margin-bottom:6px;">VERIFIED COLLECTOR PASS</div>
            <div style="font-size:17px;color:#ffffff;font-weight:bold;">${customerEmail}</div>
            <div style="font-size:11px;color:#4ade80;margin-top:6px;">Authenticated at ${istTime} IST</div>
          </div>
          <p style="color:#787266;font-size:11px;margin-top:16px;margin-bottom:0;">
            Explore our Genesis &amp; Horizon collections · Gujarat Time Company
          </p>
          ${companyFooterHtml}
        </div>
      `,
    });

    console.info(`[GTC Mailer] Dispatched Collector Welcome email to [${customerEmail}]`);
    return {
      success: true,
      mode: 'collector_welcome_sent',
      messageId: info.messageId,
    };
  }

  // ===========================================================================
  // 5. FORGOT PASSWORD RECOVERY EMAIL WITH LINK & 6-DIGIT OTP (CUSTOMER & ADMIN)
  // ===========================================================================
  if (type === 'password_reset_otp' || type === 'password_reset_link') {
    const { email, userName = 'Valued Collector', isAdmin = false, otp, resetUrl } = payload;

    if (!email) {
      throw new Error('password_reset requires email');
    }

    const defaultUrl = resetUrl || `http://localhost:5173/index.html#type=recovery&email=${encodeURIComponent(email)}`;
    const subject = otp
      ? `Gujarat Time Company: Your Password Reset Key is ${otp}`
      : `Gujarat Time Company: Reset Your Account Password`;

    const textContent = `Maison Gujarat Time Company · Credential Recovery\n\n` +
      `A password reset was requested for ${userName} (${email}) at ${istTime} IST.\n\n` +
      (otp ? `YOUR 6-DIGIT RECOVERY KEY:\n${otp}\n(Expires in 2 minutes)\n\n` : '') +
      `Click the link below to set your new password:\n${defaultUrl}\n\n` +
      `If you did not request this, you may safely disregard this message.\n${companyFooterText}`;

    const info = await transporter.sendMail({
      from: senderIdentity,
      to: email,
      replyTo: user,
      subject,
      text: textContent,
      html: `
        <div style="background:#0b0b0b;color:#f5efe6;padding:34px;font-family:sans-serif;border:1px solid #C9A84C;border-radius:14px;max-width:480px;margin:auto;">
          <div style="color:#C9A84C;letter-spacing:0.2em;font-size:11px;margin-bottom:10px;">MAISON GUJARAT TIME COMPANY · CREDENTIAL RECOVERY</div>
          <h2 style="color:#ffffff;margin:0 0 12px;font-size:20px;">Password Reset Authorization</h2>
          <p style="color:#b8aa91;font-size:14px;line-height:1.5;">
            A password reset was requested for <strong style="color:#ffffff;">${userName}</strong> (<span style="color:#C9A84C;">${email}</span>)${isAdmin ? ' <strong>[CO-OWNER ADMIN]</strong>' : ''} at ${istTime} IST.
          </p>
          ${
            otp
              ? `
              <div style="margin:20px 0;padding:20px;background:#141310;border:1px solid rgba(201,168,76,0.45);border-radius:12px;text-align:center;">
                <div style="font-size:11px;color:#C9A84C;letter-spacing:0.2em;margin-bottom:8px;">RECOVERY OTP KEY</div>
                <div style="font-size:38px;font-weight:bold;letter-spacing:0.28em;color:#ffffff;font-family:monospace;">${otp}</div>
                <div style="color:#ff6b6b;font-size:12px;margin-top:10px;">⏱ Auto-destructs in 2 minutes</div>
              </div>
              `
              : ''
          }
          <div style="text-align:center;margin:24px 0;">
            <a href="${defaultUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#C9A84C;color:#0b0b0b !important;font-weight:700;font-size:13px;letter-spacing:0.1em;padding:12px 26px;border-radius:6px;text-decoration:none;box-shadow:0 4px 14px rgba(201,168,76,0.3);">
              RESET MY PASSWORD ➔
            </a>
          </div>
          <p style="color:#8c8270;font-size:12px;margin:0;text-align:center;">
            Click the button above to set your new password directly on the website. If you did not request this, you may safely ignore this message.
          </p>
          ${companyFooterHtml}
        </div>
      `,
    });

    console.info(`[GTC Mailer] Dispatched Password Reset email to [${email}] (messageId: ${info.messageId})`);
    return { success: true, mode: 'password_reset_sent', messageId: info.messageId };
  }

  // ===========================================================================
  // 6. PASSWORD UPDATED CONFIRMATION (+ CROSS-MAIL IF ADMIN)
  // ===========================================================================
  if (type === 'password_updated_confirmation') {
    const { email, isAdmin = false } = payload;

    if (!email) {
      throw new Error('password_updated_confirmation requires email');
    }

    // 1. Send confirmation to the user who changed their password
    const userInfo = await transporter.sendMail({
      from: senderIdentity,
      to: email,
      replyTo: user,
      subject: `Gujarat Time Company: Your Password Has Been Updated`,
      text: `Maison Gujarat Time Company\n\nThe password for account ${email} was successfully updated at ${istTime} IST.\n\nIf you performed this action, no further action is required. If you did not update your password, please contact Gujarat Time Company security immediately at ${user}.\n${companyFooterText}`,
      html: `
        <div style="background:#0b0b0b;color:#f5efe6;padding:32px;font-family:sans-serif;border:1px solid #C9A84C;border-radius:14px;max-width:480px;margin:auto;">
          <div style="color:#C9A84C;letter-spacing:0.2em;font-size:11px;margin-bottom:10px;">MAISON GUJARAT TIME COMPANY · SURAT</div>
          <h2 style="color:#ffffff;margin:0 0 12px;font-size:20px;">Vault Password Updated</h2>
          <p style="color:#b8aa91;font-size:14px;line-height:1.6;">
            The password for account <strong style="color:#C9A84C;">${email}</strong> was successfully updated in our database at ${istTime} IST.
          </p>
          <div style="margin:18px 0;padding:14px;background:#141310;border:1px solid rgba(74,222,128,0.35);border-radius:8px;color:#4ade80;font-size:12px;text-align:center;font-family:monospace;">
            CREDENTIALS SYNCHRONIZED WITH SECURE VAULT
          </div>
          ${companyFooterHtml}
        </div>
      `,
    });

    // 2. If one of the 3 Co-Owner Admins changed their password, alert all 3 owners
    let adminInfo = null;
    if (isAdmin) {
      adminInfo = await transporter.sendMail({
        from: senderIdentity,
        to: adminEmails,
        replyTo: user,
        subject: `Gujarat Time Company Alert: Co-Owner ${email} Updated Password`,
        text: `Maison Gujarat Time Company · Co-Owner Security Notice\n\nCo-owner ${email} has reset and updated their admin password at ${istTime} IST.\n${companyFooterText}`,
        html: `
          <div style="background:#0b0b0b;color:#f5efe6;padding:32px;font-family:sans-serif;border:1px solid #C9A84C;border-radius:14px;max-width:500px;margin:auto;">
            <div style="color:#C9A84C;letter-spacing:0.2em;font-size:11px;margin-bottom:10px;">CO-OWNER SECURITY NOTICE</div>
            <h2 style="color:#ffffff;margin:0 0 12px;font-size:20px;">Admin Password Changed</h2>
            <p style="color:#b8aa91;font-size:14px;line-height:1.6;">
              Co-owner <strong style="color:#C9A84C;">${email}</strong> has reset and updated their admin password at ${istTime} IST.
            </p>
            ${companyFooterHtml}
          </div>
        `,
      });
    }

    console.info(`[GTC Mailer] Dispatched Password Updated Confirmation to [${email}] (admin alert: ${isAdmin})`);
    return {
      success: true,
      mode: 'password_updated_confirmation_sent',
      userMessageId: userInfo.messageId,
      adminMessageId: adminInfo?.messageId,
    };
  }

  throw new Error(`Unsupported mail type: "${type}"`);
}

// Keep alias so both function names work anywhere in the project
export const dispatchGtcMail = sendMail;
