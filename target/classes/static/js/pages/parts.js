/* pages/parts.js — Manage Part Purchase (mirrors ManagePartPurchaseController) */
function renderPartsPage(container) {
  const busOptions = () => DB.readAll("buses").map(b => ({ value: b.busId, label: `${b.busId} — ${b.busNumber}` }));
  const maintOptionsForBus = (busId) => DB.readAll("maintenance")
    .filter(m => !busId || Number(m.busId) === Number(busId))
    .map(m => ({ value: m.maintId, label: `#${m.maintId} — ${(m.maintenanceType || "").replace(/_/g, " ")} (${Fmt.date(m.serviceDate)})` }));

  // The Linked Maintenance dropdown only ever shows jobs for the currently
  // selected bus — a part bought for Bus A can no longer be linked to Bus
  // B's maintenance job by mistake.
  function refreshMaintOptions(busId) {
    const sel = qs("#f_maintId", container);
    if (!sel) return;
    const keep = sel.value;
    const opts = maintOptionsForBus(busId);
    sel.innerHTML = `<option value="">None</option>` + opts.map(o => `<option value="${o.value}">${Fmt.escapeHtml(o.label)}</option>`).join("");
    sel.value = opts.some(o => String(o.value) === String(keep)) ? keep : "";
  }

  function recalcTotal() {
    const qty = Number(qs("#f_quantity")?.value || 0);
    const price = Number(qs("#f_unitPrice")?.value || 0);
    const totalEl = qs("#f_totalCost");
    if (totalEl) totalEl.value = (qty * price).toFixed(2);
  }

  renderCrudPage(container, {
    title: "Part Purchases",
    subtitle: "Spare parts bought for buses — linked to maintenance jobs when relevant.",
    table: "partPurchases",
    idField: "purchaseId",
    singular: "Part purchase",
    fields: [
      { name: "busId", label: "Bus", type: "select", required: true, options: busOptions(), onChange: (data) => refreshMaintOptions(data.busId) },
      { name: "maintId", label: "Linked Maintenance (optional)", type: "select", options: maintOptionsForBus(null) },
      { name: "partName", label: "Part Name", required: true, placeholder: "e.g. Brake Pads" },
      { name: "quantity", label: "Quantity", type: "number", required: true, onChange: recalcTotal },
      { name: "unitPrice", label: "Unit Price (Rs.)", type: "number", step: "0.01", required: true, onChange: recalcTotal },
      { name: "totalCost", label: "Total Cost (Rs.)", type: "number", step: "0.01", readonly: true },
      { name: "supplierName", label: "Supplier", required: true, placeholder: "Supplier / shop name" },
      { name: "date", label: "Purchase Date", type: "date", required: true },
      { name: "partDescription", label: "Description", type: "textarea", wide: true }
    ],
    columns: [
      { key: "purchaseId", label: "ID" },
      { key: "busId", label: "Bus", render: r => Q.busNumber(r.busId) },
      { key: "partName", label: "Part" },
      { key: "quantity", label: "Qty" },
      { key: "unitPrice", label: "Unit Price", render: r => Fmt.money(r.unitPrice) },
      { key: "totalCost", label: "Total", render: r => Fmt.money(r.totalCost) },
      { key: "supplierName", label: "Supplier" },
      { key: "date", label: "Date", render: r => Fmt.date(r.date) }
    ],
    searchKeys: [r => Q.busNumber(r.busId), "partName", "supplierName"],
    defaultSort: (a, b) => b.purchaseId - a.purchaseId,
    emptyText: "No part purchases recorded yet.",
    beforeSave(data) {
      if (!Validate.isPositiveNumber(data.quantity)) return { error: "Quantity must be a positive number." };
      if (!Validate.isNonNegativeNumber(data.unitPrice)) return { error: "Unit price must be valid." };
      data.totalCost = Number(data.quantity) * Number(data.unitPrice);
      data.busId = Number(data.busId);
      data.maintId = data.maintId === "" ? null : Number(data.maintId);
      return null;
    },
    onCreate(row) { row.createdBy = Session.currentUser().userId; },
    onSelectRow(row) { refreshMaintOptions(row.busId); },
    onClearForm() { refreshMaintOptions(null); },
    onPrint(row) { PrintReceipt.partPurchaseReceipt(row, Q.busNumber(row.busId)); }
  });

  recalcTotal();
}
