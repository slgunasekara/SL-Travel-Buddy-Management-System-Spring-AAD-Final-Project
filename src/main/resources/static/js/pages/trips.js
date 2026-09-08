async function renderTripsPage(container) {
    let editingId = null;


    let tripsCache = [];
    let tripEmployeesCache = [];

    async function refreshTripsData() {
        try {
            const [tRes, teRes] = await Promise.all([
                apiRequest("GET", "/v1/trip/all"),
                apiRequest("GET", "/v1/trip-employee/all")
            ]);
            tripsCache = tRes.body || [];
            tripEmployeesCache = teRes.body || [];
        } catch (err) {
            Toast.error(apiErrorMessage(err, "Failed to load trips."));
        }
    }

    await refreshTripsData();


    let busesCache = [];
    let employeesCache = [];

    async function refreshLookups() {
        try {
            const [bRes, eRes] = await Promise.all([
                apiRequest("GET", "/v1/bus/all"),
                apiRequest("GET", "/v1/employee/all")
            ]);
            busesCache = bRes.body || [];
            employeesCache = eRes.body || [];
        } catch (err) {
            Toast.error(apiErrorMessage(err, "Failed to load buses/employees."));
        }
    }

    await refreshLookups();

    const busOptions = () => busesCache.map(b => `<option value="${b.busId}">${b.busId} — ${b.busNumber} (${b.busType})${b.routePermitNo ? "" : " — charter only, no permit"}</option>`).join("");

    function busNumber(busId) {
        const b = busesCache.find(x => x.busId === busId);
        return b ? Fmt.escapeHtml(b.busNumber) : "-";
    }

    function empName(empId) {
        const e = employeesCache.find(x => x.empId === empId);
        return e ? Fmt.escapeHtml(e.empName) : "-";
    }


    const CREW_SLOTS_DEF = [
        {key: "driver1", label: "Driver 1", role: "DRIVER1", category: "DRIVER"},
        {
            key: "driver2",
            label: "Driver 2",
            sub: "optional — for trips needing two drivers",
            role: "DRIVER2",
            category: "DRIVER"
        },
        {key: "conductor", label: "Conductor", role: "CONDUCTOR", category: "CONDUCTOR"},
        {key: "helper", label: "Helper", role: "HELPER", category: "HELPER"},
        {key: "cleaner", label: "Cleaner", role: "CLEANER", category: "CLEANER"}
    ];

    function activeEmployees() {
        return employeesCache.filter(e => e.empStatus === "ACTIVE");
    }

    function matchesCategory(emp, category) {
        return emp.empCategory === category || emp.empCategory2 === category;
    }

    function empSuggestions(term, category) {
        const t = term.trim().toLowerCase();
        if (!t) return [];
        return activeEmployees()
            .filter(e => e.empName.toLowerCase().includes(t) && matchesCategory(e, category))
            .slice(0, 8);
    }


    function crewSlotsHtml(prefix, existingByRole) {
        return `<div class="form-grid">${CREW_SLOTS_DEF.map(s => {
            const existing = existingByRole ? existingByRole[s.role] : null;
            return `
        <div class="form-field">
          <label>${s.label}${s.role === "DRIVER1" ? ' <span class="req">*</span>' : ""}${s.sub ? ` <span class="muted" style="font-weight:400;">(${s.sub})</span>` : ""}</label>
          <div class="autocomplete-wrap">
            <input type="text" id="${prefix}_${s.key}_display" value="${existing ? empName(existing.empId) : ""}" placeholder="Type a name to search..." autocomplete="off" />
            <input type="hidden" id="${prefix}_${s.key}_id" value="${existing ? existing.empId : ""}" />
            <div class="autocomplete-list" id="${prefix}_${s.key}_list"></div>
          </div>
        </div>`;
        }).join("")}</div>`;
    }


    function wireCrewSlots(root, prefix) {
        CREW_SLOTS_DEF.forEach(s => {
            const input = qs(`#${prefix}_${s.key}_display`, root);
            const hidden = qs(`#${prefix}_${s.key}_id`, root);
            const list = qs(`#${prefix}_${s.key}_list`, root);
            if (!input) return;

            function renderSuggestions() {
                const matches = empSuggestions(input.value, s.category);
                if (!input.value.trim()) {
                    list.classList.remove("show");
                    list.innerHTML = "";
                    hidden.value = "";
                    return;
                }
                list.innerHTML = matches.length === 0
                    ? `<div class="autocomplete-empty">No matching ${s.category.toLowerCase()} found for "${Fmt.escapeHtml(input.value)}".</div>`
                    : matches.map((e, i) => `
            <div class="autocomplete-item" data-idx="${i}">
              <div class="autocomplete-item__title">${Fmt.escapeHtml(e.empName)}</div>
              <div class="autocomplete-item__sub">${e.empCategory}${e.empCategory2 ? " / " + e.empCategory2 : ""} · ${e.contactNo}</div>
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
                const match = activeEmployees().find(e => e.empName === input.value && matchesCategory(e, s.category));
                hidden.value = match ? match.empId : "";
                if (input.value.trim() && !match) input.value = "";
            }

            input.addEventListener("input", debounce(renderSuggestions, 100));
            input.addEventListener("focus", renderSuggestions);
            input.addEventListener("blur", () => setTimeout(() => {
                list.classList.remove("show");
                clearHiddenIfInvalid();
            }, 120));
        });
    }


    function readCrewSlots(root, prefix) {
        return CREW_SLOTS_DEF.map(s => ({
            slot: s,
            empId: qs(`#${prefix}_${s.key}_id`, root).value ? Number(qs(`#${prefix}_${s.key}_id`, root).value) : null
        }));
    }

    function resetCrewSlots(root, prefix) {
        CREW_SLOTS_DEF.forEach(s => {
            const input = qs(`#${prefix}_${s.key}_display`, root);
            const hidden = qs(`#${prefix}_${s.key}_id`, root);
            if (input) input.value = "";
            if (hidden) hidden.value = "";
        });
    }


    function validateCrewPicks(picks) {
        const filled = picks.filter(p => p.empId !== null);
        const seen = new Map();
        for (const p of filled) {
            if (seen.has(p.empId)) {
                return `${empName(p.empId)} is assigned to both ${seen.get(p.empId)} and ${p.slot.label} — pick a different person for one of them.`;
            }
            seen.set(p.empId, p.slot.label);
        }
        const hasDriver = filled.some(p => p.slot.role === "DRIVER1" || p.slot.role === "DRIVER2");
        if (!hasDriver) {
            return "This trip needs at least one driver — fill in Driver 1 or Driver 2 before saving.";
        }
        return null;
    }

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
          <span class="muted" id="routeLockHint" style="font-size:11.5px; display:none;"></span>
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
      <div class="form-actions" style="margin-bottom:0;">
        <span class="muted" style="font-size:12px;">Assign the crew below — at least one <strong>driver</strong> (Driver 1 or Driver 2) is required before this trip can be saved.</span>
      </div>
      <div class="card" id="crewSubCard" style="margin:8px 0 0; background:var(--surface-2, #f8f9fb);">
        ${crewSlotsHtml("new", null)}
      </div>

      <div class="form-actions">
        <button class="btn btn--primary" id="btnSave">Save Trip + Crew</button>
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

    wireCrewSlots(container, "new");


    function applyRouteLock() {
        const category = qs("#f_tripCategory").value;
        const startEl = qs("#f_startLocation");
        const endEl = qs("#f_endLocation");
        const hint = qs("#routeLockHint");

        if (category !== "ROUTE") {
            startEl.readOnly = false;
            endEl.readOnly = false;
            startEl.placeholder = "";
            endEl.placeholder = "";
            hint.style.display = "none";
            return;
        }

        const bus = busesCache.find(b => b.busId === Number(qs("#f_busId").value));
        startEl.readOnly = true;
        endEl.readOnly = true;

        if (bus && bus.permitStartLocation && bus.permitEndLocation) {
            startEl.value = bus.permitStartLocation;
            endEl.value = bus.permitEndLocation;
            hint.textContent = `Locked to ${bus.busNumber}'s Route Permit (${bus.routePermitNo || "no permit no. on file"}).`;
            hint.style.display = "";
        } else {
            startEl.value = "";
            endEl.value = "";
            startEl.placeholder = bus ? "This bus has no Route Permit set" : "Select a bus first";
            endEl.placeholder = startEl.placeholder;
            hint.textContent = bus
                ? `${bus.busNumber} has no Route Permit — add one in Manage Bus first, or choose a different trip category.`
                : "";
            hint.style.display = bus ? "" : "none";
        }
    }

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
        applyRouteLock();
    }

    function clearForm() {
        editingId = null;
        ["f_tripCategory", "f_busId", "f_startLocation", "f_endLocation", "f_distance", "f_totalIncome", "f_tripDate", "f_description"].forEach(id => qs("#" + id).value = "");
        applyRouteLock();
        resetCrewSlots(container, "new");
        qs("#crewSubCard").style.display = "";
        qs("#btnSave").style.display = "";
        qs("#btnSave").disabled = false;
        qs("#btnUpdate").disabled = true;
        qs("#btnDelete").disabled = true;
        qsa("#dataTable tbody tr").forEach(r => r.classList.remove("row-selected"));
    }

    function validate(data) {
        if (Validate.isEmpty(data.tripCategory)) {
            Toast.warning("Please select a trip category.");
            return false;
        }
        if (!data.busId) {
            Toast.warning("Please select a bus.");
            return false;
        }
        if (data.tripCategory === "ROUTE") {
            const bus = busesCache.find(b => b.busId === data.busId);
            if (!bus || !bus.permitStartLocation || !bus.permitEndLocation) {
                Toast.warning("This bus doesn't have a Route Permit set. Add one in Manage Bus first, or pick a different trip category.");
                return false;
            }
        }
        if (Validate.isEmpty(data.startLocation) || Validate.isEmpty(data.endLocation)) {
            Toast.warning("Start and end locations are required.");
            return false;
        }
        if (!Validate.isPositiveNumber(data.totalIncome)) {
            Toast.warning("Total income must be a positive number.");
            return false;
        }
        if (Validate.isEmpty(data.tripDate)) {
            Toast.warning("Trip date is required.");
            return false;
        }
        if (data.distance !== null && !Validate.isNonNegativeNumber(data.distance)) {
            Toast.warning("Distance cannot be negative.");
            return false;
        }
        return true;
    }

    function roleLabel(role) {
        const map = {
            DRIVER1: "Driver 1",
            DRIVER2: "Driver 2",
            CONDUCTOR: "Conductor",
            HELPER: "Helper",
            CLEANER: "Cleaner"
        };
        return map[role] || role;
    }

    function crewSummary(tripId) {
        const list = tripEmployeesCache.filter(te => te.tripId === tripId);
        if (list.length === 0) return `<span class="muted">Unassigned</span>`;
        return list.map(te => `<span class="chip">${empName(te.empId)} <em>(${roleLabel(te.roleInTrip)})</em></span>`).join(" ");
    }

    function renderTable() {
        let rows = tripsCache;
        const term = qs("#searchBox").value.trim().toLowerCase();
        if (term) {
            rows = rows.filter(t =>
                (t.tripCategory || "").toLowerCase().includes(term) ||
                (t.startLocation || "").toLowerCase().includes(term) ||
                (t.endLocation || "").toLowerCase().includes(term) ||
                busNumber(t.busId).toLowerCase().includes(term)
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
          <td>${busNumber(t.busId)}</td>
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
            tr.addEventListener("click", (e) => {
                if (!e.target.closest("[data-act]")) selectRow(id);
            });
            tr.querySelector('[data-act="edit"]').addEventListener("click", () => selectRow(id));
            tr.querySelector('[data-act="del"]').addEventListener("click", () => doDelete(id));
            tr.querySelector('[data-act="crew"]').addEventListener("click", () => openCrewModal(id));
            tr.querySelector('[data-act="print"]').addEventListener("click", () => {
                const t = tripsCache.find(x => x.tripId === id);
                const crew = tripEmployeesCache.filter(te => te.tripId === id).map(te => `${empName(te.empId)} (${roleLabel(te.roleInTrip)})`).join(", ");
                PrintReceipt.tripReceipt(t, busNumber(t.busId), crew);
            });
        });
    }

    function selectRow(id) {
        const t = tripsCache.find(x => x.tripId === id);
        if (!t) return;
        editingId = id;
        fillForm(t);
        qs("#crewSubCard").style.display = "none";
        qs("#btnSave").style.display = "none";
        qs("#btnSave").disabled = true;
        qs("#btnUpdate").disabled = false;
        qs("#btnDelete").disabled = false;
        qsa("#dataTable tbody tr").forEach(r => r.classList.toggle("row-selected", Number(r.dataset.id) === id));
    }

    async function doDelete(id) {
        const ok = await confirmDialog({
            title: "Delete Trip",
            message: "This will also remove crew assignments for this trip. Continue?",
            okText: "Delete",
            danger: true
        });
        if (!ok) return;
        try {
            const crewToRemove = tripEmployeesCache.filter(te => te.tripId === id);
            await Promise.all(crewToRemove.map(te => apiRequest("DELETE", "/v1/trip-employee/" + te.tripEmpId)));
            await apiRequest("DELETE", "/v1/trip/" + id);
            Toast.success("Trip deleted successfully!");
            await refreshTripsData();
            if (editingId === id) clearForm();
            renderTable();
        } catch (err) {

            Toast.error(apiErrorMessage(err, "Failed to delete this trip."));
        }
    }

    function openCrewModal(tripId) {
        const trip = tripsCache.find(t => t.tripId === tripId);
        const currentCrew = tripEmployeesCache.filter(te => te.tripId === tripId);
        const existingByRole = {};
        currentCrew.forEach(te => {
            existingByRole[te.roleInTrip] = te;
        });

        openModal({
            title: `Assign Crew — Trip #${tripId} (${trip.startLocation} → ${trip.endLocation})`,
            size: "modal--lg",
            bodyHtml: crewSlotsHtml("modal", existingByRole),
            footerHtml: `<button class="btn btn--ghost" data-act="x">Close</button><button class="btn btn--primary" id="btnSaveCrew">Save Crew</button>`,
            onMount(overlay, close) {
                wireCrewSlots(overlay, "modal");

                qs("#btnSaveCrew", overlay).addEventListener("click", async () => {
                    const picks = readCrewSlots(overlay, "modal");
                    const crewError = validateCrewPicks(picks);
                    if (crewError) {
                        Toast.error(crewError);
                        return;
                    }

                    const ops = [];
                    CREW_SLOTS_DEF.forEach(s => {
                        const pick = picks.find(p => p.slot.key === s.key);
                        const newEmpId = pick.empId;
                        const existingRec = existingByRole[s.role] || null;

                        if (!newEmpId && existingRec) {
                            ops.push(apiRequest("DELETE", "/v1/trip-employee/" + existingRec.tripEmpId));
                        } else if (newEmpId && !existingRec) {
                            ops.push(apiRequest("POST", "/v1/trip-employee", {
                                tripId,
                                empId: newEmpId,
                                roleInTrip: s.role,
                                assignedDate: today(),
                                createdBy: Session.currentUser().userId
                            }));
                        } else if (newEmpId && existingRec && existingRec.empId !== newEmpId) {
                            ops.push(apiRequest("PUT", "/v1/trip-employee/" + existingRec.tripEmpId, {
                                tripId,
                                empId: newEmpId,
                                roleInTrip: s.role,
                                assignedDate: existingRec.assignedDate,
                                createdBy: existingRec.createdBy
                            }));
                        }
                    });

                    if (ops.length === 0) {
                        Toast.info("No changes to save.");
                        return;
                    }
                    try {
                        await Promise.all(ops);
                        Toast.success("Crew updated!");
                        await refreshTripsData();
                        renderTable();
                        close();
                    } catch (err) {
                        Toast.error(apiErrorMessage(err, "Failed to update crew for this trip."));
                    }
                });
            }
        });
    }

    qs("#btnSave").addEventListener("click", async () => {
        const data = readForm();
        if (!validate(data)) return;

        const picks = readCrewSlots(container, "new");
        const crewError = validateCrewPicks(picks);
        if (crewError) {
            Toast.warning(crewError);
            return;
        }
        const crew = picks
            .filter(p => p.empId !== null)
            .map(p => ({
                empId: p.empId,
                roleInTrip: p.slot.role,
                assignedDate: today(),
                createdBy: Session.currentUser().userId
            }));

        const btn = qs("#btnSave");
        btn.disabled = true;
        try {

            await apiRequest("POST", "/v1/trip/with-crew", {
                trip: {...data, createdBy: Session.currentUser().userId},
                crew
            });
            await refreshTripsData();
            Toast.success("Trip and crew saved successfully!");
            clearForm();
            renderTable();
        } catch (e) {
            Toast.error(e.message || "Failed to save trip and crew.");
            btn.disabled = false;
        }
    });

    qs("#btnUpdate").addEventListener("click", async () => {
        if (!editingId) return;
        const data = readForm();
        if (!validate(data)) return;
        try {
            await apiRequest("PUT", "/v1/trip/" + editingId, data);
            Toast.success("Trip updated successfully!");
            await refreshTripsData();
            clearForm();
            renderTable();
        } catch (err) {
            Toast.error(apiErrorMessage(err, "Failed to update this trip."));
        }
    });

    qs("#btnDelete").addEventListener("click", () => editingId && doDelete(editingId));
    qs("#btnReset").addEventListener("click", clearForm);
    qs("#btnRefresh").addEventListener("click", () => {
        qs("#searchBox").value = "";
        renderTable();
    });
    qs("#searchBox").addEventListener("input", debounce(renderTable, 200));
    qs("#f_tripCategory").addEventListener("change", applyRouteLock);
    qs("#f_busId").addEventListener("change", applyRouteLock);

    /* ---- Calendar view---- */
    let calendarCursor = new Date();
    calendarCursor.setDate(1);

    function renderCalendar() {
        const host = qs("#calendarViewWrap");
        const year = calendarCursor.getFullYear();
        const month = calendarCursor.getMonth();
        const monthLabel = calendarCursor.toLocaleDateString("en-GB", {month: "long", year: "numeric"});
        const firstDow = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayStr = today();

        const trips = tripsCache;
        const byDate = {};
        trips.forEach(t => {
            (byDate[t.tripDate] = byDate[t.tripDate] || []).push(t);
        });

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
        ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => `<div class="calendar-dow">${d}</div>`).join("")}
        ${cells}
      </div>`;

        qs("#calPrev").addEventListener("click", () => {
            calendarCursor.setMonth(calendarCursor.getMonth() - 1);
            renderCalendar();
        });
        qs("#calNext").addEventListener("click", () => {
            calendarCursor.setMonth(calendarCursor.getMonth() + 1);
            renderCalendar();
        });
        qs("#calToday").addEventListener("click", () => {
            calendarCursor = new Date();
            calendarCursor.setDate(1);
            renderCalendar();
        });

        qsa(".calendar-cell[data-date]").forEach(cell => {
            cell.addEventListener("click", () => {
                // Jump back to table view
                const date = cell.dataset.date;
                qs("#viewTableBtn").click();
                renderTableFilteredByDate(date);
            });
        });
    }

    function renderTableFilteredByDate(dateStr) {
        let rows = tripsCache.filter(t => t.tripDate === dateStr);
        rows = [...rows].sort((a, b) => b.tripId - a.tripId);
        const tbody = qs("#dataTable tbody");
        tbody.innerHTML = rows.length === 0
            ? `<tr><td colspan="9"><div class="table-empty"><div class="table-empty__icon">${EMPTY_STATE_ICON}</div>No trips on ${Fmt.date(dateStr)}.</div></td></tr>`
            : rows.map(t => `
        <tr data-id="${t.tripId}">
          <td>${t.tripId}</td>
          <td><span class="badge badge--blue">${t.tripCategory}</span></td>
          <td>${busNumber(t.busId)}</td>
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
            tr.addEventListener("click", (e) => {
                if (!e.target.closest("[data-act]")) selectRow(id);
            });
            tr.querySelector('[data-act="edit"]').addEventListener("click", () => selectRow(id));
            tr.querySelector('[data-act="del"]').addEventListener("click", () => doDelete(id));
            tr.querySelector('[data-act="crew"]').addEventListener("click", () => openCrewModal(id));
            tr.querySelector('[data-act="print"]').addEventListener("click", () => {
                const t = tripsCache.find(x => x.tripId === id);
                const crew = tripEmployeesCache.filter(te => te.tripId === id).map(te => `${empName(te.empId)} (${roleLabel(te.roleInTrip)})`).join(", ");
                PrintReceipt.tripReceipt(t, busNumber(t.busId), crew);
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

    // Global Search "jump to record" —
    const jumpId = (typeof GlobalSearch !== "undefined") ? GlobalSearch.consumeJumpTarget("trips") : null;
    if (jumpId !== null && jumpId !== undefined) {
        qs("#viewTableBtn").classList.add("active");
        qs("#viewCalendarBtn").classList.remove("active");
        qs("#tableViewWrap").style.display = "";
        qs("#calendarViewWrap").style.display = "none";
        qs("#searchBox").value = "";
        renderTable();
        selectRow(jumpId);
        const tr = qs(`#dataTable tbody tr[data-id="${jumpId}"]`);
        if (tr) {
            tr.scrollIntoView({behavior: "smooth", block: "center"});
            tr.classList.add("jump-highlight");
            setTimeout(() => tr.classList.remove("jump-highlight"), 2500);
        }
    }
}
