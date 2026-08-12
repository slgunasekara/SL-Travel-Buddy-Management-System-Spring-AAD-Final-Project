/* =========================================================================
   db.js — localStorage-backed "database" layer for SL Travel Buddy
   Management System (web edition).

   Mirrors the original JavaFX + MySQL desktop app's schema (see bus_system.sql)
   Every table is stored as a JSON array under key `bms_<table>`.
   Auto-increment counters are stored under `bms_seq_<table>`.
   ========================================================================= */

const DB = (() => {
  const PREFIX = "bms_";

  const TABLES = [
    "users", "buses", "employees", "trips", "tripEmployees", "tripExpenses",
    "employeeSalaries", "maintenance", "partPurchases", "otherServices",
    "events", "updatePrices", "passwordResetOtps"
  ];

  function key(table) { return PREFIX + table; }
  function seqKey(table) { return PREFIX + "seq_" + table; }

  function readAll(table) {
    const raw = localStorage.getItem(key(table));
    return raw ? JSON.parse(raw) : [];
  }

  function writeAll(table, arr) {
    localStorage.setItem(key(table), JSON.stringify(arr));
  }

  function nextId(table) {
    const k = seqKey(table);
    let n = parseInt(localStorage.getItem(k) || "0", 10) + 1;
    localStorage.setItem(k, String(n));
    return n;
  }

  function nowISO() { return new Date().toISOString(); }
  function today() { return new Date().toISOString().slice(0, 10); }

  /* ---------------------------------------------------------------------
     Seeding — mirrors bus_system.sql sample inserts exactly.
     --------------------------------------------------------------------- */
  function seedIfEmpty() {
    if (localStorage.getItem(PREFIX + "seeded")) return;

    // Users (from bus_system.sql)
    writeAll("users", [
      { userId: 1, username: "amg", password: "amg123", name: "Praveen Gunasekara", role: "Owner", contact: "0771194695", nic: "200318900123", email: "praveengunasekara7@gmail.com", createdAt: nowISO() },
      { userId: 2, username: "sampath", password: "sampath123", name: "Sampath Kumara", role: "Manager", contact: "0771234567", nic: "200184529425", email: "mendisdanushka886@gmail.com", createdAt: nowISO() }
    ]);
    localStorage.setItem(seqKey("users"), "2");

    // Employees (from bus_system.sql)
    writeAll("employees", [
      { empId: 1, empCategory: "DRIVER", empName: "Sunil Perera", address: "Colombo", contactNo: "0771234567", nicNo: "901234567V", ntcNo: "NTC12345", drivingLicenceNo: "B1234567", joinDate: "2022-05-10", exitDate: null, empStatus: "ACTIVE", createdBy: 1 },
      { empId: 2, empCategory: "DRIVER", empName: "Nimal Fernando", address: "Kandy", contactNo: "0723456789", nicNo: "901987654V", ntcNo: "NTC23456", drivingLicenceNo: "B2345678", joinDate: "2021-09-15", exitDate: null, empStatus: "ACTIVE", createdBy: 1 },
      { empId: 3, empCategory: "DRIVER", empName: "Mahesh Silva", address: "Kurunegala", contactNo: "0713456789", nicNo: "925678901V", ntcNo: "NTC45678", drivingLicenceNo: "B3456789", joinDate: "2021-07-30", exitDate: null, empStatus: "ACTIVE", createdBy: 1 },
      { empId: 4, empCategory: "DRIVER", empName: "Chamara Senanayake", address: "Anuradhapura", contactNo: "0714567890", nicNo: "927890123V", ntcNo: "NTC56789", drivingLicenceNo: "B4567890", joinDate: "2023-02-14", exitDate: null, empStatus: "ACTIVE", createdBy: 1 }
    ]);
    localStorage.setItem(seqKey("employees"), "4");

    // Update_Prices (from bus_system.sql)
    writeAll("updatePrices", [
      { updatePricesId: 1, updateType: "FUEL", changeType: "INCREMENT", previousValue: 420.00, newValue: 450.00, changeAmount: 30.00, percentageChange: 7.14, changeDate: "2025-01-10", description: "Fuel price increased by government", createdBy: 1 },
      { updatePricesId: 2, updateType: "TICKET", changeType: "DECREMENT", previousValue: 100.00, newValue: 90.00, changeAmount: -10.00, percentageChange: -10.00, changeDate: "2025-01-10", description: "Discount for holiday season", createdBy: 1 }
    ]);
    localStorage.setItem(seqKey("updatePrices"), "2");

    // Empty operational tables — user builds these up through the app,
    // exactly as the original DB starts with no buses/trips/etc.
    writeAll("buses", []);
    writeAll("trips", []);
    writeAll("tripEmployees", []);
    writeAll("tripExpenses", []);
    writeAll("employeeSalaries", []);
    writeAll("maintenance", []);
    writeAll("partPurchases", []);
    writeAll("otherServices", []);
    writeAll("events", []);
    writeAll("passwordResetOtps", []);

    localStorage.setItem(PREFIX + "seeded", "1");
  }

  function resetAll() {
    TABLES.forEach(t => { localStorage.removeItem(key(t)); localStorage.removeItem(seqKey(t)); });
    localStorage.removeItem(PREFIX + "seeded");
    localStorage.removeItem(PREFIX + "session");
    seedIfEmpty();
  }

  return { readAll, writeAll, nextId, nowISO, today, seedIfEmpty, resetAll, TABLES };
})();

DB.seedIfEmpty();
