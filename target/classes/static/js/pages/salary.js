function renderSalaryPage(container) {
    let activeTab = "manager";

    let employeesCache = [];
    const employeesReady = apiRequest("GET", "/v1/employee/all")
        .then(res => {
            employeesCache = res.body || [];
        })
        .catch(err => {
            Toast.error(apiErrorMessage(err, "Failed to load employees."));
        });
    const TABS = [
        {id: "manager", label: "Manager Salary"},
        {id: "all", label: "All Employee Salary"}
    ];

    function isManager(e) {
        return e.empCategory === "MANAGER" || e.empCategory2 === "MANAGER";
    }


    function employee(empId) {
        return employeesCache.find(e => e.empId === empId);
    }

    function empName(empId) {
        const e = employee(empId);
        return e ? Fmt.escapeHtml(e.empName) : "-";
    }

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
        employeesReady.then(() => {
            if (activeTab === "manager") renderManagerSalaryTab(host);
            else renderAllEmployeeSalaryTab(host);
        });
    }

    function renderManagerSalaryTab(host) {
        function empSuggestions() {
            return employeesCache
                .filter(isManager)
                .map(e => ({
                    label: `${e.empName} (${e.empCategory})`,
                    sub: e.contactNo,
                    value: e.empId,
                    raw: e
                }));
        }

        function empDisplayValue(empId) {
            const e = employee(Number(empId));
            return e ? `${e.empName} (${e.empCategory})` : "";
        }

        renderCrudPage(host, {
            title: "Manager Salary",
            subtitle: "Not trip-specific — a Manager oversees the whole business, not a single trip.",
            table: "employeeSalaries",
            idField: "salaryId",
            singular: "Salary payment",
            api: {base: "/v1/salary"},
            fields: [
                {
                    name: "empId",
                    label: "Manager",
                    type: "searchSelect",
                    required: true,
                    placeholder: "Type a manager's name to search...",
                    source: empSuggestions,
                    displayValue: empDisplayValue
                },
                {name: "amount", label: "Amount (Rs.)", type: "number", step: "0.01", required: true},
                {name: "date", label: "Date", type: "date", required: true},
                {name: "description", label: "Description", type: "textarea", wide: true}
            ],
            columns: [
                {key: "salaryId", label: "ID"},
                {key: "empId", label: "Employee", render: r => empName(r.empId)},
                {key: "amount", label: "Amount", render: r => Fmt.money(r.amount)},
                {key: "date", label: "Date", render: r => Fmt.date(r.date)}
            ],

            afterLoad: rows => rows.filter(r => {
                const e = employee(r.empId);
                return e && isManager(e);
            }),
            searchKeys: [r => empName(r.empId), "description"],
            defaultSort: (a, b) => b.salaryId - a.salaryId,
            emptyText: "No manager salary payments recorded yet.",
            beforeSave(data, isEdit) {
                if (!data.empId) return {error: "Please select a manager from the list (type a name to search)."};
                if (!employeesCache.some(e => e.empId === data.empId)) {
                    return {error: "That doesn't match a valid employee — please pick one from the suggestions."};
                }
                if (employee(data.empId) && !isManager(employee(data.empId))) {
                    return {error: "This tab is for Managers only — Driver/Conductor/Helper/Cleaner pay is entered from Trip Expenses."};
                }
                if (!Validate.isPositiveNumber(data.amount)) return {error: "Amount must be a positive number."};
                data.tripId = null; // Manager salary is never trip-specific.
                return null;
            },
            onCreate(row) {
                row.createdBy = Session.currentUser().userId;
            },
            onPrint(row) {
                PrintReceipt.salaryReceipt(row, empName(row.empId));
            }
        });
    }

    async function renderAllEmployeeSalaryTab(host) {
        let search = "";
        let salaryRows = [];
        try {
            const res = await apiRequest("GET", "/v1/salary/all");
            salaryRows = res.body || [];
        } catch (err) {
            Toast.error(apiErrorMessage(err, "Failed to load salary records."));
        }

        function rows() {
            return salaryRows
                .map(s => ({...s, _emp: employee(s.empId)}))
                .filter(s => {
                    if (!search) return true;
                    const t = search.toLowerCase();
                    return (s._emp?.empName || "").toLowerCase().includes(t) || (s._emp?.empCategory || "").toLowerCase().includes(t);
                })
                .sort((a, b) => b.salaryId - a.salaryId);
        }


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
          <td>${r._emp ? `<span class="badge badge--blue">${Fmt.escapeHtml(r._emp.empCategory)}</span>${r._emp.empCategory2 ? ` <span class="badge badge--gray">${Fmt.escapeHtml(r._emp.empCategory2)}</span>` : ""}` : "-"}</td>
          <td>${r.tripId ? `#${r.tripId}` : "-"}</td>
          <td>${Fmt.money(r.amount)}</td>
          <td>${Fmt.date(r.date)}</td>
          <td>${Fmt.escapeHtml(r.description || "-")}</td>
        </tr>`).join("") : `<tr><td colspan="7"><div class="table-empty">No salary records yet.</div></td></tr>`;
        }

        qs("#allSalarySearch", host).addEventListener("input", debounce((e) => {
            search = e.target.value;
            renderBody();
        }, 150));
        renderBody();
    }

    renderActiveTab();
}
