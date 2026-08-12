/* =========================================================================
   backup.js — export every table to a single downloadable JSON file, and
   restore from one. Pure data plumbing; does not alter any table schema
   or business logic, just reads/writes via the existing DB helpers.
   ========================================================================= */

const Backup = (() => {
  function exportAll() {
    const payload = {
      app: "SL Travel Buddy",
      exportedAt: new Date().toISOString(),
      version: 1,
      tables: {}
    };
    DB.TABLES.forEach(t => { payload.tables[t] = DB.readAll(t); });

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sl-travel-buddy-backup-${DB.today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data || typeof data !== "object" || !data.tables) {
            reject(new Error("This doesn't look like a valid SL Travel Buddy backup file."));
            return;
          }
          let restoredTables = 0;
          // Awaited so every row in the file is actually confirmed synced
          // to the backend before this resolves — the caller reloads the
          // page shortly after, and a reload cancels any request still
          // in flight, which would otherwise silently drop rows.
          for (const t of DB.TABLES) {
            if (Array.isArray(data.tables[t])) {
              await DB.writeAll(t, data.tables[t]);
              restoredTables++;
            }
          }
          resolve({ restoredTables, exportedAt: data.exportedAt });
        } catch (err) {
          reject(new Error("Couldn't read that file — make sure it's a valid backup JSON."));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read the file."));
      reader.readAsText(file);
    });
  }

  return { exportAll, importFromFile };
})();
