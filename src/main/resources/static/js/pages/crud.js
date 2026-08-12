/* =========================================================================
   crud.js — generic "list + form" page factory.
   Used by Bus, Employee, Maintenance, Part Purchases, Other Services,
   Trip Expenses, Employee Salary, Update Prices and Events pages, since
   they all follow the same desktop-app pattern: form on top, searchable
   table below, click a row to edit, Save / Update / Delete / Reset.
   ========================================================================= */

const EMPTY_STATE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 8l2-4h14l2 4"/><path d="M3 8v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8"/><path d="M3 8h18"/><path d="M9 12h6"/>
</svg>`;

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
  if (f.type === "autocomplete") {
    return `<div class="autocomplete-wrap">
      <input type="text" id="f_${f.name}" value="${Fmt.escapeHtml(val)}" placeholder="${f.placeholder || ""}" ${req} autocomplete="off" />
      <div class="autocomplete-list" id="ac_${f.name}"></div>
    </div>`;
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
       columns: [{key,label, render(row), sortable, sortValue(row)}],
       searchKeys: [...],
       defaultSort(a,b),
       beforeSave(data, isEdit) -> data | {error},
       afterLoad(rows) -> rows (optional post-processing e.g. joins),
       extraToolbar: html,
       emptyText,
       csvImport: true (adds an "Import CSV" button using cfg.fields as the schema),
       onPrint(row) (adds a print icon per row that calls this)
     } */
  let editingId = null;
  let sortState = null; // { colIndex, dir: 1|-1 }

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
          ${cfg.csvImport ? `<button class="btn btn--ghost btn--sm" id="btnImportCsv">Import CSV</button><input type="file" id="csvFile" accept=".csv" class="file-input-hidden" />` : ""}
          <button class="btn btn--ghost btn--sm" id="btnExport">Export CSV</button>
          <button class="btn btn--ghost btn--sm" id="btnRefresh">Refresh</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table" id="dataTable">
          <thead><tr>${cfg.columns.map((c, i) => `<th class="${c.sortable === false ? "" : "sortable"}" data-col="${i}">${c.label}${c.sortable === false ? "" : '<span class="sort-arrow">▲</span>'}</th>`).join("")}<th class="col-actions">Actions</th></tr></thead>
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
    if (f.type === "autocomplete") wireAutocomplete(f);
  });

  function wireAutocomplete(f) {
    const input = qs("#f_" + f.name, container);
    const list = qs("#ac_" + f.name, container);

    function renderSuggestions() {
      const term = input.value.trim().toLowerCase();
      if (!term) { list.classList.remove("show"); list.innerHTML = ""; return; }
      const items = f.source().filter(it => it.label.toLowerCase().includes(term)).slice(0, 8);
      if (items.length === 0) {
        list.innerHTML = `<div class="autocomplete-empty">No matches — keep typing to add a new one.</div>`;
      } else {
        list.innerHTML = items.map((it, i) => `
          <div class="autocomplete-item" data-idx="${i}">
            <div class="autocomplete-item__title">${Fmt.escapeHtml(it.label)}</div>
            ${it.sub ? `<div class="autocomplete-item__sub">${Fmt.escapeHtml(it.sub)}</div>` : ""}
          </div>`).join("");
        qsa(".autocomplete-item", list).forEach(el => {
          el.addEventListener("mousedown", (e) => {
            e.preventDefault(); // keep focus/blur from firing before click registers
            const picked = items[Number(el.dataset.idx)];
            input.value = picked.label;
            list.classList.remove("show");
            if (f.onPick) f.onPick(picked.raw, container);
          });
        });
      }
      list.classList.add("show");
    }

    input.addEventListener("input", debounce(renderSuggestions, 120));
    input.addEventListener("focus", renderSuggestions);
    input.addEventListener("blur", () => setTimeout(() => list.classList.remove("show"), 120));
  }

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

  function applySort(rows) {
    if (!sortState) return rows;
    const col = cfg.columns[sortState.colIndex];
    if (!col) return rows;
    return [...rows].sort((a, b) => {
      const av = col.sortValue ? col.sortValue(a) : a[col.key];
      const bv = col.sortValue ? col.sortValue(b) : b[col.key];
      if (av === bv) return 0;
      if (av === undefined || av === null) return 1;
      if (bv === undefined || bv === null) return -1;
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return cmp * sortState.dir;
    });
  }

  function renderTable() {
    let rows = getRows();
    const term = qs("#searchBox", container).value.trim().toLowerCase();
    if (term) rows = rows.filter(r => matchesSearch(r, term));
    if (sortState) rows = applySort(rows);
    else if (cfg.defaultSort) rows = [...rows].sort(cfg.defaultSort);

    const tbody = qs("#dataTable tbody", container);
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${cfg.columns.length + 1}">
        <div class="table-empty">
          <div class="table-empty__icon">${EMPTY_STATE_ICON}</div>
          ${cfg.emptyText || "No records found."}
        </div>
      </td></tr>`;
    } else {
      tbody.innerHTML = rows.map(row => `
        <tr data-id="${row[cfg.idField]}">
          ${cfg.columns.map(c => `<td>${c.render ? c.render(row) : Fmt.escapeHtml(row[c.key] ?? "-")}</td>`).join("")}
          <td class="col-actions">
            ${cfg.onPrint ? `<button class="icon-btn icon-btn--print" data-act="print" title="Print">🖨</button>` : ""}
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
      const printBtn = tr.querySelector('[data-act="print"]');
      if (printBtn) printBtn.addEventListener("click", () => {
        const row = DB.readAll(cfg.table).find(r => r[cfg.idField] === id);
        if (row) cfg.onPrint(row);
      });
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

  function parseCsv(text) {
    const rows = [];
    let row = [], field = "", inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ",") { row.push(field); field = ""; }
        else if (c === "\n" || c === "\r") {
          if (c === "\r" && text[i + 1] === "\n") i++;
          row.push(field); rows.push(row); row = []; field = "";
        } else field += c;
      }
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows.filter(r => r.some(v => v.trim() !== ""));
  }

  async function importCsv(file) {
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) { Toast.warning("CSV file looks empty."); return; }

    const headers = rows[0].map(h => h.trim().toLowerCase());
    const importableFields = cfg.fields.filter(f => f.type !== "checkbox" || true);
    const fieldByHeader = {};
    importableFields.forEach(f => {
      const idx = headers.indexOf(f.name.toLowerCase()) >= 0 ? headers.indexOf(f.name.toLowerCase()) : headers.indexOf(f.label.toLowerCase());
      if (idx >= 0) fieldByHeader[f.name] = idx;
    });

    if (Object.keys(fieldByHeader).length === 0) {
      Toast.error(`No matching columns found. Expected headers like: ${cfg.fields.map(f => f.name).join(", ")}`);
      return;
    }

    let imported = 0, skipped = 0;
    const existingRows = DB.readAll(cfg.table);

    for (let i = 1; i < rows.length; i++) {
      const raw = rows[i];
      const data = {};
      cfg.fields.forEach(f => {
        const idx = fieldByHeader[f.name];
        let v = idx !== undefined ? (raw[idx] || "").trim() : (f.default !== undefined ? f.default : "");
        if (f.type === "number") v = v === "" ? "" : Number(v);
        if (f.type === "checkbox") v = /^(true|1|yes)$/i.test(String(v));
        data[f.name] = v;
      });

      const missingRequired = cfg.fields.some(f => f.required && f.type !== "checkbox" && (data[f.name] === "" || data[f.name] === undefined));
      if (missingRequired) { skipped++; continue; }

      if (cfg.beforeSave) {
        const res = cfg.beforeSave(data, false);
        if (res && res.error) { skipped++; continue; }
      }

      const newRow = { [cfg.idField]: DB.nextId(cfg.table), ...data };
      if (cfg.onCreate) cfg.onCreate(newRow);
      existingRows.push(newRow);
      imported++;
    }

    DB.writeAll(cfg.table, existingRows);
    renderTable();
    if (cfg.onChange) cfg.onChange();
    if (imported > 0) Toast.success(`Imported ${imported} record${imported === 1 ? "" : "s"}.${skipped ? ` (${skipped} skipped — missing required fields.)` : ""}`);
    else Toast.error(`No rows imported. ${skipped} row(s) skipped — check required fields match your CSV.`);
  }

  qs("#btnSave", container).addEventListener("click", doSave);
  qs("#btnUpdate", container).addEventListener("click", doUpdate);
  qs("#btnDelete", container).addEventListener("click", () => editingId && doDelete(editingId));
  qs("#btnReset", container).addEventListener("click", clearForm);
  qs("#btnRefresh", container).addEventListener("click", () => { qs("#searchBox", container).value = ""; renderTable(); Toast.info("List refreshed."); });
  qs("#btnExport", container).addEventListener("click", exportCsv);
  qs("#searchBox", container).addEventListener("input", debounce(renderTable, 200));

  qsa("#dataTable thead th.sortable", container).forEach(th => {
    th.addEventListener("click", () => {
      const idx = Number(th.dataset.col);
      if (sortState && sortState.colIndex === idx) {
        sortState.dir = sortState.dir === 1 ? -1 : 1;
      } else {
        sortState = { colIndex: idx, dir: 1 };
      }
      qsa("#dataTable thead th", container).forEach(h => h.classList.remove("sort-asc", "sort-desc"));
      th.classList.add(sortState.dir === 1 ? "sort-asc" : "sort-desc");
      qs(".sort-arrow", th).textContent = sortState.dir === 1 ? "▲" : "▼";
      renderTable();
    });
  });

  if (cfg.csvImport) {
    qs("#btnImportCsv", container).addEventListener("click", () => qs("#csvFile", container).click());
    qs("#csvFile", container).addEventListener("change", async (e) => {
      const file = e.target.files[0];
      e.target.value = "";
      if (!file) return;
      await importCsv(file);
    });
  }

  clearForm();
  renderTable();
  return { renderTable, clearForm };
}
