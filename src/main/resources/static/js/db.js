/* =========================================================================
   db.js — backend-backed "database" layer for SL Travel Buddy Management
   System, now talking to the Spring Boot REST API (with Spring Security
   JWT) instead of localStorage.

   Design: every table is kept as an in-memory cache, populated from the
   backend once via DB.bootstrap() right after login. DB.readAll(table)
   returns straight from that cache — synchronously, exactly like before —
   so none of the 15+ page files that call DB.readAll()/DB.writeAll() had
   to change. DB.writeAll(table, newArr) diffs the new array against the
   cache to work out which rows were added / edited / removed, updates the
   cache immediately (so the UI reacts instantly, same as the old
   localStorage version), and fires the matching POST/PUT/DELETE calls to
   the backend in the background. Ids are still assigned client-side by
   DB.nextId() (same sequential scheme as before) and sent to the backend
   on create, so there is never an id-reconciliation step needed.
   ========================================================================= */

const DB = (() => {
  const TABLES = [
    "users", "buses", "employees", "trips", "tripEmployees", "tripExpenses",
    "employeeSalaries", "maintenance", "partPurchases", "otherServices",
    "events", "updatePrices", "customers", "accidents",
    "insurances", "insuranceClaims", "licenses", "busLoans", "loanPayments", "budgetCaps", "attendance", "busSaleRecords", "todos"
    // Note: passwordResetOtps is no longer a client-synced table — the
    // backend owns OTP records entirely via /v1/auth/forgot/**.
  ];

  const cache = {};
  TABLES.forEach(t => { cache[t] = []; });
  const seq = {}; // per-table auto-increment counter — bumps on every nextId() call,
                   // independent of cache contents, exactly like the original
                   // localStorage seq_<table> counter. This matters because some
                   // pages (e.g. assigning several crew slots on one Trip) call
                   // nextId() several times before a single writeAll(), so basing
                   // it purely on "max of cache + 1" would hand out the same id
                   // twice and blow up on the backend's primary key.
  let bootstrapped = false;

  function readAll(table) {
    return (cache[table] || []).slice();
  }

  function nextId(table) {
    const meta = RESOURCE_MAP[table];
    const idKey = meta ? meta.id : "id";
    let max = seq[table] || 0;
    (cache[table] || []).forEach(r => {
      const v = Number(r[idKey]);
      if (!isNaN(v) && v > max) max = v;
    });
    seq[table] = max + 1;
    return seq[table];
  }

  function writeAll(table, arr) {
    const meta = RESOURCE_MAP[table];
    const before = cache[table] || [];
    cache[table] = arr.slice(); // optimistic update — UI reads this immediately, same as before

    if (!meta) return Promise.resolve();
    const idKey = meta.id;
    const api = resourceApi(meta.base);

    const beforeMap = {};
    before.forEach(r => { beforeMap[r[idKey]] = r; });
    const afterIds = {};
    arr.forEach(r => { afterIds[r[idKey]] = true; });

    // Every regular page (crud.js, trips.js, etc.) calls DB.writeAll()
    // fire-and-forget, without awaiting it — that's intentional, single-row
    // edits should feel instant. But bulk operations like restoring a
    // backup fire dozens of these at once and then reload the page a
    // moment later — if that reload happens before the requests actually
    // land, the in-flight ones get cancelled and the restore is silently
    // incomplete. So this always returns a Promise that resolves once
    // every fired request has settled; callers that care (backup.js) can
    // await it, and everyone else can keep ignoring the return value
    // exactly as before.
    const pending = [];

    // Deletes — present before, gone now
    before.forEach(r => {
      if (!afterIds[r[idKey]]) {
        pending.push(api.delete(r[idKey]).catch(err => handleSyncError(table, err)));
      }
    });

    // Creates & updates
    arr.forEach(r => {
      const prev = beforeMap[r[idKey]];
      if (!prev) {
        pending.push(api.add(r).catch(err => handleSyncError(table, err)));
      } else if (JSON.stringify(prev) !== JSON.stringify(r)) {
        pending.push(api.update(r[idKey], r).catch(err => handleSyncError(table, err)));
      }
    });

    return Promise.all(pending);
  }

  function handleSyncError(table, err) {
    if (typeof Toast !== "undefined") {
      Toast.error(apiErrorMessage(err, "Failed to save your change to the server. Reloading data to stay in sync..."));
    }
    // Best-effort resync so the cache never permanently drifts from the server.
    reloadTable(table).catch(() => {});
  }

  function reloadTable(table) {
    const meta = RESOURCE_MAP[table];
    if (!meta) return Promise.resolve();
    return resourceApi(meta.base).getAll().then(res => {
      cache[table] = res.body || [];
      // Keep the reservation counter in sync with what the server actually
      // has (it only ever moves up, never down, so ids already handed out
      // locally this session stay valid).
      let max = seq[table] || 0;
      cache[table].forEach(r => {
        const v = Number(r[meta.id]);
        if (!isNaN(v) && v > max) max = v;
      });
      seq[table] = max;
    });
  }

  function nowISO() { return new Date().toISOString(); }
  function today() { return new Date().toISOString().slice(0, 10); }

  /** Fetches every table from the backend in parallel and fills the cache.
   *  Called once right after a page with data (dashboard.html) loads.
   *  "users" is Owner-only on the backend (Manage Users is an Owner-only
   *  page) — fetching it for a Manager/Admin session used to 403 and take
   *  the whole Promise.all() down with it, locking non-Owner users out of
   *  the entire app. It's now skipped for non-Owner sessions, and any
   *  other single table's failure is swallowed (logged, left empty)
   *  rather than sinking the whole bootstrap. */
  function bootstrap() {
    const user = (typeof Session !== "undefined") ? Session.currentUser() : null;
    const tablesToLoad = TABLES.filter(t => t !== "users" || (user && user.role === "Owner"));
    const loads = tablesToLoad.map(t => reloadTable(t).catch(err => {
      console.error("Failed to load table:", t, err);
    }));
    return Promise.all(loads).then(() => { bootstrapped = true; });
  }

  function isBootstrapped() { return bootstrapped; }

  // Kept for API compatibility with any code that still references it —
  // seeding is now the backend's job (DataSeeder), so this is a no-op.
  function seedIfEmpty() {}

  function resetAll() {
    // Local-only reset: clears the in-memory cache and forces a fresh
    // bootstrap from the backend (does not delete server data).
    TABLES.forEach(t => { cache[t] = []; seq[t] = 0; });
    bootstrapped = false;
    return bootstrap();
  }

  return { readAll, writeAll, nextId, nowISO, today, seedIfEmpty, resetAll, bootstrap, isBootstrapped, TABLES };
})();
