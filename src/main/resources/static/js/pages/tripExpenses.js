/* pages/tripExpenses.js — Manage Trip Expenses (mirrors ManageTripExpensesController).
   Redesigned around "one row per trip": selecting a trip loads its
   existing Fuel/Parking/Other entry (if any) for editing, or starts a
   fresh one. The date is taken from the trip automatically. A button
   after the Other Amount field reveals a salary field for each of the
   trip's assigned crew slots (Driver 1/2, Conductor, Helper, Cleaner —
   matching Manage Trip's Assign Crew), so crew pay for this trip can be
   saved in the very same action. */
function renderTripExpensesPage(container) {
  const CREW_SLOTS = [
    { key: "driver1", label: "Driver 1", role: "DRIVER", index: 0 },
    { key: "driver2", label: "Driver 2", role: "DRIVER", index: 1 },
    { key: "conductor", label: "Conductor", role: "CONDUCTOR", index: 0 },
    { key: "helper", label: "Helper", role: "HELPER", index: 0 },
    { key: "cleaner", label: "Cleaner", role: "CLEANER", index: 0 }
  ];

  const tripOptions = () => DB.readAll("trips").map(t => `<option value="${t.tripId}">#${t.tripId} — ${t.startLocation} → ${t.endLocation} (${Fmt.date(t.tripDate)})</option>`).join("");

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h2>Trip Expenses</h2>
        <p class="muted">One entry per trip — fuel, parking, other costs and crew pay all saved together. The date comes from the trip.</p>
      </div>
    </div>

    <div class="card form-card">
      <div class="form-grid">
        <div class="form-field form-field--wide">
          <label>Trip <span class="req">*</span></label>
          <select id="f_tripId" required><option value="">Select a trip...</option>${tripOptions()}</select>
        </div>
      </div>
      <div class="form-grid" style="margin-top:14px">
        <div class="form-field">
          <label>Fuel Amount (Rs.)</label>
          <input type="number" step="0.01" id="f_fuelAmount" placeholder="0.00" disabled />
        </div>
        <div class="form-field">
          <label>Parking Amount (Rs.)</label>
          <input type="number" step="0.01" id="f_parkingAmount" placeholder="0.00" disabled />
        </div>
        <div class="form-field">
          <label>Other Amount (Rs.)</label>
          <input type="number" step="0.01" id="f_otherAmount" placeholder="0.00" disabled />
        </div>
        <div class="form-field form-field--wide" id="otherDescWrap">
          <label>What is the "Other" expense for? <span id="otherReqMark"></span></label>
          <input type="text" id="f_otherDescription" placeholder="Only needed if you entered an Other amount above" disabled />
        </div>
        <div class="form-field form-field--wide">
          <button type="button" class="btn btn--secondary btn--sm" id="btnToggleCrew" disabled>+ Add Crew Salaries for This Trip</button>
        </div>
        <div class="form-field form-field--wide" id="crewSalariesWrap" style="display:none;">
          <div class="form-grid" id="crewSalaryFields"></div>
        </div>
        <div class="form-field form-field--wide">
          <label>Trip Notes <span class="muted" style="font-weight:400;">(optional)</span></label>
          <textarea id="f_tripNotes" rows="2" placeholder="e.g. heavy traffic day, extra stop for repairs" disabled></textarea>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn--primary" id="btnSave" disabled>Save</button>
        <button class="btn btn--danger" id="btnDelete" disabled>Delete Entry</button>
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
          <thead><tr>
            <th>ID</th><th>Trip</th><th>Date</th><th>Fuel</th><th>Parking</th><th>Other</th>
            <th>Driver 1</th><th>Driver 2</th><th>Conductor</th><th>Helper</th><th>Cleaner</th>
            <th class="col-actions">Actions</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </div>`;

  const fuelEl = () => qs("#f_fuelAmount");
  const parkEl = () => qs("#f_parkingAmount");
  const otherEl = () => qs("#f_otherAmount");
  const otherDescEl = () => qs("#f_otherDescription");
  const notesEl = () => qs("#f_tripNotes");
  let currentTripId = null;

  otherEl().addEventListener("input", syncOtherDescState);
  function syncOtherDescState() {
    const hasOther = Number(otherEl().value) > 0;
    const mark = qs("#otherReqMark");
    if (mark) mark.innerHTML = hasOther ? '<span class="req">*</span>' : "";
  }

  function existingRowFor(tripId) {
    return DB.readAll("tripExpenses").find(r => r.tripId === tripId) || null;
  }

  function crewSlotInfo(tripId) {
    const crew = DB.readAll("tripEmployees").filter(te => te.tripId === tripId);
    const salaries = DB.readAll("employeeSalaries").filter(s => s.tripId === tripId && s.fromTripExpense);
    const driverSlots = Q.driverSlotsForTrip(tripId);
    const byRole = { CONDUCTOR: crew.find(c => c.roleInTrip === "CONDUCTOR"), HELPER: crew.find(c => c.roleInTrip === "HELPER"), CLEANER: crew.find(c => c.roleInTrip === "CLEANER") };

    function info(rec) {
      if (!rec) return null;
      const sal = salaries.find(s => s.empId === rec.empId);
      return { empId: rec.empId, name: Q.empName(rec.empId), amount: sal ? sal.amount : null };
    }
    return {
      driver1: info(driverSlots.driver1), driver2: info(driverSlots.driver2),
      conductor: info(byRole.CONDUCTOR), helper: info(byRole.HELPER), cleaner: info(byRole.CLEANER)
    };
  }

  function renderCrewSalaryFields(tripId) {
    const info = crewSlotInfo(tripId);
    const host = qs("#crewSalaryFields");
    host.innerHTML = CREW_SLOTS.map(s => {
      const slot = info[s.key];
      return `
        <div class="form-field">
          <label>${s.label} ${slot ? `<span class="muted" style="font-weight:400;">(${Fmt.escapeHtml(slot.name)})</span>` : `<span class="muted" style="font-weight:400;">(not assigned)</span>`}</label>
          <input type="number" step="0.01" class="crew-salary-input" data-slot="${s.key}" placeholder="0.00" value="${slot && slot.amount !== null ? slot.amount : ""}" ${slot ? "" : "disabled"} />
        </div>`;
    }).join("");
    return info;
  }

  function anyCrewSalarySaved(info) {
    return Object.values(info).some(s => s && s.amount !== null);
  }

  function loadTrip(tripId) {
    currentTripId = tripId;
    const enable = !!tripId;
    ["f_fuelAmount", "f_parkingAmount", "f_otherAmount", "f_otherDescription", "f_tripNotes", "btnToggleCrew", "btnSave"].forEach(id => qs("#" + id).disabled = !enable);

    if (!tripId) {
      fuelEl().value = ""; parkEl().value = ""; otherEl().value = ""; otherDescEl().value = ""; notesEl().value = "";
      qs("#crewSalariesWrap").style.display = "none";
      qs("#btnDelete").disabled = true;
      return;
    }

    const existing = existingRowFor(tripId);
    fuelEl().value = existing ? (existing.fuelAmount || "") : "";
    parkEl().value = existing ? (existing.parkingAmount || "") : "";
    otherEl().value = existing ? (existing.otherAmount || "") : "";
    otherDescEl().value = existing ? (existing.otherDescription || "") : "";
    notesEl().value = existing ? (existing.notes || "") : "";
    syncOtherDescState();
    qs("#btnDelete").disabled = !existing;

    const info = renderCrewSalaryFields(tripId);
    qs("#crewSalariesWrap").style.display = anyCrewSalarySaved(info) ? "block" : "none";
  }

  qs("#f_tripId").addEventListener("change", (e) => loadTrip(e.target.value ? Number(e.target.value) : null));

  qs("#btnToggleCrew").addEventListener("click", () => {
    const wrap = qs("#crewSalariesWrap");
    const showing = wrap.style.display !== "none";
    if (!showing) renderCrewSalaryFields(currentTripId);
    wrap.style.display = showing ? "none" : "block";
  });

  function clearForm() {
    qs("#f_tripId").value = "";
    loadTrip(null);
    qsa("#dataTable tbody tr").forEach(r => r.classList.remove("row-selected"));
  }

  function getRows() { return DB.readAll("tripExpenses"); }

  function renderTable() {
    let rows = getRows();
    const term = qs("#searchBox").value.trim().toLowerCase();
    if (term) {
      rows = rows.filter(r => {
        const t = Q.trip(r.tripId);
        return (r.notes || "").toLowerCase().includes(term) ||
          (r.otherDescription || "").toLowerCase().includes(term) ||
          String(r.tripId).includes(term) ||
          (t && `${t.startLocation} ${t.endLocation}`.toLowerCase().includes(term));
      });
    }
    rows = [...rows].sort((a, b) => (b.date || "").localeCompare(a.date || "") || b.tripExpId - a.tripExpId);

    const tbody = qs("#dataTable tbody");
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="12"><div class="table-empty"><div class="table-empty__icon">${EMPTY_STATE_ICON}</div>No trip expenses recorded yet.</div></td></tr>`;
    } else {
      tbody.innerHTML = rows.map(r => {
        const t = Q.trip(r.tripId);
        const tripLabel = t ? `#${r.tripId} (${t.startLocation} → ${t.endLocation})` : `#${r.tripId}`;
        const info = crewSlotInfo(r.tripId);
        const crewCell = (s) => s ? `${Fmt.escapeHtml(s.name)}${s.amount !== null ? `<br><strong>${Fmt.money(s.amount)}</strong>` : ""}` : "-";
        return `
        <tr data-id="${r.tripExpId}" data-trip-id="${r.tripId}">
          <td>${r.tripExpId}</td>
          <td>${tripLabel}</td>
          <td>${Fmt.date(r.date)}</td>
          <td>${r.fuelAmount ? Fmt.money(r.fuelAmount) : "-"}</td>
          <td>${r.parkingAmount ? Fmt.money(r.parkingAmount) : "-"}</td>
          <td>${r.otherAmount ? Fmt.money(r.otherAmount) : "-"}</td>
          <td>${crewCell(info.driver1)}</td>
          <td>${crewCell(info.driver2)}</td>
          <td>${crewCell(info.conductor)}</td>
          <td>${crewCell(info.helper)}</td>
          <td>${crewCell(info.cleaner)}</td>
          <td class="col-actions">
            <button class="icon-btn icon-btn--print" data-act="print" title="Print">🖨</button>
            <button class="icon-btn" data-act="edit" title="Edit">✎</button>
            <button class="icon-btn icon-btn--danger" data-act="del" title="Delete">🗑</button>
          </td>
        </tr>`;
      }).join("");
    }
    qs("#rowCount").textContent = `${rows.length} record${rows.length === 1 ? "" : "s"}`;

    qsa("#dataTable tbody tr[data-id]").forEach(tr => {
      const tripId = Number(tr.dataset.tripId);
      tr.addEventListener("click", (e) => { if (!e.target.closest("[data-act]")) selectTrip(tripId); });
      tr.querySelector('[data-act="edit"]').addEventListener("click", () => selectTrip(tripId));
      tr.querySelector('[data-act="del"]').addEventListener("click", () => doDelete(tripId));
      tr.querySelector('[data-act="print"]').addEventListener("click", () => printRow(tripId));
    });
  }

  function selectTrip(tripId) {
    qs("#f_tripId").value = tripId;
    loadTrip(tripId);
    qsa("#dataTable tbody tr").forEach(r => r.classList.toggle("row-selected", Number(r.dataset.tripId) === tripId));
    container.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function printRow(tripId) {
    const row = existingRowFor(tripId);
    if (!row) return;
    const t = Q.trip(tripId);
    const tripLabel = t ? `#${tripId} (${t.startLocation} → ${t.endLocation})` : `#${tripId}`;
    PrintReceipt.tripExpenseReceipt(row, tripLabel, crewSlotInfo(tripId));
  }

  async function doDelete(tripId) {
    const ok = await confirmDialog({ title: "Delete Trip Expense Entry", message: "This removes the fuel/parking/other costs AND any crew salaries saved through this page for this trip. Continue?", okText: "Delete", danger: true });
    if (!ok) return;
    DB.writeAll("tripExpenses", getRows().filter(r => r.tripId !== tripId));
    DB.writeAll("employeeSalaries", DB.readAll("employeeSalaries").filter(s => !(s.tripId === tripId && s.fromTripExpense)));
    Toast.success("Trip expense entry deleted.");
    if (currentTripId === tripId) clearForm();
    renderTable();
  }

  function doSave() {
    const tripId = currentTripId;
    if (!tripId) { Toast.warning("Please select a trip."); return; }
    const trip = Q.trip(tripId);
    if (!trip) { Toast.error("Selected trip could not be found."); return; }

    const fuel = Number(fuelEl().value) || 0;
    const parking = Number(parkEl().value) || 0;
    const other = Number(otherEl().value) || 0;
    const otherDesc = otherDescEl().value.trim();
    const notes = notesEl().value.trim();
    const crewInputs = qsa(".crew-salary-input").filter(el => !el.disabled);
    const anyCrewFilled = crewInputs.some(el => Number(el.value) > 0);

    if (fuel <= 0 && parking <= 0 && other <= 0 && !anyCrewFilled) {
      Toast.warning("Enter at least one amount (Fuel, Parking, Other, or a crew salary) before saving.");
      return;
    }
    if (other > 0 && !otherDesc) {
      Toast.warning('Please describe what the "Other" expense is for.');
      return;
    }

    // Upsert the wide trip-expense row.
    const rows = getRows();
    const idx = rows.findIndex(r => r.tripId === tripId);
    const rowData = {
      tripId, date: trip.tripDate,
      fuelAmount: fuel, parkingAmount: parking, otherAmount: other,
      otherDescription: other > 0 ? otherDesc : "",
      notes
    };
    if (idx >= 0) rows[idx] = { ...rows[idx], ...rowData };
    else rows.push({ tripExpId: DB.nextId("tripExpenses"), ...rowData, createdBy: Session.currentUser().userId });
    DB.writeAll("tripExpenses", rows);

    // Upsert/remove crew salary entries.
    let salaries = DB.readAll("employeeSalaries");
    let salaryChanges = 0;
    const info = crewSlotInfo(tripId);
    CREW_SLOTS.forEach(s => {
      const slot = info[s.key];
      const input = qs(`.crew-salary-input[data-slot="${s.key}"]`);
      if (!slot || !input) return;
      const amount = Number(input.value) || 0;
      const existingSalary = salaries.find(sal => sal.tripId === tripId && sal.empId === slot.empId && sal.fromTripExpense);
      if (amount > 0) {
        if (existingSalary) {
          const sidx = salaries.findIndex(sal => sal.salaryId === existingSalary.salaryId);
          salaries[sidx] = { ...salaries[sidx], amount, date: trip.tripDate };
        } else {
          salaries.push({
            salaryId: DB.nextId("employeeSalaries"), empId: slot.empId, tripId, amount, date: trip.tripDate,
            description: `${s.label} salary for Trip #${tripId}`, fromTripExpense: true,
            createdBy: Session.currentUser().userId
          });
        }
        salaryChanges++;
      } else if (existingSalary) {
        salaries = salaries.filter(sal => sal.salaryId !== existingSalary.salaryId);
        salaryChanges++;
      }
    });
    if (salaryChanges > 0) DB.writeAll("employeeSalaries", salaries);

    Toast.success("Trip expenses saved!");
    renderTable();
    loadTrip(tripId);
  }

  function exportCsv() {
    const rows = getRows();
    if (rows.length === 0) { Toast.warning("No data to export!"); return; }
    const headers = ["ID", "Trip", "Date", "Fuel", "Parking", "Other", "Other Desc", "Notes"];
    const lines = [headers.join(",")];
    rows.forEach(r => {
      const t = Q.trip(r.tripId);
      const tripLabel = t ? `#${r.tripId} (${t.startLocation} -> ${t.endLocation})` : `#${r.tripId}`;
      lines.push([r.tripExpId, tripLabel, r.date, r.fuelAmount || 0, r.parkingAmount || 0, r.otherAmount || 0, r.otherDescription || "", r.notes || ""]
        .map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
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
  qs("#btnDelete").addEventListener("click", () => currentTripId && doDelete(currentTripId));
  qs("#btnReset").addEventListener("click", clearForm);
  qs("#btnRefresh").addEventListener("click", () => { qs("#searchBox").value = ""; renderTable(); });
  qs("#btnExport").addEventListener("click", exportCsv);
  qs("#searchBox").addEventListener("input", debounce(renderTable, 200));

  clearForm();
  renderTable();
}
