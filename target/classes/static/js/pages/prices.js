/* pages/prices.js — Update Prices (mirrors UpdatePricesController + UpdatePricesModel) */
function renderPricesPage(container) {
  function latestPrice(type) {
    const rows = DB.readAll("updatePrices")
      .filter(p => p.updateType === type)
      .sort((a, b) => (b.changeDate.localeCompare(a.changeDate)) || (b.updatePricesId - a.updatePricesId));
    return rows.length ? Number(rows[0].newValue) : 0;
  }

  function recalc() {
    const prevEl = qs("#f_previousValue");
    const newEl = qs("#f_newValue");
    const amtEl = qs("#f_changeAmount");
    const pctEl = qs("#f_percentageChange");
    const ctEl = qs("#f_changeType");
    if (!prevEl || !newEl) return;
    const prev = Number(prevEl.value);
    const val = Number(newEl.value);
    if (prevEl.value !== "" && newEl.value !== "" && !isNaN(prev) && !isNaN(val)) {
      const amt = val - prev;
      const pct = prev === 0 ? 0 : (amt / prev) * 100;
      amtEl.value = amt.toFixed(2);
      pctEl.value = pct.toFixed(2);
      if (ctEl && !ctEl.value) ctEl.value = amt >= 0 ? "INCREMENT" : "DECREMENT";
    } else {
      amtEl.value = ""; pctEl.value = "";
    }
  }

  function onTypeChange() {
    const typeEl = qs("#f_updateType");
    const prevEl = qs("#f_previousValue");
    if (typeEl.value) {
      prevEl.value = latestPrice(typeEl.value).toFixed(2);
      recalc();
    }
  }

  renderCrudPage(container, {
    title: "Update Prices",
    subtitle: "Track fuel & ticket price changes over time.",
    table: "updatePrices",
    idField: "updatePricesId",
    singular: "Price update",
    fields: [
      { name: "updateType", label: "Update Type", type: "select", required: true, options: ["FUEL", "TICKET"], onChange: onTypeChange },
      { name: "changeType", label: "Change Type", type: "select", required: true, options: ["INCREMENT", "DECREMENT"] },
      { name: "previousValue", label: "Previous Value (Rs.)", type: "number", step: "0.01", required: true, onChange: recalc },
      { name: "newValue", label: "New Value (Rs.)", type: "number", step: "0.01", required: true, onChange: recalc },
      { name: "changeAmount", label: "Change Amount", type: "number", step: "0.01", readonly: true },
      { name: "percentageChange", label: "% Change", type: "number", step: "0.01", readonly: true },
      { name: "changeDate", label: "Change Date", type: "date", required: true },
      { name: "description", label: "Description", type: "textarea", wide: true }
    ],
    columns: [
      { key: "updatePricesId", label: "ID" },
      { key: "updateType", label: "Type", render: r => `<span class="badge badge--${r.updateType === "FUEL" ? "amber" : "blue"}">${r.updateType}</span>` },
      { key: "changeType", label: "Change", render: r => `<span class="badge badge--${r.changeType === "INCREMENT" ? "red" : "green"}">${r.changeType === "INCREMENT" ? "▲" : "▼"} ${r.changeType}</span>` },
      { key: "previousValue", label: "Previous", render: r => Fmt.money(r.previousValue) },
      { key: "newValue", label: "New", render: r => Fmt.money(r.newValue) },
      { key: "changeAmount", label: "Δ Amount", render: r => Fmt.money(r.changeAmount) },
      { key: "percentageChange", label: "% Change", render: r => `${Number(r.percentageChange).toFixed(2)}%` },
      { key: "changeDate", label: "Date", render: r => Fmt.date(r.changeDate) }
    ],
    searchKeys: ["updateType", "changeType", "description"],
    defaultSort: (a, b) => b.changeDate.localeCompare(a.changeDate) || b.updatePricesId - a.updatePricesId,
    emptyText: "No price updates recorded yet.",
    beforeSave(data) {
      if (isNaN(Number(data.previousValue)) || isNaN(Number(data.newValue))) return { error: "Please enter valid previous and new values." };
      data.previousValue = Number(data.previousValue);
      data.newValue = Number(data.newValue);
      data.changeAmount = data.newValue - data.previousValue;
      data.percentageChange = data.previousValue === 0 ? 0 : (data.changeAmount / data.previousValue) * 100;
      return null;
    },
    onCreate(row) { row.createdBy = Session.currentUser().userId; },
    onPrint(row) { PrintReceipt.priceUpdateReceipt(row); }
  });
}
