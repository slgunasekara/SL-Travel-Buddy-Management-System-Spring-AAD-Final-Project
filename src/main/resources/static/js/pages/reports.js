/* pages/reports.js — mirrors ManageReportController + DailyProfitController + MonthlyProfitController */
function renderReportsPage(container) {
  let activeTab = "overview";
  let fromDate = defaultFrom();
  let toDate = DB.today();
  let compareSelection = [];

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
    { id: "perBus", label: "Profit per Bus" },
    { id: "compare", label: "Bus Comparison" },
    { id: "daily", label: "Daily Profit" },
    { id: "monthly", label: "Monthly Profit" },
    { id: "leaderboard", label: "Leaderboard" },
    { id: "seasonal", label: "Seasonal Insights" },
    { id: "custom", label: "Custom Report Builder" }
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
      <button class="btn btn--secondary" id="btnClosingPack">📦 Monthly Closing Pack (Excel)</button>
      <button class="btn btn--secondary" id="btnSummaryPdf">📄 Business Summary (PDF)</button>
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

  /** Formatted Excel Export — one .xlsx with one sheet per report, each
   *  with a header row, an auto-sized column width, and a totals row where
   *  a total makes sense. Used by "Monthly Closing Pack" below (all
   *  reports bundled in one click) — the same helper works for a
   *  single-sheet export too, just pass one entry in `sheets`.
   *  Uses SheetJS (loaded via CDN in dashboard.html); its free/community
   *  build doesn't support cell coloring or bold fonts, so "formatted"
   *  here means: multiple named sheets, sensible column widths, and totals
   *  — not colored headers. */
  function exportExcel(sheets, filename) {
    if (typeof XLSX === "undefined") {
      Toast.error("Excel export library didn't load — check your internet connection and try again.");
      return;
    }
    const wb = XLSX.utils.book_new();
    sheets.forEach(sheet => {
      const aoa = [sheet.headers, ...sheet.rows];
      if (sheet.totalRow) aoa.push(sheet.totalRow);
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = sheet.headers.map((h, i) => {
        const maxLen = Math.max(String(h).length, ...sheet.rows.map(r => String(r[i] ?? "").length));
        return { wch: Math.min(40, Math.max(10, maxLen + 2)) };
      });
      XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31)); // Excel sheet-name limit
    });
    XLSX.writeFile(wb, filename);
    Toast.success("Excel file exported!");
  }

  function buildClosingPackSheets() {
    const income = Q.incomeReport(fromDate, toDate);
    const totalIncome = income.reduce((a, r) => a + (r.type === "Event" && r.linkedTripId ? 0 : r.income), 0);
    const expense = Q.expenseReport(fromDate, toDate);
    const totalExpense = expense.reduce((a, r) => a + (Number(r.amount) || 0), 0);
    const salary = Q.salaryReport(fromDate, toDate);
    const totalSalary = salary.reduce((a, r) => a + (Number(r.amount) || 0), 0);
    const trips = Q.tripReport(fromDate, toDate);
    const perBus = Q.profitPerBus(fromDate, toDate);

    return [
      { name: "Income", headers: ["Type", "ID", "Reference", "Date", "Income"], rows: income.map(r => [r.type, r.refId, r.reference, r.date, r.income]), totalRow: ["", "", "", "TOTAL", totalIncome] },
      { name: "Expense", headers: ["Date", "Category", "Amount"], rows: expense.map(r => [r.expenseDate, r.category, r.amount]), totalRow: ["", "TOTAL", totalExpense] },
      { name: "Salary", headers: ["Employee", "Date", "Amount"], rows: salary.map(r => [r.employeeName, r.salaryDate, r.amount]), totalRow: ["", "TOTAL", totalSalary] },
      { name: "Trips", headers: ["Trip ID", "Date", "Bus", "Route", "Category"], rows: trips.map(r => [r.tripId, r.tripDate, r.busNumber, r.route, r.category]) },
      { name: "Profit per Bus", headers: ["Bus", "Trips", "Income", "Fuel", "Parking", "Maintenance", "Parts", "Total Cost", "Profit"], rows: perBus.map(r => [r.busNumber, r.trips, r.income, r.fuel, r.parking, r.maintenance, r.parts, r.expenses, r.profit]) },
      { name: "Summary", headers: ["Metric", "Value"], rows: [["Period", `${fromDate} to ${toDate}`], ["Total Income", totalIncome], ["Total Expense", totalExpense], ["Total Salary", totalSalary], ["Net Profit", totalIncome - totalExpense - totalSalary]] }
    ];
  }

  qs("#btnClosingPack").addEventListener("click", () => {
    exportExcel(buildClosingPackSheets(), `closing_pack_${fromDate}_${toDate}.xlsx`);
  });

  qs("#btnSummaryPdf").addEventListener("click", () => {
    if (typeof window.jspdf === "undefined") {
      Toast.error("PDF library didn't load — check your internet connection and try again.");
      return;
    }
    CompanySettingsApi.get().then(res => buildSummaryPdf(res.body || {})).catch(() => buildSummaryPdf({}));
  });

  function buildSummaryPdf(brand) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 20;
    const income = Q.incomeReport(fromDate, toDate);
    const totalIncome = income.reduce((a, r) => a + (r.income || 0), 0);
    const expense = Q.expenseReport(fromDate, toDate);
    const totalExpense = expense.reduce((a, r) => a + (Number(r.amount) || 0), 0);
    const salary = Q.salaryReport(fromDate, toDate);
    const totalSalary = salary.reduce((a, r) => a + (Number(r.amount) || 0), 0);
    const perBus = Q.profitPerBus(fromDate, toDate);
    const fleet = DB.readAll("buses").length;

    doc.setFontSize(16); doc.setFont(undefined, "bold");
    doc.text(brand.companyName || "SL Travel Buddy", 14, y); y += 7;
    doc.setFontSize(10); doc.setFont(undefined, "normal");
    if (brand.address) { doc.text(brand.address, 14, y); y += 5; }
    y += 4;
    doc.setFontSize(13); doc.setFont(undefined, "bold");
    doc.text("Monthly Business Summary", 14, y); y += 6;
    doc.setFontSize(10); doc.setFont(undefined, "normal");
    doc.text(`${Fmt.date(fromDate)} – ${Fmt.date(toDate)}`, 14, y); y += 10;

    const summaryLines = [
      ["Total Income", Fmt.money(totalIncome)],
      ["Total Expense", Fmt.money(totalExpense)],
      ["Total Salary", Fmt.money(totalSalary)],
      ["Net Profit", Fmt.money(totalIncome - totalExpense - totalSalary)],
      ["Fleet Size", String(fleet)],
      ["Active Buses (with trips this period)", String(perBus.filter(b => b.trips > 0).length)]
    ];
    doc.setFont(undefined, "bold");
    summaryLines.forEach(([label, value]) => {
      doc.text(label, 14, y);
      doc.setFont(undefined, "normal");
      doc.text(value, 100, y);
      doc.setFont(undefined, "bold");
      y += 7;
    });
    doc.setFont(undefined, "normal");

    y += 6;
    doc.setFontSize(12); doc.setFont(undefined, "bold");
    doc.text("Profit per Bus", 14, y); y += 7;
    doc.setFontSize(9); doc.setFont(undefined, "bold");
    doc.text("Bus", 14, y); doc.text("Trips", 60, y); doc.text("Income", 90, y); doc.text("Cost", 130, y); doc.text("Profit", 170, y, { align: "right" });
    doc.setFont(undefined, "normal"); y += 2; doc.line(14, y, 196, y); y += 6;
    perBus.forEach(b => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(b.busNumber, 14, y);
      doc.text(String(b.trips), 60, y);
      doc.text(Fmt.money(b.income), 90, y);
      doc.text(Fmt.money(b.expenses), 130, y);
      doc.text(Fmt.money(b.profit), 170, y, { align: "right" });
      y += 6;
    });

    y += 10;
    doc.setFontSize(8);
    doc.text(`Generated ${new Date().toLocaleString("en-GB")}`, 14, y);

    doc.save(`business_summary_${fromDate}_${toDate}.pdf`);
    Toast.success("Business Summary PDF downloaded!");
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
      // An Event row whose linkedTripId is set represents the same money as
      // its Trip row above — still shown for traceability, just excluded
      // from the total so that money isn't counted twice.
      const totalIncome = rows.reduce((a, r) => a + (r.type === "Event" && r.linkedTripId ? 0 : r.income), 0);
      host.innerHTML = `
        ${summaryCardsHtml()}
        <div class="card">
          <div class="table-toolbar"><h3>Income Report</h3><div class="table-toolbar__right"><button class="btn btn--ghost btn--sm" id="printBtn">🖨 Print</button><button class="btn btn--ghost btn--sm" id="exp">Export CSV</button></div></div>
          <div class="table-wrap"><table class="data-table">
            <thead><tr><th>Type</th><th>ID</th><th>Reference</th><th>Date</th><th>Income</th></tr></thead>
            <tbody>${rows.length ? rows.map(r => `<tr><td><span class="badge ${r.type === "Trip" ? "badge--blue" : "badge--purple"}">${r.type}</span></td><td>#${r.refId}</td><td>${Fmt.escapeHtml(r.reference)}</td><td>${Fmt.date(r.date)}</td><td>${Fmt.money(r.income)}${r.type === "Event" && r.linkedTripId ? ` <span class="muted" style="font-size:11px;">(linked to Trip #${r.linkedTripId} — not double-counted)</span>` : ""}</td></tr>`).join("") : `<tr><td colspan="5"><div class="table-empty">No income in this range.</div></td></tr>`}</tbody>
          </table></div>
        </div>`;
      qs("#exp")?.addEventListener("click", () => exportTable(["Type", "ID", "Reference", "Date", "Income"], rows.map(r => [r.type, r.refId, r.reference, r.date, r.income]), `income_report_${fromDate}_${toDate}.csv`));
      qs("#printBtn")?.addEventListener("click", () => PrintReceipt.tablePrint({
        docTitle: "Income Report", heading: "Income Report", subheading: `${Fmt.date(fromDate)} – ${Fmt.date(toDate)}`,
        columns: ["Type", "ID", "Reference", "Date", "Income"],
        rows: rows.map(r => [r.type, `#${r.refId}`, r.reference, Fmt.date(r.date), Fmt.money(r.income)]),
        totalLabel: "Total Income", totalValue: Fmt.money(totalIncome)
      }));
      return;
    }

    if (activeTab === "expense") {
      const rows = Q.expenseReport(fromDate, toDate);
      host.innerHTML = `
        ${summaryCardsHtml()}
        <div class="card">
          <div class="table-toolbar"><h3>Expense Report</h3><div class="table-toolbar__right"><button class="btn btn--ghost btn--sm" id="printBtn">🖨 Print</button><button class="btn btn--ghost btn--sm" id="exp">Export CSV</button></div></div>
          <p class="muted" style="padding:0 16px;">Fuel, parking, trip-other, maintenance, part purchases and other services. Salary payments have their own <strong>Salary Report</strong> tab.</p>
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

    if (activeTab === "perBus") {
      const rows = Q.profitPerBus(fromDate, toDate);
      const util = Q.busUtilization(fromDate, toDate);
      const utilByBus = Object.fromEntries(util.map(u => [u.busId, u]));
      host.innerHTML = `
        ${summaryCardsHtml()}
        <div class="card">
          <div class="table-toolbar"><h3>Profit per Bus</h3><div class="table-toolbar__right"><button class="btn btn--ghost btn--sm" id="printBtn">🖨 Print</button><button class="btn btn--ghost btn--sm" id="exp">Export CSV</button></div></div>
          <p class="muted" style="padding:0 16px;">Income minus fuel, parking, trip-other, maintenance, and part-purchase costs for that bus. Salary is fleet-wide, not bus-specific — see the Salary Report.</p>
          <div class="table-wrap"><table class="data-table">
            <thead><tr><th>Bus</th><th>Trips</th><th>Income</th><th>Fuel</th><th>Parking</th><th>Maintenance</th><th>Parts</th><th>Total Cost</th><th>Profit</th><th>Utilization</th></tr></thead>
            <tbody>${rows.length ? rows.map(r => `
              <tr>
                <td>${Fmt.escapeHtml(r.busNumber)}</td><td>${r.trips}</td><td>${Fmt.money(r.income)}</td>
                <td>${Fmt.money(r.fuel)}</td><td>${Fmt.money(r.parking)}</td><td>${Fmt.money(r.maintenance)}</td><td>${Fmt.money(r.parts)}</td>
                <td>${Fmt.money(r.expenses)}</td>
                <td class="${r.profit >= 0 ? "text-success" : "text-danger"}">${Fmt.money(r.profit)}</td>
                <td>${utilByBus[r.busId] ? utilByBus[r.busId].utilizationPct + "%" : "-"}</td>
              </tr>`).join("") : `<tr><td colspan="10"><div class="table-empty">No trips in this range.</div></td></tr>`}</tbody>
          </table></div>
        </div>`;
      qs("#exp")?.addEventListener("click", () => exportTable(
        ["Bus", "Trips", "Income", "Fuel", "Parking", "Maintenance", "Parts", "Total Cost", "Profit", "Utilization %"],
        rows.map(r => [r.busNumber, r.trips, r.income, r.fuel, r.parking, r.maintenance, r.parts, r.expenses, r.profit, utilByBus[r.busId]?.utilizationPct ?? ""]),
        `profit_per_bus_${fromDate}_${toDate}.csv`));
      qs("#printBtn")?.addEventListener("click", () => PrintReceipt.tablePrint({
        docTitle: "Profit per Bus", heading: "Profit per Bus", subheading: `${Fmt.date(fromDate)} – ${Fmt.date(toDate)}`,
        columns: ["Bus", "Trips", "Income", "Fuel", "Parking", "Maintenance", "Parts", "Total Cost", "Profit", "Utilization"],
        rows: rows.map(r => [r.busNumber, r.trips, Fmt.money(r.income), Fmt.money(r.fuel), Fmt.money(r.parking), Fmt.money(r.maintenance), Fmt.money(r.parts), Fmt.money(r.expenses), Fmt.money(r.profit), utilByBus[r.busId] ? utilByBus[r.busId].utilizationPct + "%" : "-"]),
        totalLabel: "Total Profit", totalValue: Fmt.money(rows.reduce((a, r) => a + r.profit, 0))
      }));
      return;
    }

    if (activeTab === "compare") {
      const allBuses = DB.readAll("buses");
      const rows = Q.profitPerBus(fromDate, toDate);
      const util = Object.fromEntries(Q.busUtilization(fromDate, toDate).map(u => [u.busId, u]));
      const rowByBus = Object.fromEntries(rows.map(r => [r.busId, r]));
      const selected = (compareSelection.length ? compareSelection : allBuses.slice(0, 3).map(b => b.busId));

      host.innerHTML = `
        <div class="card">
          <div class="card__head"><h3>Bus Comparison Mode</h3></div>
          <p class="muted" style="padding:0 16px;">Pick 2–3 buses to compare side by side over the selected date range.</p>
          <div style="padding:0 16px 16px; display:flex; gap:10px; flex-wrap:wrap;">
            ${allBuses.map(b => `<label class="checkbox-line"><input type="checkbox" class="cmpBusChk" value="${b.busId}" ${selected.includes(b.busId) ? "checked" : ""} /> <span>${Fmt.escapeHtml(b.busNumber)}</span></label>`).join("")}
          </div>
        </div>
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>Metric</th>${selected.map(id => `<th>${Fmt.escapeHtml(Q.busNumber(id))}</th>`).join("")}</tr></thead>
          <tbody>
            <tr><td>Trips</td>${selected.map(id => `<td>${rowByBus[id]?.trips ?? 0}</td>`).join("")}</tr>
            <tr><td>Income</td>${selected.map(id => `<td>${Fmt.money(rowByBus[id]?.income ?? 0)}</td>`).join("")}</tr>
            <tr><td>Fuel Cost</td>${selected.map(id => `<td>${Fmt.money(rowByBus[id]?.fuel ?? 0)}</td>`).join("")}</tr>
            <tr><td>Maintenance Cost</td>${selected.map(id => `<td>${Fmt.money(rowByBus[id]?.maintenance ?? 0)}</td>`).join("")}</tr>
            <tr><td>Parts Cost</td>${selected.map(id => `<td>${Fmt.money(rowByBus[id]?.parts ?? 0)}</td>`).join("")}</tr>
            <tr><td>Total Cost</td>${selected.map(id => `<td>${Fmt.money(rowByBus[id]?.expenses ?? 0)}</td>`).join("")}</tr>
            <tr><td><strong>Profit</strong></td>${selected.map(id => `<td class="${(rowByBus[id]?.profit ?? 0) >= 0 ? "text-success" : "text-danger"}"><strong>${Fmt.money(rowByBus[id]?.profit ?? 0)}</strong></td>`).join("")}</tr>
            <tr><td>Utilization</td>${selected.map(id => `<td>${util[id] ? util[id].utilizationPct + "%" : "-"}</td>`).join("")}</tr>
          </tbody>
        </table></div>`;

      qsa(".cmpBusChk", host).forEach(chk => chk.addEventListener("change", () => {
        const checked = qsa(".cmpBusChk:checked", host).map(c => Number(c.value));
        if (checked.length > 3) { chk.checked = false; Toast.warning("Compare up to 3 buses at a time."); return; }
        compareSelection = checked;
        renderTab();
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
                    <div class="leaderboard-sub">${r.occurrences} booking${r.occurrences === 1 ? "" : "s"} (trips + events)</div>
                  </div>
                  <div class="leaderboard-value">${Fmt.money(r.income)}</div>
                </div>`).join("") : `<div class="table-empty"><div class="table-empty__icon">${EMPTY_STATE_ICON}</div>No trips or event bookings in this range.</div>`}
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
                    <div class="leaderboard-sub">${Fmt.money(d.income)} in trip income${d.incidents ? ` · <span class="text-danger">${d.incidents} incident${d.incidents === 1 ? "" : "s"}</span>` : " · no incidents on file"}</div>
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

    if (activeTab === "seasonal") {
      const insights = Q.seasonalDemandInsights();
      const maxAvg = Math.max(1, ...insights.rows.map(r => r.avgTrips));
      host.innerHTML = `
        <div class="card">
          <div class="card__head"><h3>Seasonal Demand Insights</h3></div>
          <p class="muted" style="padding:0 16px;">Average trips per month across every year on file — helps spot which months to plan extra capacity for.</p>
          ${insights.busiest.length ? `<div style="padding:0 16px 8px;"><span class="badge badge--red">Busiest</span> ${insights.busiest.map(Fmt.escapeHtml).join(", ")}</div>` : ""}
          ${insights.quietest.length ? `<div style="padding:0 16px 16px;"><span class="badge badge--blue">Quietest</span> ${insights.quietest.map(Fmt.escapeHtml).join(", ")}</div>` : ""}
          <div style="padding:0 16px 16px;">
            ${insights.rows.map(r => `
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                <div style="width:90px; font-size:12.5px;" class="muted">${r.month}</div>
                <div style="flex:1; background:var(--bg-soft); border-radius:6px; overflow:hidden; height:18px;">
                  <div style="width:${Math.round((r.avgTrips / maxAvg) * 100)}%; background:var(--primary); height:100%;"></div>
                </div>
                <div style="width:120px; font-size:12.5px; text-align:right;">${r.avgTrips} trips avg</div>
              </div>`).join("")}
          </div>
        </div>`;
      return;
    }

    if (activeTab === "custom") {
      renderCustomReportBuilder(host);
      return;
    }
  }

  const CUSTOM_SOURCES = {
    TRIPS: { table: "trips", dateField: "tripDate", label: "Trips", columns: { tripId: "Trip ID", busId: "Bus", tripCategory: "Category", startLocation: "Start", endLocation: "End", distance: "Distance (km)", totalIncome: "Income", tripDate: "Date" } },
    MAINTENANCE: { table: "maintenance", dateField: "serviceDate", label: "Maintenance", columns: { maintId: "ID", busId: "Bus", maintenanceType: "Type", cost: "Cost", technician: "Technician", serviceDate: "Date" } },
    PARTS: { table: "partPurchases", dateField: "date", label: "Part Purchases", columns: { purchaseId: "ID", busId: "Bus", partName: "Part", quantity: "Qty", totalCost: "Total Cost", supplierName: "Supplier", date: "Date" } },
    TRIP_EXPENSES: { table: "tripExpenses", dateField: "date", label: "Trip Expenses", columns: { tripExpenseId: "ID", tripId: "Trip ID", fuelAmount: "Fuel", parkingAmount: "Parking", otherAmount: "Other", date: "Date" } },
    ACCIDENTS: { table: "accidents", dateField: "accidentDate", label: "Accidents", columns: { accidentId: "ID", busId: "Bus", driverId: "Driver", location: "Location", estimatedCost: "Est. Cost", accidentDate: "Date" } },
    EMPLOYEE_SALARY: { table: "employeeSalaries", dateField: "date", label: "Employee Salary", columns: { salaryId: "ID", empId: "Employee", tripId: "Trip ID", amount: "Amount", date: "Date" } }
  };
  const REF_RENDERERS = { busId: Q.busNumber, empId: Q.empName, driverId: Q.empName };

  function renderCustomReportBuilder(host) {
    let source = "TRIPS";
    let selectedCols = Object.keys(CUSTOM_SOURCES[source].columns);

    function shell() {
      const src = CUSTOM_SOURCES[source];
      host.innerHTML = `
        <div class="card">
          <div class="card__head"><h3>Custom Report Builder</h3></div>
          <p class="muted" style="padding:0 16px;">Pick a data source and the columns you want, using the date range selected above.</p>
          <div style="padding:0 16px 12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <select id="cr_source">${Object.entries(CUSTOM_SOURCES).map(([k, v]) => `<option value="${k}" ${k === source ? "selected" : ""}>${v.label}</option>`).join("")}</select>
            <button class="btn btn--primary btn--sm" id="cr_generate">Generate</button>
          </div>
          <div style="padding:0 16px 12px; display:flex; gap:12px; flex-wrap:wrap;">
            ${Object.entries(src.columns).map(([key, label]) => `
              <label class="checkbox-line"><input type="checkbox" class="cr_col" value="${key}" ${selectedCols.includes(key) ? "checked" : ""} /> <span>${Fmt.escapeHtml(label)}</span></label>`).join("")}
          </div>
          <div id="cr_resultHost"></div>
        </div>`;

      qs("#cr_source", host).addEventListener("change", (e) => {
        source = e.target.value;
        selectedCols = Object.keys(CUSTOM_SOURCES[source].columns);
        shell();
      });
      qs("#cr_generate", host).addEventListener("click", () => {
        selectedCols = qsa(".cr_col", host).filter(c => c.checked).map(c => c.value);
        generate();
      });
    }

    function generate() {
      const src = CUSTOM_SOURCES[source];
      if (!selectedCols.length) { Toast.error("Pick at least one column."); return; }
      const rows = DB.readAll(src.table).filter(r => (r[src.dateField] || "") >= fromDate && (r[src.dateField] || "") <= toDate);
      const headers = selectedCols.map(c => src.columns[c]);
      const dataRows = rows.map(r => selectedCols.map(c => {
        const renderer = REF_RENDERERS[c];
        return renderer ? renderer(r[c]) : (r[c] === undefined || r[c] === null ? "" : r[c]);
      }));

      qs("#cr_resultHost", host).innerHTML = `
        <div class="table-toolbar"><span class="muted">${dataRows.length} row${dataRows.length === 1 ? "" : "s"}</span>
          <div class="table-toolbar__right">
            <button class="btn btn--ghost btn--sm" id="cr_csv">Export CSV</button>
            <button class="btn btn--ghost btn--sm" id="cr_xlsx">Export Excel</button>
          </div>
        </div>
        <div class="table-wrap"><table class="data-table">
          <thead><tr>${headers.map(h => `<th>${Fmt.escapeHtml(h)}</th>`).join("")}</tr></thead>
          <tbody>${dataRows.length ? dataRows.map(row => `<tr>${row.map(v => `<td>${Fmt.escapeHtml(String(v))}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${headers.length}"><div class="table-empty">No records in this range.</div></td></tr>`}</tbody>
        </table></div>`;

      qs("#cr_csv", host).addEventListener("click", () => exportTable(headers, dataRows, `custom_report_${source.toLowerCase()}_${fromDate}_${toDate}.csv`));
      qs("#cr_xlsx", host).addEventListener("click", () => exportExcel([{ name: src.label, headers, rows: dataRows }], `custom_report_${source.toLowerCase()}_${fromDate}_${toDate}.xlsx`));
    }

    shell();
    generate();
  }

  function yearOptions(selected) {
    const trips = DB.readAll("trips");
    const years = new Set(trips.map(t => Number(t.tripDate.slice(0, 4))));
    years.add(new Date().getFullYear());
    years.add(selected);
    return [...years].sort((a, b) => b - a).map(y => `<option value="${y}" ${y === selected ? "selected" : ""}>${y}</option>`).join("");
  }

  renderTab();
}
