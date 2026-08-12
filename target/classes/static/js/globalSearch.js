/* =========================================================================
   globalSearch.js — Ctrl/Cmd+K search palette. Searches across the main
   record types and navigates to the right page on selection. Read-only —
   does not modify any data or existing page logic.
   ========================================================================= */

const GlobalSearch = (() => {
  let overlayEl = null;
  let results = [];
  let activeIndex = -1;

  function ensureOverlay() {
    if (overlayEl) return overlayEl;
    overlayEl = document.createElement("div");
    overlayEl.className = "search-palette-overlay";
    overlayEl.innerHTML = `
      <div class="search-palette">
        <div class="search-palette__input-wrap">
          ${icon("search")}
          <input type="text" class="search-palette__input" id="gsInput" placeholder="Search buses, trips, employees, customers..." autocomplete="off" />
          <span class="search-palette__esc">ESC</span>
        </div>
        <div class="search-palette__results" id="gsResults"></div>
      </div>`;
    document.body.appendChild(overlayEl);
    overlayEl.addEventListener("click", e => { if (e.target === overlayEl) close(); });
    qs("#gsInput", overlayEl).addEventListener("input", debounce(() => runSearch(qs("#gsInput", overlayEl).value), 120));
    qs("#gsInput", overlayEl).addEventListener("keydown", onInputKeydown);
    return overlayEl;
  }

  function buildIndex(term) {
    const t = term.trim().toLowerCase();
    if (!t) return [];
    const out = [];

    DB.readAll("buses").forEach(b => {
      if (`${b.busNumber} ${b.busBrandName} ${b.busType} ${b.routePermitNo || ""} ${b.permitStartLocation || ""} ${b.permitEndLocation || ""}`.toLowerCase().includes(t)) {
        out.push({ group: "Buses", icon: "bus", title: b.busNumber, sub: `${b.busBrandName} · ${b.busType}`, hash: "#/buses", table: "buses", id: b.busId });
      }
    });
    DB.readAll("trips").forEach(tr => {
      if (`${tr.startLocation} ${tr.endLocation} ${tr.tripCategory}`.toLowerCase().includes(t)) {
        out.push({ group: "Trips", icon: "route", title: `${tr.startLocation} → ${tr.endLocation}`, sub: `${tr.tripCategory} · ${Fmt.date(tr.tripDate)}`, hash: "#/trips", table: "trips", id: tr.tripId });
      }
    });
    DB.readAll("employees").forEach(e => {
      if (`${e.empName} ${e.empCategory} ${e.empCategory2 || ""} ${e.contactNo}`.toLowerCase().includes(t)) {
        out.push({ group: "Employees", icon: "users", title: e.empName, sub: `${e.empCategory}${e.empCategory2 ? " / " + e.empCategory2 : ""} · ${e.contactNo}`, hash: "#/employees", table: "employees", id: e.empId });
      }
    });
    DB.readAll("customers").forEach(c => {
      if (`${c.name} ${c.contact} ${c.nic}`.toLowerCase().includes(t)) {
        out.push({ group: "Customers", icon: "users", title: c.name, sub: c.contact || "", hash: "#/customers", table: "customers", id: c.customerId });
      }
    });
    DB.readAll("events").forEach(ev => {
      if (`${ev.customerName} ${ev.startLocation} ${ev.endLocation}`.toLowerCase().includes(t)) {
        out.push({ group: "Event Bookings", icon: "calendar", title: ev.customerName, sub: `${ev.startLocation} → ${ev.endLocation}`, hash: "#/events", table: "events", id: ev.eventId });
      }
    });

    const navMatches = NAV_ITEMS.filter(i => i.label.toLowerCase().includes(t));
    navMatches.forEach(i => out.push({ group: "Go to page", icon: i.icon, title: i.label, sub: "Page", hash: i.hash }));

    return out.slice(0, 30);
  }

  function runSearch(term) {
    results = buildIndex(term);
    activeIndex = results.length ? 0 : -1;
    renderResults();
  }

  function renderResults() {
    const host = qs("#gsResults", overlayEl);
    if (results.length === 0) {
      const term = qs("#gsInput", overlayEl).value.trim();
      host.innerHTML = term
        ? `<div class="search-palette__empty">No matches for "${Fmt.escapeHtml(term)}"</div>`
        : `<div class="search-palette__empty">Start typing to search buses, trips, employees, customers, or jump to a page.</div>`;
      return;
    }
    let currentGroup = null;
    let html = "";
    results.forEach((r, i) => {
      if (r.group !== currentGroup) {
        html += `<div class="search-palette__group-label">${r.group}</div>`;
        currentGroup = r.group;
      }
      html += `
        <div class="search-result-item ${i === activeIndex ? "active" : ""}" data-idx="${i}">
          <span class="search-result-item__icon">${icon(r.icon)}</span>
          <div>
            <div class="search-result-item__title">${Fmt.escapeHtml(r.title)}</div>
            <div class="search-result-item__sub">${Fmt.escapeHtml(r.sub)}</div>
          </div>
        </div>`;
    });
    host.innerHTML = html;
    qsa(".search-result-item", host).forEach(el => {
      el.addEventListener("click", () => selectResult(Number(el.dataset.idx)));
      el.addEventListener("mouseenter", () => { activeIndex = Number(el.dataset.idx); highlightActive(); });
    });
  }

  function highlightActive() {
    qsa(".search-result-item", overlayEl).forEach(el => el.classList.toggle("active", Number(el.dataset.idx) === activeIndex));
    const activeEl = qs(`.search-result-item[data-idx="${activeIndex}"]`, overlayEl);
    if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
  }

  function selectResult(idx) {
    const r = results[idx];
    if (!r) return;
    close();
    if (r.table && r.id !== undefined) setJumpTarget(r.table, r.id);
    location.hash = r.hash;
  }

  // One-shot "jump to this record" handoff to whichever page renders next —
  // consumed (and cleared) by that page so it only fires once.
  let pendingJump = null;
  function setJumpTarget(table, id) { pendingJump = { table, id }; }
  function consumeJumpTarget(table) {
    if (!pendingJump || pendingJump.table !== table) return null;
    const id = pendingJump.id;
    pendingJump = null;
    return id;
  }

  function onInputKeydown(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); if (results.length) { activeIndex = (activeIndex + 1) % results.length; highlightActive(); } }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (results.length) { activeIndex = (activeIndex - 1 + results.length) % results.length; highlightActive(); } }
    else if (e.key === "Enter") { e.preventDefault(); if (activeIndex >= 0) selectResult(activeIndex); }
    else if (e.key === "Escape") { close(); }
  }

  function open() {
    ensureOverlay();
    qs("#gsInput", overlayEl).value = "";
    results = []; activeIndex = -1;
    renderResults();
    overlayEl.classList.add("open");
    setTimeout(() => qs("#gsInput", overlayEl).focus(), 30);
  }

  function close() {
    if (overlayEl) overlayEl.classList.remove("open");
  }

  function toggle() {
    if (overlayEl && overlayEl.classList.contains("open")) close();
    else open();
  }

  // Global keyboard shortcut: Ctrl/Cmd+K, from anywhere in the app.
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      toggle();
    }
  });

  return { open, close, toggle, consumeJumpTarget };
})();
