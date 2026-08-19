/* pages/accidents.js — Accident records: bus, location, optional trip,
   driver, date, estimated cost, up to 3 photos. */
function renderAccidentsPage(container) {
  let editingId = null;
  let photoUrls = [null, null, null];

  const busOptions = () => DB.readAll("buses").map(b => `<option value="${b.busId}">${b.busId} — ${b.busNumber}</option>`).join("");
  const driverOptions = () => DB.readAll("employees")
    .filter(e => e.empStatus === "ACTIVE" && (e.empCategory === "DRIVER" || e.empCategory2 === "DRIVER"))
    .map(e => `<option value="${e.empId}">${Fmt.escapeHtml(e.empName)}</option>`).join("");
  const tripOptionsForBus = (busId) => DB.readAll("trips")
    .filter(t => !busId || Number(t.busId) === Number(busId))
    .map(t => `<option value="${t.tripId}">#${t.tripId} — ${Fmt.escapeHtml(t.startLocation)} → ${Fmt.escapeHtml(t.endLocation)} (${Fmt.date(t.tripDate)})</option>`).join("");

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h2>Accidents</h2>
        <p class="muted">Bus accident records — location, driver, estimated cost, and photos.</p>
      </div>
    </div>

    <div class="card form-card">
      <div class="form-grid">
        <div class="form-field">
          <label>Bus <span class="req">*</span></label>
          <select id="f_busId" required><option value="">Select...</option>${busOptions()}</select>
        </div>
        <div class="form-field">
          <label>Trip (optional)</label>
          <select id="f_tripId"><option value="">None — parked / no trip running</option>${tripOptionsForBus(null)}</select>
        </div>
        <div class="form-field">
          <label>Driver</label>
          <select id="f_driverId"><option value="">Select...</option>${driverOptions()}</select>
        </div>
        <div class="form-field">
          <label>Location <span class="req">*</span></label>
          <input type="text" id="f_location" placeholder="Where the accident happened" required />
        </div>
        <div class="form-field">
          <label>Accident Date <span class="req">*</span></label>
          <input type="date" id="f_accidentDate" required />
        </div>
        <div class="form-field">
          <label>Estimated Cost (Rs.)</label>
          <input type="number" id="f_estimatedCost" step="0.01" placeholder="Repair estimate" />
        </div>
        <div class="form-field form-field--wide">
          <label>Description</label>
          <textarea id="f_description" placeholder="What happened..."></textarea>
        </div>
      </div>

      <div class="form-grid" style="margin-top:12px;">
        <div class="form-field"><label>Photo 1</label>${photoSlotHtml(0)}</div>
        <div class="form-field"><label>Photo 2</label>${photoSlotHtml(1)}</div>
        <div class="form-field"><label>Photo 3</label>${photoSlotHtml(2)}</div>
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
        <input type="text" id="searchBox" class="search-input" placeholder="Search accidents..." />
        <div class="table-toolbar__right">
          <span class="muted" id="recordCount"></span>
          <button class="btn btn--ghost btn--sm" id="btnRefresh">Refresh</button>
        </div>
      </div>
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>ID</th><th>Bus</th><th>Location</th><th>Date</th><th>Driver</th><th>Trip</th><th>Est. Cost</th><th>Actions</th></tr></thead>
        <tbody id="tableBody"></tbody>
      </table></div>
    </div>`;

  function photoSlotHtml(idx) {
    return `
      <div class="photo-slot" id="photoSlot${idx}">
        <input type="file" accept="image/*" id="photoInput${idx}" style="display:none;" />
        <div class="photo-slot__preview" id="photoPreview${idx}">
          <button type="button" class="btn btn--ghost btn--sm" data-photo-idx="${idx}" data-act="choose">Choose photo...</button>
        </div>
      </div>`;
  }

  function renderPhotoSlot(idx) {
    const preview = qs(`#photoPreview${idx}`);
    const url = photoUrls[idx];
    preview.innerHTML = url
      ? `<img src="${url}" alt="Accident photo ${idx + 1}" class="photo-slot__img" />
         <button type="button" class="btn btn--ghost btn--sm" data-photo-idx="${idx}" data-act="remove">Remove</button>`
      : `<button type="button" class="btn btn--ghost btn--sm" data-photo-idx="${idx}" data-act="choose">Choose photo...</button>`;
    wirePhotoButtons(idx);
  }

  function wirePhotoButtons(idx) {
    const preview = qs(`#photoPreview${idx}`);
    const chooseBtn = preview.querySelector('[data-act="choose"]');
    const removeBtn = preview.querySelector('[data-act="remove"]');
    if (chooseBtn) chooseBtn.addEventListener("click", () => qs(`#photoInput${idx}`).click());
    if (removeBtn) removeBtn.addEventListener("click", () => { photoUrls[idx] = null; renderPhotoSlot(idx); });
  }

  for (let i = 0; i < 3; i++) {
    wirePhotoButtons(i);
    qs(`#photoInput${i}`).addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const preview = qs(`#photoPreview${i}`);
      preview.innerHTML = `<span class="muted">Uploading...</span>`;
      try {
        const url = await uploadFile(file);
        photoUrls[i] = url;
        renderPhotoSlot(i);
        Toast.success(`Photo ${i + 1} uploaded.`);
      } catch (err) {
        Toast.error(apiErrorMessage(err, "Could not upload that photo."));
        renderPhotoSlot(i);
      }
      e.target.value = "";
    });
  }

  qs("#f_busId").addEventListener("change", () => {
    const busId = qs("#f_busId").value;
    qs("#f_tripId").innerHTML = `<option value="">None — parked / no trip running</option>${tripOptionsForBus(busId)}`;
  });

  function readForm() {
    return {
      busId: Number(qs("#f_busId").value),
      tripId: qs("#f_tripId").value ? Number(qs("#f_tripId").value) : null,
      driverId: qs("#f_driverId").value ? Number(qs("#f_driverId").value) : null,
      location: qs("#f_location").value.trim(),
      accidentDate: qs("#f_accidentDate").value,
      estimatedCost: qs("#f_estimatedCost").value === "" ? null : Number(qs("#f_estimatedCost").value),
      description: qs("#f_description").value.trim(),
      photo1Url: photoUrls[0], photo2Url: photoUrls[1], photo3Url: photoUrls[2]
    };
  }

  function fillForm(a) {
    qs("#f_busId").value = a.busId || "";
    qs("#f_tripId").innerHTML = `<option value="">None — parked / no trip running</option>${tripOptionsForBus(a.busId)}`;
    qs("#f_tripId").value = a.tripId || "";
    qs("#f_driverId").value = a.driverId || "";
    qs("#f_location").value = a.location || "";
    qs("#f_accidentDate").value = a.accidentDate || "";
    qs("#f_estimatedCost").value = a.estimatedCost ?? "";
    qs("#f_description").value = a.description || "";
    photoUrls = [a.photo1Url || null, a.photo2Url || null, a.photo3Url || null];
    for (let i = 0; i < 3; i++) renderPhotoSlot(i);
  }

  function clearForm() {
    editingId = null;
    ["f_busId", "f_tripId", "f_driverId", "f_location", "f_accidentDate", "f_estimatedCost", "f_description"].forEach(id => qs("#" + id).value = "");
    photoUrls = [null, null, null];
    for (let i = 0; i < 3; i++) renderPhotoSlot(i);
    qs("#btnSave").disabled = false;
    qs("#btnUpdate").disabled = true;
    qs("#btnDelete").disabled = true;
  }

  function validate(data) {
    if (!data.busId) { Toast.warning("Please select a bus."); return false; }
    if (Validate.isEmpty(data.location)) { Toast.warning("Please enter the accident location."); return false; }
    if (Validate.isEmpty(data.accidentDate)) { Toast.warning("Please select the accident date."); return false; }
    if (new Date(data.accidentDate) > new Date()) { Toast.warning("Accident date can't be in the future."); return false; }
    return true;
  }

  function doSave() {
    const data = readForm();
    if (!validate(data)) return;
    const rows = DB.readAll("accidents");
    rows.push({ accidentId: DB.nextId("accidents"), ...data, createdBy: Session.currentUser().userId, createdAt: DB.nowISO() });
    DB.writeAll("accidents", rows);
    Toast.success("Accident recorded.");
    clearForm();
    renderTable();
  }

  function doUpdate() {
    if (!editingId) return;
    const data = readForm();
    if (!validate(data)) return;
    const rows = DB.readAll("accidents");
    const idx = rows.findIndex(r => r.accidentId === editingId);
    if (idx < 0) return;
    rows[idx] = { ...rows[idx], ...data };
    DB.writeAll("accidents", rows);
    Toast.success("Accident record updated.");
    clearForm();
    renderTable();
  }

  async function doDelete(id) {
    const ok = await confirmDialog({ title: "Delete Accident", message: "Delete this accident record? This can't be undone from here.", okText: "Delete", danger: true });
    if (!ok) return;
    DB.writeAll("accidents", DB.readAll("accidents").filter(r => r.accidentId !== id));
    Toast.success("Accident record deleted.");
    clearForm();
    renderTable();
  }

  function selectRow(id) {
    const row = DB.readAll("accidents").find(r => r.accidentId === id);
    if (!row) return;
    editingId = id;
    fillForm(row);
    qs("#btnSave").disabled = true;
    qs("#btnUpdate").disabled = false;
    qs("#btnDelete").disabled = false;
  }

  function viewDetails(id) {
    const a = DB.readAll("accidents").find(r => r.accidentId === id);
    if (!a) return;
    const bus = DB.readAll("buses").find(b => b.busId === a.busId);
    const photos = [a.photo1Url, a.photo2Url, a.photo3Url].filter(Boolean);
    openModal({
      title: `Accident #${a.accidentId}`,
      size: "modal--lg",
      bodyHtml: `
        <div class="detail-grid">
          <div><strong>Bus</strong><div>${bus ? Fmt.escapeHtml(bus.busNumber) : "-"}</div></div>
          <div><strong>Driver</strong><div>${Q.empName(a.driverId)}</div></div>
          <div><strong>Location</strong><div>${Fmt.escapeHtml(a.location)}</div></div>
          <div><strong>Date</strong><div>${Fmt.date(a.accidentDate)}</div></div>
          <div><strong>Trip</strong><div>${a.tripId ? `#${a.tripId}` : "Not trip-related"}</div></div>
          <div><strong>Estimated Cost</strong><div>${a.estimatedCost ? Fmt.money(a.estimatedCost) : "-"}</div></div>
        </div>
        ${a.description ? `<p style="margin-top:12px;">${Fmt.escapeHtml(a.description)}</p>` : ""}
        <div class="photo-gallery" style="margin-top:16px;">
          ${photos.length ? photos.map(p => `<img src="${p}" class="photo-gallery__img" alt="Accident photo" />`).join("") : `<p class="muted">No photos attached.</p>`}
        </div>`,
      footerHtml: `<button class="btn btn--ghost" data-act="x">Close</button>`
    });
  }

  function renderTable() {
    const term = qs("#searchBox").value.trim().toLowerCase();
    let rows = DB.readAll("accidents").map(a => ({ ...a, _bus: DB.readAll("buses").find(b => b.busId === a.busId) }));
    if (term) {
      rows = rows.filter(a =>
        (a._bus?.busNumber || "").toLowerCase().includes(term) ||
        (a.location || "").toLowerCase().includes(term) ||
        Q.empName(a.driverId).toLowerCase().includes(term)
      );
    }
    rows = [...rows].sort((a, b) => (b.accidentDate || "").localeCompare(a.accidentDate || "") || b.accidentId - a.accidentId);

    qs("#recordCount").textContent = `${rows.length} record${rows.length === 1 ? "" : "s"}`;
    qs("#tableBody").innerHTML = rows.length ? rows.map(a => `
      <tr data-id="${a.accidentId}">
        <td>${a.accidentId}</td>
        <td>${a._bus ? Fmt.escapeHtml(a._bus.busNumber) : "-"}</td>
        <td>${Fmt.escapeHtml(a.location)}</td>
        <td>${Fmt.date(a.accidentDate)}</td>
        <td>${Q.empName(a.driverId)}</td>
        <td>${a.tripId ? `#${a.tripId}` : "-"}</td>
        <td>${a.estimatedCost ? Fmt.money(a.estimatedCost) : "-"}</td>
        <td class="actions-cell">
          <button class="icon-btn" data-act="view" title="View details">🔍</button>
          <button class="icon-btn" data-act="edit" title="Edit">✏️</button>
          <button class="icon-btn icon-btn--danger" data-act="del" title="Delete">🗑</button>
        </td>
      </tr>`).join("") : `<tr><td colspan="8"><div class="table-empty">No accident records yet.</div></td></tr>`;

    qsa("#tableBody tr[data-id]").forEach(tr => {
      const id = Number(tr.dataset.id);
      tr.querySelector('[data-act="view"]')?.addEventListener("click", () => viewDetails(id));
      tr.querySelector('[data-act="edit"]')?.addEventListener("click", () => selectRow(id));
      tr.querySelector('[data-act="del"]')?.addEventListener("click", () => doDelete(id));
    });
  }

  qs("#btnSave").addEventListener("click", doSave);
  qs("#btnUpdate").addEventListener("click", doUpdate);
  qs("#btnDelete").addEventListener("click", () => editingId && doDelete(editingId));
  qs("#btnReset").addEventListener("click", clearForm);
  qs("#btnRefresh").addEventListener("click", () => { qs("#searchBox").value = ""; renderTable(); });
  qs("#searchBox").addEventListener("input", debounce(renderTable, 200));

  renderTable();

  // Global Search "jump to record" — select and briefly highlight the
  // matching row, same pattern as every other page.
  const jumpId = (typeof GlobalSearch !== "undefined") ? GlobalSearch.consumeJumpTarget("accidents") : null;
  if (jumpId !== null && jumpId !== undefined) {
    qs("#searchBox").value = "";
    renderTable();
    selectRow(jumpId);
    const tr = qs(`#tableBody tr[data-id="${jumpId}"]`);
    if (tr) {
      tr.scrollIntoView({ behavior: "smooth", block: "center" });
      tr.classList.add("jump-highlight");
      setTimeout(() => tr.classList.remove("jump-highlight"), 2500);
    }
  }
}
