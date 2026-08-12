/* pages/tripExpenses.js — Manage Trip Expenses (mirrors ManageTripExpensesController).
   Fuel, Parking and Other can all be entered together for a trip and
   saved in a single action (each non-empty amount becomes its own
   record behind the scenes). There are two description fields:
   - "What is the Other expense for?" — specific to the Other amount,
     required only when an Other amount is entered.
   - "Trip Notes" — a general, optional note about this whole expense
     entry, applied to every record created in the same save. */
function renderTripExpensesPage(container) {
  let editingId = null; // set only when editing ONE existing row from the table below

  const tripOptions = () => DB.readAll("trips").map(t => `<option value="${t.tripId}">#${t.tripId} — ${t.startLocation} → ${t.endLocation} (${Fmt.date(t.tripDate)})</option>`).join("");

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h2>Trip Expenses</h2>
        <p class="muted">Enter fuel, parking and other on-trip costs together for a trip — one save covers all three.</p>
      </div>
    </div>

    <div class="card form-card">
      <div class="form-grid">
        <div class="form-field">
          <label>Trip <span class="req">*</span></label>
          <select id="f_tripId" required><option value="">Select...</option>${tripOptions()}</select>
        </div>
        <div class="form-field">
          <label>Date <span class="req">*</span></label>
          <input type="date" id="f_date" required />
        </div>
      </div>
      <div class="form-grid" style="margin-top:14px">
        <div class="form-field">
          <label>Fuel Amount (Rs.)</label>
          <input type="number" step="0.01" id="f_fuelAmount" placeholder="0.00" />
        </div>
        <div class="form-field">
          <label>Parking Amount (Rs.)</label>
          <input type="number" step="0.01" id="f_parkingAmount" placeholder="0.00" />
        </div>
        <div class="form-field">
          <label>Other Amount (Rs.)</label>
          <input type="number" step="0.01" id="f_otherAmount" placeholder="0.00" />
        </div>
        <div class="form-field form-field--wide" id="otherDescWrap">
          <label>What is the "Other" expense for? <span id="otherReqMark"></span></label>
          <input type="text" id="f_otherDescription" placeholder="Only needed if you entered an Other amount above" disabled />
        </div>
        <div class="form-field form-field--wide" id="tripNotesWrap">
          <label>Trip Notes <span class="muted" style="font-weight:400;">(optional — applies to all expenses saved together here)</span></label>
          <textarea id="f_tripNotes" rows="2" placeholder="e.g. Colombo-Kandy return trip, heavy traffic day"></textarea>
        </div>
      </div>
      <p class="muted" id="editHint" style="margin-top:10px; display:none;">
        Editing a single existing expense — only that record will be updated. Reset to go back to entering fuel/parking/other together.
      </p>
      <div class="form-actions">
        <button class="btn btn--primary" id="btnSave">Save</button>
        <button class="btn btn--secondary" id="btnUpdate" disabled>Update</button>
        <button class="btn btn--danger" id="btnDelete" disabled>Delete</button>
        <button class="btn btn--ghost" id="btnReset">Reset</button>
      </div>
    </div>

    <div class="card">
      <div class="table-toolbar">
        <div class="search-box">${icon("search", "search-ic")}<input type="text" id="searchBox" placeholder="Search trip expenses..." /></div>
        <div class="table-toolbar__right">
          <span class="pill" id="rowCount">0 records</span>
          <button class="btn btn--ghost btn--sm" id="btnExport">Export CSV</button>
          <button class="btn btn--ghost btn--sm" id="btnRefresh">Refresh</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table" id="dataTable">
          <thead><tr><th>ID</th><th>Trip</th><th>Type</th><th>Amount</th><th>Date</th><th>Note</th><th class="col-actions">Actions</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </div>`;

  const fuelEl = () => qs("#f_fuelAmount");
  const parkEl = () => qs("#f_parkingAmount");
  const otherEl = () => qs("#f_otherAmount");
  const otherDescEl = () => qs("#f_otherDescription");
  const notesEl = () => qs("#f_tripNotes");

  function combineDescription(specific, general) {
    return [specific, general].map(s => (s || "").trim()).filter(Boolean).join(" — ");
  }

  function syncOtherDescState() {
    const hasOther = Number(otherEl().value) > 0;
    otherDescEl().disabled = !hasOther && !editingId;
    const mark = qs("#otherReqMark");
    if (mark) mark.innerHTML = hasOther ? '<span class="req">*</span>' : "";
    if (!hasOther && !editingId) otherDescEl().value = "";
  }
  otherEl().addEventListener("input", syncOtherDescState);

  function clearForm() {
    editingId = null;
    qs("#f_tripId").value = "";
    qs("#f_date").value = "";
    fuelEl().value = "";
    parkEl().value = "";
    otherEl().value = "";
    otherDescEl().value = "";
    notesEl().value = "";
    qs("#otherDescWrap label").innerHTML = `What is the "Other" expense for? <span id="otherReqMark"></span>`;
    qs("#tripNotesWrap").style.display = "";
    syncOtherDescState();
    qs("#editHint").style.display = "none";
    ["f_tripId", "f_date", "f_fuelAmount", "f_parkingAmount", "f_otherAmount"].forEach(id => qs("#" + id).disabled = false);
    qs("#btnSave").disabled = false;
    qs("#btnSave").style.display = "";
    qs("#btnUpdate").disabled = true;
    qs("#btnDelete").disabled = true;
    qsa("#dataTable tbody tr").forEach(r => r.classList.remove("row-selected"));
  }

  function getRows() {
    return DB.readAll("tripExpenses");
  }

  function renderTable() {
    let rows = getRows();
    const term = qs("#searchBox").value.trim().toLowerCase();
    if (term) {
      rows = rows.filter(r =>
        (r.tripExpType || "").toLowerCase().includes(term) ||
        (r.description || "").toLowerCase().includes(term) ||
        String(r.tripId).includes(term)
      );
    }
    rows = [...rows].sort((a, b) => b.tripExpId - a.tripExpId);

    const tbody = qs("#dataTable tbody");
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="table-empty"><div class="table-empty__icon">${EMPTY_STATE_ICON}</div>No trip expenses recorded yet.</div></td></tr>`;
    } else {
      tbody.innerHTML = rows.map(r => {
        const t = Q.trip(r.tripId);
        const tripLabel = t ? `#${r.tripId} (${t.startLocation} → ${t.endLocation})` : `#${r.tripId}`;
        const typeTone = r.tripExpType === "FUEL" ? "amber" : r.tripExpType === "PARKING" ? "blue" : "gray";
        return `
        <tr data-id="${r.tripExpId}">
          <td>${r.tripExpId}</td>
          <td>${tripLabel}</td>
          <td><span class="badge badge--${typeTone}">${r.tripExpType}</span></td>
          <td>${Fmt.money(r.amount)}</td>
          <td>${Fmt.date(r.date)}</td>
          <td>${Fmt.escapeHtml(r.description || "-")}</td>
          <td class="col-actions">
            <button class="icon-btn" data-act="edit" title="Edit">✎</button>
            <button class="icon-btn icon-btn--danger" data-act="del" title="Delete">🗑</button>
          </td>
        </tr>`;
      }).join("");
    }
    qs("#rowCount").textContent = `${rows.length} record${rows.length === 1 ? "" : "s"}`;

    qsa("#dataTable tbody tr[data-id]").forEach(tr => {
      const id = Number(tr.dataset.id);
      tr.addEventListener("click", (e) => { if (!e.target.closest("[data-act]")) selectRow(id); });
      tr.querySelector('[data-act="edit"]').addEventListener("click", () => selectRow(id));
      tr.querySelector('[data-act="del"]').addEventListener("click", () => doDelete(id));
    });
  }

  function selectRow(id) {
    const row = getRows().find(r => r.tripExpId === id);
    if (!row) return;
    editingId = id;
    qs("#f_tripId").value = row.tripId;
    qs("#f_date").value = row.date;
    fuelEl().value = ""; parkEl().value = ""; otherEl().value = "";
    if (row.tripExpType === "FUEL") fuelEl().value = row.amount;
    else if (row.tripExpType === "PARKING") parkEl().value = row.amount;
    else otherEl().value = row.amount;

    // In edit mode we work with ONE record's raw description directly,
    // rather than trying to split it back into "specific" + "general" parts.
    otherDescEl().value = row.description || "";
    otherDescEl().disabled = false;
    qs("#otherDescWrap label").innerHTML = `Description`;
    qs("#tripNotesWrap").style.display = "none";

    ["f_fuelAmount", "f_parkingAmount", "f_otherAmount"].forEach(id2 => {
      const keep = (id2 === "f_fuelAmount" && row.tripExpType === "FUEL") ||
                   (id2 === "f_parkingAmount" && row.tripExpType === "PARKING") ||
                   (id2 === "f_otherAmount" && row.tripExpType === "OTHERS");
      qs("#" + id2).disabled = !keep;
    });

    qs("#editHint").style.display = "block";
    qs("#btnSave").style.display = "none";
    qs("#btnUpdate").disabled = false;
    qs("#btnDelete").disabled = false;
    qsa("#dataTable tbody tr").forEach(r => r.classList.toggle("row-selected", Number(r.dataset.id) === id));
  }

  async function doDelete(id) {
    const ok = await confirmDialog({ title: "Delete Trip Expense", message: "Are you sure you want to delete this expense record?", okText: "Delete", danger: true });
    if (!ok) return;
    DB.writeAll("tripExpenses", getRows().filter(r => r.tripExpId !== id));
    Toast.success("Trip expense deleted successfully!");
    if (editingId === id) clearForm();
    renderTable();
  }

  function doSave() {
    const tripId = Number(qs("#f_tripId").value);
    const date = qs("#f_date").value;
    if (!tripId) { Toast.warning("Please select a trip."); return; }
    if (!date) { Toast.warning("Please select a date."); return; }

    const generalNotes = notesEl().value.trim();
    const entries = [
      { type: "FUEL", amount: Number(fuelEl().value) || 0, description: combineDescription("", generalNotes) },
      { type: "PARKING", amount: Number(parkEl().value) || 0, description: combineDescription("", generalNotes) },
      { type: "OTHERS", amount: Number(otherEl().value) || 0, description: combineDescription(otherDescEl().value.trim(), generalNotes) }
    ].filter(e => e.amount > 0);

    if (entries.length === 0) {
      Toast.warning("Enter at least one amount (Fuel, Parking, or Other) before saving.");
      return;
    }
    const otherHasAmount = Number(otherEl().value) > 0;
    if (otherHasAmount && !otherDescEl().value.trim()) {
      Toast.warning('Please describe what the "Other" expense is for.');
      return;
    }

    const rows = getRows();
    entries.forEach(e => {
      rows.push({
        tripExpId: DB.nextId("tripExpenses"),
        tripId, tripExpType: e.type, amount: e.amount, description: e.description, date,
        createdBy: Session.currentUser().userId
      });
    });
    DB.writeAll("tripExpenses", rows);
    Toast.success(`Saved ${entries.length} expense${entries.length === 1 ? "" : "s"} for this trip!`);
    clearForm();
    renderTable();
  }

  function doUpdate() {
    if (!editingId) return;
    const tripId = Number(qs("#f_tripId").value);
    const date = qs("#f_date").value;
    if (!tripId || !date) { Toast.warning("Trip and date are required."); return; }

    const rows = getRows();
    const idx = rows.findIndex(r => r.tripExpId === editingId);
    if (idx < 0) return;
    const type = rows[idx].tripExpType;
    let amount;
    if (type === "FUEL") amount = Number(fuelEl().value) || 0;
    else if (type === "PARKING") amount = Number(parkEl().value) || 0;
    else amount = Number(otherEl().value) || 0;

    if (amount <= 0) { Toast.warning("Amount must be a positive number."); return; }
    const description = otherDescEl().value.trim();
    if (type === "OTHERS" && !description) { Toast.warning('Please add a description for this "Other" expense.'); return; }

    rows[idx] = { ...rows[idx], tripId, date, amount, description };
    DB.writeAll("tripExpenses", rows);
    Toast.success("Trip expense updated successfully!");
    clearForm();
    renderTable();
  }

  function exportCsv() {
    const rows = getRows();
    if (rows.length === 0) { Toast.warning("No data to export!"); return; }
    const headers = ["ID", "Trip", "Type", "Amount", "Date", "Note"];
    const lines = [headers.join(",")];
    rows.forEach(r => {
      const t = Q.trip(r.tripId);
      const tripLabel = t ? `#${r.tripId} (${t.startLocation} -> ${t.endLocation})` : `#${r.tripId}`;
      lines.push([r.tripExpId, tripLabel, r.tripExpType, r.amount, r.date, r.description || ""].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `tripExpenses_export_${DB.today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.success("CSV exported!");
  }

  qs("#btnSave").addEventListener("click", doSave);
  qs("#btnUpdate").addEventListener("click", doUpdate);
  qs("#btnDelete").addEventListener("click", () => editingId && doDelete(editingId));
  qs("#btnReset").addEventListener("click", clearForm);
  qs("#btnRefresh").addEventListener("click", () => { qs("#searchBox").value = ""; renderTable(); });
  qs("#btnExport").addEventListener("click", exportCsv);
  qs("#searchBox").addEventListener("input", debounce(renderTable, 200));

  clearForm();
  renderTable();
}
