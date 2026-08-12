/* pages/employee.js — Manage Employee (mirrors ManageEmployeeController) */
function renderEmployeePage(container) {
  renderCrudPage(container, {
    title: "Manage Employee",
    subtitle: "Drivers, conductors and staff records.",
    table: "employees",
    idField: "empId",
    singular: "Employee",
    fields: [
      { name: "empCategory", label: "Category", type: "select", required: true, options: ["DRIVER", "CONDUCTOR", "MANAGER", "HELPER", "CLEANER"] },
      { name: "empName", label: "Full Name", required: true, placeholder: "Employee name" },
      { name: "address", label: "Address", required: true, wide: true, placeholder: "Residential address" },
      { name: "contactNo", label: "Contact No.", required: true, placeholder: "10-digit number" },
      { name: "nicNo", label: "NIC No.", required: true, placeholder: "e.g. 199012345678 or 901234567V" },
      { name: "ntcNo", label: "NTC No.", placeholder: "Optional" },
      { name: "drivingLicenceNo", label: "Driving Licence No.", placeholder: "Optional" },
      { name: "joinDate", label: "Join Date", type: "date", required: true },
      { name: "exitDate", label: "Exit Date", type: "date" },
      { name: "empStatus", label: "Status", type: "select", required: true, default: "ACTIVE", options: ["ACTIVE", "INACTIVE", "ON_LEAVE", "TEMPORARY", "RETIRED", "SUSPENDED"] }
    ],
    columns: [
      { key: "empId", label: "ID" },
      { key: "empName", label: "Name" },
      { key: "empCategory", label: "Category", render: r => `<span class="badge badge--blue">${r.empCategory}</span>` },
      { key: "contactNo", label: "Contact" },
      { key: "nicNo", label: "NIC" },
      { key: "joinDate", label: "Join Date", render: r => Fmt.date(r.joinDate) },
      { key: "empStatus", label: "Status", render: r => `<span class="badge badge--${empStatusTone(r.empStatus)}">${r.empStatus.replace("_", " ")}</span>` }
    ],
    searchKeys: ["empName", "empCategory", "contactNo", "nicNo", "empStatus"],
    defaultSort: (a, b) => b.empId - a.empId,
    emptyText: "No employees yet — add your first team member above.",
    csvImport: true,
    beforeSave(data) {
      if (!Validate.isContact(data.contactNo)) return { error: "Contact number must be exactly 10 digits!" };
      if (!Validate.isNic(data.nicNo)) return { error: "Invalid NIC format! Use 9 digits + V, or 12 digits." };
      if (data.joinDate && new Date(data.joinDate) > new Date()) return { error: "Join date cannot be in the future!" };
      if (data.exitDate && data.joinDate && new Date(data.exitDate) < new Date(data.joinDate)) return { error: "Exit date cannot be before join date!" };
      return null;
    },
    onCreate(row) { row.createdBy = Session.currentUser().userId; },
    canDelete(id) {
      const hasSalary = DB.readAll("employeeSalaries").some(s => s.empId === id);
      const hasTrip = DB.readAll("tripEmployees").some(t => t.empId === id);
      if (hasSalary || hasTrip) return { blocked: true, reason: "Cannot delete this employee — salary records or trip assignments reference them." };
      return { blocked: false };
    }
  });
}

function empStatusTone(s) {
  return { ACTIVE: "green", INACTIVE: "gray", ON_LEAVE: "amber", TEMPORARY: "blue", RETIRED: "gray", SUSPENDED: "red" }[s] || "gray";
}
