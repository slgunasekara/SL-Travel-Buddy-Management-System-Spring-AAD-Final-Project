/* =========================================================================
   crud.js — generic "list + form" page factory.
   Used by Bus, Employee, Maintenance, Part Purchases, Other Services,
   Trip Expenses, Employee Salary, Update Prices and Events pages, since
   they all follow the same desktop-app pattern: form on top, searchable
   table below, click a row to edit, Save / Update / Delete / Reset.
   ========================================================================= */

function fieldHtml(f, value) {
  const val = value === undefined || value === null ? "" : value;
  const req = f.required ? "required" : "";
  if (f.type === "select") {
    const opts = f.options.map(o => {
      const ov = typeof o === "object" ? o.value : o;
      const ol = typeof o === "object" ? o.label : o;
      return `<option value="${Fmt.escapeHtml(ov)}" ${String(ov) === String(val) ? "selected" : ""}>${Fmt.escapeHtml(ol)}</option>`;
    }).join("");
    return `<select id="f_${f.name}" ${req} ${f.disabled ? "disabled" : ""}>
      <option value="">${f.placeholder || "Select..."}</option>${opts}
    </select>`;
  }
  if (f.type === "textarea") {
    return `<textarea id="f_${f.name}" rows="2" placeholder="${f.placeholder || ""}" ${req}>${Fmt.escapeHtml(val)}</textarea>`;
  }
  if (f.type === "checkbox") {
    return `<label class="checkbox-line"><input type="checkbox" id="f_${f.name}" ${val ? "checked" : ""}/> <span>${f.checkLabel || ""}</span></label>`;
  }
  return `<input type="${f.type || "text"}" id="f_${f.name}" value="${Fmt.escapeHtml(val)}" placeholder="${f.placeholder || ""}" ${req} ${f.step ? `step="${f.step}"` : ""} ${f.disabled ? "disabled" : ""} ${f.readonly ? "readonly" : ""}/>`;
}

function readFieldValue(f) {
  const el = qs("#f_" + f.name);
  if (!el) return undefined;
  if (f.type === "checkbox") return el.checked;
  if (f.type === "number") return el.value === "" ? "" : Number(el.value);
  return el.value.trim();
}

function renderCrudPage(container, cfg) {
  /* cfg = {
       title, subtitle, table, idField,
       fields: [{name,label,type,required,options,...}],
       columns: [{key,label, render(row)}],
       searchKeys: [...],
       defaultSort(a,b),
       beforeSave(data, isEdit) -> data | {error},
       afterLoad(rows) -> rows (optional post-processing e.g. joins),
       extraToolbar: html,
       emptyText
     } */
  let editingId = null;

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h2>${cfg.title}</h2>
        ${cfg.subtitle ? `<p class="muted">${cfg.subtitle}</p>` : ""}
      </div>
      ${cfg.extraToolbar || ""}
    </div>

    <div class="card form-card">
      <div class="form-grid" id="formGrid"></div>
      <div class="form-actions">
        <button class="btn btn--primary" id="btnSave">Save</button>
        <button class="btn btn--secondary" id="btnUpdate" disabled>Update</button>
        <button class="btn btn--danger" id="btnDelete" disabled>Delete</button>
        <button class="btn btn--ghost" id="btnReset">Reset</button>
      </div>
    </div>

    <div class="card">
      <div class="table-toolbar">
        <div class="search-box">
          ${icon("search", "search-ic")}
          <input type="text" id="searchBox" placeholder="Search ${cfg.title.toLowerCase()}..." />
        </div>
        <div class="table-toolbar__right">
          <span class="pill" id="rowCount">0 records</span>
          <button class="btn btn--ghost btn--sm" id="btnExport">Export CSV</button>
          <button class="btn btn--ghost btn--sm" id="btnRefresh">Refresh</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table" id="dataTable">
          <thead><tr>${cfg.columns.map(c => `<th>${c.label}</th>`).join("")}<th class="col-actions">Actions</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </div>`;

  const grid = qs("#formGrid", container);
  grid.innerHTML = cfg.fields.map(f => `
    <div class="form-field ${f.wide ? "form-field--wide" : ""}">
      ${f.type !== "checkbox" ? `<label for="f_${f.name}">${f.label}${f.required ? ' <span class="req">*</span>' : ""}</label>` : ""}
      ${fieldHtml(f, "")}
    </div>`).join("");

  cfg.fields.forEach(f => {
    if (f.onChange) {
      const el = qs("#f_" + f.name, container);
      el.addEventListener("change", () => f.onChange(readAllFields()));
    }
  });

  function readAllFields() {
    const data = {};
    cfg.fields.forEach(f => { data[f.name] = readFieldValue(f); });
    return data;
  }

  function fillForm(row) {
    cfg.fields.forEach(f => {
      const el = qs("#f_" + f.name, container);
      if (!el) return;
      if (f.type === "checkbox") el.checked = !!row[f.name];
      else el.value = row[f.name] === undefined || row[f.name] === null ? "" : row[f.name];
    });
  }

  function clearForm() {
    editingId = null;
    cfg.fields.forEach(f => {
      const el = qs("#f_" + f.name, container);
      if (!el) return;
      if (f.type === "checkbox") el.checked = false;
      else el.value = f.default !== undefined ? f.default : "";
    });
    qs("#btnSave", container).disabled = false;
    qs("#btnUpdate", container).disabled = true;
    qs("#btnDelete", container).disabled = true;
    qsa("#dataTable tbody tr", container).forEach(r => r.classList.remove("row-selected"));
  }

  function getRows() {
    let rows = DB.readAll(cfg.table);
    if (cfg.afterLoad) rows = cfg.afterLoad(rows);
    return rows;
  }

  function matchesSearch(row, term) {
    return cfg.searchKeys.some(k => {
      const v = typeof k === "function" ? k(row) : row[k];
      return String(v ?? "").toLowerCase().includes(term);
    });
  }

  function renderTable() {
    let rows = getRows();
    const term = qs("#searchBox", container).value.trim().toLowerCase();
    if (term) rows = rows.filter(r => matchesSearch(r, term));
    if (cfg.defaultSort) rows = [...rows].sort(cfg.defaultSort);

    const tbody = qs("#dataTable tbody", container);
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${cfg.columns.length + 1}"><div class="table-empty">${cfg.emptyText || "No records found."}</div></td></tr>`;
    } else {
      tbody.innerHTML = rows.map(row => `
        <tr data-id="${row[cfg.idField]}">
          ${cfg.columns.map(c => `<td>${c.render ? c.render(row) : Fmt.escapeHtml(row[c.key] ?? "-")}</td>`).join("")}
          <td class="col-actions">
            <button class="icon-btn" data-act="edit" title="Edit">✎</button>
            <button class="icon-btn icon-btn--danger" data-act="del" title="Delete">🗑</button>
          </td>
        </tr>`).join("");
    }
    qs("#rowCount", container).textContent = `${rows.length} record${rows.length === 1 ? "" : "s"}`;

    qsa("#dataTable tbody tr[data-id]", container).forEach(tr => {
      const id = Number(tr.dataset.id);
      tr.addEventListener("click", (e) => {
        if (e.target.closest("[data-act]")) return;
        selectRow(id);
      });
      const editBtn = tr.querySelector('[data-act="edit"]');
      if (editBtn) editBtn.addEventListener("click", () => selectRow(id));
      const delBtn = tr.querySelector('[data-act="del"]');
      if (delBtn) delBtn.addEventListener("click", () => doDelete(id));
    });
  }

  function selectRow(id) {
    const rows = DB.readAll(cfg.table);
    const row = rows.find(r => r[cfg.idField] === id);
    if (!row) return;
    editingId = id;
    fillForm(row);
    qs("#btnSave", container).disabled = true;
    qs("#btnUpdate", container).disabled = false;
    qs("#btnDelete", container).disabled = false;
    qsa("#dataTable tbody tr", container).forEach(r => r.classList.toggle("row-selected", Number(r.dataset.id) === id));
    container.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function validateRequired(data) {
    for (const f of cfg.fields) {
      if (f.required && f.type !== "checkbox" && (data[f.name] === "" || data[f.name] === undefined || data[f.name] === null)) {
        Toast.warning(`Please fill in "${f.label}"`);
        qs("#f_" + f.name, container)?.focus();
        return false;
      }
    }
    return true;
  }

  async function doSave() {
    const data = readAllFields();
    if (!validateRequired(data)) return;
    if (cfg.beforeSave) {
      const res = cfg.beforeSave(data, false);
      if (res && res.error) { Toast.warning(res.error); return; }
    }
    const rows = DB.readAll(cfg.table);
    const newRow = { [cfg.idField]: DB.nextId(cfg.table), ...data };
    if (cfg.onCreate) cfg.onCreate(newRow);
    rows.push(newRow);
    DB.writeAll(cfg.table, rows);
    Toast.success(`${cfg.singular || cfg.title} saved successfully!`);
    clearForm();
    renderTable();
    if (cfg.onChange) cfg.onChange();
  }

  async function doUpdate() {
    if (!editingId) return;
    const data = readAllFields();
    if (!validateRequired(data)) return;
    if (cfg.beforeSave) {
      const res = cfg.beforeSave(data, true, editingId);
      if (res && res.error) { Toast.warning(res.error); return; }
    }
    const rows = DB.readAll(cfg.table);
    const idx = rows.findIndex(r => r[cfg.idField] === editingId);
    if (idx < 0) return;
    rows[idx] = { ...rows[idx], ...data };
    if (cfg.onUpdate) cfg.onUpdate(rows[idx]);
    DB.writeAll(cfg.table, rows);
    Toast.success(`${cfg.singular || cfg.title} updated successfully!`);
    clearForm();
    renderTable();
    if (cfg.onChange) cfg.onChange();
  }

  async function doDelete(id) {
    if (cfg.canDelete) {
      const check = cfg.canDelete(id);
      if (check && check.blocked) { Toast.error(check.reason || "Cannot delete this record — it is referenced elsewhere."); return; }
    }
    const ok = await confirmDialog({ title: `Delete ${cfg.singular || cfg.title}`, message: `Are you sure you want to delete this ${(cfg.singular || cfg.title).toLowerCase()}?`, okText: "Delete", danger: true });
    if (!ok) return;
    const rows = DB.readAll(cfg.table).filter(r => r[cfg.idField] !== id);
    DB.writeAll(cfg.table, rows);
    Toast.success(`${cfg.singular || cfg.title} deleted successfully!`);
    if (editingId === id) clearForm();
    renderTable();
    if (cfg.onChange) cfg.onChange();
  }

  function exportCsv() {
    const rows = getRows();
    if (rows.length === 0) { Toast.warning("No data to export!"); return; }
    const headers = cfg.columns.map(c => c.label);
    const lines = [headers.join(",")];
    rows.forEach(row => {
      const line = cfg.columns.map(c => {
        let v = c.csv ? c.csv(row) : (c.render ? c.render(row).replace(/<[^>]+>/g, "") : row[c.key]);
        v = String(v ?? "").replace(/"/g, '""');
        return `"${v}"`;
      });
      lines.push(line.join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${cfg.table}_export_${DB.today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.success("CSV exported!");
  }

  qs("#btnSave", container).addEventListener("click", doSave);
  qs("#btnUpdate", container).addEventListener("click", doUpdate);
  qs("#btnDelete", container).addEventListener("click", () => editingId && doDelete(editingId));
  qs("#btnReset", container).addEventListener("click", clearForm);
  qs("#btnRefresh", container).addEventListener("click", () => { qs("#searchBox", container).value = ""; renderTable(); Toast.info("List refreshed."); });
  qs("#btnExport", container).addEventListener("click", exportCsv);
  qs("#searchBox", container).addEventListener("input", debounce(renderTable, 200));

  clearForm();
  renderTable();
  return { renderTable, clearForm };
}
