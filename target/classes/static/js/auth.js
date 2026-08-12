/* =========================================================================
   auth.js — login, session (SessionManager equivalent), forgot-password/OTP.
   Now backed by the Spring Boot /v1/auth/** endpoints (JWT auth) instead of
   reading/writing the users table directly. The OTP flow keeps the exact
   same shape it always had (a 6-digit code, 10 min expiry, single-use) —
   it's just generated and validated server-side now. The OTP code itself
   is still returned to the client (never emailed by the server), so the
   existing "email simulation" panel / EmailJS flow in index.html keeps
   working unchanged.
   ========================================================================= */

const Session = (() => {
  const KEY = "bms_session";
  function set(user, token) {
    sessionStorage.setItem(KEY, JSON.stringify({ user, token, loginTime: Date.now() }));
    setAuthToken(token);
  }
  function get() {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  }
  function clear() { sessionStorage.removeItem(KEY); clearAuthToken(); }
  function currentUser() { const s = get(); return s ? s.user : null; }
  function token() { const s = get(); return s ? s.token : null; }
  function isLoggedIn() { return !!get(); }
  function isOwner() { const u = currentUser(); return !!u && u.role === "Owner"; }
  // Restore the JWT into memory on every page load (fetch doesn't send it automatically).
  setAuthToken(token());
  return { set, get, clear, currentUser, token, isLoggedIn, isOwner };
})();

const Auth = (() => {
  function authenticate(username, password) {
    return AuthApi.login(username, password).then(res => {
      const b = res.body;
      const user = {
        userId: b.userId, username: b.username, name: b.name, role: b.role,
        contact: b.contact, nic: b.nic, email: b.email, createdAt: b.createdAt
      };
      return { ok: true, user, token: b.token };
    }).catch(err => ({ ok: false, message: apiErrorMessage(err, "Invalid username or password.") }));
  }

  function requestOtp(email) {
    return AuthApi.requestOtp(email).then(res => {
      const b = res.body;
      if (!b.ok) return { ok: false, reason: "not_found" };
      return { ok: true, otp: b.otp, user: { userId: b.userId, name: b.userName, email: b.email } };
    }).catch(() => ({ ok: false, reason: "not_found" }));
  }

  function verifyOtp(email, code) {
    return AuthApi.verifyOtp(email, code).then(res => res.body.userId).catch(() => null);
  }

  // OTP is now marked used atomically by resetPassword() on the server —
  // kept as a no-op here so any existing call sites keep working untouched.
  function markOtpUsed() { return Promise.resolve(); }

  function resetPassword(userId, newPassword, email, code) {
    return AuthApi.resetPassword(userId, email, code, newPassword).then(() => true).catch(() => false);
  }

  return { authenticate, requestOtp, verifyOtp, markOtpUsed, resetPassword };
})();
