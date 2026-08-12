/* pages/services.js — Manage Other Services (mirrors ManageOtherServicesController) */
function renderServicesPage(container) {
  const busOptions = () => DB.readAll("buses").map(b => ({ value: b.busId, label: `${b.busId} — ${b.busNumber}` }));
  const tripOptions = () => DB.readAll("trips").map(t => ({ value: t.tripId, label: `#${t.tripId} — ${t.startLocation} → ${t.endLocation} (${Fmt.date(t.tripDate)})` }));

  renderCrudPage(container, {
    title: "Other Services",
    subtitle: "Cleaning, permits, decorations and any miscellaneous cost.",
    table: "otherServices",
    idField: "serviceId",
    singular: "Service",
    fields: [
      { name: "busId", label: "Bus (optional)", type: "select", options: busOptions() },
      { name: "tripId", label: "Trip (optional)", type: "select", options: tripOptions() },
      { name: "serviceName", label: "Service Name", required: true, placeholder: "e.g. Interior Cleaning" },
      { name: "cost", label: "Cost (Rs.)", type: "number", step: "0.01", required: true },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "description", label: "Description", type: "textarea", wide: true }
    ],
    columns: [
      { key: "serviceId", label: "ID" },
      { key: "serviceName", label: "Service" },
      { key: "busId", label: "Bus", render: r => r.busId ? Q.busNumber(r.busId) : "-" },
      { key: "tripId", label: "Trip", render: r => r.tripId ? `#${r.tripId}` : "-" },
      { key: "cost", label: "Cost", render: r => Fmt.money(r.cost) },
      { key: "date", label: "Date", render: r => Fmt.date(r.date) }
    ],
    searchKeys: ["serviceName", "description", r => Q.busNumber(r.busId)],
    defaultSort: (a, b) => b.serviceId - a.serviceId,
    emptyText: "No other-service records yet.",
    beforeSave(data) {
      if (!Validate.isNonNegativeNumber(data.cost)) return { error: "Cost must be a valid non-negative amount." };
      data.busId = data.busId === "" ? null : Number(data.busId);
      data.tripId = data.tripId === "" ? null : Number(data.tripId);
      return null;
    },
    onCreate(row) { row.createdBy = Session.currentUser().userId; },
    onPrint(row) { PrintReceipt.otherServiceReceipt(row, row.busId ? Q.busNumber(row.busId) : null); }
  });
}
