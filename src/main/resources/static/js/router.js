/* =========================================================================
   router.js — hash-based SPA router + sidebar/topbar shell
   ========================================================================= */

const NAV_ITEMS = [
  { hash: "#/dashboard", icon: "grid", label: "Dashboard" },
  { hash: "#/buses", icon: "bus", label: "Manage Bus" },
  { hash: "#/trips", icon: "route", label: "Manage Trip" },
  { hash: "#/events", icon: "calendar", label: "Event Bookings" },
  { hash: "#/trip-expenses", icon: "receipt", label: "Trip Expenses" },
  { hash: "#/employees", icon: "users", label: "Employee" },
  { hash: "#/salaries", icon: "wallet", label: "Employee Salary" },
  { hash: "#/maintenance", icon: "wrench", label: "Maintenance" },
  { hash: "#/parts", icon: "box", label: "Part Purchases" },
  { hash: "#/services", icon: "sparkles", label: "Other Services" },
  { hash: "#/prices", icon: "trend", label: "Update Prices" },
  { hash: "#/reports", icon: "chart", label: "Reports" },
  { hash: "#/tools", icon: "tool", label: "Tools" },
  { hash: "#/users", icon: "shield", label: "Manage User", ownerOnly: true }
];

const ICONS = {
  grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
  bus: '<path d="M4 16V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10"/><path d="M4 16a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1M18 16a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1"/><path d="M4 11h16M8 17v2M16 17v2"/><circle cx="7.5" cy="16" r="1"/><circle cx="16.5" cy="16" r="1"/>',
  route: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 7.5C10 10 8 13 6 14c-2 1-2 3-.5 4"/><path d="M15.8 16.5C14 14 16 11 18 10c2-1 2-3 .5-4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14a5 5 0 0 1 5.5 5"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1.2"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2z"/>',
  box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>',
  sparkles: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  tool: '<path d="M9 3a3 3 0 0 0 0 6l-6 6a2 2 0 0 0 3 3l6-6a3 3 0 0 0 4-3l-3 3-2-2 3-3a3 3 0 0 0-5-4z"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'
};

function icon(name, cls = "") {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ""}</svg>`;
}

const Router = (() => {
  const routes = {};
  function register(path, renderFn) { routes[path] = renderFn; }

  function currentPath() {
    return (location.hash || "#/dashboard").split("?")[0];
  }

  function buildShell() {
    const user = Session.currentUser();
    const app = qs("#app");
    app.innerHTML = `
      <div class="shell">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar__brand">
            <div class="brand-mark">
              <img src="PASTE_LOGO_IMAGE_URL_HERE" alt="Logo" class="logo"
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <span class="logo-fallback">${icon("bus")}</span>
            </div>
            <div class="brand-text">
              <strong>Gunasekara</strong>
              <span>Travels · Fleet OS</span>
            </div>
          </div>
          <nav class="sidebar__nav" id="sidebarNav"></nav>
          <div class="sidebar__footer">
            <div class="user-chip">
              <div class="user-chip__avatar">${(user?.name || "U").charAt(0)}</div>
              <div class="user-chip__meta">
                <strong>${Fmt.escapeHtml(user?.name || "")}</strong>
                <span>${Fmt.escapeHtml(user?.role || "")}</span>
              </div>
            </div>
            <button class="btn btn--ghost btn--block" id="btnLogout">${icon("logout")} Logout</button>
          </div>
        </aside>
        <div class="main">
          <header class="topbar">
            <button class="topbar__burger" id="burger" aria-label="Toggle menu">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
            </button>
            <div class="topbar__title" id="pageTitle">Dashboard</div>
            <div class="topbar__right">
              <span class="topbar__clock" id="clock"></span>
            </div>
          </header>
          <main class="content" id="content"></main>
        </div>
      </div>`;

    const nav = qs("#sidebarNav");
    nav.innerHTML = NAV_ITEMS.filter(i => !i.ownerOnly || Session.isOwner()).map(i => `
      <a href="${i.hash}" class="sidebar__link" data-hash="${i.hash}">
        ${icon(i.icon)}<span>${i.label}</span>
      </a>`).join("");

    qs("#btnLogout").addEventListener("click", async () => {
      const ok = await confirmDialog({ title: "Logout", message: "Are you sure you want to logout?", okText: "Logout", danger: true });
      if (ok) { Session.clear(); location.hash = ""; location.reload(); }
    });

    qs("#burger").addEventListener("click", () => qs("#sidebar").classList.toggle("open"));

    function tickClock() {
      const el = qs("#clock");
      if (!el) return;
      el.textContent = new Date().toLocaleString("en-GB", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    }
    tickClock();
    setInterval(tickClock, 30000);
  }

  function setActive(hash) {
    qsa(".sidebar__link").forEach(a => a.classList.toggle("active", a.dataset.hash === hash));
    qsa(".sidebar__link").forEach(a => a.addEventListener("click", () => qs("#sidebar").classList.remove("open")));
  }

  function render() {
    if (!Session.isLoggedIn()) { location.href = "index.html"; return; }
    if (!qs("#sidebar")) buildShell();

    const hash = currentPath();
    setActive(hash);
    const match = routes[hash] || routes["#/dashboard"];
    const item = NAV_ITEMS.find(i => i.hash === hash);
    qs("#pageTitle").textContent = item ? item.label : "Dashboard";

    if (item && item.ownerOnly && !Session.isOwner()) {
      qs("#content").innerHTML = `<div class="empty-state"><h3>Access denied</h3><p>Only Owners can access User Management.</p></div>`;
      return;
    }
    qs("#content").innerHTML = "";
    match(qs("#content"));
    if (typeof Reveal !== "undefined") Reveal.scan(qs("#content"));
  }

  function start() {
    window.addEventListener("hashchange", render);
    render();
  }

  return { register, start, render };
})();
