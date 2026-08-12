/* pages/trips.js — Manage Trip + employee assignment (mirrors ManageTripController) */
function renderTripsPage(container) {
  let editingId = null;

  const busOptions = () => DB.readAll("buses").map(b => `<option value="${b.busId}">${b.busId} — ${b.busNumber} (${b.busType})</option>`).join("");

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h2>Manage Trip</h2>
        <p class="muted">Log every trip, its route, income, and assign the crew.</p>
      </div>
    </div>

    <div class="card form-card">
      <div class="form-grid">
        <div class="form-field">
          <label>Trip Category <span class="req">*</span></label>
          <select id="f_tripCategory" required>
            <option value="">Select...</option>
            <option value="ROUTE">ROUTE</option>
            <option value="SCHOOL_SERVICE">SCHOOL_SERVICE</option>
            <option value="OFFICE_SERVICE">OFFICE_SERVICE</option>
            <option value="PRIVATE_TRIP">PRIVATE_TRIP</option>
          </select>
        </div>
        <div class="form-field">
          <label>Bus <span class="req">*</span></label>
          <select id="f_busId" required><option value="">Select...</option>${busOptions()}</select>
        </div>
        <div class="form-field">
          <label>Start Location <span class="req">*</span></label>
          <input type="text" id="f_startLocation" required />
        </div>
        <div class="form-field">
          <label>End Location <span class="req">*</span></label>
          <input type="text" id="f_endLocation" required />
        </div>
        <div class="form-field">
          <label>Distance (km)</label>
          <input type="number" step="0.01" id="f_distance" />
        </div>
        <div class="form-field">
          <label>Total Income (Rs.) <span class="req">*</span></label>
          <input type="number" step="0.01" id="f_totalIncome" required />
        </div>
        <div class="form-field">
          <label>Trip Date <span class="req">*</span></label>
          <input type="date" id="f_tripDate" required />
        </div>
        <div class="form-field form-field--wide">
          <label>Description</label>
          <textarea id="f_description" rows="2"></textarea>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn--primary" id="btnSave">Save</button>
        <button class="btn btn--secondary" id="btnUpdate" disabled>Update</button>
        <button class="btn btn--danger" id="btnDelete" disabled>Delete</button>
        <button class="btn btn--ghost" id="btnReset">Reset</button>
      </div>
    </div>

    <div class="card">
      <div class="table-toolbar">
        <div class="search-box">${icon("search", "search-ic")}<input type="text" id="searchBox" placeholder="Search trips..." /></div>
        <div class="table-toolbar__right">
          <span class="pill" id="rowCount">0 records</span>
          <div class="view-toggle">
            <button id="viewTableBtn" class="active">Table</button>
            <button id="viewCalendarBtn">Calendar</button>
          </div>
          <button class="btn btn--ghost btn--sm" id="btnRefresh">Refresh</button>
        </div>
      </div>
      <div class="table-wrap" id="tableViewWrap">
        <table class="data-table" id="dataTable">
          <thead><tr><th>ID</th><th>Category</th><th>Bus</th><th>Route</th><th>Distance</th><th>Income</th><th>Date</th><th>Crew</th><th class="col-actions">Actions</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <div id="calendarViewWrap" style="display:none"></div>
    </div>`;

  function readForm() {
    return {
      tripCategory: qs("#f_tripCategory").value,
      busId: Number(qs("#f_busId").value),
      startLocation: qs("#f_startLocation").value.trim(),
      endLocation: qs("#f_endLocation").value.trim(),
      distance: qs("#f_distance").value === "" ? null : Number(qs("#f_distance").value),
      totalIncome: Number(qs("#f_totalIncome").value),
      tripDate: qs("#f_tripDate").value,
      description: qs("#f_description").value.trim()
    };
  }

  function fillForm(t) {
    qs("#f_tripCategory").value = t.tripCategory || "";
    qs("#f_busId").value = t.busId || "";
    qs("#f_startLocation").value = t.startLocation || "";
    qs("#f_endLocation").value = t.endLocation || "";
    qs("#f_distance").value = t.distance ?? "";
    qs("#f_totalIncome").value = t.totalIncome ?? "";
    qs("#f_tripDate").value = t.tripDate || "";
    qs("#f_description").value = t.description || "";
  }

  function clearForm() {
    editingId = null;
    ["f_tripCategory", "f_busId", "f_startLocation", "f_endLocation", "f_distance", "f_totalIncome", "f_tripDate", "f_description"].forEach(id => qs("#" + id).value = "");
    qs("#btnSave").disabled = false;
    qs("#btnUpdate").disabled = true;
    qs("#btnDelete").disabled = true;
    qsa("#dataTable tbody tr").forEach(r => r.classList.remove("row-selected"));
  }

  function validate(data) {
    if (Validate.isEmpty(data.tripCategory)) { Toast.warning("Please select a trip category."); return false; }
    if (!data.busId) { Toast.warning("Please select a bus."); return false; }
    if (Validate.isEmpty(data.startLocation) || Validate.isEmpty(data.endLocation)) { Toast.warning("Start and end locations are required."); return false; }
    if (!Validate.isPositiveNumber(data.totalIncome)) { Toast.warning("Total income must be a positive number."); return false; }
    if (Validate.isEmpty(data.tripDate)) { Toast.warning("Trip date is required."); return false; }
    if (data.distance !== null && !Validate.isNonNegativeNumber(data.distance)) { Toast.warning("Distance cannot be negative."); return false; }
    return true;
  }

  function crewSummary(tripId) {
    const list = DB.readAll("tripEmployees").filter(te => te.tripId === tripId);
    if (list.length === 0) return `<span class="muted">Unassigned</span>`;
    return list.map(te => `<span class="chip">${Fmt.escapeHtml(Q.empName(te.empId))} <em>(${te.roleInTrip})</em></span>`).join(" ");
  }

  function renderTable() {
    let rows = DB.readAll("trips");
    const term = qs("#searchBox").value.trim().toLowerCase();
    if (term) {
      rows = rows.filter(t =>
        (t.tripCategory || "").toLowerCase().includes(term) ||
        (t.startLocation || "").toLowerCase().includes(term) ||
        (t.endLocation || "").toLowerCase().includes(term) ||
        Q.busNumber(t.busId).toLowerCase().includes(term)
      );
    }
    rows = [...rows].sort((a, b) => b.tripDate.localeCompare(a.tripDate) || b.tripId - a.tripId);

    const tbody = qs("#dataTable tbody");
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9"><div class="table-empty"><div class="table-empty__icon">${EMPTY_STATE_ICON}</div>No trips logged yet — add your first trip above.</div></td></tr>`;
    } else {
      tbody.innerHTML = rows.map(t => `
        <tr data-id="${t.tripId}">
          <td>${t.tripId}</td>
          <td><span class="badge badge--blue">${t.tripCategory}</span></td>
          <td>${Q.busNumber(t.busId)}</td>
          <td>${Fmt.escapeHtml(t.startLocation)} → ${Fmt.escapeHtml(t.endLocation)}</td>
          <td>${t.distance ? t.distance + " km" : "-"}</td>
          <td>${Fmt.money(t.totalIncome)}</td>
          <td>${Fmt.date(t.tripDate)}</td>
          <td>${crewSummary(t.tripId)}</td>
          <td class="col-actions">
            <button class="icon-btn icon-btn--print" data-act="print" title="Print Receipt">🖨</button>
            <button class="icon-btn" data-act="crew" title="Assign Crew">👥</button>
            <button class="icon-btn" data-act="edit" title="Edit">✎</button>
            <button class="icon-btn icon-btn--danger" data-act="del" title="Delete">🗑</button>
          </td>
        </tr>`).join("");
    }
    qs("#rowCount").textContent = `${rows.length} record${rows.length === 1 ? "" : "s"}`;

    qsa("#dataTable tbody tr[data-id]").forEach(tr => {
      const id = Number(tr.dataset.id);
      tr.addEventListener("click", (e) => { if (!e.target.closest("[data-act]")) selectRow(id); });
      tr.querySelector('[data-act="edit"]').addEventListener("click", () => selectRow(id));
      tr.querySelector('[data-act="del"]').addEventListener("click", () => doDelete(id));
      tr.querySelector('[data-act="crew"]').addEventListener("click", () => openCrewModal(id));
      tr.querySelector('[data-act="print"]').addEventListener("click", () => {
        const t = DB.readAll("trips").find(x => x.tripId === id);
        const crew = DB.readAll("tripEmployees").filter(te => te.tripId === id).map(te => `${Q.empName(te.empId)} (${te.roleInTrip})`).join(", ");
        PrintReceipt.tripReceipt(t, Q.busNumber(t.busId), crew);
      });
    });
  }

  function selectRow(id) {
    const t = DB.readAll("trips").find(x => x.tripId === id);
    if (!t) return;
    editingId = id;
    fillForm(t);
    qs("#btnSave").disabled = true;
    qs("#btnUpdate").disabled = false;
    qs("#btnDelete").disabled = false;
    qsa("#dataTable tbody tr").forEach(r => r.classList.toggle("row-selected", Number(r.dataset.id) === id));
  }

  async function doDelete(id) {
    const hasExpenses = DB.readAll("tripExpenses").some(e => e.tripId === id);
    const hasSalary = DB.readAll("employeeSalaries").some(s => s.tripId === id);
    if (hasExpenses || hasSalary) { Toast.error("Cannot delete this trip — it has linked expenses or salary records."); return; }
    const ok = await confirmDialog({ title: "Delete Trip", message: "This will also remove crew assignments for this trip. Continue?", okText: "Delete", danger: true });
    if (!ok) return;
    DB.writeAll("trips", DB.readAll("trips").filter(t => t.tripId !== id));
    DB.writeAll("tripEmployees", DB.readAll("tripEmployees").filter(te => te.tripId !== id));
    Toast.success("Trip deleted successfully!");
    if (editingId === id) clearForm();
    renderTable();
  }

  function openCrewModal(tripId) {
    const trip = DB.readAll("trips").find(t => t.tripId === tripId);
    const employees = DB.readAll("employees").filter(e => e.empStatus === "ACTIVE");
    const currentCrew = DB.readAll("tripEmployees").filter(te => te.tripId === tripId);
    const drivers = currentCrew.filter(te => te.roleInTrip === "DRIVER").sort((a, b) => a.tripEmpId - b.tripEmpId);

    const SLOTS = [
      { key: "driver1", label: "Driver 1", role: "DRIVER", existing: drivers[0] || null },
      { key: "driver2", label: "Driver 2", sub: "optional — for trips needing two drivers", role: "DRIVER", existing: drivers[1] || null },
      { key: "conductor", label: "Conductor", role: "CONDUCTOR", existing: currentCrew.find(te => te.roleInTrip === "CONDUCTOR") || null },
      { key: "helper", label: "Helper", role: "HELPER", existing: currentCrew.find(te => te.roleInTrip === "HELPER") || null },
      { key: "cleaner", label: "Cleaner", role: "CLEANER", existing: currentCrew.find(te => te.roleInTrip === "CLEANER") || null }
    ];

    function empSuggestions(term) {
      const t = term.trim().toLowerCase();
      if (!t) return [];
      return employees.filter(e => e.empName.toLowerCase().includes(t)).slice(0, 8);
    }

    openModal({
      title: `Assign Crew — Trip #${tripId} (${trip.startLocation} → ${trip.endLocation})`,
      size: "modal--lg",
      bodyHtml: `
        <div class="form-grid">
          ${SLOTS.map(s => `
            <div class="form-field">
              <label>${s.label}${s.sub ? ` <span class="muted" style="font-weight:400;">(${s.sub})</span>` : ""}</label>
              <div class="autocomplete-wrap">
                <input type="text" id="slot_${s.key}_display" value="${s.existing ? Fmt.escapeHtml(Q.empName(s.existing.empId)) : ""}" placeholder="Type a name to search..." autocomplete="off" />
                <input type="hidden" id="slot_${s.key}_id" value="${s.existing ? s.existing.empId : ""}" />
                <div class="autocomplete-list" id="slot_${s.key}_list"></div>
              </div>
            </div>`).join("")}
        </div>`,
      footerHtml: `<button class="btn btn--ghost" data-act="x">Close</button><button class="btn btn--primary" id="btnSaveCrew">Save Crew</button>`,
      onMount(overlay) {
        SLOTS.forEach(s => {
          const input = qs(`#slot_${s.key}_display`, overlay);
          const hidden = qs(`#slot_${s.key}_id`, overlay);
          const list = qs(`#slot_${s.key}_list`, overlay);

          function renderSuggestions() {
            const matches = empSuggestions(input.value);
            if (!input.value.trim()) { list.classList.remove("show"); list.innerHTML = ""; hidden.value = ""; return; }
            list.innerHTML = matches.length === 0
              ? `<div class="autocomplete-empty">No matching employee found.</div>`
              : matches.map((e, i) => `
                <div class="autocomplete-item" data-idx="${i}">
                  <div class="autocomplete-item__title">${Fmt.escapeHtml(e.empName)}</div>
                  <div class="autocomplete-item__sub">${e.empCategory} · ${e.contactNo}</div>
                </div>`).join("");
            qsa(".autocomplete-item", list).forEach(el => {
              el.addEventListener("mousedown", (e) => {
                e.preventDefault();
                const picked = matches[Number(el.dataset.idx)];
                input.value = picked.empName;
                hidden.value = picked.empId;
                list.classList.remove("show");
              });
            });
            list.classList.add("show");
          }
          function clearHiddenIfInvalid() {
            const match = employees.find(e => e.empName === input.value);
            hidden.value = match ? match.empId : "";
          }
          input.addEventListener("input", debounce(renderSuggestions, 100));
          input.addEventListener("focus", renderSuggestions);
          input.addEventListener("blur", () => setTimeout(() => { list.classList.remove("show"); clearHiddenIfInvalid(); }, 120));
        });

        qs("#btnSaveCrew", overlay).addEventListener("click", () => {
          let all = DB.readAll("tripEmployees");
          let changed = 0;
          SLOTS.forEach(s => {
            const hiddenVal = qs(`#slot_${s.key}_id`, overlay).value;
            const newEmpId = hiddenVal ? Number(hiddenVal) : null;
            const existingRec = s.existing;

            if (!newEmpId && existingRec) {
              all = all.filter(te => te.tripEmpId !== existingRec.tripEmpId);
              changed++;
            } else if (newEmpId && !existingRec) {
              all.push({ tripEmpId: DB.nextId("tripEmployees"), tripId, empId: newEmpId, roleInTrip: s.role, assignedDate: DB.nowISO(), createdBy: Session.currentUser().userId });
              changed++;
            } else if (newEmpId && existingRec && existingRec.empId !== newEmpId) {
              const idx = all.findIndex(te => te.tripEmpId === existingRec.tripEmpId);
              if (idx >= 0) all[idx] = { ...all[idx], empId: newEmpId };
              changed++;
            }
          });
          DB.writeAll("tripEmployees", all);
          if (changed > 0) Toast.success("Crew updated!");
          else Toast.info("No changes to save.");
          renderTable();
        });
      }
    });
  }

  qs("#btnSave").addEventListener("click", () => {
    const data = readForm();
    if (!validate(data)) return;
    const rows = DB.readAll("trips");
    rows.push({ tripId: DB.nextId("trips"), ...data, createdBy: Session.currentUser().userId });
    DB.writeAll("trips", rows);
    Toast.success("Trip saved successfully!");
    clearForm();
    renderTable();
  });

  qs("#btnUpdate").addEventListener("click", () => {
    if (!editingId) return;
    const data = readForm();
    if (!validate(data)) return;
    const rows = DB.readAll("trips");
    const idx = rows.findIndex(t => t.tripId === editingId);
    rows[idx] = { ...rows[idx], ...data };
    DB.writeAll("trips", rows);
    Toast.success("Trip updated successfully!");
    clearForm();
    renderTable();
  });

  qs("#btnDelete").addEventListener("click", () => editingId && doDelete(editingId));
  qs("#btnReset").addEventListener("click", clearForm);
  qs("#btnRefresh").addEventListener("click", () => { qs("#searchBox").value = ""; renderTable(); });
  qs("#searchBox").addEventListener("input", debounce(renderTable, 200));

  /* ---- Calendar view (additive; table view + all CRUD above is unchanged) ---- */
  let calendarCursor = new Date();
  calendarCursor.setDate(1);

  function renderCalendar() {
    const host = qs("#calendarViewWrap");
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const monthLabel = calendarCursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = DB.today();

    const trips = DB.readAll("trips");
    const byDate = {};
    trips.forEach(t => { (byDate[t.tripDate] = byDate[t.tripDate] || []).push(t); });

    let cells = "";
    for (let i = 0; i < firstDow; i++) cells += `<div class="calendar-cell empty"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayTrips = byDate[dateStr] || [];
      const isToday = dateStr === todayStr;
      cells += `
        <div class="calendar-cell ${isToday ? "today" : ""}" data-date="${dateStr}">
          <span class="calendar-cell__num">${d}</span>
          ${dayTrips.length ? `<span class="calendar-cell__badge">${dayTrips.length} trip${dayTrips.length === 1 ? "" : "s"}</span>` : ""}
        </div>`;
    }

    host.innerHTML = `
      <div class="calendar-head">
        <h3>${monthLabel}</h3>
        <div class="calendar-nav">
          <button class="btn btn--ghost btn--sm" id="calPrev">‹ Prev</button>
          <button class="btn btn--ghost btn--sm" id="calToday">Today</button>
          <button class="btn btn--ghost btn--sm" id="calNext">Next ›</button>
        </div>
      </div>
      <div class="calendar-grid">
        ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => `<div class="calendar-dow">${d}</div>`).join("")}
        ${cells}
      </div>`;

    qs("#calPrev").addEventListener("click", () => { calendarCursor.setMonth(calendarCursor.getMonth() - 1); renderCalendar(); });
    qs("#calNext").addEventListener("click", () => { calendarCursor.setMonth(calendarCursor.getMonth() + 1); renderCalendar(); });
    qs("#calToday").addEventListener("click", () => { calendarCursor = new Date(); calendarCursor.setDate(1); renderCalendar(); });

    qsa(".calendar-cell[data-date]").forEach(cell => {
      cell.addEventListener("click", () => {
        // Jump back to table view, filtered to that day's trips.
        const date = cell.dataset.date;
        qs("#viewTableBtn").click();
        renderTableFilteredByDate(date);
      });
    });
  }

  function renderTableFilteredByDate(dateStr) {
    let rows = DB.readAll("trips").filter(t => t.tripDate === dateStr);
    rows = [...rows].sort((a, b) => b.tripId - a.tripId);
    const tbody = qs("#dataTable tbody");
    tbody.innerHTML = rows.length === 0
      ? `<tr><td colspan="9"><div class="table-empty"><div class="table-empty__icon">${EMPTY_STATE_ICON}</div>No trips on ${Fmt.date(dateStr)}.</div></td></tr>`
      : rows.map(t => `
        <tr data-id="${t.tripId}">
          <td>${t.tripId}</td>
          <td><span class="badge badge--blue">${t.tripCategory}</span></td>
          <td>${Q.busNumber(t.busId)}</td>
          <td>${Fmt.escapeHtml(t.startLocation)} → ${Fmt.escapeHtml(t.endLocation)}</td>
          <td>${t.distance ? t.distance + " km" : "-"}</td>
          <td>${Fmt.money(t.totalIncome)}</td>
          <td>${Fmt.date(t.tripDate)}</td>
          <td>${crewSummary(t.tripId)}</td>
          <td class="col-actions">
            <button class="icon-btn icon-btn--print" data-act="print" title="Print Receipt">🖨</button>
            <button class="icon-btn" data-act="crew" title="Assign Crew">👥</button>
            <button class="icon-btn" data-act="edit" title="Edit">✎</button>
            <button class="icon-btn icon-btn--danger" data-act="del" title="Delete">🗑</button>
          </td>
        </tr>`).join("");
    qs("#rowCount").textContent = `${rows.length} record${rows.length === 1 ? "" : "s"} on ${Fmt.date(dateStr)}`;
    qsa("#dataTable tbody tr[data-id]").forEach(tr => {
      const id = Number(tr.dataset.id);
      tr.addEventListener("click", (e) => { if (!e.target.closest("[data-act]")) selectRow(id); });
      tr.querySelector('[data-act="edit"]').addEventListener("click", () => selectRow(id));
      tr.querySelector('[data-act="del"]').addEventListener("click", () => doDelete(id));
      tr.querySelector('[data-act="crew"]').addEventListener("click", () => openCrewModal(id));
      tr.querySelector('[data-act="print"]').addEventListener("click", () => {
        const t = DB.readAll("trips").find(x => x.tripId === id);
        const crew = DB.readAll("tripEmployees").filter(te => te.tripId === id).map(te => `${Q.empName(te.empId)} (${te.roleInTrip})`).join(", ");
        PrintReceipt.tripReceipt(t, Q.busNumber(t.busId), crew);
      });
    });
  }

  qs("#viewTableBtn").addEventListener("click", () => {
    qs("#viewTableBtn").classList.add("active");
    qs("#viewCalendarBtn").classList.remove("active");
    qs("#tableViewWrap").style.display = "";
    qs("#calendarViewWrap").style.display = "none";
  });
  qs("#viewCalendarBtn").addEventListener("click", () => {
    qs("#viewCalendarBtn").classList.add("active");
    qs("#viewTableBtn").classList.remove("active");
    qs("#tableViewWrap").style.display = "none";
    qs("#calendarViewWrap").style.display = "";
    renderCalendar();
  });

  clearForm();
  renderTable();
}
