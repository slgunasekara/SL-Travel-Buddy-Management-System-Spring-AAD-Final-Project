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
    const events = DB.readAll("events").filter(e => e.eventDate && e.eventDate >= fromDate && e.eventDate <= toDate);
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

    // Event bookings (private hire / charter) are NOT added to totalIncome
    // here. A charter is already tracked as its own PRIVATE_TRIP record in
    // the Trips module (that's where its income counts), and an Event
    // Booking can optionally reference that same trip via linkedTripId —
    // so adding eventValue here again would double-count the same income.
    // (Reports → Income Report still lists event bookings on their own
    // row so you can see booking value at a glance — it just isn't summed
    // into totalIncome/netProfit a second time.)

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
    const events = DB.readAll("events").filter(e => e.eventDate && e.eventDate.startsWith(String(year)));
    const months = {};
    trips.forEach(t => {
      const ym = t.tripDate.slice(0, 7);
      if (!months[ym]) months[ym] = true;
    });
    events.forEach(e => {
      const ym = e.eventDate.slice(0, 7);
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
    const tripRows = DB.readAll("trips")
      .filter(t => t.tripDate >= fromDate && t.tripDate <= toDate)
      .map(t => ({ type: "Trip", refId: t.tripId, reference: busNumber(t.busId), date: t.tripDate, income: Number(t.totalIncome) || 0, linkedTripId: null }));
    const eventRows = DB.readAll("events")
      .filter(e => e.eventDate && e.eventDate >= fromDate && e.eventDate <= toDate)
      .map(e => ({ type: "Event", refId: e.eventId, reference: `${e.startLocation} → ${e.endLocation}`, date: e.eventDate, income: Number(e.eventValue) || 0, linkedTripId: e.linkedTripId || null }));
    return [...tripRows, ...eventRows].sort((a, b) => b.date.localeCompare(a.date));
  }

  function expenseReport(fromDate, toDate) {
    const rows = [];
    DB.readAll("tripExpenses")
      .filter(e => e.date >= fromDate && e.date <= toDate)
      .forEach(e => {
        if (Number(e.fuelAmount) > 0) rows.push({ expenseDate: e.date, amount: e.fuelAmount, category: "FUEL" });
        if (Number(e.parkingAmount) > 0) rows.push({ expenseDate: e.date, amount: e.parkingAmount, category: "PARKING" });
        if (Number(e.otherAmount) > 0) rows.push({ expenseDate: e.date, amount: e.otherAmount, category: "TRIP OTHER" });
      });
    // Salary is deliberately NOT listed here — it has its own dedicated
    // "Salary Report" tab, so listing it here too would just duplicate the
    // same records across two tabs. (It's still included in the Total
    // Expenses figure on the Overview tab, which needs the full picture.)
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

  /** Profit per bus over a date range — income minus fuel/parking/trip-other,
   *  maintenance, part purchases, and other-services costs attributable to
   *  that bus. Salary is fleet-wide (not reliably bus-attributable) so it's
   *  deliberately excluded here too, same as expenseReport(). Used by the
   *  Reports → "Profit per Bus" tab and Bus Comparison Mode. */
  function profitPerBus(fromDate, toDate) {
    const trips = DB.readAll("trips").filter(t => t.tripDate >= fromDate && t.tripDate <= toDate);
    const tripBusOf = {};
    trips.forEach(t => { tripBusOf[t.tripId] = t.busId; });

    const perBus = {};
    const ensure = (busId) => perBus[busId] || (perBus[busId] = { busId, income: 0, fuel: 0, parking: 0, tripOther: 0, maintenance: 0, parts: 0, otherServices: 0, trips: 0 });

    trips.forEach(t => { const b = ensure(t.busId); b.income += Number(t.totalIncome) || 0; b.trips += 1; });

    DB.readAll("tripExpenses").filter(e => e.date >= fromDate && e.date <= toDate).forEach(e => {
      const busId = tripBusOf[e.tripId];
      if (busId === undefined) return; // trip outside the selected range
      const b = ensure(busId);
      b.fuel += Number(e.fuelAmount) || 0;
      b.parking += Number(e.parkingAmount) || 0;
      b.tripOther += Number(e.otherAmount) || 0;
    });

    DB.readAll("maintenance").filter(m => m.serviceDate >= fromDate && m.serviceDate <= toDate).forEach(m => {
      ensure(m.busId).maintenance += Number(m.cost) || 0;
    });
    DB.readAll("partPurchases").filter(p => p.date >= fromDate && p.date <= toDate).forEach(p => {
      ensure(p.busId).parts += Number(p.totalCost) || 0;
    });
    DB.readAll("otherServices").filter(s => s.date >= fromDate && s.date <= toDate && s.busId).forEach(s => {
      ensure(s.busId).otherServices += Number(s.cost) || 0;
    });

    return Object.values(perBus).map(b => {
      const expenses = b.fuel + b.parking + b.tripOther + b.maintenance + b.parts + b.otherServices;
      return { ...b, busNumber: busNumber(b.busId), expenses, profit: b.income - expenses };
    }).sort((a, b) => b.profit - a.profit);
  }

  /** Bus utilization — % of days in range where a bus had at least one trip. */
  function busUtilization(fromDate, toDate) {
    const totalDays = Math.max(1, Math.round((new Date(toDate) - new Date(fromDate)) / 86400000) + 1);
    const activeDaysByBus = {};
    DB.readAll("trips").filter(t => t.tripDate >= fromDate && t.tripDate <= toDate).forEach(t => {
      (activeDaysByBus[t.busId] || (activeDaysByBus[t.busId] = new Set())).add(t.tripDate);
    });
    return DB.readAll("buses").map(b => {
      const activeDays = (activeDaysByBus[b.busId] || new Set()).size;
      return { busId: b.busId, busNumber: b.busNumber, activeDays, totalDays, utilizationPct: Math.round((activeDays / totalDays) * 100) };
    }).sort((a, b) => b.utilizationPct - a.utilizationPct);
  }

  /** Seasonal Demand Insights — average trips + income per calendar month
   *  across all years on file, so a fleet owner can see which months
   *  (e.g. April, December) historically run busiest and plan around it. */
  function seasonalDemandInsights() {
    const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const byMonth = {}; // "0".."11" -> { trips: n, income: n, years: Set }
    DB.readAll("trips").forEach(t => {
      if (!t.tripDate) return;
      const d = new Date(t.tripDate);
      const m = d.getMonth();
      if (!byMonth[m]) byMonth[m] = { trips: 0, income: 0, years: new Set() };
      byMonth[m].trips += 1;
      byMonth[m].income += Number(t.totalIncome) || 0;
      byMonth[m].years.add(d.getFullYear());
    });
    const rows = MONTH_NAMES.map((name, m) => {
      const stats = byMonth[m] || { trips: 0, income: 0, years: new Set() };
      const yearsSeen = Math.max(1, stats.years.size);
      return { month: name, avgTrips: Math.round(stats.trips / yearsSeen), avgIncome: Math.round(stats.income / yearsSeen), totalTrips: stats.trips };
    });
    const withData = rows.filter(r => r.totalTrips > 0);
    if (!withData.length) return { rows, busiest: [], quietest: [] };
    const avgOfAvgs = withData.reduce((s, r) => s + r.avgTrips, 0) / withData.length;
    const busiest = withData.filter(r => r.avgTrips > avgOfAvgs * 1.15).map(r => r.month);
    const quietest = withData.filter(r => r.avgTrips < avgOfAvgs * 0.85).map(r => r.month);
    return { rows, busiest, quietest };
  }
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

  /** Latest (by expireDate) ACTIVE Insurance/License row for a bus — used
   *  by the alerts, the Insurance Claim auto-fill, and Renewal Cost Summary. */
  function latestInsurance(busId) {
    return DB.readAll("insurances").filter(i => i.busId === busId)
      .sort((a, b) => (b.expireDate || "").localeCompare(a.expireDate || ""))[0] || null;
  }
  function latestLicense(busId) {
    return DB.readAll("licenses").filter(l => l.busId === busId)
      .sort((a, b) => (b.expireDate || "").localeCompare(a.expireDate || ""))[0] || null;
  }

  /** Category Budget Caps — current calendar month's actual spend per
   *  category vs the configured monthly cap (Settings → Budget Caps).
   *  Feeds fleetAlerts() same as everything else here. */
  function budgetCapAlerts() {
    const caps = DB.readAll("budgetCaps");
    if (!caps.length) return [];
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;

    const spendByCategory = { FUEL: 0, MAINTENANCE: 0, PARTS: 0 };
    DB.readAll("tripExpenses").filter(e => e.date >= monthStart && e.date <= monthEnd)
      .forEach(e => { spendByCategory.FUEL += Number(e.fuelAmount) || 0; });
    DB.readAll("maintenance").filter(m => m.serviceDate >= monthStart && m.serviceDate <= monthEnd)
      .forEach(m => { spendByCategory.MAINTENANCE += Number(m.cost) || 0; });
    DB.readAll("partPurchases").filter(p => p.date >= monthStart && p.date <= monthEnd)
      .forEach(p => { spendByCategory.PARTS += Number(p.totalCost) || 0; });

    const alerts = [];
    caps.forEach(cap => {
      const spent = spendByCategory[cap.category] || 0;
      const cap_ = Number(cap.monthlyCap) || 0;
      if (cap_ <= 0) return;
      const pct = spent / cap_;
      if (pct >= 1) alerts.push({ type: "danger", text: `${cap.category} spending this month (${Fmt.money(spent)}) has passed its ${Fmt.money(cap_)} budget cap` });
      else if (pct >= 0.85) alerts.push({ type: "warning", text: `${cap.category} spending this month (${Fmt.money(spent)}) is approaching its ${Fmt.money(cap_)} budget cap` });
    });
    return alerts;
  }

  /** Tyre/Battery Lifecycle Tracking — part purchases with an expected
   *  lifespan (months) that's due or overdue for replacement. */
  function partLifecycleAlerts() {
    const soon = new Date(); soon.setDate(soon.getDate() + 30);
    const alerts = [];
    DB.readAll("partPurchases").filter(p => p.expectedLifespanMonths && p.date).forEach(p => {
      const dueDate = new Date(p.date);
      dueDate.setMonth(dueDate.getMonth() + Number(p.expectedLifespanMonths));
      const num = busNumber(p.busId);
      if (dueDate < new Date()) alerts.push({ type: "danger", text: `${num}: ${p.partName} is past its expected ${p.expectedLifespanMonths}-month lifespan (fitted ${Fmt.date(p.date)}) — consider replacing` });
      else if (dueDate < soon) alerts.push({ type: "warning", text: `${num}: ${p.partName} approaching its expected replacement date (${Fmt.date(dueDate.toISOString().slice(0, 10))})` });
    });
    return alerts;
  }

  /* ---- Combined fleet & document alerts, used by the dashboard panel AND the topbar notification bell.
     Sourced from the Insurance/License page (Financial → License & Insurance) rather than the old
     Bus.insuranceExpiryDate/licenseRenewalDate fields, which have been retired from Manage Bus. */
  function fleetAlerts() {
    const soon = new Date(); soon.setDate(soon.getDate() + 30);
    const alerts = [];
    DB.readAll("insurances").forEach(i => {
      if (!i.expireDate) return;
      const d = new Date(i.expireDate);
      const num = busNumber(i.busId);
      if (d < new Date()) alerts.push({ type: "danger", text: `${num}: Insurance expired on ${Fmt.date(i.expireDate)}` });
      else if (d < soon) alerts.push({ type: "warning", text: `${num}: Insurance expiring on ${Fmt.date(i.expireDate)}` });
    });
    DB.readAll("licenses").forEach(l => {
      if (!l.expireDate) return;
      const d = new Date(l.expireDate);
      const num = busNumber(l.busId);
      if (d < new Date()) alerts.push({ type: "danger", text: `${num}: License renewal overdue since ${Fmt.date(l.expireDate)}` });
      else if (d < soon) alerts.push({ type: "warning", text: `${num}: License renewal due ${Fmt.date(l.expireDate)}` });
    });
    return [...alerts, ...serviceReminders(), ...tripLossAlerts(), ...budgetCapAlerts(), ...partLifecycleAlerts()];
  }

  /* ---- Top routes / top drivers leaderboards ---- */
  function topRoutes(fromDate, toDate, limit = 5) {
    const map = {};
    DB.readAll("trips").filter(t => t.tripDate >= fromDate && t.tripDate <= toDate).forEach(t => {
      const key = `${t.startLocation} → ${t.endLocation}`;
      if (!map[key]) map[key] = { route: key, occurrences: 0, income: 0 };
      map[key].occurrences += 1;
      map[key].income += Number(t.totalIncome) || 0;
    });
    // Event bookings (charters/private hires) count toward how often a
    // route is serviced, but NOT toward its income here — a charter's
    // income is already counted once, via its own PRIVATE_TRIP trip
    // record above (optionally linked from the Event Booking). Adding
    // eventValue on top of that would double-count the same money.
    DB.readAll("events").filter(e => e.eventDate && e.eventDate >= fromDate && e.eventDate <= toDate).forEach(e => {
      const key = `${e.startLocation} → ${e.endLocation}`;
      if (!map[key]) map[key] = { route: key, occurrences: 0, income: 0 };
      map[key].occurrences += 1;
    });
    return Object.values(map).sort((a, b) => b.income - a.income).slice(0, limit);
  }

  function topDrivers(fromDate, toDate, limit = 5) {
    const trips = DB.readAll("trips").filter(t => t.tripDate >= fromDate && t.tripDate <= toDate);
    const tripIds = new Set(trips.map(t => t.tripId));
    const tripIncomeById = {}; trips.forEach(t => tripIncomeById[t.tripId] = Number(t.totalIncome) || 0);
    const assignments = DB.readAll("tripEmployees").filter(te => tripIds.has(te.tripId) && (te.roleInTrip === "DRIVER1" || te.roleInTrip === "DRIVER2"));
    const map = {};
    assignments.forEach(te => {
      if (!map[te.empId]) map[te.empId] = { empId: te.empId, name: empName(te.empId), trips: 0, income: 0, incidents: 0 };
      map[te.empId].trips += 1;
      map[te.empId].income += tripIncomeById[te.tripId] || 0;
    });
    // Driver Performance Scoring — incidents/complaints per driver, from
    // the Accident record's driverId (not date-range filtered, since an
    // accident history matters regardless of when the current report
    // window is — it's about the driver's overall track record).
    DB.readAll("accidents").forEach(a => {
      if (a.driverId && map[a.driverId]) map[a.driverId].incidents += 1;
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

  /* ---- Customers: bookings linked by NIC or contact number against Event
     records — contact is used as a fallback since NIC is optional on the
     Customer record but a booking should still be found without it. ---- */
  function customerBookingsCount(customer) {
    if (!customer) return 0;
    const nic = (customer.nic || "").trim().toLowerCase();
    const contact = (customer.contact || "").trim().toLowerCase();
    if (!nic && !contact) return 0;
    return DB.readAll("events").filter(e => {
      const eNic = (e.customerNic || "").trim().toLowerCase();
      const eContact = (e.customerContact || "").trim().toLowerCase();
      return (nic && eNic === nic) || (contact && eContact === contact);
    }).length;
  }

  /** Loan term length in whole months between two ISO date strings — used
   *  by the Financial → Bus Loan page (Add Loan duration column, and the
   *  Check Loan Details "months remaining" calculation). */
  function loanTermMonths(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate), e = new Date(endDate);
    let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    if (e.getDate() < s.getDate()) months -= 1;
    return Math.max(0, months);
  }

  /** Distinct (month,year) installments paid so far for a loan, and their total. */
  function loanPaymentsSummary(loanId) {
    const payments = DB.readAll("loanPayments").filter(p => p.loanId === loanId);
    const monthsPaid = new Set(payments.map(p => `${p.forYear}-${p.forMonth}`)).size;
    const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
    return { monthsPaid, totalPaid, payments };
  }

  /** Trips whose recorded fuel+parking+other costs exceed their total
   *  income — i.e. the trip ran at a loss. Used by fleetAlerts() (Dashboard
   *  panel + notification bell) and can also be read directly for a
   *  standalone "loss-making trips" list. */
  function tripLossAlerts() {
    const expenseByTrip = {};
    DB.readAll("tripExpenses").forEach(e => {
      expenseByTrip[e.tripId] = (Number(e.fuelAmount) || 0) + (Number(e.parkingAmount) || 0) + (Number(e.otherAmount) || 0);
    });
    return DB.readAll("trips")
      .filter(t => expenseByTrip[t.tripId] !== undefined && expenseByTrip[t.tripId] > (Number(t.totalIncome) || 0))
      .map(t => ({
        type: "danger",
        text: `Trip #${t.tripId} (${busNumber(t.busId)}, ${t.startLocation} → ${t.endLocation}) ran at a loss — costs ${Fmt.money(expenseByTrip[t.tripId])} vs income ${Fmt.money(t.totalIncome)}`
      }));
  }

  /** Suggested fare for a trip — distance × per-km fuel cost (assuming
   *  ~3.5 km/liter for a bus) × a service multiplier to cover driver,
   *  maintenance, and margin. A rough starting estimate, not a fixed price —
   *  shown next to the Total Income field on Manage Trip. */
  function suggestedFare(distanceKm) {
    const dist = Number(distanceKm);
    if (!dist || dist <= 0) return null;
    const fuelPriceRows = DB.readAll("updatePrices").filter(p => p.updateType === "FUEL")
      .sort((a, b) => (b.changeDate || "").localeCompare(a.changeDate || "") || (b.updatePricesId - a.updatePricesId));
    if (!fuelPriceRows.length) return null;
    const fuelPricePerLiter = Number(fuelPriceRows[0].newValue) || 0;
    const KM_PER_LITER = 3.5;
    const SERVICE_MULTIPLIER = 2.5;
    const fuelCost = (dist / KM_PER_LITER) * fuelPricePerLiter;
    return Math.round(fuelCost * SERVICE_MULTIPLIER);
  }

  return {
    bus, employee, trip, user, userName, busNumber, empName,
    dailyProfitByRange, summaryStats, allDailyProfit, monthlyProfit,
    dashboardSummary, last30DaysChart, reportSummary,
    incomeReport, expenseReport, salaryReport, tripReport,
    serviceReminders, fleetAlerts, topRoutes, topDrivers, topConductors, momComparison,
    expenseBreakdown, customerBookingsCount, latestInsurance, latestLicense,
    loanTermMonths, loanPaymentsSummary, tripLossAlerts, suggestedFare,
    profitPerBus, busUtilization, seasonalDemandInsights, budgetCapAlerts, partLifecycleAlerts
  };
})();
