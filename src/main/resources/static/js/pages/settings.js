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

    <div class="card">
      <div class="settings-section">
        <h4>About</h4>
      </div>
      <p class="muted">SL Travel Buddy — Bus Management System (Web Edition). Logged in as
        <strong>${Fmt.escapeHtml(Session.currentUser().name)}</strong> (${Fmt.escapeHtml(Session.currentUser().role)}).</p>
    </div>`;

  qs("#btnLight").addEventListener("click", () => { Theme.set("light"); Toast.success("Switched to light mode."); });
  qs("#btnDark").addEventListener("click", () => { Theme.set("dark"); Toast.success("Switched to dark mode."); });

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
    DB.resetAll();
    Toast.success("Data reset. Reloading...");
    setTimeout(() => location.reload(), 900);
  });
}
