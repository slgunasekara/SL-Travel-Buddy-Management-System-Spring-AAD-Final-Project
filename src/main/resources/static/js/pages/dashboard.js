async function renderDashboardPage(container) {
    container.innerHTML = `<div class="empty-state"><p>Loading dashboard...</p></div>`;

    let s, mom, alerts;
    try {
        [s, mom, alerts] = await Promise.all([
            apiRequest("GET", "/v1/report/dashboard-summary").then(r => r.body),
            apiRequest("GET", "/v1/report/mom-comparison").then(r => r.body),
            apiRequest("GET", "/v1/report/fleet-alerts").then(r => r.body)
        ]);
    } catch (e) {
        container.innerHTML = `<div class="empty-state"><p>Could not load the dashboard: ${Fmt.escapeHtml(e.message || "unknown error")}</p></div>`;
        return;
    }

    const user = Session.currentUser();

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
        <div class="card__head"><h3>Income Breakdown</h3></div>
        <div id="incomeDonutHost"></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card__head"><h3>Fleet & Document Alerts</h3></div>
        <div id="alertsHost" class="alert-list"></div>
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


    let chartData = [];
    try {
        const today = new Date();
        const start = new Date(today);
        start.setDate(start.getDate() - 29);
        const fromDate = start.toISOString().slice(0, 10);
        const toDate = today.toISOString().slice(0, 10);
        const rows = await apiRequest("GET", `/v1/report/daily-profit?from=${fromDate}&to=${toDate}`).then(r => r.body);
        const byDate = {};
        rows.forEach(r => byDate[r.date] = r);
        for (let i = 0; i < 30; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            const key = d.toISOString().slice(0, 10);
            const r = byDate[key];
            chartData.push({
                date: key,
                label: d.toLocaleDateString("en-GB", {day: "2-digit", month: "2-digit"}),
                income: r ? r.totalIncome : 0,
                expense: r ? r.totalExpenses : 0,
                profit: r ? r.netProfit : 0
            });
        }
    } catch (err) {
        Toast.error(apiErrorMessage(err, "Failed to load the 30-day chart."));
    }
    renderLineChart(qs("#chartHost"), {
        labels: chartData.map(d => d.label),
        series: [
            {name: "Income", color: "#2f9e6e", data: chartData.map(d => d.income)},
            {name: "Expense", color: "#e0663e", data: chartData.map(d => d.expense)},
            {name: "Profit", color: "#3565e8", data: chartData.map(d => d.profit)}
        ]
    });


    const donutData = [];
    if (s.totalExpenses > 0) donutData.push({label: "Expenses", value: s.totalExpenses, color: "#e0663e"});
    if (s.netProfit > 0) donutData.push({label: "Net Profit", value: s.netProfit, color: "#2f9e6e"});
    renderDonutChart(qs("#incomeDonutHost"), {
        data: donutData,
        valueFmt: (v) => Fmt.money(v)
    });
    if (s.netProfit < 0) {
        qs("#incomeDonutHost").insertAdjacentHTML("beforeend",
            `<p class="muted" style="text-align:center; margin-top:10px;">Expenses currently exceed income by ${Fmt.money(Math.abs(s.netProfit))}.</p>`);
    }


    const alertsHost = qs("#alertsHost");
    alertsHost.innerHTML = alerts.length
        ? alerts.map(a => `<div class="alert-item alert-item--${a.type}">${icon(a.type === "danger" ? "shield" : "bell")}<span>${Fmt.escapeHtml(a.text)}</span></div>`).join("")
        : `<div class="empty-state empty-state--sm"><p>No urgent alerts. Everything looks good! ✅</p></div>`;

    let recentTrips = [];
    let busesCache = [];
    try {
        const [tRes, bRes] = await Promise.all([
            apiRequest("GET", "/v1/trip/all"),
            apiRequest("GET", "/v1/bus/all")
        ]);
        recentTrips = tRes.body || [];
        busesCache = bRes.body || [];
    } catch (err) {
        Toast.error(apiErrorMessage(err, "Failed to load recent trips."));
    }

    function busNumber(busId) {
        const b = busesCache.find(x => x.busId === busId);
        return b ? Fmt.escapeHtml(b.busNumber) : "-";
    }

    const recent = [...recentTrips].sort((a, b) => b.tripDate.localeCompare(a.tripDate) || b.tripId - a.tripId).slice(0, 6);
    qs("#recentTripsBody").innerHTML = recent.length ? recent.map(t => `
    <tr>
      <td>${t.tripId}</td>
      <td><span class="badge badge--blue">${t.tripCategory}</span></td>
      <td>${busNumber(t.busId)}</td>
      <td>${Fmt.escapeHtml(t.startLocation)} → ${Fmt.escapeHtml(t.endLocation)}</td>
      <td>${Fmt.date(t.tripDate)}</td>
      <td>${Fmt.money(t.totalIncome)}</td>
    </tr>`).join("") : `<tr><td colspan="6"><div class="table-empty"><div class="table-empty__icon">${EMPTY_STATE_ICON}</div>No trips yet.</div></td></tr>`;
}
