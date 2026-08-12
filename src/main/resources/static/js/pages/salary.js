/* pages/salary.js — Manage Employee Salary (mirrors ManageEmployeeSalaryController) */
function renderSalaryPage(container) {
  const empOptions = () => DB.readAll("employees").map(e => ({ value: e.empId, label: `${e.empId} — ${e.empName} (${e.empCategory})` }));
  const tripOptions = () => DB.readAll("trips").map(t => ({ value: t.tripId, label: `#${t.tripId} — ${t.startLocation} → ${t.endLocation} (${Fmt.date(t.tripDate)})` }));

  renderCrudPage(container, {
    title: "Employee Salary",
    subtitle: "Pay drivers, conductors and other staff — optionally linked to a trip.",
    table: "employeeSalaries",
    idField: "salaryId",
    singular: "Salary payment",
    fields: [
      { name: "empId", label: "Employee", type: "select", required: true, options: empOptions() },
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
    beforeSave(data) {
      if (!Validate.isPositiveNumber(data.amount)) return { error: "Amount must be a positive number." };
      data.tripId = data.tripId === "" ? null : Number(data.tripId);
      return null;
    },
    onCreate(row) { row.createdBy = Session.currentUser().userId; }
  });
}
