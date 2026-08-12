/* pages/dashboard.js — mirrors DashboardModel + Dashboard.fxml */
function renderDashboardPage(container) {
  const s = Q.dashboardSummary();
  const user = Session.currentUser();

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h2>Welcome back, ${Fmt.escapeHtml(user.name.split(" ")[0])} 👋</h2>
        <p class="muted">Manage your fleet with efficiency and excellence.</p>
      </div>
    </div>

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
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card__head">
          <h3>Income vs Expense vs Profit — Last 30 Days</h3>
        </div>
        <div id="chartHost"></div>
      </div>
      <div class="card">
        <div class="card__head"><h3>Fleet & Document Alerts</h3></div>
        <div id="alertsHost" class="alert-list"></div>
      </div>
    </div>

    <div class="card">
      <div class="card__head"><h3>Recent Trips</h3><a href="#/trips" class="link">View all →</a></div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>ID</th><th>Category</th><th>Bus</th><th>Route</th><th>Date</th><th>Income</th></tr></thead>
          <tbody id="recentTripsBody"></tbody>
        </table>
      </div>
    </div>`;

  const chartData = Q.last30DaysChart();
  renderLineChart(qs("#chartHost"), {
    labels: chartData.map(d => d.label),
    series: [
      { name: "Income", color: "#2f9e6e", data: chartData.map(d => d.income) },
      { name: "Expense", color: "#e0663e", data: chartData.map(d => d.expense) },
      { name: "Profit", color: "#3565e8", data: chartData.map(d => d.profit) }
    ]
  });

  // Alerts: expired/expiring insurance & license
  const buses = DB.readAll("buses");
  const soon = new Date(); soon.setDate(soon.getDate() + 30);
  const alerts = [];
  buses.forEach(b => {
    if (b.insuranceExpiryDate) {
      const d = new Date(b.insuranceExpiryDate);
      if (d < new Date()) alerts.push({ type: "danger", text: `${b.busNumber}: Insurance expired on ${Fmt.date(b.insuranceExpiryDate)}` });
      else if (d < soon) alerts.push({ type: "warning", text: `${b.busNumber}: Insurance expiring on ${Fmt.date(b.insuranceExpiryDate)}` });
    }
    if (b.licenseRenewalDate) {
      const d = new Date(b.licenseRenewalDate);
      if (d < new Date()) alerts.push({ type: "danger", text: `${b.busNumber}: License renewal overdue since ${Fmt.date(b.licenseRenewalDate)}` });
      else if (d < soon) alerts.push({ type: "warning", text: `${b.busNumber}: License renewal due ${Fmt.date(b.licenseRenewalDate)}` });
    }
  });
  const alertsHost = qs("#alertsHost");
  alertsHost.innerHTML = alerts.length
    ? alerts.map(a => `<div class="alert-item alert-item--${a.type}">${icon(a.type === "danger" ? "shield" : "bell")}<span>${Fmt.escapeHtml(a.text)}</span></div>`).join("")
    : `<div class="empty-state empty-state--sm"><p>No urgent alerts. Everything looks good! ✅</p></div>`;

  const recent = [...DB.readAll("trips")].sort((a, b) => b.tripDate.localeCompare(a.tripDate) || b.tripId - a.tripId).slice(0, 6);
  qs("#recentTripsBody").innerHTML = recent.length ? recent.map(t => `
    <tr>
      <td>${t.tripId}</td>
      <td><span class="badge badge--blue">${t.tripCategory}</span></td>
      <td>${Q.busNumber(t.busId)}</td>
      <td>${Fmt.escapeHtml(t.startLocation)} → ${Fmt.escapeHtml(t.endLocation)}</td>
      <td>${Fmt.date(t.tripDate)}</td>
      <td>${Fmt.money(t.totalIncome)}</td>
    </tr>`).join("") : `<tr><td colspan="6"><div class="table-empty">No trips yet.</div></td></tr>`;
}
