/* pages/tripExpenses.js — Manage Trip Expenses (mirrors ManageTripExpensesController) */
function renderTripExpensesPage(container) {
  const tripOptions = () => DB.readAll("trips").map(t => ({ value: t.tripId, label: `#${t.tripId} — ${t.startLocation} → ${t.endLocation} (${Fmt.date(t.tripDate)})` }));

  renderCrudPage(container, {
    title: "Trip Expenses",
    subtitle: "Fuel, parking and other on-trip costs.",
    table: "tripExpenses",
    idField: "tripExpId",
    singular: "Trip expense",
    fields: [
      { name: "tripId", label: "Trip", type: "select", required: true, options: tripOptions() },
      { name: "tripExpType", label: "Expense Type", type: "select", required: true, options: ["FUEL", "PARKING", "OTHERS"] },
      { name: "amount", label: "Amount (Rs.)", type: "number", step: "0.01", required: true },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "description", label: "Description", type: "textarea", wide: true }
    ],
    columns: [
      { key: "tripExpId", label: "ID" },
      { key: "tripId", label: "Trip", render: r => { const t = Q.trip(r.tripId); return t ? `#${r.tripId} (${t.startLocation} → ${t.endLocation})` : `#${r.tripId}`; } },
      { key: "tripExpType", label: "Type", render: r => `<span class="badge badge--${r.tripExpType === "FUEL" ? "amber" : r.tripExpType === "PARKING" ? "blue" : "gray"}">${r.tripExpType}</span>` },
      { key: "amount", label: "Amount", render: r => Fmt.money(r.amount) },
      { key: "date", label: "Date", render: r => Fmt.date(r.date) }
    ],
    searchKeys: ["tripExpType", "description", r => String(r.tripId)],
    defaultSort: (a, b) => b.tripExpId - a.tripExpId,
    emptyText: "No trip expenses recorded yet.",
    beforeSave(data) {
      if (!Validate.isPositiveNumber(data.amount)) return { error: "Amount must be a positive number." };
      return null;
    },
    onCreate(row) { row.createdBy = Session.currentUser().userId; }
  });
}
