/* pages/settings.js — Settings (new, additive). Data backup/restore lives
   here since localStorage data can otherwise be lost if the browser
   cache is cleared — see the README note on this. */
function renderSettingsPage(container) {
  container.innerHTML = `
    <div class="page-head">
      <div><h2>Settings</h2><p class="muted">Appearance and data management for this device.</p></div>
    </div>

    <div class="card">
      <div class="settings-section">
        <h4>Appearance</h4>
        <p class="muted">Choose how SL Travel Buddy looks on this device.</p>
      </div>
      <div class="settings-actions">
        <button class="btn btn--secondary" id="btnLight">☀️ Light Mode</button>
        <button class="btn btn--secondary" id="btnDark">🌙 Dark Mode</button>
      </div>
    </div>

    <div class="card">
      <div class="settings-section">
        <h4>Session Security</h4>
        <p class="muted">Automatically log out on this device after a period of inactivity.</p>
      </div>
      <div class="settings-actions" style="padding:0 16px 16px; display:flex; align-items:center; gap:10px;">
        <label for="idleMinutes" class="muted">Auto-logout after</label>
        <select id="idleMinutes">
          <option value="5">5 minutes</option>
          <option value="10">10 minutes</option>
          <option value="20">20 minutes</option>
          <option value="30">30 minutes</option>
          <option value="60">60 minutes</option>
        </select>
      </div>
    </div>

    <div class="card">
      <div class="settings-section">
        <h4>Keyboard Shortcuts</h4>
        <p class="muted">Click "Change" then press a new key combination.</p>
      </div>
      <div id="shortcutsHost" style="padding:0 16px 16px;"></div>
    </div>

    <div class="card">
      <div class="settings-section">
        <h4>Two-Factor Authentication</h4>
        <p class="muted">Require a 6-digit email code at login, on top of your password.</p>
      </div>
      <div class="settings-actions" style="padding:0 16px 16px; display:flex; align-items:center; gap:10px;">
        <label class="checkbox-line"><input type="checkbox" id="tfaEnabled" /> <span>Require an email code when I log in</span></label>
      </div>
    </div>

    <div class="card">
      <div class="settings-section">
        <h4>Change Password</h4>
        <p class="muted">Update your own login password. You'll need your current password to confirm it's you.</p>
      </div>
      <form id="changePasswordForm" class="form-grid" style="padding:0 16px 16px;">
        <div class="form-field">
          <label for="cpCurrent">Current Password</label>
          <input type="password" id="cpCurrent" autocomplete="current-password" required />
        </div>
        <div class="form-field">
          <label for="cpNew">New Password</label>
          <input type="password" id="cpNew" autocomplete="new-password" required />
        </div>
        <div class="form-field">
          <label for="cpConfirm">Confirm New Password</label>
          <input type="password" id="cpConfirm" autocomplete="new-password" required />
        </div>
        <div class="settings-actions" style="grid-column:1/-1;">
          <button type="submit" class="btn btn--primary">Update Password</button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="settings-section">
        <h4>Data Backup &amp; Restore</h4>
        <p class="muted">
          All data in this app is stored locally in your browser (no server or database).
          That means clearing your browser's cache/site data will erase everything —
          export a backup regularly, and keep the file somewhere safe.
        </p>
      </div>
      <div class="settings-actions">
        <button class="btn btn--primary" id="btnExportAll">⬇ Export All Data (JSON)</button>
        <button class="btn btn--secondary" id="btnImportAll">⬆ Import Backup</button>
        <input type="file" id="importFile" accept="application/json" class="file-input-hidden" />
      </div>
    </div>

    <div class="card">
      <div class="settings-section">
        <h4>Reset</h4>
        <p class="muted">Wipe all data on this device and start fresh with the original demo accounts.</p>
      </div>
      <div class="settings-actions">
        <button class="btn btn--danger" id="btnResetAll">Reset to Demo Data</button>
      </div>
    </div>

    ${Session.isOwner() ? `
    <div class="card">
      <div class="settings-section">
        <h4>Company Letterhead</h4>
        <p class="muted">Shown on every printed receipt and report.</p>
      </div>
      <div class="settings-actions" style="padding:0 16px 16px; display:grid; gap:10px; max-width:420px;">
        <input type="text" id="lh_companyName" placeholder="Company name" />
        <input type="text" id="lh_address" placeholder="Address (optional)" />
        <input type="text" id="lh_phone" placeholder="Phone (optional)" />
        <div class="photo-field" id="lh_logoField">
          <input type="hidden" id="lh_logoUrl" value="" />
          <div class="photo-field__preview" id="lh_logoPreview"><span class="muted">No logo</span></div>
          <input type="file" accept="image/*" id="lh_logoInput" style="display:none;" />
          <button type="button" class="btn btn--secondary btn--sm" id="lh_logoBtn">Choose Logo</button>
        </div>
        <button class="btn btn--primary" id="btnSaveLetterhead" style="justify-self:start;">Save Letterhead</button>
      </div>
    </div>

    <div class="card">
      <div class="settings-section">
        <h4>Category Budget Caps</h4>
        <p class="muted">Monthly spending limits — you'll get an alert when a category approaches or passes its cap.</p>
      </div>
      <div class="settings-actions" style="padding:0 16px 16px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <select id="bc_category">
          <option value="FUEL">Fuel</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="PARTS">Parts</option>
        </select>
        <input type="number" id="bc_amount" placeholder="Monthly cap (Rs.)" style="max-width:200px;" />
        <button class="btn btn--primary btn--sm" id="btnAddBudgetCap">Save Cap</button>
      </div>
      <div id="budgetCapsHost" style="padding:0 16px 16px;"></div>
    </div>

    <div class="card">
      <div class="settings-section">
        <h4>Active Sessions</h4>
        <p class="muted">Everyone who's used the app in the last 15 minutes. You can end a session remotely — they'll be logged out on their next action.</p>
      </div>
      <div id="sessionsHost" style="padding:0 16px 16px;"><p class="muted">Loading...</p></div>
    </div>

    <div class="card">
      <div class="settings-section">
        <h4>Audit Log</h4>
        <p class="muted">Every create/update/delete across the system — who did what, and when (most recent 500).</p>
      </div>
      <div id="auditLogHost" style="padding:0 16px 16px;"><p class="muted">Loading...</p></div>
    </div>

    <div class="card">
      <div class="settings-section">
        <h4>Recently Deleted</h4>
        <p class="muted">Deleted records aren't erased — they're just hidden. Restore anything here.</p>
      </div>
      <div id="recycleBinHost" style="padding:0 16px 16px;"><p class="muted">Loading...</p></div>
    </div>` : ""}

    <div class="card">
      <div class="settings-section">
        <h4>About</h4>
      </div>
      <p class="muted">SL Travel Buddy — Bus Management System (Web Edition). Logged in as
        <strong>${Fmt.escapeHtml(Session.currentUser().name)}</strong> (${Fmt.escapeHtml(Session.currentUser().role)}).</p>
    </div>`;

  qs("#btnLight").addEventListener("click", () => { Theme.set("light"); Toast.success("Switched to light mode."); });
  qs("#btnDark").addEventListener("click", () => { Theme.set("dark"); Toast.success("Switched to dark mode."); });

  if (Session.isOwner()) {
    loadSessions();
    loadAuditLog();
    loadLetterhead();
    loadRecycleBin();
    loadBudgetCaps();
  }

  function loadBudgetCaps() {
    function render() {
      const caps = DB.readAll("budgetCaps");
      qs("#budgetCapsHost").innerHTML = caps.length ? `
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>Category</th><th>Monthly Cap</th><th></th></tr></thead>
          <tbody>${caps.map(c => `
            <tr>
              <td>${Fmt.escapeHtml(c.category)}</td>
              <td>${Fmt.money(c.monthlyCap)}</td>
              <td><button class="btn btn--danger btn--sm" data-del-cap="${c.capId}">Remove</button></td>
            </tr>`).join("")}</tbody>
        </table></div>` : `<p class="muted">No budget caps set yet.</p>`;
      qsa("[data-del-cap]", qs("#budgetCapsHost")).forEach(btn => {
        btn.addEventListener("click", () => {
          const remaining = DB.readAll("budgetCaps").filter(c => c.capId !== Number(btn.dataset.delCap));
          DB.writeAll("budgetCaps", remaining);
          render();
        });
      });
    }
    render();

    qs("#btnAddBudgetCap").addEventListener("click", () => {
      const category = qs("#bc_category").value;
      const amount = Number(qs("#bc_amount").value);
      if (!Validate.isPositiveNumber(amount)) { Toast.error("Enter a valid positive monthly cap."); return; }
      const existingCaps = DB.readAll("budgetCaps");
      const existing = existingCaps.find(c => c.category === category);
      const payload = { category, monthlyCap: amount, createdBy: Session.currentUser().userId, createdAt: DB.nowISO() };
      const nextRows = existing
        ? existingCaps.map(c => c.capId === existing.capId ? { ...c, ...payload } : c)
        : [...existingCaps, { capId: DB.nextId("budgetCaps"), ...payload }];
      DB.writeAll("budgetCaps", nextRows);
      Toast.success("Budget cap saved.");
      qs("#bc_amount").value = "";
      render();
    });
  }

  function loadRecycleBin() {
    RecycleBinApi.all().then(res => {
      const rows = res.body || [];
      qs("#recycleBinHost").innerHTML = rows.length ? `
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>Type</th><th>ID</th><th></th></tr></thead>
          <tbody>${rows.map((r, i) => `
            <tr>
              <td>${Fmt.escapeHtml(r.entityType)}</td>
              <td>#${Fmt.escapeHtml(r.entityId)}</td>
              <td><button class="btn btn--secondary btn--sm" data-restore-idx="${i}">Restore</button></td>
            </tr>`).join("")}</tbody>
        </table></div>` : `<p class="muted">Nothing deleted right now.</p>`;
      qsa("[data-restore-idx]", qs("#recycleBinHost")).forEach(btn => {
        btn.addEventListener("click", () => {
          const r = rows[Number(btn.dataset.restoreIdx)];
          RecycleBinApi.restore(r.repoBean, r.entityId).then(() => {
            Toast.success(`${r.entityType} #${r.entityId} restored.`);
            DB.bootstrap();
            loadRecycleBin();
          }).catch(err => Toast.error(apiErrorMessage(err, "Could not restore that record.")));
        });
      });
    }).catch(err => { qs("#recycleBinHost").innerHTML = `<p class="muted">${Fmt.escapeHtml(apiErrorMessage(err, "Could not load recently deleted records."))}</p>`; });
  }

  function loadLetterhead() {
    CompanySettingsApi.get().then(res => {
      const s = res.body || {};
      qs("#lh_companyName").value = s.companyName || "";
      qs("#lh_address").value = s.address || "";
      qs("#lh_phone").value = s.phone || "";
      qs("#lh_logoUrl").value = s.logoUrl || "";
      qs("#lh_logoPreview").innerHTML = s.logoUrl ? `<img src="${Fmt.escapeHtml(s.logoUrl)}" alt="" />` : `<span class="muted">No logo</span>`;
      qs("#lh_logoBtn").textContent = s.logoUrl ? "Change Logo" : "Choose Logo";
    }).catch(err => Toast.error(apiErrorMessage(err, "Could not load the letterhead settings.")));

    qs("#lh_logoBtn").addEventListener("click", () => qs("#lh_logoInput").click());
    qs("#lh_logoInput").addEventListener("change", async () => {
      const file = qs("#lh_logoInput").files[0];
      if (!file) return;
      const btn = qs("#lh_logoBtn");
      btn.disabled = true;
      btn.textContent = "Uploading...";
      try {
        const url = await uploadFile(file);
        qs("#lh_logoUrl").value = url;
        qs("#lh_logoPreview").innerHTML = `<img src="${Fmt.escapeHtml(url)}" alt="" />`;
      } catch (err) {
        Toast.error(apiErrorMessage(err, "Could not upload the logo."));
      } finally {
        btn.disabled = false;
        btn.textContent = qs("#lh_logoUrl").value ? "Change Logo" : "Choose Logo";
      }
    });

    qs("#btnSaveLetterhead").addEventListener("click", () => {
      const data = {
        companyName: qs("#lh_companyName").value.trim() || "SL Travel Buddy",
        address: qs("#lh_address").value.trim(),
        phone: qs("#lh_phone").value.trim(),
        logoUrl: qs("#lh_logoUrl").value.trim()
      };
      CompanySettingsApi.update(data).then(() => {
        Toast.success("Letterhead updated — it'll appear on receipts from now on.");
        PrintReceipt.loadBrand();
      }).catch(err => Toast.error(apiErrorMessage(err, "Could not save the letterhead.")));
    });
  }

  function loadSessions() {
    SessionsApi.active().then(res => {
      const rows = res.body || [];
      const me = Session.currentUser().userId;
      qs("#sessionsHost").innerHTML = rows.length ? `
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>Name</th><th>Role</th><th>Last Active</th><th></th></tr></thead>
          <tbody>${rows.map(s => `
            <tr>
              <td>${Fmt.escapeHtml(s.name)}${s.userId === me ? ` <span class="badge badge--blue">You</span>` : ""}</td>
              <td>${Fmt.escapeHtml(s.role)}</td>
              <td>${Fmt.escapeHtml(new Date(s.lastSeen).toLocaleString())}</td>
              <td>${s.userId === me ? "" : `<button class="btn btn--danger btn--sm" data-revoke="${s.userId}">Log out</button>`}</td>
            </tr>`).join("")}</tbody>
        </table></div>` : `<p class="muted">No other active sessions right now.</p>`;
      qsa("[data-revoke]", qs("#sessionsHost")).forEach(btn => {
        btn.addEventListener("click", async () => {
          const ok = await confirmDialog({ title: "End Session", message: "Log this user out remotely?", okText: "Log out", danger: true });
          if (!ok) return;
          SessionsApi.revoke(btn.dataset.revoke).then(() => { Toast.success("Session ended."); loadSessions(); })
            .catch(err => Toast.error(apiErrorMessage(err, "Could not end that session.")));
        });
      });
    }).catch(err => { qs("#sessionsHost").innerHTML = `<p class="muted">${Fmt.escapeHtml(apiErrorMessage(err, "Could not load active sessions."))}</p>`; });
  }

  function loadAuditLog() {
    AuditLogApi.recent().then(res => {
      const rows = res.body || [];
      qs("#auditLogHost").innerHTML = rows.length ? `
        <div class="table-wrap" style="max-height:340px; overflow-y:auto;"><table class="data-table">
          <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Entity</th><th>ID</th></tr></thead>
          <tbody>${rows.map(a => `
            <tr>
              <td>${Fmt.escapeHtml(new Date(a.performedAt).toLocaleString())}</td>
              <td>${Fmt.escapeHtml(a.performedBy)}</td>
              <td><span class="badge badge--${a.action === "CREATE" ? "green" : a.action === "DELETE" ? "red" : "amber"}">${a.action}</span></td>
              <td>${Fmt.escapeHtml(a.entityType)}</td>
              <td>#${Fmt.escapeHtml(a.entityId)}</td>
            </tr>`).join("")}</tbody>
        </table></div>` : `<p class="muted">No activity recorded yet.</p>`;
    }).catch(err => { qs("#auditLogHost").innerHTML = `<p class="muted">${Fmt.escapeHtml(apiErrorMessage(err, "Could not load the audit log."))}</p>`; });
  }

  qs("#idleMinutes").value = String(IdleTimeout.minutes());
  qs("#idleMinutes").addEventListener("change", () => {
    IdleTimeout.setMinutes(qs("#idleMinutes").value);
    Toast.success("Auto-logout timing updated.");
  });

  qs("#tfaEnabled").checked = !!Session.currentUser().twoFactorEnabled;
  qs("#tfaEnabled").addEventListener("change", () => {
    const chk = qs("#tfaEnabled");
    const enabled = chk.checked;
    chk.disabled = true;
    AuthApi.toggleTwoFactor(enabled).then(() => {
      const s = Session.get();
      s.user.twoFactorEnabled = enabled;
      Session.set(s.user, s.token);
      Toast.success(enabled ? "Two-factor authentication turned on." : "Two-factor authentication turned off.");
    }).catch(err => {
      chk.checked = !enabled;
      Toast.error(apiErrorMessage(err, "Could not update two-factor authentication."));
    }).finally(() => { chk.disabled = false; });
  });

  renderShortcuts();
  function renderShortcuts() {
    const bindings = Shortcuts.all();
    qs("#shortcutsHost").innerHTML = `
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>Action</th><th>Shortcut</th><th></th></tr></thead>
        <tbody>${Object.entries(bindings).map(([name, b]) => `
          <tr>
            <td>${Fmt.escapeHtml(b.label)}</td>
            <td><kbd>${Fmt.escapeHtml(Shortcuts.label(b))}</kbd></td>
            <td><button class="btn btn--secondary btn--sm" data-rebind="${name}">Change</button></td>
          </tr>`).join("")}</tbody>
      </table></div>`;
    qsa("[data-rebind]", qs("#shortcutsHost")).forEach(btn => {
      btn.addEventListener("click", () => {
        btn.textContent = "Press a key...";
        btn.disabled = true;
        const capture = (e) => {
          e.preventDefault();
          if (["Control", "Meta", "Shift", "Alt"].includes(e.key)) return;
          Shortcuts.set(btn.dataset.rebind, e.key, e.ctrlKey || e.metaKey);
          document.removeEventListener("keydown", capture, true);
          Toast.success("Shortcut updated.");
          renderShortcuts();
        };
        document.addEventListener("keydown", capture, true);
      });
    });
  }

  qs("#changePasswordForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const current = qs("#cpCurrent").value;
    const next = qs("#cpNew").value;
    const confirm = qs("#cpConfirm").value;
    if (!current) { Toast.warning("Please enter your current password."); return; }
    if (next.length < 6) { Toast.warning("New password must be at least 6 characters."); return; }
    if (next !== confirm) { Toast.warning("New password and confirmation don't match."); return; }
    if (next === current) { Toast.warning("New password must be different from your current password."); return; }
    const btn = qs("#changePasswordForm button[type=submit]");
    btn.disabled = true;
    try {
      await AuthApi.changePassword(current, next);
      Toast.success("Password updated! Use your new password next time you sign in.");
      qs("#changePasswordForm").reset();
    } catch (err) {
      Toast.error(apiErrorMessage(err, "Could not update your password. Please check your current password and try again."));
    } finally {
      btn.disabled = false;
    }
  });

  qs("#btnExportAll").addEventListener("click", () => {
    Backup.exportAll();
    Toast.success("Backup file downloaded!");
  });

  qs("#btnImportAll").addEventListener("click", () => qs("#importFile").click());
  qs("#importFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ok = await confirmDialog({
      title: "Import backup",
      message: "This will overwrite all current data on this device with the contents of the backup file. Continue?",
      okText: "Import & Overwrite",
      danger: true
    });
    e.target.value = "";
    if (!ok) return;
    try {
      const result = await Backup.importFromFile(file);
      Toast.success(`Restored ${result.restoredTables} tables. Reloading...`);
      setTimeout(() => location.reload(), 900);
    } catch (err) {
      Toast.error(err.message || "Import failed.");
    }
  });

  qs("#btnResetAll").addEventListener("click", async () => {
    const ok = await confirmDialog({
      title: "Reset all data",
      message: "This permanently deletes every bus, trip, employee, and record on this device, and restores the original demo data. This cannot be undone. Continue?",
      okText: "Reset Everything",
      danger: true
    });
    if (!ok) return;
    try {
      await AdminApi.resetDemoData();
      await DB.resetAll();
      Toast.success("Data reset. Reloading...");
      setTimeout(() => location.reload(), 900);
    } catch (err) {
      Toast.error(apiErrorMessage(err, "Could not reset data. Please try again."));
    }
  });
}
