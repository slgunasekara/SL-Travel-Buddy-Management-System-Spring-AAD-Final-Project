/* pages/maintenance.js — Manage Maintenance (mirrors ManageMaintenanceController) */
function renderMaintenancePage(container) {
  const busOptions = () => DB.readAll("buses").map(b => ({ value: b.busId, label: `${b.busId} — ${b.busNumber}` }));

  renderCrudPage(container, {
    title: "Maintenance Records",
    subtitle: "Track servicing history and cost for every bus.",
    table: "maintenance",
    idField: "maintId",
    singular: "Maintenance record",
    fields: [
      { name: "busId", label: "Bus", type: "select", required: true, options: busOptions() },
      { name: "maintenanceType", label: "Maintenance Type", type: "select", required: true, options: ["MECHANICAL_REPAIR", "BODY_REPAIR", "TIRE_SERVICE", "BRAKE_SERVICE", "ELECTRICAL_REPAIR", "OIL_CHANGE", "FULL_SERVICE"] },
      { name: "serviceDate", label: "Service Date", type: "date", required: true },
      { name: "mileage", label: "Mileage at Service (km)", type: "number" },
      { name: "cost", label: "Cost (Rs.)", type: "number", step: "0.01", required: true },
      { name: "technician", label: "Maintained By", placeholder: "Technician / garage name" },
      { name: "description", label: "Description", type: "textarea", wide: true }
    ],
    columns: [
      { key: "maintId", label: "ID" },
      { key: "busId", label: "Bus", render: r => Q.busNumber(r.busId) },
      { key: "maintenanceType", label: "Type", render: r => `<span class="badge badge--blue">${(r.maintenanceType || "").replace(/_/g, " ")}</span>` },
      { key: "serviceDate", label: "Date", render: r => Fmt.date(r.serviceDate) },
      { key: "mileage", label: "Mileage", render: r => r.mileage ? `${Number(r.mileage).toLocaleString()} km` : "-" },
      { key: "cost", label: "Cost", render: r => Fmt.money(r.cost) },
      { key: "technician", label: "Maintained By" }
    ],
    searchKeys: [r => Q.busNumber(r.busId), "maintenanceType", "technician", "description"],
    defaultSort: (a, b) => b.maintId - a.maintId,
    emptyText: "No maintenance records yet.",
    beforeSave(data) {
      if (!Validate.isNonNegativeNumber(data.cost)) return { error: "Cost must be a valid non-negative amount." };
      data.busId = Number(data.busId);
      return null;
    },
    onCreate(row) { row.createdBy = Session.currentUser().userId; },
    onPrint(row) { PrintReceipt.maintenanceReceipt(row, Q.busNumber(row.busId)); }
  });
}
