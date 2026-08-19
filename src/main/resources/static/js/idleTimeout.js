/* idleTimeout.js — Auto-logout on Inactivity.
   Watches mouse/keyboard/touch/scroll activity; after the configured idle
   period with no activity, warns the user for 60s (in case they're just
   reading) and then logs out automatically. Timeout is configurable from
   Settings (persisted in localStorage — a device/browser preference, not
   account data, so it isn't synced through the backend). */
const IdleTimeout = (() => {
  const STORAGE_KEY = "bms_idle_timeout_minutes";
  const DEFAULT_MINUTES = 20;
  const WARNING_SECONDS = 60;

  let idleTimer = null;
  let countdownInterval = null;
  let warningEl = null;

  function minutes() {
    const v = Number(localStorage.getItem(STORAGE_KEY));
    return v > 0 ? v : DEFAULT_MINUTES;
  }

  function setMinutes(v) {
    v = Number(v);
    if (v > 0) localStorage.setItem(STORAGE_KEY, String(v));
    else localStorage.removeItem(STORAGE_KEY);
    resetTimers();
  }

  function doLogout() {
    hideWarning();
    Session.clear();
    location.href = "index.html?reason=idle";
  }

  function showWarning() {
    let remaining = WARNING_SECONDS;
    warningEl = document.createElement("div");
    warningEl.className = "idle-warning-overlay";
    warningEl.innerHTML = `
      <div class="idle-warning-box">
        <h3>Still there?</h3>
        <p>You've been inactive for a while. For security, you'll be logged out in <span id="idleCountdown">${remaining}</span>s.</p>
        <button class="btn btn--primary" id="idleStayBtn">Stay logged in</button>
      </div>`;
    document.body.appendChild(warningEl);
    document.getElementById("idleStayBtn").addEventListener("click", resetTimers);

    countdownInterval = setInterval(() => {
      remaining -= 1;
      const el = document.getElementById("idleCountdown");
      if (el) el.textContent = String(remaining);
      if (remaining <= 0) { clearInterval(countdownInterval); doLogout(); }
    }, 1000);
  }

  function hideWarning() {
    if (warningEl) { warningEl.remove(); warningEl = null; }
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
  }

  function resetTimers() {
    hideWarning();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(showWarning, minutes() * 60 * 1000);
  }

  function start() {
    ["mousemove", "keydown", "mousedown", "touchstart", "scroll"].forEach(evt => {
      document.addEventListener(evt, resetTimers, { passive: true });
    });
    resetTimers();
  }

  return { start, minutes, setMinutes };
})();
