/* =========================================================================
   emailConfig.js — real OTP email delivery via EmailJS.

   WHY THIS FILE EXISTS:
   The original desktop app sent OTP emails directly over Gmail SMTP using
   a hardcoded email + app password baked into the Java source
   (see services/EmailService.java). That approach is fine for a compiled
   desktop binary, but this web app's source (HTML/CSS/JS) is fully
   readable by anyone who visits the page — so a raw SMTP password can
   NEVER live in this codebase. EmailJS (https://www.emailjs.com) solves
   this: only a "public key" (safe to expose, like a Stripe publishable
   key) sits in the browser. Your real mailbox credentials are configured
   once inside your EmailJS dashboard and never touch this code.

   SETUP (one-time, ~5 minutes, free tier = 200 emails/month):
   1. Create a free account at https://www.emailjs.com
   2. Email Services → Add New Service → connect your Gmail account
      (OAuth — no app password needed). Copy the "Service ID".
   3. Email Templates → Create New Template. Use these variable names
      so they match the send() call below:
         {{to_email}}   {{to_name}}   {{otp_code}}   {{app_name}}
      Subject suggestion: "Password Reset OTP - {{app_name}}"
      Body: reuse the HTML layout from the original EmailService.java
      buildEmailContent() method if you'd like the same look.
      Copy the "Template ID".
   4. Account → General → copy your "Public Key".
   5. Paste all three values into the CONFIG object below.

   Until these are filled in, the app automatically falls back to
   on-screen "demo mode" OTP display, so nothing breaks in the meantime.
   ========================================================================= */

const EmailConfig = {
  SERVICE_ID: "service_cuedw6d",
  TEMPLATE_ID: "template_evis7a4",
  PUBLIC_KEY: "9GZGUJSr-1-g_QcV1",
  APP_NAME: "Gunasekara Travels"
};

function emailConfigured() {
  return !EmailConfig.SERVICE_ID.startsWith("PASTE_")
    && !EmailConfig.TEMPLATE_ID.startsWith("PASTE_")
    && !EmailConfig.PUBLIC_KEY.startsWith("PASTE_");
}

let emailjsReady = false;
function ensureEmailJsInit() {
  if (emailjsReady) return true;
  if (typeof emailjs === "undefined") return false; // SDK failed to load (e.g. offline)
  emailjs.init({ publicKey: EmailConfig.PUBLIC_KEY });
  emailjsReady = true;
  return true;
}

/**
 * Attempts to send the OTP by real email via EmailJS.
 * Returns { sent: true } on success, or { sent: false, reason } on any
 * failure (not configured yet, offline, EmailJS error, etc.) so the
 * caller can gracefully fall back to on-screen display.
 */
async function sendOtpEmail(toEmail, toName, otpCode) {
  if (!emailConfigured()) return { sent: false, reason: "not_configured" };
  if (!ensureEmailJsInit()) return { sent: false, reason: "sdk_unavailable" };

  try {
    await emailjs.send(EmailConfig.SERVICE_ID, EmailConfig.TEMPLATE_ID, {
      to_email: toEmail,
      to_name: toName,
      otp_code: otpCode,
      app_name: EmailConfig.APP_NAME
    });
    return { sent: true };
  } catch (err) {
    console.error("EmailJS send failed:", err);
    return { sent: false, reason: "send_failed" };
  }
}
