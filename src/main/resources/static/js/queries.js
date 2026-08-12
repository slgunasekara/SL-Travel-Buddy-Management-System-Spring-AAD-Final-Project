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

    // trip expenses attach to the date of their trip (LEFT JOIN on trip_id)
    const tripDateMap = {};
    DB.readAll("trips").forEach(t => tripDateMap[t.tripId] = t.tripDate);
    tripExpenses.forEach(e => {
      const d = tripDateMap[e.tripId];
      if (d && d >= fromDate && d <= toDate) bucket(d).tripExpenses += Number(e.amount) || 0;
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
    trips.forEach(t => {
      const ym = t.tripDate.slice(0, 7);
      if (!months[ym]) months[ym] = true;
    });
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
    return DB.readAll("trips")
      .filter(t => t.tripDate >= fromDate && t.tripDate <= toDate)
      .map(t => ({ tripId: t.tripId, busNumber: busNumber(t.busId), tripDate: t.tripDate, totalIncome: t.totalIncome }))
      .sort((a, b) => b.tripDate.localeCompare(a.tripDate));
  }

  function expenseReport(fromDate, toDate) {
    return DB.readAll("tripExpenses")
      .filter(e => e.date >= fromDate && e.date <= toDate)
      .map(e => ({ expenseDate: e.date, amount: e.amount, category: e.tripExpType }))
      .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
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

  return {
    bus, employee, trip, user, userName, busNumber, empName,
    dailyProfitByRange, summaryStats, allDailyProfit, monthlyProfit,
    dashboardSummary, last30DaysChart, reportSummary,
    incomeReport, expenseReport, salaryReport, tripReport
  };
})();
