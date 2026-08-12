/* pages/employee.js — Manage Employee (mirrors ManageEmployeeController) */
function renderEmployeePage(container) {
  const LICENCE_REQUIRED_CATEGORIES = ["DRIVER", "MANAGER"];
  const CATEGORY_OPTIONS = ["DRIVER", "CONDUCTOR", "MANAGER", "HELPER", "CLEANER"];

  function licenceNeeded(category) {
    return LICENCE_REQUIRED_CATEGORIES.includes(category);
  }

  // A driving licence is required if EITHER role (primary or secondary)
  // is Driver or Manager.
  function updateLicenceRequirement(category, secondaryCategory) {
    const needed = licenceNeeded(category) || licenceNeeded(secondaryCategory);
    const input = qs("#f_drivingLicenceNo", container);
    const label = container.querySelector('label[for="f_drivingLicenceNo"]');
    if (input) input.required = needed;
    if (label) label.innerHTML = `Driving Licence No.${needed ? ' <span class="req">*</span>' : ""}`;
  }

  renderCrudPage(container, {
    title: "Manage Employee",
    subtitle: "Drivers, conductors and staff records.",
    table: "employees",
    idField: "empId",
    singular: "Employee",
    fields: [
      { name: "empCategory", label: "Category", type: "select", required: true, options: CATEGORY_OPTIONS, onChange: (data) => updateLicenceRequirement(data.empCategory, data.empSecondaryCategory) },
      { name: "empSecondaryCategory", label: "Secondary Role (optional)", type: "select", options: CATEGORY_OPTIONS, placeholder: "None — single role only", onChange: (data) => updateLicenceRequirement(data.empCategory, data.empSecondaryCategory) },
      { name: "empName", label: "Full Name", required: true, placeholder: "Employee name" },
      { name: "address", label: "Address", required: true, wide: true, placeholder: "Residential address" },
      { name: "contactNo", label: "Contact No.", required: true, placeholder: "10-digit number" },
      { name: "nicNo", label: "NIC No.", required: true, placeholder: "e.g. 199012345678 or 901234567V" },
      { name: "ntcNo", label: "NTC No.", placeholder: "Optional" },
      { name: "drivingLicenceNo", label: "Driving Licence No.", placeholder: "Required for Drivers & Managers" },
      { name: "joinDate", label: "Join Date", type: "date", required: true },
      { name: "exitDate", label: "Exit Date", type: "date" },
      { name: "empStatus", label: "Status", type: "select", required: true, default: "ACTIVE", options: ["ACTIVE", "INACTIVE", "ON_LEAVE", "TEMPORARY", "RETIRED", "SUSPENDED"] }
    ],
    columns: [
      { key: "empId", label: "ID" },
      { key: "empName", label: "Name" },
      { key: "empCategory", label: "Role(s)", render: r => `<span class="badge badge--blue">${r.empCategory}</span>${r.empSecondaryCategory ? ` <span class="badge badge--gray">${r.empSecondaryCategory}</span>` : ""}` },
      { key: "contactNo", label: "Contact" },
      { key: "nicNo", label: "NIC" },
      { key: "joinDate", label: "Join Date", render: r => Fmt.date(r.joinDate) },
      { key: "empStatus", label: "Status", render: r => `<span class="badge badge--${empStatusTone(r.empStatus)}">${r.empStatus.replace("_", " ")}</span>` }
    ],
    searchKeys: ["empName", "empCategory", "empSecondaryCategory", "contactNo", "nicNo", "empStatus"],
    defaultSort: (a, b) => b.empId - a.empId,
    emptyText: "No employees yet — add your first team member above.",
    csvImport: true,
    beforeSave(data) {
      if (!Validate.isContact(data.contactNo)) return { error: "Contact number must be exactly 10 digits!" };
      if (!Validate.isNic(data.nicNo)) return { error: "Invalid NIC format! Use 9 digits + V, or 12 digits." };
      if (data.joinDate && new Date(data.joinDate) > new Date()) return { error: "Join date cannot be in the future!" };
      if (data.exitDate && data.joinDate && new Date(data.exitDate) < new Date(data.joinDate)) return { error: "Exit date cannot be before join date!" };
      data.empSecondaryCategory = data.empSecondaryCategory === "" ? null : data.empSecondaryCategory;
      if (data.empSecondaryCategory && data.empSecondaryCategory === data.empCategory) {
        return { error: "Secondary Role must be different from the primary Category." };
      }
      if ((licenceNeeded(data.empCategory) || licenceNeeded(data.empSecondaryCategory)) && Validate.isEmpty(data.drivingLicenceNo)) {
        return { error: "Driving Licence No. is required when either role is Driver or Manager." };
      }
      return null;
    },
    onCreate(row) { row.createdBy = Session.currentUser().userId; },
    onSelectRow(row) { updateLicenceRequirement(row.empCategory, row.empSecondaryCategory); },
    onClearForm() { updateLicenceRequirement("", ""); },
    canDelete(id) {
      const hasSalary = DB.readAll("employeeSalaries").some(s => s.empId === id);
      const hasTrip = DB.readAll("tripEmployees").some(t => t.empId === id);
      if (hasSalary || hasTrip) return { blocked: true, reason: "Cannot delete this employee — salary records or trip assignments reference them." };
      return { blocked: false };
    },
    onPrint(row) { PrintReceipt.employeeReceipt(row); }
  });
}

function empStatusTone(s) {
  return { ACTIVE: "green", INACTIVE: "gray", ON_LEAVE: "amber", TEMPORARY: "blue", RETIRED: "gray", SUSPENDED: "red" }[s] || "gray";
}
