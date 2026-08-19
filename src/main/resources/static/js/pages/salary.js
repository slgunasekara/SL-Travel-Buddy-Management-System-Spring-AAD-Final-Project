/* pages/salary.js — Employee Salary, split into two tabs:
     - "Manager Salary": the actual add/edit/delete form (mirrors
       ManageEmployeeSalaryController) — Managers only, since a Manager
       isn't tied to any one Trip (they oversee the whole business), so
       there's no Trip field here at all.
     - "All Employee Salary": a read-only overview of every salary record
       for every employee category (Driver/Conductor/Helper/Cleaner pay is
       entered from Trip Expenses, not here — this tab is just where you
       see all of it together in one table). */
function renderSalaryPage(container) {
  let activeTab = "manager";
  const TABS = [
    { id: "manager", label: "Manager Salary" },
    { id: "all", label: "All Employee Salary" },
    { id: "payslip", label: "Generate Payslip" }
  ];

  function isManager(e) { return e.empCategory === "MANAGER" || e.empCategory2 === "MANAGER"; }

  container.innerHTML = `
    <div class="page-head">
      <div><h2>Employee Salary</h2><p class="muted">Manager pay is entered here. Driver/Conductor/Helper/Cleaner pay comes from Trip Expenses.</p></div>
    </div>
    <div class="tabs" id="salaryTabBar"></div>
    <div id="salaryTabContent"></div>`;

  qs("#salaryTabBar", container).innerHTML = TABS.map(t => `<button class="tab-btn ${t.id === activeTab ? "active" : ""}" data-tab="${t.id}">${t.label}</button>`).join("");
  qsa("[data-tab]", container).forEach(btn => btn.addEventListener("click", () => {
    activeTab = btn.dataset.tab;
    qsa("[data-tab]", container).forEach(b => b.classList.toggle("active", b.dataset.tab === activeTab));
    renderActiveTab();
  }));

  function renderActiveTab() {
    const host = qs("#salaryTabContent", container);
    host.innerHTML = "";
    if (activeTab === "manager") renderManagerSalaryTab(host);
    else if (activeTab === "all") renderAllEmployeeSalaryTab(host);
    else renderPayslipTab(host);
  }

  function renderPayslipTab(host) {
    const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    host.innerHTML = `
      <div class="card">
        <div class="card__head"><h3>Generate Payslip (PDF)</h3></div>
        <p class="muted" style="padding:0 16px;">Pick an employee and a month — every salary payment recorded for them that month is itemized on the payslip.</p>
        <div style="padding:0 16px 16px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
          <select id="ps_empId" style="min-width:220px;"><option value="">Select employee...</option>${DB.readAll("employees").map(e => `<option value="${e.empId}">${Fmt.escapeHtml(e.empName)} (${e.empCategory})</option>`).join("")}</select>
          <select id="ps_month">${MONTH_NAMES.map((m, i) => `<option value="${i + 1}" ${i === new Date().getMonth() ? "selected" : ""}>${m}</option>`).join("")}</select>
          <select id="ps_year">${[0, 1, 2].map(offset => { const y = new Date().getFullYear() - offset; return `<option value="${y}">${y}</option>`; }).join("")}</select>
          <button class="btn btn--primary" id="btnGeneratePayslip">Generate PDF</button>
        </div>
        <div id="payslipPreview" style="padding:0 16px 16px;"></div>
      </div>`;

    qs("#btnGeneratePayslip", host).addEventListener("click", () => {
      const empId = Number(qs("#ps_empId", host).value);
      if (!empId) { Toast.error("Select an employee first."); return; }
      const month = Number(qs("#ps_month", host).value);
      const year = Number(qs("#ps_year", host).value);
      const emp = Q.employee(empId);
      const monthStr = String(month).padStart(2, "0");
      const rows = DB.readAll("employeeSalaries").filter(s => s.empId === empId && (s.date || "").startsWith(`${year}-${monthStr}`));
      const total = rows.reduce((a, r) => a + (Number(r.amount) || 0), 0);

      if (!rows.length) {
        qs("#payslipPreview", host).innerHTML = `<p class="muted">No salary payments recorded for ${Fmt.escapeHtml(emp ? emp.empName : "this employee")} in ${MONTH_NAMES[month - 1]} ${year}.</p>`;
        return;
      }
      qs("#payslipPreview", host).innerHTML = `<p class="muted">${rows.length} payment${rows.length === 1 ? "" : "s"} totalling ${Fmt.money(total)} for ${MONTH_NAMES[month - 1]} ${year}.</p>`;

      CompanySettingsApi.get().then(res => {
        buildPayslipPdf(res.body || {}, emp, MONTH_NAMES[month - 1], year, rows, total);
      }).catch(() => buildPayslipPdf({}, emp, MONTH_NAMES[month - 1], year, rows, total));
    });
  }

  function buildPayslipPdf(brand, emp, monthName, year, rows, total) {
    if (typeof window.jspdf === "undefined") {
      Toast.error("PDF library didn't load — check your internet connection and try again.");
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(16); doc.setFont(undefined, "bold");
    doc.text(brand.companyName || "SL Travel Buddy", 14, y); y += 7;
    doc.setFontSize(10); doc.setFont(undefined, "normal");
    if (brand.address) { doc.text(brand.address, 14, y); y += 5; }
    if (brand.phone) { doc.text(brand.phone, 14, y); y += 5; }
    y += 4;

    doc.setFontSize(13); doc.setFont(undefined, "bold");
    doc.text(`Payslip — ${monthName} ${year}`, 14, y); y += 8;
    doc.setFontSize(10); doc.setFont(undefined, "normal");
    doc.text(`Employee: ${emp ? emp.empName : "Unknown"}`, 14, y); y += 5;
    doc.text(`Category: ${emp ? emp.empCategory : "-"}`, 14, y); y += 5;
    if (emp && emp.nicNo) { doc.text(`NIC: ${emp.nicNo}`, 14, y); y += 5; }
    y += 4;

    doc.setFont(undefined, "bold");
    doc.text("Date", 14, y); doc.text("Trip", 70, y); doc.text("Description", 100, y); doc.text("Amount", 180, y, { align: "right" });
    doc.setFont(undefined, "normal");
    y += 2; doc.line(14, y, 196, y); y += 6;

    rows.forEach(r => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(Fmt.date(r.date), 14, y);
      doc.text(r.tripId ? `#${r.tripId}` : "-", 70, y);
      doc.text((r.description || "-").slice(0, 40), 100, y);
      doc.text(Fmt.money(r.amount), 180, y, { align: "right" });
      y += 6;
    });

    y += 2; doc.line(14, y, 196, y); y += 8;
    doc.setFont(undefined, "bold");
    doc.text("Total Paid", 100, y);
    doc.text(Fmt.money(total), 180, y, { align: "right" });
    y += 14;
    doc.setFontSize(8); doc.setFont(undefined, "normal");
    doc.text(`Generated ${new Date().toLocaleString("en-GB")}`, 14, y);

    doc.save(`payslip_${emp ? emp.empName.replace(/\s+/g, "_") : "employee"}_${monthName}_${year}.pdf`);
    Toast.success("Payslip PDF downloaded!");
  }

  function renderManagerSalaryTab(host) {
    function empSuggestions() {
      return DB.readAll("employees")
        .filter(isManager)
        .map(e => ({
          label: `${e.empName} (${e.empCategory})`,
          sub: e.contactNo,
          value: e.empId,
          raw: e
        }));
    }
    function empDisplayValue(empId) {
      const e = Q.employee(Number(empId));
      return e ? `${e.empName} (${e.empCategory})` : "";
    }

    renderCrudPage(host, {
      title: "Manager Salary",
      subtitle: "Not trip-specific — a Manager oversees the whole business, not a single trip.",
      table: "employeeSalaries",
      idField: "salaryId",
      singular: "Salary payment",
      fields: [
        { name: "empId", label: "Manager", type: "searchSelect", required: true, placeholder: "Type a manager's name to search...", source: empSuggestions, displayValue: empDisplayValue },
        { name: "amount", label: "Amount (Rs.)", type: "number", step: "0.01", required: true },
        { name: "date", label: "Date", type: "date", required: true },
        { name: "description", label: "Description", type: "textarea", wide: true }
      ],
      columns: [
        { key: "salaryId", label: "ID" },
        { key: "empId", label: "Employee", render: r => Q.empName(r.empId) },
        { key: "amount", label: "Amount", render: r => Fmt.money(r.amount) },
        { key: "date", label: "Date", render: r => Fmt.date(r.date) }
      ],
      // This tab is Manager-only, so only Manager rows belong in its own
      // list/search — Driver/Conductor/Helper/Cleaner records (created via
      // Trip Expenses) still exist in the same table but are shown on the
      // "All Employee Salary" tab instead, not duplicated here. afterLoad
      // only affects what's displayed/searched — Save/Update/Delete still
      // read the full unfiltered table, so this can never wipe out anyone
      // else's salary records.
      afterLoad: rows => rows.filter(r => { const e = Q.employee(r.empId); return e && isManager(e); }),
      searchKeys: [r => Q.empName(r.empId), "description"],
      defaultSort: (a, b) => b.salaryId - a.salaryId,
      emptyText: "No manager salary payments recorded yet.",
      beforeSave(data, isEdit) {
        if (!data.empId) return { error: "Please select a manager from the list (type a name to search)." };
        if (!DB.readAll("employees").some(e => e.empId === data.empId)) {
          return { error: "That doesn't match a valid employee — please pick one from the suggestions." };
        }
        if (Q.employee(data.empId) && !isManager(Q.employee(data.empId))) {
          return { error: "This tab is for Managers only — Driver/Conductor/Helper/Cleaner pay is entered from Trip Expenses." };
        }
        if (!Validate.isPositiveNumber(data.amount)) return { error: "Amount must be a positive number." };
        data.tripId = null; // Manager salary is never trip-specific.
        return null;
      },
      onCreate(row) { row.createdBy = Session.currentUser().userId; },
      onPrint(row) { PrintReceipt.salaryReceipt(row, Q.empName(row.empId)); }
    });
  }

  function renderAllEmployeeSalaryTab(host) {
    let search = "";
    function rows() {
      return DB.readAll("employeeSalaries")
        .map(s => ({ ...s, _emp: Q.employee(s.empId) }))
        .filter(s => {
          if (!search) return true;
          const t = search.toLowerCase();
          return (s._emp?.empName || "").toLowerCase().includes(t) || (s._emp?.empCategory || "").toLowerCase().includes(t);
        })
        .sort((a, b) => b.salaryId - a.salaryId);
    }

    // Render the shell (search box + table) once, then on every keystroke
    // only replace the <tbody> — rebuilding the whole card's innerHTML on
    // each input event destroys and recreates the <input>, which drops
    // keyboard focus after every character typed.
    host.innerHTML = `
      <div class="card">
        <div class="table-toolbar">
          <input type="text" id="allSalarySearch" class="search-input" placeholder="Search by employee name or category..." />
          <div class="table-toolbar__right"><span class="muted" id="allSalaryCount"></span></div>
        </div>
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>ID</th><th>Employee</th><th>Category</th><th>Trip</th><th>Amount</th><th>Date</th><th>Description</th></tr></thead>
          <tbody id="allSalaryBody"></tbody>
        </table></div>
      </div>`;

    function renderBody() {
      const data = rows();
      const total = data.reduce((a, r) => a + (Number(r.amount) || 0), 0);
      qs("#allSalaryCount", host).textContent = `${data.length} record${data.length === 1 ? "" : "s"} · Total ${Fmt.money(total)}`;
      qs("#allSalaryBody", host).innerHTML = data.length ? data.map(r => `
        <tr>
          <td>${r.salaryId}</td>
          <td>${Fmt.escapeHtml(r._emp ? r._emp.empName : "Unknown")}</td>
          <td>${r._emp ? `<span class="badge badge--blue">${r._emp.empCategory}</span>${r._emp.empCategory2 ? ` <span class="badge badge--gray">${r._emp.empCategory2}</span>` : ""}` : "-"}</td>
          <td>${r.tripId ? `#${r.tripId}` : "-"}</td>
          <td>${Fmt.money(r.amount)}</td>
          <td>${Fmt.date(r.date)}</td>
          <td>${Fmt.escapeHtml(r.description || "-")}</td>
        </tr>`).join("") : `<tr><td colspan="7"><div class="table-empty">No salary records yet.</div></td></tr>`;
    }

    qs("#allSalarySearch", host).addEventListener("input", debounce((e) => { search = e.target.value; renderBody(); }, 150));
    renderBody();
  }

  renderActiveTab();
}
