/* =========================================================================
   notifications.js — topbar notification bell. Reuses Q.fleetAlerts()
   (insurance/license expiry + service-due reminders) so the same alert
   logic that powers the dashboard panel is available from any page.
   ========================================================================= */

const Notifications = (() => {
  let panelEl = null;

  function ensurePanel() {
    if (panelEl) return panelEl;
    panelEl = document.createElement("div");
    panelEl.className = "notif-panel";
    document.body.appendChild(panelEl);
    panelEl.addEventListener("click", e => e.stopPropagation());
    return panelEl;
  }

  function render() {
    const alerts = Q.fleetAlerts();
    ensurePanel().innerHTML = `
      <div class="notif-panel__head">
        <strong>Fleet & Document Alerts</strong>
        <span class="pill">${alerts.length}</span>
      </div>
      <div class="notif-panel__body">
        ${alerts.length === 0
          ? `<div class="notif-empty">No urgent alerts. Everything looks good! ✅</div>`
          : alerts.map(a => `
            <div class="alert-item alert-item--${a.type}">
              ${icon(a.type === "danger" ? "shield" : "bell")}<span>${Fmt.escapeHtml(a.text)}</span>
            </div>`).join("")}
      </div>`;
  }

  function updateBadge(triggerEl) {
    const count = Q.fleetAlerts().length;
    let badge = triggerEl.querySelector(".bell-badge");
    if (count > 0) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "bell-badge";
        triggerEl.appendChild(badge);
      }
      badge.textContent = count > 9 ? "9+" : String(count);
    } else if (badge) {
      badge.remove();
    }
  }

  function positionPanel(triggerEl) {
    const rect = triggerEl.getBoundingClientRect();
    const panelWidth = 340;
    let right = Math.max(12, window.innerWidth - rect.right);
    if (window.innerWidth - right - panelWidth < 8) right = Math.max(8, window.innerWidth - panelWidth - 8);
    panelEl.style.top = (rect.bottom + 12) + "px";
    panelEl.style.right = right + "px";
  }

  function onDocClick(e) { if (panelEl && !panelEl.contains(e.target)) close(); }
  function onKeydown(e) { if (e.key === "Escape") close(); }
  function onResize() { close(); }

  function open(triggerEl) {
    render();
    positionPanel(triggerEl);
    requestAnimationFrame(() => panelEl.classList.add("open"));
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onKeydown);
    window.addEventListener("resize", onResize);
  }

  function close() {
    if (!panelEl) return;
    panelEl.classList.remove("open");
    document.removeEventListener("click", onDocClick, true);
    document.removeEventListener("keydown", onKeydown);
    window.removeEventListener("resize", onResize);
  }

  function toggle(triggerEl) {
    if (panelEl && panelEl.classList.contains("open")) { close(); return; }
    open(triggerEl);
  }

  return { toggle, close, updateBadge };
})();
