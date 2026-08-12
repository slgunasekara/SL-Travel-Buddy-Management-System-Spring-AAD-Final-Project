/* =========================================================================
   auth.js — login, session (SessionManager equivalent), forgot-password/OTP
   Since this is a pure front-end app with no mail server, the OTP is
   generated the same way as the desktop app (6-digit, 10 min expiry) and
   is displayed on-screen in a "email simulation" panel instead of being
   emailed — every other rule (expiry, single-use, format) is preserved.
   ========================================================================= */

const Session = (() => {
  const KEY = "bms_session";
  function set(user) {
    sessionStorage.setItem(KEY, JSON.stringify({ user, loginTime: Date.now() }));
  }
  function get() {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  }
  function clear() { sessionStorage.removeItem(KEY); }
  function currentUser() { const s = get(); return s ? s.user : null; }
  function isLoggedIn() { return !!get(); }
  function isOwner() { const u = currentUser(); return !!u && u.role === "Owner"; }
  return { set, get, clear, currentUser, isLoggedIn, isOwner };
})();

const Auth = (() => {
  function authenticate(username, password) {
    const users = DB.readAll("users");
    return users.find(u => u.username === username && u.password === password) || null;
  }

  function generateOTP() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function requestOtp(email) {
    const users = DB.readAll("users");
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { ok: false, reason: "not_found" };

    const otps = DB.readAll("passwordResetOtps");
    const otp = generateOTP();
    const now = new Date();
    const expires = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes, same as desktop app
    otps.push({
      otpId: DB.nextId("passwordResetOtps"),
      userId: user.userId,
      otpCode: otp,
      email: user.email,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      isUsed: false
    });
    DB.writeAll("passwordResetOtps", otps);
    return { ok: true, otp, user };
  }

  function verifyOtp(email, code) {
    const otps = DB.readAll("passwordResetOtps");
    const now = new Date();
    const match = [...otps].reverse().find(o =>
      o.email.toLowerCase() === email.toLowerCase() &&
      o.otpCode === code &&
      !o.isUsed &&
      new Date(o.expiresAt) > now
    );
    return match ? match.userId : null;
  }

  function markOtpUsed(email, code) {
    const otps = DB.readAll("passwordResetOtps");
    const idx = otps.findIndex(o => o.email.toLowerCase() === email.toLowerCase() && o.otpCode === code);
    if (idx >= 0) { otps[idx].isUsed = true; DB.writeAll("passwordResetOtps", otps); }
  }

  function resetPassword(userId, newPassword) {
    const users = DB.readAll("users");
    const idx = users.findIndex(u => u.userId === userId);
    if (idx < 0) return false;
    users[idx].password = newPassword;
    DB.writeAll("users", users);
    return true;
  }

  return { authenticate, requestOtp, verifyOtp, markOtpUsed, resetPassword };
})();
