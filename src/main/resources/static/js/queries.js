/* =========================================================================
   queries.js — replicates the calculation logic found in the Java *Model
   classes (BusModel, DailyProfitModel, DashboardModel, ReportModel, etc.)
   operating over the localStorage tables instead of SQL joins.
   ========================================================================= */

const Q = (() => {

  function bus(id) { return DB.readAll("buses").find(b => b.busId === id); }
  function employee(id) { return DB.readAll("employees").find(e => e.empId === id); }
  function trip(id) { return DB.readAll("trips").find(t => t.tripId === id); }
  function user(id) { return DB.readAll("users").find(u => u.userId === id); }
  function userName(id) { const u = user(id); return u ? u.username : "-"; }
  function busNumber(id) { const b = bus(id); return b ? b.busNumber : "-"; }
  function empName(id) { const e = employee(id); return e ? e.empName : "-"; }

  /* ---- Per-day aggregation, mirrors DailyProfitModel SQL joins ---- */
  function dailyProfitByRange(fromDate, toDate) {
    const trips = DB.readAll("trips").filter(t => t.tripDate >= fromDate && t.tripDate <= toDate);
    const tripExpenses = DB.readAll("tripExpenses");
    const salaries = DB.readAll("employeeSalaries");
    const maint = DB.readAll("maintenance");
    const parts = DB.readAll("partPurchases");
    const services = DB.readAll("otherServices");

    const byDate = {};
    function bucket(date) {
      if (!byDate[date]) {
        byDate[date] = {
          date, totalIncome: 0, tripExpenses: 0, salaries: 0,
          maintenance: 0, partPurchases: 0, otherServices: 0, totalTrips: 0,
          tripIds: new Set()
        };
      }
      return byDate[date];
    }

    trips.forEach(t => {
      const b = bucket(t.tripDate);
      b.totalIncome += Number(t.totalIncome) || 0;
      b.tripIds.add(t.tripId);
    });

    // Event Bookings are NOT counted here — a private-hire booking is
    // already entered as its own Trip (Trip Category "PRIVATE_TRIP") with
    // its own income and Trip Expenses, so adding eventValue on top of
    // that would double-count the same job. Events.linkedTripId lets a
    // booking reference that Trip record for traceability instead.


    // trip expenses attach to the date of their trip (LEFT JOIN on trip_id)
    const tripDateMap = {};
    DB.readAll("trips").forEach(t => tripDateMap[t.tripId] = t.tripDate);
    tripExpenses.forEach(e => {
      const d = e.date || tripDateMap[e.tripId];
      if (d && d >= fromDate && d <= toDate) {
        bucket(d).tripExpenses += (Number(e.fuelAmount) || 0) + (Number(e.parkingAmount) || 0) + (Number(e.otherAmount) || 0);
      }
    });

    salaries.forEach(s => { if (s.date >= fromDate && s.date <= toDate) bucket(s.date).salaries += Number(s.amount) || 0; });
    maint.forEach(m => { if (m.serviceDate >= fromDate && m.serviceDate <= toDate) bucket(m.serviceDate).maintenance += Number(m.cost) || 0; });
    parts.forEach(p => { if (p.date >= fromDate && p.date <= toDate) bucket(p.date).partPurchases += Number(p.totalCost) || 0; });
    services.forEach(s => { if (s.date >= fromDate && s.date <= toDate) bucket(s.date).otherServices += Number(s.cost) || 0; });

    return Object.values(byDate).map(b => {
      const totalExpenses = b.tripExpenses + b.salaries + b.maintenance + b.partPurchases + b.otherServices;
      return {
        date: b.date,
        totalIncome: b.totalIncome,
        tripExpenses: b.tripExpenses,
        salaries: b.salaries,
        maintenance: b.maintenance,
        partPurchases: b.partPurchases,
        otherServices: b.otherServices,
        totalExpenses,
        netProfit: b.totalIncome - totalExpenses,
        totalTrips: b.tripIds.size
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
  }

  function summaryStats(fromDate, toDate) {
    const rows = dailyProfitByRange(fromDate, toDate);
    const sum = (k) => rows.reduce((acc, r) => acc + r[k], 0);
    return {
      totalIncome: sum("totalIncome"),
      tripExpenses: sum("tripExpenses"),
      salaries: sum("salaries"),
      maintenance: sum("maintenance"),
      partPurchases: sum("partPurchases"),
      otherServices: sum("otherServices"),
      totalExpenses: sum("totalExpenses"),
      netProfit: sum("netProfit"),
      totalTrips: sum("totalTrips")
    };
  }

  function allDailyProfit() {
    const trips = DB.readAll("trips");
    if (trips.length === 0) return [];
    const min = trips.reduce((m, t) => t.tripDate < m ? t.tripDate : m, trips[0].tripDate);
    const max = trips.reduce((m, t) => t.tripDate > m ? t.tripDate : m, trips[0].tripDate);
    return dailyProfitByRange(min, max);
  }

  function monthlyProfit(year) {
    const trips = DB.readAll("trips").filter(t => t.tripDate.startsWith(String(year)));
    const months = {};
    trips.forEach(t => { months[t.tripDate.slice(0, 7)] = true; });
    return Object.keys(months).sort().reverse().map(ym => {
      const firstDay = ym + "-01";
      const lastDay = new Date(Number(ym.slice(0,4)), Number(ym.slice(5,7)), 0).toISOString().slice(0,10);
      const s = summaryStats(firstDay, lastDay);
      return { month: ym, ...s };
    });
  }

  /* ---- Dashboard summary ---- */
  function dashboardSummary() {
    const buses = DB.readAll("buses");
    const trips = DB.readAll("trips");
    const employees = DB.readAll("employees");
    const all = allDailyProfit();
    const totalIncome = all.reduce((a, r) => a + r.totalIncome, 0);
    const totalExpenses = all.reduce((a, r) => a + r.totalExpenses, 0);
    return {
      totalBuses: buses.filter(b => b.busStatus === "Active").length,
      totalTrips: trips.length,
      totalEmployees: employees.filter(e => e.empStatus === "ACTIVE").length,
      totalIncome, totalExpenses,
      netProfit: totalIncome - totalExpenses
    };
  }

  function last30DaysChart() {
    const today = new Date();
    const start = new Date(today); start.setDate(start.getDate() - 29);
    const fromDate = start.toISOString().slice(0, 10);
    const toDate = today.toISOString().slice(0, 10);
    const rows = dailyProfitByRange(fromDate, toDate);
    const map = {}; rows.forEach(r => map[r.date] = r);
    const out = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const r = map[key];
      out.push({
        date: key,
        label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" }),
        income: r ? r.totalIncome : 0,
        expense: r ? r.totalExpenses : 0,
        profit: r ? r.netProfit : 0
      });
    }
    return out;
  }

  /* ---- Reports (income / expenses / salary / trip) for a date range ---- */
  function reportSummary(fromDate, toDate) {
    const s = summaryStats(fromDate, toDate);
    return {
      totalIncome: s.totalIncome,
      totalExpenses: s.totalExpenses,
      totalSalary: s.salaries,
      netProfit: s.netProfit,
      totalTrips: s.totalTrips
    };
  }

  function incomeReport(fromDate, toDate) {
    // Event Bookings aren't listed here — a private-hire booking is
    // recorded as its own Trip (Trip Category "PRIVATE_TRIP"), so its
    // income already appears via the Trip rows below.
    return DB.readAll("trips")
      .filter(t => t.tripDate >= fromDate && t.tripDate <= toDate)
      .map(t => ({ tripId: t.tripId, busNumber: busNumber(t.busId), tripDate: t.tripDate, totalIncome: t.totalIncome }))
      .sort((a, b) => b.tripDate.localeCompare(a.tripDate));
  }

  function expenseReport(fromDate, toDate) {
    // Every non-salary expense category (Salary has its own dedicated
    // Salary Report tab) so the rows here add up to the same "Total
    // Expenses minus Salary" figure the Overview/summary cards use —
    // previously this only listed Trip Expenses (Fuel/Parking/Other)
    // and silently left out Maintenance, Parts and Other Services.
    const rows = [];
    DB.readAll("tripExpenses")
      .filter(e => e.date >= fromDate && e.date <= toDate)
      .forEach(e => {
        if (Number(e.fuelAmount) > 0) rows.push({ expenseDate: e.date, amount: e.fuelAmount, category: "FUEL" });
        if (Number(e.parkingAmount) > 0) rows.push({ expenseDate: e.date, amount: e.parkingAmount, category: "PARKING" });
        if (Number(e.otherAmount) > 0) rows.push({ expenseDate: e.date, amount: e.otherAmount, category: "TRIP OTHER" });
      });
    DB.readAll("maintenance")
      .filter(m => m.serviceDate >= fromDate && m.serviceDate <= toDate)
      .forEach(m => { if (Number(m.cost) > 0) rows.push({ expenseDate: m.serviceDate, amount: m.cost, category: "MAINTENANCE" }); });
    DB.readAll("partPurchases")
      .filter(p => p.date >= fromDate && p.date <= toDate)
      .forEach(p => { if (Number(p.totalCost) > 0) rows.push({ expenseDate: p.date, amount: p.totalCost, category: "PARTS" }); });
    DB.readAll("otherServices")
      .filter(s => s.date >= fromDate && s.date <= toDate)
      .forEach(s => { if (Number(s.cost) > 0) rows.push({ expenseDate: s.date, amount: s.cost, category: "OTHER SERVICES" }); });
    return rows.sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
  }

  function salaryReport(fromDate, toDate) {
    return DB.readAll("employeeSalaries")
      .filter(s => s.date >= fromDate && s.date <= toDate)
      .map(s => ({ empId: s.empId, employeeName: empName(s.empId), salaryDate: s.date, amount: s.amount }))
      .sort((a, b) => b.salaryDate.localeCompare(a.salaryDate));
  }

  function tripReport(fromDate, toDate) {
    return DB.readAll("trips")
      .filter(t => t.tripDate >= fromDate && t.tripDate <= toDate)
      .map(t => ({ tripId: t.tripId, tripDate: t.tripDate, busNumber: busNumber(t.busId), route: `${t.startLocation} → ${t.endLocation}`, category: t.tripCategory }))
      .sort((a, b) => b.tripDate.localeCompare(a.tripDate));
  }

  /* ---- Bus service (maintenance) reminders — mirrors insurance/license alert logic ---- */
  const SERVICE_DUE_DAYS = 180;   // recommend a service every ~6 months
  const SERVICE_DUE_KM = 5000;    // or every 5,000 km, whichever first

  function serviceReminders() {
    const buses = DB.readAll("buses").filter(b => b.busStatus === "Active");
    const maint = DB.readAll("maintenance");
    const alerts = [];
    const today = new Date();

    buses.forEach(b => {
      const history = maint.filter(m => m.busId === b.busId && m.serviceDate)
        .sort((a, c) => c.serviceDate.localeCompare(a.serviceDate));
      const last = history[0];
      const currentMileage = Number(b.currentMileage) || 0;

      if (!last) {
        if (currentMileage >= SERVICE_DUE_KM) {
          alerts.push({ type: "warning", text: `${b.busNumber}: No maintenance on record and mileage is ${currentMileage.toLocaleString()} km — a first service is recommended.` });
        }
        return;
      }
      const daysSince = Math.floor((today - new Date(last.serviceDate)) / (1000 * 60 * 60 * 24));
      const kmSince = currentMileage - (Number(last.mileage) || 0);

      if (daysSince > SERVICE_DUE_DAYS || kmSince > SERVICE_DUE_KM) {
        alerts.push({ type: "danger", text: `${b.busNumber}: Service overdue — last serviced ${Fmt.date(last.serviceDate)} (${daysSince} days / ${Math.max(0, kmSince).toLocaleString()} km ago).` });
      } else if (daysSince > SERVICE_DUE_DAYS - 30 || kmSince > SERVICE_DUE_KM - 1000) {
        alerts.push({ type: "warning", text: `${b.busNumber}: Service due soon — last serviced ${Fmt.date(last.serviceDate)} (${daysSince} days / ${Math.max(0, kmSince).toLocaleString()} km ago).` });
      }
    });
    return alerts;
  }

  /* ---- Combined fleet & document alerts, used by the dashboard panel AND the topbar notification bell ---- */
  function fleetAlerts() {
    const buses = DB.readAll("buses");
    const soon = new Date(); soon.setDate(soon.getDate() + 30);
    const alerts = [];
    buses.forEach(b => {
      if (b.insuranceExpiryDate) {
        const d = new Date(b.insuranceExpiryDate);
        if (d < new Date()) alerts.push({ type: "danger", text: `${b.busNumber}: Insurance expired on ${Fmt.date(b.insuranceExpiryDate)}` });
        else if (d < soon) alerts.push({ type: "warning", text: `${b.busNumber}: Insurance expiring on ${Fmt.date(b.insuranceExpiryDate)}` });
      }
      if (b.licenseRenewalDate) {
        const d = new Date(b.licenseRenewalDate);
        if (d < new Date()) alerts.push({ type: "danger", text: `${b.busNumber}: License renewal overdue since ${Fmt.date(b.licenseRenewalDate)}` });
        else if (d < soon) alerts.push({ type: "warning", text: `${b.busNumber}: License renewal due ${Fmt.date(b.licenseRenewalDate)}` });
      }
    });
    return [...alerts, ...serviceReminders()];
  }

  /* ---- Top routes / top drivers leaderboards ---- */
  function topRoutes(fromDate, toDate, limit = 5) {
    // Event Bookings excluded — their route/income already shows up via
    // the linked "PRIVATE_TRIP" Trip record, so counting both would
    // double the income for the same job.
    const trips = DB.readAll("trips").filter(t => t.tripDate >= fromDate && t.tripDate <= toDate);
    const map = {};
    trips.forEach(t => {
      const key = `${t.startLocation} → ${t.endLocation}`;
      if (!map[key]) map[key] = { route: key, trips: 0, income: 0 };
      map[key].trips += 1;
      map[key].income += Number(t.totalIncome) || 0;
    });
    return Object.values(map).sort((a, b) => b.income - a.income).slice(0, limit);
  }

  function topDrivers(fromDate, toDate, limit = 5) {
    const trips = DB.readAll("trips").filter(t => t.tripDate >= fromDate && t.tripDate <= toDate);
    const tripIds = new Set(trips.map(t => t.tripId));
    const tripIncomeById = {}; trips.forEach(t => tripIncomeById[t.tripId] = Number(t.totalIncome) || 0);
    const assignments = DB.readAll("tripEmployees").filter(te => tripIds.has(te.tripId) && te.roleInTrip === "DRIVER");
    const map = {};
    assignments.forEach(te => {
      if (!map[te.empId]) map[te.empId] = { empId: te.empId, name: empName(te.empId), trips: 0, income: 0 };
      map[te.empId].trips += 1;
      map[te.empId].income += tripIncomeById[te.tripId] || 0;
    });
    return Object.values(map).sort((a, b) => b.trips - a.trips).slice(0, limit);
  }

  // Ranked by AVERAGE income per trip (total income from their trips / trip count),
  // not by trip count — the conductor who brings in the most per trip on average tops the list.
  function topConductors(fromDate, toDate, limit = 5) {
    const trips = DB.readAll("trips").filter(t => t.tripDate >= fromDate && t.tripDate <= toDate);
    const tripIds = new Set(trips.map(t => t.tripId));
    const tripIncomeById = {}; trips.forEach(t => tripIncomeById[t.tripId] = Number(t.totalIncome) || 0);
    const assignments = DB.readAll("tripEmployees").filter(te => tripIds.has(te.tripId) && te.roleInTrip === "CONDUCTOR");
    const map = {};
    assignments.forEach(te => {
      if (!map[te.empId]) map[te.empId] = { empId: te.empId, name: empName(te.empId), trips: 0, income: 0 };
      map[te.empId].trips += 1;
      map[te.empId].income += tripIncomeById[te.tripId] || 0;
    });
    return Object.values(map)
      .map(c => ({ ...c, avgIncome: c.trips > 0 ? c.income / c.trips : 0 }))
      .sort((a, b) => b.avgIncome - a.avgIncome)
      .slice(0, limit);
  }

  /* ---- Month-over-month comparison ---- */
  function momComparison() {
    const now = new Date();
    const curStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const curEnd = now.toISOString().slice(0, 10);
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevStart = prevMonthDate.toISOString().slice(0, 10);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);

    const cur = summaryStats(curStart, curEnd);
    const prev = summaryStats(prevStart, prevEnd);

    function pctChange(curV, prevV) {
      if (prevV === 0) return curV === 0 ? 0 : 100;
      return ((curV - prevV) / Math.abs(prevV)) * 100;
    }

    return {
      curLabel: now.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      prevLabel: prevMonthDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      income: { cur: cur.totalIncome, prev: prev.totalIncome, pct: pctChange(cur.totalIncome, prev.totalIncome) },
      expenses: { cur: cur.totalExpenses, prev: prev.totalExpenses, pct: pctChange(cur.totalExpenses, prev.totalExpenses) },
      profit: { cur: cur.netProfit, prev: prev.netProfit, pct: pctChange(cur.netProfit, prev.netProfit) },
      trips: { cur: cur.totalTrips, prev: prev.totalTrips, pct: pctChange(cur.totalTrips, prev.totalTrips) }
    };
  }

  /* ---- Expense category breakdown, for the pie chart on Reports ---- */
  function expenseBreakdown(fromDate, toDate) {
    const s = summaryStats(fromDate, toDate);
    return [
      { label: "Trip Expenses", value: s.tripExpenses, color: "#e0663e" },
      { label: "Salaries", value: s.salaries, color: "#3565e8" },
      { label: "Maintenance", value: s.maintenance, color: "#c98a1f" },
      { label: "Parts", value: s.partPurchases, color: "#7454c7" },
      { label: "Other Services", value: s.otherServices, color: "#0c8a86" }
    ].filter(x => x.value > 0);
  }

  /* ---- Customers: bookings linked by NIC match against Event records,
     falling back to Contact Number when the customer has no NIC on file
     (NIC is optional on the Customers page) so their booking count isn't
     stuck at zero just because they were added without one. ---- */
  function customerBookingsCount(nic, contact) {
    const events = DB.readAll("events");
    if (nic) {
      const byNic = events.filter(e => e.customerNic && e.customerNic.trim().toLowerCase() === nic.trim().toLowerCase()).length;
      if (byNic > 0) return byNic;
    }
    if (contact) {
      return events.filter(e => e.customerContact && e.customerContact.trim() === contact.trim()).length;
    }
    return 0;
  }

  /* ---- Stable Driver 1 / Driver 2 resolution for a trip's crew.
     tripEmployees rows carry a `driverSlot` (1 or 2) for DRIVER-role
     records so the two driver seats keep their identity across edits.
     Older records saved before this existed have no driverSlot, so as
     a fallback (only used when NONE of the trip's drivers have a slot
     yet) we fall back to insertion order — the first driver added
     stays "Driver 1". Once the crew is saved again it gets a real slot
     and stops relying on the fallback. ---- */
  function driverSlotsForTrip(tripId) {
    const drivers = DB.readAll("tripEmployees").filter(te => te.tripId === tripId && te.roleInTrip === "DRIVER");
    const hasSlotData = drivers.some(d => d.driverSlot === 1 || d.driverSlot === 2);
    if (hasSlotData) {
      return {
        driver1: drivers.find(d => d.driverSlot === 1) || null,
        driver2: drivers.find(d => d.driverSlot === 2) || null
      };
    }
    const sorted = [...drivers].sort((a, b) => a.tripEmpId - b.tripEmpId);
    return { driver1: sorted[0] || null, driver2: sorted[1] || null };
  }

  return {
    bus, employee, trip, user, userName, busNumber, empName,
    dailyProfitByRange, summaryStats, allDailyProfit, monthlyProfit,
    dashboardSummary, last30DaysChart, reportSummary,
    incomeReport, expenseReport, salaryReport, tripReport,
    serviceReminders, fleetAlerts, topRoutes, topDrivers, topConductors, momComparison,
    expenseBreakdown, customerBookingsCount, driverSlotsForTrip
  };
})();
