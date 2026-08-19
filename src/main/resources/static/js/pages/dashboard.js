/* pages/dashboard.js — mirrors DashboardModel + Dashboard.fxml.
   Dashboard Customization: each section below is wrapped in a
   data-widget="..." div; DashboardPrefs (below) tracks which widgets are
   shown, stored per-user in localStorage (a device/browser preference,
   like theme). Role-based Dashboard: the first time a user opens the
   dashboard (no saved prefs yet), the *default* selection differs by
   role — Owner gets the full financial view, Manager gets an
   operational-tasks-focused subset — but either role can then customize
   further via the "Customize" button. */
const DashboardPrefs = (() => {
  const WIDGETS = {
    stats: "Summary Stat Cards",
    chart: "Income vs Expense Chart (30 days)",
    donut: "Income Breakdown",
    alerts: "Action Needed (Alerts + Tasks)",
    mom: "Month-over-Month Comparison",
    recentTrips: "Recent Trips"
  };
  const OWNER_DEFAULT = Object.keys(WIDGETS);
  const MANAGER_DEFAULT = ["stats", "alerts", "recentTrips"];

  function storageKey() {
    const user = Session.currentUser();
    return "bms_dashboard_widgets_" + (user ? user.username || user.userId : "guest");
  }

  function get() {
    const stored = localStorage.getItem(storageKey());
    if (stored) { try { return JSON.parse(stored); } catch (e) { /* fall through to default */ } }
    const role = Session.currentUser().role;
    return role === "Manager" ? MANAGER_DEFAULT.slice() : OWNER_DEFAULT.slice();
  }

  function set(list) {
    localStorage.setItem(storageKey(), JSON.stringify(list));
  }

  function isVisible(widgetId) {
    return get().includes(widgetId);
  }

  return { WIDGETS, get, set, isVisible };
})();

function renderDashboardPage(container) {
  const s = Q.dashboardSummary();
  const user = Session.currentUser();
  const mom = Q.momComparison();
  const visible = DashboardPrefs.get();
  const show = (id) => visible.includes(id);

  function momChangeHtml(m) {
    const dir = m.pct > 0.5 ? "up" : m.pct < -0.5 ? "down" : "flat";
    const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "•";
    return `<span class="mom-item__change mom-item__change--${dir}">${arrow} ${Math.abs(m.pct).toFixed(1)}%</span>`;
  }

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h2>Welcome back, ${Fmt.escapeHtml(user.name.split(" ")[0])} 👋</h2>
        <p class="muted">Manage your fleet with efficiency and excellence.</p>
      </div>
      <button class="btn btn--secondary" id="btnCustomizeDash">⚙ Customize</button>
    </div>

    ${show("stats") ? `
    <div class="stat-grid">
      <div class="stat-card stat-card--blue">
        ${icon("bus")}
        <div><span class="stat-card__value">${s.totalBuses}</span><span class="stat-card__label">Active Buses</span></div>
      </div>
      <div class="stat-card stat-card--purple">
        ${icon("route")}
        <div><span class="stat-card__value">${s.totalTrips}</span><span class="stat-card__label">Total Trips</span></div>
      </div>
      <div class="stat-card stat-card--teal">
        ${icon("users")}
        <div><span class="stat-card__value">${s.totalEmployees}</span><span class="stat-card__label">Active Employees</span></div>
      </div>
      <div class="stat-card stat-card--green">
        ${icon("trend")}
        <div><span class="stat-card__value">${Fmt.money(s.totalIncome)}</span><span class="stat-card__label">Total Income</span></div>
      </div>
      <div class="stat-card stat-card--amber">
        ${icon("receipt")}
        <div><span class="stat-card__value">${Fmt.money(s.totalExpenses)}</span><span class="stat-card__label">Total Expenses</span></div>
      </div>
      <div class="stat-card ${s.netProfit >= 0 ? "stat-card--green" : "stat-card--red"}">
        ${icon("wallet")}
        <div><span class="stat-card__value">${Fmt.money(s.netProfit)}</span><span class="stat-card__label">Net Profit</span></div>
      </div>
    </div>` : ""}

    ${(show("chart") || show("donut")) ? `
    <div class="grid-2">
      ${show("chart") ? `
      <div class="card">
        <div class="card__head">
          <h3>Income vs Expense vs Profit — Last 30 Days</h3>
        </div>
        <div id="chartHost"></div>
      </div>` : ""}
      ${show("donut") ? `
      <div class="card">
        <div class="card__head"><h3>Income Breakdown</h3></div>
        <div id="incomeDonutHost"></div>
      </div>` : ""}
    </div>` : ""}

    ${(show("alerts") || show("mom")) ? `
    <div class="grid-2">
      ${show("alerts") ? `
      <div class="card">
        <div class="card__head"><h3>Action Needed</h3><a href="#/todo" class="link">To-Do List →</a></div>
        <div id="alertsHost" class="alert-list"></div>
      </div>` : ""}
      ${show("mom") ? `
      <div class="card">
        <div class="card__head">
          <h3>${mom.curLabel} vs ${mom.prevLabel}</h3>
        </div>
        <div class="mom-grid">
          <div class="mom-item">
            <span class="mom-item__label">Income</span>
            <span class="mom-item__value">${Fmt.money(mom.income.cur)}</span>
            ${momChangeHtml(mom.income)}
          </div>
          <div class="mom-item">
            <span class="mom-item__label">Expenses</span>
            <span class="mom-item__value">${Fmt.money(mom.expenses.cur)}</span>
            ${momChangeHtml(mom.expenses)}
          </div>
          <div class="mom-item">
            <span class="mom-item__label">Net Profit</span>
            <span class="mom-item__value">${Fmt.money(mom.profit.cur)}</span>
            ${momChangeHtml(mom.profit)}
          </div>
          <div class="mom-item">
            <span class="mom-item__label">Trips</span>
            <span class="mom-item__value">${mom.trips.cur}</span>
            ${momChangeHtml(mom.trips)}
          </div>
        </div>
      </div>` : ""}
    </div>` : ""}

    ${show("recentTrips") ? `
    <div class="card">
      <div class="card__head"><h3>Recent Trips</h3><a href="#/trips" class="link">View all →</a></div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>ID</th><th>Category</th><th>Bus</th><th>Route</th><th>Date</th><th>Income</th></tr></thead>
          <tbody id="recentTripsBody"></tbody>
        </table>
      </div>
    </div>` : ""}`;

  qs("#btnCustomizeDash").addEventListener("click", showCustomizeModal);

  function showCustomizeModal() {
    const current = DashboardPrefs.get();
    openModal({
      title: "Customize Dashboard",
      bodyHtml: `
        <p class="muted">Choose which widgets appear on your dashboard.</p>
        ${Object.entries(DashboardPrefs.WIDGETS).map(([id, label]) => `
          <label class="checkbox-line" style="display:block; margin-bottom:8px;">
            <input type="checkbox" class="dashWidgetChk" value="${id}" ${current.includes(id) ? "checked" : ""} /> <span>${Fmt.escapeHtml(label)}</span>
          </label>`).join("")}`,
      footerHtml: `<button class="btn btn--secondary" id="dw_cancel">Cancel</button><button class="btn btn--primary" id="dw_save">Save</button>`,
      onMount(overlay, close) {
        qs("#dw_cancel", overlay).addEventListener("click", close);
        qs("#dw_save", overlay).addEventListener("click", () => {
          const selected = qsa(".dashWidgetChk", overlay).filter(c => c.checked).map(c => c.value);
          DashboardPrefs.set(selected);
          close();
          renderDashboardPage(container);
        });
      }
    });
  }

  if (show("chart")) {
    const chartData = Q.last30DaysChart();
    renderLineChart(qs("#chartHost"), {
      labels: chartData.map(d => d.label),
      series: [
        { name: "Income", color: "#2f9e6e", data: chartData.map(d => d.income) },
        { name: "Expense", color: "#e0663e", data: chartData.map(d => d.expense) },
        { name: "Profit", color: "#3565e8", data: chartData.map(d => d.profit) }
      ]
    });
  }

  if (show("donut")) {
    // Income breakdown donut: how total income splits into expenses vs net profit.
    const donutData = [];
    if (s.totalExpenses > 0) donutData.push({ label: "Expenses", value: s.totalExpenses, color: "#e0663e" });
    if (s.netProfit > 0) donutData.push({ label: "Net Profit", value: s.netProfit, color: "#2f9e6e" });
    renderDonutChart(qs("#incomeDonutHost"), {
      data: donutData,
      valueFmt: (v) => Fmt.money(v)
    });
    if (s.netProfit < 0) {
      qs("#incomeDonutHost").insertAdjacentHTML("beforeend",
        `<p class="muted" style="text-align:center; margin-top:10px;">Expenses currently exceed income by ${Fmt.money(Math.abs(s.netProfit))}.</p>`);
    }
  }

  if (show("alerts")) {
    // Action Needed — insurance/license expiry + bus service reminders
    // (shared with the topbar notification bell) unified with pending
    // To-Do items assigned to the person looking at this dashboard.
    const alerts = Q.fleetAlerts();
    const myPendingTodos = DB.readAll("todos")
      .filter(t => t.assignedToUserId === user.userId && t.todoStatus !== "COMPLETED")
      .map(t => ({ type: t.todoStatus === "IN_PROGRESS" ? "warning" : "info", text: `Task: ${t.title}${t.dueDate ? ` (due ${Fmt.date(t.dueDate)})` : ""}` }));
    const combined = [...alerts, ...myPendingTodos];
    const alertsHost = qs("#alertsHost");
    alertsHost.innerHTML = combined.length
      ? combined.map(a => `<div class="alert-item alert-item--${a.type}">${icon(a.type === "danger" ? "shield" : "bell")}<span>${Fmt.escapeHtml(a.text)}</span></div>`).join("")
      : `<div class="empty-state empty-state--sm"><p>Nothing needs your attention. Everything looks good! ✅</p></div>`;
  }

  if (show("recentTrips")) {
    const recent = [...DB.readAll("trips")].sort((a, b) => b.tripDate.localeCompare(a.tripDate) || b.tripId - a.tripId).slice(0, 6);
    qs("#recentTripsBody").innerHTML = recent.length ? recent.map(t => `
    <tr>
      <td>${t.tripId}</td>
      <td><span class="badge badge--blue">${t.tripCategory}</span></td>
      <td>${Q.busNumber(t.busId)}</td>
      <td>${Fmt.escapeHtml(t.startLocation)} → ${Fmt.escapeHtml(t.endLocation)}</td>
      <td>${Fmt.date(t.tripDate)}</td>
      <td>${Fmt.money(t.totalIncome)}</td>
    </tr>`).join("") : `<tr><td colspan="6"><div class="table-empty"><div class="table-empty__icon">${EMPTY_STATE_ICON}</div>No trips yet.</div></td></tr>`;
  }
}
