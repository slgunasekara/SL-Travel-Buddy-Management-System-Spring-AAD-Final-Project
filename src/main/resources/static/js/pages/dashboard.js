/* pages/dashboard.js — mirrors DashboardModel + Dashboard.fxml */
function renderDashboardPage(container) {
  const s = Q.dashboardSummary();
  const user = Session.currentUser();
  const mom = Q.momComparison();

  function momChangeHtml(m) {
    const dir = m.pct > 0.5 ? "up" : m.pct < -0.5 ? "down" : "flat";
    const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "•";
    return `<span class="mom-item__change mom-item__change--${dir}">${arrow} ${Math.abs(m.pct).toFixed(1)}%</span>`;
  }

  function buildNarrative() {
    if (s.totalTrips === 0) {
      return `You haven't logged any trips yet. Once you start adding trips, this space will automatically summarize your income, expenses and profit trends in plain language.`;
    }
    const avgPerTrip = s.totalIncome / s.totalTrips;
    const margin = s.totalIncome > 0 ? (s.netProfit / s.totalIncome) * 100 : 0;
    const marginTone = margin >= 20 ? "a healthy" : margin >= 0 ? "a modest" : "a negative";

    let text = `Across <strong>${s.totalTrips}</strong> trip${s.totalTrips === 1 ? "" : "s"} logged so far, your fleet has earned <strong>${Fmt.money(s.totalIncome)}</strong> in total income — averaging around <strong>${Fmt.money(avgPerTrip)}</strong> per trip. `;
    text += `Operating costs (fuel, salaries, maintenance, parts and other services) have added up to <strong>${Fmt.money(s.totalExpenses)}</strong>, leaving a net ${s.netProfit >= 0 ? "profit" : "loss"} of <strong>${Fmt.money(Math.abs(s.netProfit))}</strong> — ${marginTone} margin of ${Math.abs(margin).toFixed(1)}%. `;

    if (mom.income.prev > 0 || mom.expenses.prev > 0 || mom.income.cur > 0) {
      const incomeDir = mom.income.pct > 0.5 ? "up" : mom.income.pct < -0.5 ? "down" : "about flat";
      const profitDir = mom.profit.pct > 0.5 ? "up" : mom.profit.pct < -0.5 ? "down" : "about flat";
      text += `Compared to ${mom.prevLabel}, income is ${incomeDir}${incomeDir !== "about flat" ? ` ${Math.abs(mom.income.pct).toFixed(1)}%` : ""} and net profit is ${profitDir}${profitDir !== "about flat" ? ` ${Math.abs(mom.profit.pct).toFixed(1)}%` : ""} so far this month. `;
      if (mom.profit.pct >= 5) text += `Nice trajectory — keep it up! 🎉`;
      else if (mom.profit.pct <= -10) text += `Worth a closer look at what's driving expenses up this month.`;
    }
    return text;
  }

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

    <div class="card insight-card">
      <div class="insight-card__icon">${icon("trend")}</div>
      <div class="insight-card__body">
        <h3>Business Snapshot</h3>
        <p>${buildNarrative()}</p>
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

  // Alerts: insurance/license expiry + bus service reminders (shared with the topbar notification bell)
  const alerts = Q.fleetAlerts();
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
    </tr>`).join("") : `<tr><td colspan="6"><div class="table-empty"><div class="table-empty__icon">${EMPTY_STATE_ICON}</div>No trips yet.</div></td></tr>`;
}
