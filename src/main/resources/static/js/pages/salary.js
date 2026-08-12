/* pages/salary.js — Manage Employee Salary (mirrors ManageEmployeeSalaryController).
   Driver/Conductor/Helper/Cleaner salaries are trip-specific and are now
   normally entered from the Trip Expenses page (alongside fuel/parking/
   other costs, tied to the crew assigned there). This page is now aimed
   at Manager salaries, which aren't trip-based — so new entries here only
   suggest Managers. Existing salary records for ANY category can still
   be viewed, edited, and deleted here exactly as before. */
function renderSalaryPage(container) {
  function empSuggestions() {
    return DB.readAll("employees")
      .filter(e => e.empCategory === "MANAGER" || e.empSecondaryCategory === "MANAGER")
      .map(e => ({
        label: `${e.empName} (${e.empCategory}${e.empSecondaryCategory ? ` + ${e.empSecondaryCategory}` : ""})`,
        sub: e.contactNo,
        value: e.empId,
        raw: e
      }));
  }
  function empDisplayValue(empId) {
    const e = Q.employee(Number(empId));
    return e ? `${e.empName} (${e.empCategory})` : "";
  }

  const tripOptions = () => DB.readAll("trips").map(t => ({ value: t.tripId, label: `#${t.tripId} — ${t.startLocation} → ${t.endLocation} (${Fmt.date(t.tripDate)})` }));

  renderCrudPage(container, {
    title: "Employee Salary",
    subtitle: "Manager salaries (not trip-specific) — Driver/Conductor/Helper/Cleaner pay is entered from Trip Expenses instead.",
    table: "employeeSalaries",
    idField: "salaryId",
    singular: "Salary payment",
    fields: [
      { name: "empId", label: "Manager", type: "searchSelect", required: true, placeholder: "Type a manager's name to search...", source: empSuggestions, displayValue: empDisplayValue },
      { name: "tripId", label: "Trip (optional)", type: "select", options: tripOptions() },
      { name: "amount", label: "Amount (Rs.)", type: "number", step: "0.01", required: true },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "description", label: "Description", type: "textarea", wide: true }
    ],
    columns: [
      { key: "salaryId", label: "ID" },
      { key: "empId", label: "Employee", render: r => Q.empName(r.empId) },
      { key: "tripId", label: "Trip", render: r => r.tripId ? `#${r.tripId}` : "-" },
      { key: "amount", label: "Amount", render: r => Fmt.money(r.amount) },
      { key: "date", label: "Date", render: r => Fmt.date(r.date) }
    ],
    searchKeys: [r => Q.empName(r.empId), "description"],
    defaultSort: (a, b) => b.salaryId - a.salaryId,
    emptyText: "No salary payments recorded yet.",
    beforeSave(data, isEdit) {
      if (!data.empId) return { error: "Please select a manager from the list (type a name to search)." };
      if (!DB.readAll("employees").some(e => e.empId === data.empId)) {
        return { error: "That doesn't match a valid employee — please pick one from the suggestions." };
      }
      if (!isEdit && Q.employee(data.empId)?.empCategory !== "MANAGER") {
        return { error: "New entries here are for Managers only — Driver/Conductor/Helper/Cleaner pay is entered from Trip Expenses." };
      }
      if (!Validate.isPositiveNumber(data.amount)) return { error: "Amount must be a positive number." };
      data.tripId = data.tripId === "" ? null : Number(data.tripId);
      return null;
    },
    onCreate(row) { row.createdBy = Session.currentUser().userId; },
    onPrint(row) { PrintReceipt.salaryReceipt(row, Q.empName(row.empId)); }
  });
}
