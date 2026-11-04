import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateSixDigitOTP(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(100000 + (buf[0] % 900000));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const senderEmail = Deno.env.get("SENDER_EMAIL") || "Gujarat Time Company <onboarding@resend.dev>";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload = await req.json();
    const istTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    // =========================================================================
    // 1. AUTOMATIC ADMIN LOGIN OTP DISPATCH
    // =========================================================================
    if (payload.type === "admin_otp_request" || payload.type === "admin_otp") {
      const { initiatorEmail, initiatorUserId } = payload;

      let emailList = payload.owners;
      if (!emailList || emailList.length < 3) {
        // 1. Fetch the 3 co-owner accounts from admin_users
        const { data: owners, error: ownersErr } = await supabase
          .from("admin_users")
          .select("email")
          .order("created_at", { ascending: true })
          .limit(3);

        if (ownersErr || !owners || owners.length < 3) {
          throw new Error("Three co-owners must be registered in public.admin_users.");
        }

        emailList = owners.map((o) => o.email);
      }

      // 2. Generate or extract 3 unique random 6-digit OTPs
      const otp1 = payload.otps?.[0] || generateSixDigitOTP();
      const otp2 = payload.otps?.[1] || generateSixDigitOTP();
      const otp3 = payload.otps?.[2] || generateSixDigitOTP();

      let quorumId = payload.quorumId || null;
      let expiresAt = new Date(Date.now() + 60 * 1000).toISOString();

      // 3. For admin_otp_request: hash with bcrypt and write to admin_quorum_requests
      if (payload.type === "admin_otp_request") {
        const [hash1, hash2, hash3] = await Promise.all([
          bcrypt.hash(otp1),
          bcrypt.hash(otp2),
          bcrypt.hash(otp3),
        ]);

        const { data: quorumRow, error: insertErr } = await supabase
          .from("admin_quorum_requests")
          .insert({
            initiator_user_id: initiatorUserId || null,
            initiator_email: initiatorEmail,
            owner_1_email: emailList[0],
            owner_2_email: emailList[1],
            owner_3_email: emailList[2],
            otp_1_hash: hash1,
            otp_2_hash: hash2,
            otp_3_hash: hash3,
            expires_at: expiresAt,
          })
          .select("id")
          .single();

        if (insertErr) throw insertErr;
        quorumId = quorumRow.id;
      }

      // 4. Send individual decorative emails to each co-owner
      const keyDispatches = [
        { key: "KEY 01", email: emailList[0], code: otp1 },
        { key: "KEY 02", email: emailList[1], code: otp2 },
        { key: "KEY 03", email: emailList[2], code: otp3 },
      ];

      if (resendApiKey) {
        await Promise.all(
          keyDispatches.map((dispatch) =>
            fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: senderEmail,
                to: [dispatch.email],
                subject: `⏱ [GTC VAULT ${dispatch.key}] ${dispatch.code} — 60s Authorization Key`,
                html: `
                  <div style="background:#0b0b0b;color:#f5efe6;padding:32px;font-family:sans-serif;border:1px solid #C9A84C;border-radius:12px;max-width:500px;margin:auto;">
                    <div style="color:#C9A84C;letter-spacing:0.2em;font-size:11px;margin-bottom:8px;">❖ MAISON GUJARAT TIME COMPANY ❖</div>
                    <h2 style="color:#ffffff;margin:0 0 12px;">Admin Vault Authorization</h2>
                    <p style="color:#b8aa91;font-size:13px;line-height:1.5;">
                      Co-owner <strong style="color:#fff;">${initiatorEmail}</strong> has initiated admin login at ${istTime} IST.
                    </p>
                    <div style="margin:20px 0;padding:20px;background:#141310;border:1px solid #C9A84C;border-radius:8px;text-align:center;">
                      <div style="font-size:11px;color:#C9A84C;letter-spacing:0.18em;margin-bottom:6px;">${dispatch.key} (${dispatch.email})</div>
                      <div style="font-size:36px;font-weight:bold;letter-spacing:0.3em;color:#ffffff;font-family:monospace;">${dispatch.code}</div>
                      <div style="color:#ff6b6b;font-size:11px;margin-top:8px;">⏱ Auto-destructs in 60 seconds</div>
                    </div>
                    <p style="color:#787266;font-size:11px;margin:0;">All three co-owner keys are required simultaneously to unlock Admin Studio controls.</p>
                  </div>
                `,
              }),
            })
          )
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          quorumId,
          owners: emailList,
          expiresAt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // 2. AUTOMATIC CUSTOMER BOOKING & INQUIRY DOSSIER DISPATCH
    // =========================================================================
    if (payload.type === "watch_inquiry_booking") {
      const {
        actionType, // 'BOOKING' | 'INQUIRY'
        accountName,
        customerEmail,
        customerPhone,
        watchName,
        watchRef,
        watchSubtitle,
        watchPrice,
        customerMessage,
      } = payload;

      // 1. Fetch current 3 co-owners from database
      const { data: owners } = await supabase.from("admin_users").select("email").limit(3);
      const adminRecipients = owners && owners.length > 0
        ? owners.map((o) => o.email)
        : ["gujrattimecompany@gmail.com", "parthsherathiya181@gmail.com", "ramoliadk@gmail.com"];
      const allRecipients = Array.from(new Set([...adminRecipients, customerEmail].filter(Boolean)));

      const isBooking = (actionType || "").toUpperCase() === "BOOKING";

      if (resendApiKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: senderEmail,
            to: allRecipients,
            reply_to: customerEmail,
            subject: `❖ [GTC ${isBooking ? "BOOKING" : "INQUIRY"}] ${accountName} — ${watchName} (${watchRef || "R 39 SC AT HIMALAYAN (GD)"})`,
            html: `
              <div style="background:#0b0b0b;color:#f5efe6;padding:36px;font-family:sans-serif;border:1px solid #C9A84C;border-radius:14px;max-width:560px;margin:auto;">
                <div style="color:#C9A84C;letter-spacing:0.22em;font-size:11px;margin-bottom:8px;">❖ MAISON GUJARAT TIME COMPANY ❖</div>
                <h2 style="color:#ffffff;margin:0 0 10px;">${isBooking ? "Timepiece Allocation Booking" : "Collector Inquiry"}</h2>
                <p style="color:#b8aa91;font-size:13px;line-height:1.5;">
                  A new collector inquiry has been recorded at ${istTime} IST.
                </p>
                <div style="background:#141310;border:1px solid rgba(201,168,76,0.3);border-radius:10px;padding:18px;margin:20px 0;">
                  <table width="100%" cellpadding="6" style="font-size:13px;color:#f5efe6;">
                    <tr><td style="color:#8c8270;">Watch:</td><td style="color:#C9A84C;font-weight:bold;">${watchName} (${watchRef || "R 39 SC AT HIMALAYAN (GD)"})</td></tr>
                    ${watchSubtitle ? `<tr><td style="color:#8c8270;">Variant:</td><td>${watchSubtitle}</td></tr>` : ''}
                    ${watchPrice ? `<tr><td style="color:#8c8270;">Allocation Price:</td><td>${watchPrice}</td></tr>` : ''}
                    <tr><td style="color:#8c8270;">Collector:</td><td>${accountName}</td></tr>
                    <tr><td style="color:#8c8270;">Email:</td><td>${customerEmail}</td></tr>
                    <tr><td style="color:#8c8270;">Phone:</td><td>${customerPhone}</td></tr>
                    <tr><td style="color:#8c8270;">Message:</td><td>${customerMessage || "Direct inquiry via vault"}</td></tr>
                  </table>
                </div>
                <p style="color:#787266;font-size:11px;margin:0;">Dispatched to Maison Co-Owners and Collector Dossier Archive.</p>
              </div>
            `,
          }),
        });
      }

      return new Response(JSON.stringify({ success: true, message: "Dossier dispatched." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown payload type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
