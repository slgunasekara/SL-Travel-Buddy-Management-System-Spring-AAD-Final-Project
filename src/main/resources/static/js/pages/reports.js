/* pages/reports.js — mirrors ManageReportController + DailyProfitController + MonthlyProfitController */
function renderReportsPage(container) {
  let activeTab = "overview";
  let fromDate = defaultFrom();
  let toDate = DB.today();

  function defaultFrom() {
    const d = new Date(); d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  }

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "income", label: "Income Report" },
    { id: "expense", label: "Expense Report" },
    { id: "salary", label: "Salary Report" },
    { id: "trip", label: "Trip Report" },
    { id: "daily", label: "Daily Profit" },
    { id: "monthly", label: "Monthly Profit" },
    { id: "leaderboard", label: "Leaderboard" }
  ];

  container.innerHTML = `
    <div class="page-head">
      <div><h2>Reports</h2><p class="muted">Financial performance across income, expenses, salaries and trips.</p></div>
    </div>

    <div class="card filter-bar">
      <div class="form-field">
        <label>From</label>
        <input type="date" id="fromDate" value="${fromDate}" />
      </div>
      <div class="form-field">
        <label>To</label>
        <input type="date" id="toDate" value="${toDate}" />
      </div>
      <button class="btn btn--primary" id="btnApply">Apply Filter</button>
      <div class="quick-ranges">
        <button class="chip-btn" data-range="7">Last 7 days</button>
        <button class="chip-btn" data-range="30">Last 30 days</button>
        <button class="chip-btn" data-range="90">Last 90 days</button>
        <button class="chip-btn" data-range="365">This year</button>
      </div>
    </div>

    <div class="tabs" id="tabBar"></div>
    <div id="tabContent"></div>`;

  qs("#tabBar").innerHTML = TABS.map(t => `<button class="tab-btn ${t.id === activeTab ? "active" : ""}" data-tab="${t.id}">${t.label}</button>`).join("");

  qsa("[data-tab]").forEach(btn => btn.addEventListener("click", () => {
    activeTab = btn.dataset.tab;
    qsa("[data-tab]").forEach(b => b.classList.toggle("active", b.dataset.tab === activeTab));
    renderTab();
  }));

  qs("#btnApply").addEventListener("click", () => {
    fromDate = qs("#fromDate").value;
    toDate = qs("#toDate").value;
    if (fromDate > toDate) { Toast.warning("From date cannot be after To date."); return; }
    renderTab();
  });

  qsa("[data-range]").forEach(btn => btn.addEventListener("click", () => {
    const days = Number(btn.dataset.range);
    const to = new Date();
    const from = new Date(); from.setDate(from.getDate() - (days - 1));
    fromDate = from.toISOString().slice(0, 10);
    toDate = to.toISOString().slice(0, 10);
    qs("#fromDate").value = fromDate;
    qs("#toDate").value = toDate;
    renderTab();
  }));

  function summaryCardsHtml() {
    const s = Q.reportSummary(fromDate, toDate);
    return `
      <div class="stat-grid stat-grid--compact">
        <div class="stat-card stat-card--green">${icon("trend")}<div><span class="stat-card__value">${Fmt.money(s.totalIncome)}</span><span class="stat-card__label">Total Income</span></div></div>
        <div class="stat-card stat-card--amber">${icon("receipt")}<div><span class="stat-card__value">${Fmt.money(s.totalExpenses)}</span><span class="stat-card__label">Total Expenses</span></div></div>
        <div class="stat-card stat-card--blue">${icon("wallet")}<div><span class="stat-card__value">${Fmt.money(s.totalSalary)}</span><span class="stat-card__label">Total Salary</span></div></div>
        <div class="stat-card ${s.netProfit >= 0 ? "stat-card--green" : "stat-card--red"}">${icon("chart")}<div><span class="stat-card__value">${Fmt.money(s.netProfit)}</span><span class="stat-card__label">Net Profit</span></div></div>
        <div class="stat-card stat-card--purple">${icon("route")}<div><span class="stat-card__value">${s.totalTrips}</span><span class="stat-card__label">Total Trips</span></div></div>
      </div>`;
  }

  function exportTable(headers, rows, filename) {
    const lines = [headers.join(",")];
    rows.forEach(r => lines.push(r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    Toast.success("CSV exported!");
  }

  function renderTab() {
    const host = qs("#tabContent");
    if (activeTab === "overview") {
      host.innerHTML = `
        ${summaryCardsHtml()}
        <div class="grid-2">
          <div class="card">
            <div class="card__head"><h3>Daily Profit Trend</h3></div>
            <div id="overviewChart"></div>
          </div>
          <div class="card">
            <div class="card__head"><h3>Expense Breakdown</h3></div>
            <div id="overviewDonut"></div>
          </div>
        </div>`;
      const rows = Q.dailyProfitByRange(fromDate, toDate).sort((a, b) => a.date.localeCompare(b.date));
      renderLineChart(qs("#overviewChart"), {
        labels: rows.map(r => Fmt.date(r.date).replace(/ \d{4}$/, "")),
        series: [
          { name: "Income", color: "#2f9e6e", data: rows.map(r => r.totalIncome) },
          { name: "Expenses", color: "#e0663e", data: rows.map(r => r.totalExpenses) },
          { name: "Net Profit", color: "#3565e8", data: rows.map(r => r.netProfit) }
        ]
      });
      renderDonutChart(qs("#overviewDonut"), { data: Q.expenseBreakdown(fromDate, toDate) });
      return;
    }

    if (activeTab === "income") {
      const rows = Q.incomeReport(fromDate, toDate);
      host.innerHTML = `
        ${summaryCardsHtml()}
        <div class="card">
          <div class="table-toolbar"><h3>Income Report</h3><div class="table-toolbar__right"><button class="btn btn--ghost btn--sm" id="printBtn">🖨 Print</button><button class="btn btn--ghost btn--sm" id="exp">Export CSV</button></div></div>
          <p class="muted" style="padding:0 16px 4px;">Includes both scheduled Trips and private-hire Event Bookings.</p>
          <div class="table-wrap"><table class="data-table">
            <thead><tr><th>ID</th><th>Source</th><th>Bus</th><th>Date</th><th>Income</th></tr></thead>
            <tbody>${rows.length ? rows.map(r => `<tr><td>${r.tripId}</td><td><span class="badge badge--${r.source === "EVENT" ? "amber" : "blue"}">${r.source}</span></td><td>${r.busNumber}</td><td>${Fmt.date(r.tripDate)}</td><td>${Fmt.money(r.totalIncome)}</td></tr>`).join("") : `<tr><td colspan="5"><div class="table-empty">No income in this range.</div></td></tr>`}</tbody>
          </table></div>
        </div>`;
      qs("#exp")?.addEventListener("click", () => exportTable(["ID", "Source", "Bus", "Date", "Income"], rows.map(r => [r.tripId, r.source, r.busNumber, r.tripDate, r.totalIncome]), `income_report_${fromDate}_${toDate}.csv`));
      qs("#printBtn")?.addEventListener("click", () => PrintReceipt.tablePrint({
        docTitle: "Income Report", heading: "Income Report", subheading: `${Fmt.date(fromDate)} – ${Fmt.date(toDate)}`,
        columns: ["ID", "Source", "Bus", "Date", "Income"],
        rows: rows.map(r => [r.tripId, r.source, r.busNumber, Fmt.date(r.tripDate), Fmt.money(r.totalIncome)]),
        totalLabel: "Total Income", totalValue: Fmt.money(rows.reduce((a, r) => a + Number(r.totalIncome), 0))
      }));
      return;
    }

    if (activeTab === "expense") {
      const rows = Q.expenseReport(fromDate, toDate);
      const expenseRowsTotal = rows.reduce((a, r) => a + Number(r.amount), 0);
      host.innerHTML = `
        ${summaryCardsHtml()}
        <div class="card">
          <div class="table-toolbar"><h3>Expense Report</h3><div class="table-toolbar__right"><button class="btn btn--ghost btn--sm" id="printBtn">🖨 Print</button><button class="btn btn--ghost btn--sm" id="exp">Export CSV</button></div></div>
          <p class="muted" style="padding:0 16px 4px;">Covers Trip Expenses, Maintenance, Parts and Other Services — total below: <strong>${Fmt.money(expenseRowsTotal)}</strong>. Salary payments are reported separately under the Salary Report tab (the "Total Expenses" card above includes salary).</p>
          <div class="table-wrap"><table class="data-table">
            <thead><tr><th>Date</th><th>Category</th><th>Amount</th></tr></thead>
            <tbody>${rows.length ? rows.map(r => `<tr><td>${Fmt.date(r.expenseDate)}</td><td><span class="badge badge--gray">${r.category}</span></td><td>${Fmt.money(r.amount)}</td></tr>`).join("") : `<tr><td colspan="3"><div class="table-empty">No expenses in this range.</div></td></tr>`}</tbody>
          </table></div>
        </div>`;
      qs("#exp")?.addEventListener("click", () => exportTable(["Date", "Category", "Amount"], rows.map(r => [r.expenseDate, r.category, r.amount]), `expense_report_${fromDate}_${toDate}.csv`));
      qs("#printBtn")?.addEventListener("click", () => PrintReceipt.tablePrint({
        docTitle: "Expense Report", heading: "Expense Report", subheading: `${Fmt.date(fromDate)} – ${Fmt.date(toDate)}`,
        columns: ["Date", "Category", "Amount"],
        rows: rows.map(r => [Fmt.date(r.expenseDate), r.category, Fmt.money(r.amount)]),
        totalLabel: "Total Expenses", totalValue: Fmt.money(rows.reduce((a, r) => a + r.amount, 0))
      }));
      return;
    }

    if (activeTab === "salary") {
      const rows = Q.salaryReport(fromDate, toDate);
      host.innerHTML = `
        ${summaryCardsHtml()}
        <div class="card">
          <div class="table-toolbar"><h3>Salary Report</h3><div class="table-toolbar__right"><button class="btn btn--ghost btn--sm" id="printBtn">🖨 Print</button><button class="btn btn--ghost btn--sm" id="exp">Export CSV</button></div></div>
          <div class="table-wrap"><table class="data-table">
            <thead><tr><th>Employee</th><th>Date</th><th>Amount</th></tr></thead>
            <tbody>${rows.length ? rows.map(r => `<tr><td>${Fmt.escapeHtml(r.employeeName)}</td><td>${Fmt.date(r.salaryDate)}</td><td>${Fmt.money(r.amount)}</td></tr>`).join("") : `<tr><td colspan="3"><div class="table-empty">No salary payments in this range.</div></td></tr>`}</tbody>
          </table></div>
        </div>`;
      qs("#exp")?.addEventListener("click", () => exportTable(["Employee", "Date", "Amount"], rows.map(r => [r.employeeName, r.salaryDate, r.amount]), `salary_report_${fromDate}_${toDate}.csv`));
      qs("#printBtn")?.addEventListener("click", () => PrintReceipt.tablePrint({
        docTitle: "Salary Report", heading: "Salary Report", subheading: `${Fmt.date(fromDate)} – ${Fmt.date(toDate)}`,
        columns: ["Employee", "Date", "Amount"],
        rows: rows.map(r => [r.employeeName, Fmt.date(r.salaryDate), Fmt.money(r.amount)]),
        totalLabel: "Total Salary", totalValue: Fmt.money(rows.reduce((a, r) => a + r.amount, 0))
      }));
      return;
    }

    if (activeTab === "trip") {
      const rows = Q.tripReport(fromDate, toDate);
      host.innerHTML = `
        ${summaryCardsHtml()}
        <div class="card">
          <div class="table-toolbar"><h3>Trip Report</h3><div class="table-toolbar__right"><button class="btn btn--ghost btn--sm" id="printBtn">🖨 Print</button><button class="btn btn--ghost btn--sm" id="exp">Export CSV</button></div></div>
          <div class="table-wrap"><table class="data-table">
            <thead><tr><th>Trip ID</th><th>Date</th><th>Bus</th><th>Route</th><th>Category</th></tr></thead>
            <tbody>${rows.length ? rows.map(r => `<tr><td>#${r.tripId}</td><td>${Fmt.date(r.tripDate)}</td><td>${r.busNumber}</td><td>${Fmt.escapeHtml(r.route)}</td><td><span class="badge badge--blue">${r.category}</span></td></tr>`).join("") : `<tr><td colspan="5"><div class="table-empty">No trips in this range.</div></td></tr>`}</tbody>
          </table></div>
        </div>`;
      qs("#exp")?.addEventListener("click", () => exportTable(["Trip ID", "Date", "Bus", "Route", "Category"], rows.map(r => [r.tripId, r.tripDate, r.busNumber, r.route, r.category]), `trip_report_${fromDate}_${toDate}.csv`));
      qs("#printBtn")?.addEventListener("click", () => PrintReceipt.tablePrint({
        docTitle: "Trip Report", heading: "Trip Report", subheading: `${Fmt.date(fromDate)} – ${Fmt.date(toDate)}`,
        columns: ["Trip ID", "Date", "Bus", "Route", "Category"],
        rows: rows.map(r => [`#${r.tripId}`, Fmt.date(r.tripDate), r.busNumber, r.route, r.category])
      }));
      return;
    }

    if (activeTab === "daily") {
      const rows = Q.dailyProfitByRange(fromDate, toDate);
      host.innerHTML = `
        ${summaryCardsHtml()}
        <div class="card">
          <div class="table-toolbar"><h3>Daily Profit Breakdown</h3><div class="table-toolbar__right"><button class="btn btn--ghost btn--sm" id="printBtn">🖨 Print</button><button class="btn btn--ghost btn--sm" id="exp">Export CSV</button></div></div>
          <div class="table-wrap"><table class="data-table">
            <thead><tr><th>Date</th><th>Trips</th><th>Income</th><th>Trip Exp.</th><th>Salaries</th><th>Maintenance</th><th>Parts</th><th>Services</th><th>Total Exp.</th><th>Net Profit</th></tr></thead>
            <tbody>${rows.length ? rows.map(r => `
              <tr>
                <td>${Fmt.date(r.date)}</td><td>${r.totalTrips}</td><td>${Fmt.money(r.totalIncome)}</td>
                <td>${Fmt.money(r.tripExpenses)}</td><td>${Fmt.money(r.salaries)}</td><td>${Fmt.money(r.maintenance)}</td>
                <td>${Fmt.money(r.partPurchases)}</td><td>${Fmt.money(r.otherServices)}</td><td>${Fmt.money(r.totalExpenses)}</td>
                <td class="${r.netProfit >= 0 ? "text-success" : "text-danger"}">${Fmt.money(r.netProfit)}</td>
              </tr>`).join("") : `<tr><td colspan="10"><div class="table-empty">No data in this range.</div></td></tr>`}</tbody>
          </table></div>
        </div>`;
      qs("#exp")?.addEventListener("click", () => exportTable(
        ["Date", "Trips", "Income", "Trip Exp", "Salaries", "Maintenance", "Parts", "Services", "Total Exp", "Net Profit"],
        rows.map(r => [r.date, r.totalTrips, r.totalIncome, r.tripExpenses, r.salaries, r.maintenance, r.partPurchases, r.otherServices, r.totalExpenses, r.netProfit]),
        `daily_profit_${fromDate}_${toDate}.csv`));
      qs("#printBtn")?.addEventListener("click", () => PrintReceipt.tablePrint({
        docTitle: "Daily Profit Breakdown", heading: "Daily Profit Breakdown", subheading: `${Fmt.date(fromDate)} – ${Fmt.date(toDate)}`,
        columns: ["Date", "Trips", "Income", "Trip Exp", "Salaries", "Maintenance", "Parts", "Services", "Total Exp", "Net Profit"],
        rows: rows.map(r => [Fmt.date(r.date), r.totalTrips, Fmt.money(r.totalIncome), Fmt.money(r.tripExpenses), Fmt.money(r.salaries), Fmt.money(r.maintenance), Fmt.money(r.partPurchases), Fmt.money(r.otherServices), Fmt.money(r.totalExpenses), Fmt.money(r.netProfit)]),
        totalLabel: "Total Net Profit", totalValue: Fmt.money(rows.reduce((a, r) => a + r.netProfit, 0))
      }));
      return;
    }

    if (activeTab === "monthly") {
      const year = new Date(toDate).getFullYear();
      host.innerHTML = `
        <div class="card filter-bar">
          <div class="form-field"><label>Year</label>
            <select id="yearSelect">${yearOptions(year)}</select>
          </div>
        </div>
        <div id="monthlyHost"></div>`;
      const renderMonthly = () => {
        const y = Number(qs("#yearSelect").value);
        const rows = Q.monthlyProfit(y);
        qs("#monthlyHost").innerHTML = `
          <div class="card">
            <div class="table-toolbar"><h3>Monthly Profit — ${y}</h3><div class="table-toolbar__right"><button class="btn btn--ghost btn--sm" id="printBtn">🖨 Print</button><button class="btn btn--ghost btn--sm" id="exp">Export CSV</button></div></div>
            <div class="table-wrap"><table class="data-table">
              <thead><tr><th>Month</th><th>Trips</th><th>Income</th><th>Total Exp.</th><th>Net Profit</th></tr></thead>
              <tbody>${rows.length ? rows.map(r => `
                <tr><td>${Fmt.monthLabel(r.month)}</td><td>${r.totalTrips}</td><td>${Fmt.money(r.totalIncome)}</td>
                <td>${Fmt.money(r.totalExpenses)}</td><td class="${r.netProfit >= 0 ? "text-success" : "text-danger"}">${Fmt.money(r.netProfit)}</td></tr>`).join("")
                : `<tr><td colspan="5"><div class="table-empty">No trips recorded for ${y}.</div></td></tr>`}</tbody>
            </table></div>
          </div>`;
        qs("#exp")?.addEventListener("click", () => exportTable(
          ["Month", "Trips", "Income", "Total Expenses", "Net Profit"],
          rows.map(r => [Fmt.monthLabel(r.month), r.totalTrips, r.totalIncome, r.totalExpenses, r.netProfit]),
          `monthly_profit_${y}.csv`));
        qs("#printBtn")?.addEventListener("click", () => PrintReceipt.tablePrint({
          docTitle: `Monthly Profit ${y}`, heading: `Monthly Profit — ${y}`, subheading: null,
          columns: ["Month", "Trips", "Income", "Total Exp.", "Net Profit"],
          rows: rows.map(r => [Fmt.monthLabel(r.month), r.totalTrips, Fmt.money(r.totalIncome), Fmt.money(r.totalExpenses), Fmt.money(r.netProfit)]),
          totalLabel: "Total Net Profit", totalValue: Fmt.money(rows.reduce((a, r) => a + r.netProfit, 0))
        }));
      };
      qs("#yearSelect").addEventListener("change", renderMonthly);
      renderMonthly();
      return;
    }

    if (activeTab === "leaderboard") {
      const routes = Q.topRoutes(fromDate, toDate, 5);
      const drivers = Q.topDrivers(fromDate, toDate, 5);
      const conductors = Q.topConductors(fromDate, toDate, 5);
      host.innerHTML = `
        ${summaryCardsHtml()}
        <div class="grid-2">
          <div class="card">
            <div class="card__head"><h3>🏆 Top Routes by Income</h3></div>
            <div class="leaderboard-list">
              ${routes.length ? routes.map((r, i) => `
                <div class="leaderboard-item">
                  <div class="leaderboard-rank">${i + 1}</div>
                  <div class="leaderboard-main">
                    <div class="leaderboard-title">${Fmt.escapeHtml(r.route)}</div>
                    <div class="leaderboard-sub">${r.trips} trip${r.trips === 1 ? "" : "s"}</div>
                  </div>
                  <div class="leaderboard-value">${Fmt.money(r.income)}</div>
                </div>`).join("") : `<div class="table-empty"><div class="table-empty__icon">${EMPTY_STATE_ICON}</div>No trips in this range.</div>`}
            </div>
          </div>
          <div class="card">
            <div class="card__head"><h3>🏆 Top Drivers by Trips</h3></div>
            <div class="leaderboard-list">
              ${drivers.length ? drivers.map((d, i) => `
                <div class="leaderboard-item">
                  <div class="leaderboard-rank">${i + 1}</div>
                  <div class="leaderboard-main">
                    <div class="leaderboard-title">${Fmt.escapeHtml(d.name)}</div>
                    <div class="leaderboard-sub">${Fmt.money(d.income)} in trip income</div>
                  </div>
                  <div class="leaderboard-value">${d.trips} trip${d.trips === 1 ? "" : "s"}</div>
                </div>`).join("") : `<div class="table-empty"><div class="table-empty__icon">${EMPTY_STATE_ICON}</div>No driver assignments in this range.</div>`}
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card__head"><h3>🏆 Top Conductors by Average Income per Trip</h3></div>
          <div class="leaderboard-list">
            ${conductors.length ? conductors.map((c, i) => `
              <div class="leaderboard-item">
                <div class="leaderboard-rank">${i + 1}</div>
                <div class="leaderboard-main">
                  <div class="leaderboard-title">${Fmt.escapeHtml(c.name)}</div>
                  <div class="leaderboard-sub">${c.trips} trip${c.trips === 1 ? "" : "s"} · ${Fmt.money(c.income)} total</div>
                </div>
                <div class="leaderboard-value">${Fmt.money(c.avgIncome)} <span class="muted" style="font-weight:400; font-size:11px;">/ trip</span></div>
              </div>`).join("") : `<div class="table-empty"><div class="table-empty__icon">${EMPTY_STATE_ICON}</div>No conductor assignments in this range.</div>`}
          </div>
        </div>`;
      return;
    }
  }

  function yearOptions(selected) {
    const trips = DB.readAll("trips");
    const events = DB.readAll("events");
    const years = new Set([
      ...trips.map(t => Number(t.tripDate.slice(0, 4))),
      ...events.map(e => e.eventDate ? Number(e.eventDate.slice(0, 4)) : null).filter(Boolean)
    ]);
    years.add(new Date().getFullYear());
    years.add(selected);
    return [...years].sort((a, b) => b - a).map(y => `<option value="${y}" ${y === selected ? "selected" : ""}>${y}</option>`).join("");
  }

  renderTab();
}
