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
    { id: "all", label: "All Employee Salary" }
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
    else renderAllEmployeeSalaryTab(host);
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
