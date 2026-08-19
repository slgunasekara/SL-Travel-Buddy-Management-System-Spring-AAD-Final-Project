/* pages/employee.js — Manage Employee (mirrors ManageEmployeeController) */
function renderEmployeePage(container) {
  const LICENCE_REQUIRED_CATEGORIES = ["DRIVER", "MANAGER"];
  const SECONDARY_ROLE_OPTIONS = ["", "DRIVER", "CONDUCTOR", "MANAGER", "HELPER", "CLEANER"];

  function licenceNeeded(category, category2) {
    return LICENCE_REQUIRED_CATEGORIES.includes(category) || LICENCE_REQUIRED_CATEGORIES.includes(category2);
  }

  function updateLicenceRequirement(category, category2) {
    const needed = licenceNeeded(category, category2 !== undefined ? category2 : qs("#f_empCategory2", container)?.value);
    const input = qs("#f_drivingLicenceNo", container);
    const label = container.querySelector('label[for="f_drivingLicenceNo"]');
    if (input) input.required = needed;
    if (label) label.innerHTML = `Driving Licence No.${needed ? ' <span class="req">*</span>' : ""}`;
  }

  function showRateHistoryModal(row) {
    openModal({
      title: `Salary Rate History — ${row.empName}`,
      bodyHtml: `<p class="muted">Loading...</p>`,
      onMount(overlay) {
        SalaryRateHistoryApi.byEmployee(row.empId).then(res => {
          const rows = res.body || [];
          qs(".modal__body", overlay).innerHTML = rows.length ? `
            <table class="data-table">
              <thead><tr><th>Effective Date</th><th>Rate</th></tr></thead>
              <tbody>${rows.map(h => `<tr><td>${Fmt.date(h.effectiveDate)}</td><td>${Fmt.money(h.rate)}</td></tr>`).join("")}</tbody>
            </table>` : `<p class="muted">No base salary rate has been set for this employee yet.</p>`;
        }).catch(err => { qs(".modal__body", overlay).innerHTML = `<p class="muted">${Fmt.escapeHtml(apiErrorMessage(err, "Could not load rate history."))}</p>`; });
      }
    });
  }

  renderCrudPage(container, {
    title: "Manage Employee",
    subtitle: "Drivers, conductors and staff records.",
    table: "employees",
    idField: "empId",
    singular: "Employee",
    fields: [
      { name: "empCategory", label: "Category", type: "select", required: true, options: ["DRIVER", "CONDUCTOR", "MANAGER", "HELPER", "CLEANER"], onChange: (data) => updateLicenceRequirement(data.empCategory, data.empCategory2) },
      { name: "empCategory2", label: "Secondary Role (optional)", type: "select", options: SECONDARY_ROLE_OPTIONS, onChange: (data) => updateLicenceRequirement(data.empCategory, data.empCategory2) },
      { name: "empName", label: "Full Name", required: true, placeholder: "Employee name" },
      { name: "address", label: "Address", required: true, wide: true, placeholder: "Residential address" },
      { name: "contactNo", label: "Contact No.", required: true, placeholder: "10-digit number" },
      { name: "nicNo", label: "NIC No.", required: true, placeholder: "e.g. 199012345678 or 901234567V" },
      { name: "ntcNo", label: "NTC No.", placeholder: "Optional" },
      { name: "drivingLicenceNo", label: "Driving Licence No.", placeholder: "Required for Drivers & Managers" },
      { name: "joinDate", label: "Join Date", type: "date", required: true },
      { name: "exitDate", label: "Exit Date", type: "date" },
      { name: "empStatus", label: "Status", type: "select", required: true, default: "ACTIVE", options: ["ACTIVE", "INACTIVE", "ON_LEAVE", "TEMPORARY", "RETIRED", "SUSPENDED"] },
      { name: "baseSalaryRate", label: "Base Salary Rate (Rs./month, optional)", type: "number", step: "0.01", placeholder: "For fixed-salary staff e.g. Managers" },
      { name: "nicPhotoUrl", label: "NIC Copy (optional)", type: "photo" },
      { name: "licencePhotoUrl", label: "Driving Licence Copy (optional)", type: "photo" }
    ],
    columns: [
      { key: "empId", label: "ID" },
      { key: "empName", label: "Name" },
      { key: "empCategory", label: "Category", render: r => `<span class="badge badge--blue">${r.empCategory}</span>${r.empCategory2 ? ` <span class="badge badge--gray">${r.empCategory2}</span>` : ""}` },
      { key: "contactNo", label: "Contact" },
      { key: "nicNo", label: "NIC" },
      { key: "joinDate", label: "Join Date", render: r => Fmt.date(r.joinDate) },
      { key: "empStatus", label: "Status", render: r => `<span class="badge badge--${empStatusTone(r.empStatus)}">${r.empStatus.replace("_", " ")}</span>` },
      { key: "baseSalaryRate", label: "Base Rate", render: r => r.baseSalaryRate ? Fmt.money(r.baseSalaryRate) : "-" },
      { key: "documents", label: "Documents", render: r => [r.nicPhotoUrl ? `<a href="${Fmt.escapeHtml(r.nicPhotoUrl)}" target="_blank" rel="noopener">NIC</a>` : "", r.licencePhotoUrl ? `<a href="${Fmt.escapeHtml(r.licencePhotoUrl)}" target="_blank" rel="noopener">Licence</a>` : ""].filter(Boolean).join(" · ") || "-" }
    ],
    searchKeys: ["empName", "empCategory", "empCategory2", "contactNo", "nicNo", "empStatus"],
    defaultSort: (a, b) => b.empId - a.empId,
    emptyText: "No employees yet — add your first team member above.",
    csvImport: true,
    beforeSave(data) {
      if (!Validate.isContact(data.contactNo)) return { error: "Contact number must be exactly 10 digits!" };
      if (!Validate.isNic(data.nicNo)) return { error: "Invalid NIC format! Use 9 digits + V, or 12 digits." };
      if (data.joinDate && new Date(data.joinDate) > new Date()) return { error: "Join date cannot be in the future!" };
      if (data.exitDate && data.joinDate && new Date(data.exitDate) < new Date(data.joinDate)) return { error: "Exit date cannot be before join date!" };
      if (data.empCategory2 === data.empCategory) data.empCategory2 = "";
      if (licenceNeeded(data.empCategory, data.empCategory2) && Validate.isEmpty(data.drivingLicenceNo)) {
        return { error: "Driving Licence No. is required for Driver and Manager category employees (primary or secondary role)." };
      }
      data.baseSalaryRate = data.baseSalaryRate === "" ? null : data.baseSalaryRate;
      return null;
    },
    onCreate(row) { row.createdBy = Session.currentUser().userId; },
    onTimeline(row) { showRateHistoryModal(row); },
    onSelectRow(row) { updateLicenceRequirement(row.empCategory, row.empCategory2); },
    onClearForm() { updateLicenceRequirement("", ""); },
    canDelete(id) {
      const hasSalary = DB.readAll("employeeSalaries").some(s => s.empId === id);
      const hasTrip = DB.readAll("tripEmployees").some(t => t.empId === id);
      const hasAccidents = DB.readAll("accidents").some(a => a.driverId === id);
      if (hasSalary || hasTrip || hasAccidents) return { blocked: true, reason: "Cannot delete this employee — salary records, trip assignments, or accident records reference them." };
      return { blocked: false };
    },
    onPrint(row) { PrintReceipt.employeeReceipt(row); }
  });
}

function empStatusTone(s) {
  return { ACTIVE: "green", INACTIVE: "gray", ON_LEAVE: "amber", TEMPORARY: "blue", RETIRED: "gray", SUSPENDED: "red" }[s] || "gray";
}
