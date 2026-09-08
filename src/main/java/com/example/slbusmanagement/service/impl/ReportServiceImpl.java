package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.entity.*;
import com.example.slbusmanagement.enumeration.BusStatus;
import com.example.slbusmanagement.enumeration.RecordStatus;
import com.example.slbusmanagement.enumeration.RoleInTrip;
import com.example.slbusmanagement.repository.*;
import com.example.slbusmanagement.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Transactional(readOnly = true)
@Service
@Slf4j
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final TripRepository tripRepository;
    private final EventRepository eventRepository;
    private final TripExpenseRepository tripExpenseRepository;
    private final EmployeeSalaryRepository employeeSalaryRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final PartPurchaseRepository partPurchaseRepository;
    private final OtherServiceRepository otherServiceRepository;
    private final BusRepository busRepository;
    private final EmployeeRepository employeeRepository;
    private final TripEmployeeRepository tripEmployeeRepository;

    private String busNumberOf(Trip t) {
        return t.getBus() != null ? t.getBus().getBusNumber() : "-";
    }

    private final Map<Long, String> empNameCache = new HashMap<>();

    private String empName(Long empId) {
        if (empId == null) return "-";
        return empNameCache.computeIfAbsent(empId, id ->
                employeeRepository.findById(id).map(Employee::getEmpName).orElse("-"));
    }

    private boolean inRange(LocalDate d, LocalDate from, LocalDate to) {
        return d != null && !d.isBefore(from) && !d.isAfter(to);
    }

    private double nz(Double v) {
        return v != null ? v : 0.0;
    }

    @Override
    public List<Map<String, Object>> dailyProfitByRange(LocalDate from, LocalDate to) {

        List<Trip> trips = tripRepository.findByStatusAndTripDateBetween(RecordStatus.ACTIVE, from, to);

        Map<String, Map<String, Object>> byDate = new LinkedHashMap<>();
        Map<String, Set<Long>> tripIdsByDate = new HashMap<>();

        for (Trip t : trips) {
            String d = t.getTripDate().toString();
            Map<String, Object> b = byDate.computeIfAbsent(d, k -> newBucket(d));
            b.put("totalIncome", ((Number) b.get("totalIncome")).doubleValue() + nz(t.getTotalIncome()));
            tripIdsByDate.computeIfAbsent(d, k -> new HashSet<>()).add(t.getTripId());
        }

        Map<Long, LocalDate> tripDateMap = tripRepository.findAll().stream()
                .collect(Collectors.toMap(Trip::getTripId, Trip::getTripDate, (a, b) -> a));
        for (TripExpense e : tripExpenseRepository.findAll()) {
            LocalDate d = e.getDate() != null ? e.getDate()
                    : (e.getTrip() != null ? tripDateMap.get(e.getTrip().getTripId()) : null);
            if (inRange(d, from, to)) {
                Map<String, Object> b = byDate.computeIfAbsent(d.toString(), k -> newBucket(d.toString()));
                double amt = nz(e.getFuelAmount()) + nz(e.getParkingAmount()) + nz(e.getOtherAmount());
                b.put("tripExpenses", ((Number) b.get("tripExpenses")).doubleValue() + amt);
            }
        }
        for (EmployeeSalary s : employeeSalaryRepository.findAll()) {
            if (inRange(s.getDate(), from, to)) {
                Map<String, Object> b = byDate.computeIfAbsent(s.getDate().toString(), k -> newBucket(s.getDate().toString()));
                b.put("salaries", ((Number) b.get("salaries")).doubleValue() + nz(s.getAmount()));
            }
        }
        for (Maintenance m : maintenanceRepository.findAll()) {
            if (inRange(m.getServiceDate(), from, to)) {
                Map<String, Object> b = byDate.computeIfAbsent(m.getServiceDate().toString(), k -> newBucket(m.getServiceDate().toString()));
                b.put("maintenance", ((Number) b.get("maintenance")).doubleValue() + nz(m.getCost()));
            }
        }
        for (PartPurchase p : partPurchaseRepository.findAll()) {
            if (inRange(p.getDate(), from, to)) {
                Map<String, Object> b = byDate.computeIfAbsent(p.getDate().toString(), k -> newBucket(p.getDate().toString()));
                b.put("partPurchases", ((Number) b.get("partPurchases")).doubleValue() + nz(p.getTotalCost()));
            }
        }
        for (OtherService s : otherServiceRepository.findAll()) {
            if (inRange(s.getDate(), from, to)) {
                Map<String, Object> b = byDate.computeIfAbsent(s.getDate().toString(), k -> newBucket(s.getDate().toString()));
                b.put("otherServices", ((Number) b.get("otherServices")).doubleValue() + nz(s.getCost()));
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, Map<String, Object>> entry : byDate.entrySet()) {
            Map<String, Object> b = entry.getValue();
            double totalExpenses = ((Number) b.get("tripExpenses")).doubleValue()
                    + ((Number) b.get("salaries")).doubleValue()
                    + ((Number) b.get("maintenance")).doubleValue()
                    + ((Number) b.get("partPurchases")).doubleValue()
                    + ((Number) b.get("otherServices")).doubleValue();
            double totalIncome = ((Number) b.get("totalIncome")).doubleValue();
            b.put("totalExpenses", totalExpenses);
            b.put("netProfit", totalIncome - totalExpenses);
            b.put("totalTrips", tripIdsByDate.getOrDefault(entry.getKey(), Set.of()).size());
            result.add(b);
        }
        result.sort((a, b) -> ((String) b.get("date")).compareTo((String) a.get("date")));
        return result;
    }

    private Map<String, Object> newBucket(String date) {
        Map<String, Object> b = new LinkedHashMap<>();
        b.put("date", date);
        b.put("totalIncome", 0.0);
        b.put("tripExpenses", 0.0);
        b.put("salaries", 0.0);
        b.put("maintenance", 0.0);
        b.put("partPurchases", 0.0);
        b.put("otherServices", 0.0);
        return b;
    }

    @Override
    public Map<String, Object> summaryStats(LocalDate from, LocalDate to) {
        List<Map<String, Object>> rows = dailyProfitByRange(from, to);
        Map<String, Object> out = new LinkedHashMap<>();
        for (String key : List.of("totalIncome", "tripExpenses", "salaries", "maintenance", "partPurchases", "otherServices", "totalExpenses", "netProfit")) {
            double sum = rows.stream().mapToDouble(r -> ((Number) r.get(key)).doubleValue()).sum();
            out.put(key, sum);
        }
        int totalTrips = rows.stream().mapToInt(r -> ((Number) r.get("totalTrips")).intValue()).sum();
        out.put("totalTrips", totalTrips);
        return out;
    }

    @Override
    public List<Map<String, Object>> monthlyProfit(int year) {
        Set<YearMonth> months = new TreeSet<>(Comparator.reverseOrder());
        tripRepository.findAll().stream()
                .filter(t -> t.getTripDate() != null && t.getTripDate().getYear() == year)
                .forEach(t -> months.add(YearMonth.from(t.getTripDate())));
        eventRepository.findAll().stream()
                .filter(e -> e.getEventDate() != null && e.getEventDate().getYear() == year)
                .forEach(e -> months.add(YearMonth.from(e.getEventDate())));

        List<Map<String, Object>> result = new ArrayList<>();
        for (YearMonth ym : months) {
            LocalDate first = ym.atDay(1);
            LocalDate last = ym.atEndOfMonth();
            Map<String, Object> stats = summaryStats(first, last);
            Map<String, Object> ordered = new LinkedHashMap<>();
            ordered.put("month", ym.toString());
            ordered.putAll(stats);
            result.add(ordered);
        }
        return result;
    }

    @Override
    public Map<String, Object> dashboardSummary() {
        long totalBuses = busRepository.findAll().stream()
                .filter(b -> b.getStatus() == RecordStatus.ACTIVE && b.getBusStatus() == BusStatus.ACTIVE).count();
        long totalTrips = tripRepository.findAll().stream().filter(t -> t.getStatus() == RecordStatus.ACTIVE).count();
        long totalEmployees = employeeRepository.findAll().stream()
                .filter(e -> e.getStatus() == RecordStatus.ACTIVE && "ACTIVE".equals(e.getEmpStatus())).count();

        List<Trip> allTrips = tripRepository.findAll().stream().filter(t -> t.getStatus() == RecordStatus.ACTIVE).toList();
        double totalIncome = 0, totalExpenses = 0;
        if (!allTrips.isEmpty()) {
            LocalDate min = allTrips.stream().map(Trip::getTripDate).min(LocalDate::compareTo).orElse(LocalDate.now());
            LocalDate max = allTrips.stream().map(Trip::getTripDate).max(LocalDate::compareTo).orElse(LocalDate.now());
            List<Map<String, Object>> all = dailyProfitByRange(min, max);
            totalIncome = all.stream().mapToDouble(r -> ((Number) r.get("totalIncome")).doubleValue()).sum();
            totalExpenses = all.stream().mapToDouble(r -> ((Number) r.get("totalExpenses")).doubleValue()).sum();
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalBuses", totalBuses);
        summary.put("totalTrips", totalTrips);
        summary.put("totalEmployees", totalEmployees);
        summary.put("totalIncome", totalIncome);
        summary.put("totalExpenses", totalExpenses);
        summary.put("netProfit", totalIncome - totalExpenses);
        return summary;
    }

    @Override
    public List<Map<String, Object>> incomeReport(LocalDate from, LocalDate to) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Trip t : tripRepository.findAll()) {
            if (t.getStatus() != RecordStatus.ACTIVE || !inRange(t.getTripDate(), from, to)) continue;
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("type", "Trip");
            r.put("refId", t.getTripId());
            r.put("reference", busNumberOf(t));
            r.put("date", t.getTripDate().toString());
            r.put("income", nz(t.getTotalIncome()));
            r.put("linkedTripId", null);
            rows.add(r);
        }
        for (Event e : eventRepository.findByStatusAndEventDateBetween(RecordStatus.ACTIVE, from, to)) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("type", "Event");
            r.put("refId", e.getEventId());
            r.put("reference", e.getStartLocation() + " -> " + e.getEndLocation());
            r.put("date", e.getEventDate().toString());
            r.put("income", nz(e.getEventValue()));
            r.put("linkedTripId", e.getLinkedTrip() != null ? e.getLinkedTrip().getTripId() : null);
            rows.add(r);
        }
        rows.sort((a, b) -> ((String) b.get("date")).compareTo((String) a.get("date")));
        return rows;
    }

    @Override
    public List<Map<String, Object>> expenseReport(LocalDate from, LocalDate to) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (TripExpense e : tripExpenseRepository.findAll()) {
            if (e.getStatus() != RecordStatus.ACTIVE || !inRange(e.getDate(), from, to)) continue;
            if (nz(e.getFuelAmount()) > 0) rows.add(expenseRow(e.getDate(), e.getFuelAmount(), "FUEL"));
            if (nz(e.getParkingAmount()) > 0) rows.add(expenseRow(e.getDate(), e.getParkingAmount(), "PARKING"));
            if (nz(e.getOtherAmount()) > 0) rows.add(expenseRow(e.getDate(), e.getOtherAmount(), "TRIP OTHER"));
        }
        for (Maintenance m : maintenanceRepository.findAll()) {
            if (m.getStatus() == RecordStatus.ACTIVE && inRange(m.getServiceDate(), from, to) && nz(m.getCost()) > 0) {
                rows.add(expenseRow(m.getServiceDate(), m.getCost(), "MAINTENANCE"));
            }
        }
        for (PartPurchase p : partPurchaseRepository.findAll()) {
            if (p.getStatus() == RecordStatus.ACTIVE && inRange(p.getDate(), from, to) && nz(p.getTotalCost()) > 0) {
                rows.add(expenseRow(p.getDate(), p.getTotalCost(), "PARTS"));
            }
        }
        for (OtherService s : otherServiceRepository.findAll()) {
            if (s.getStatus() == RecordStatus.ACTIVE && inRange(s.getDate(), from, to) && nz(s.getCost()) > 0) {
                rows.add(expenseRow(s.getDate(), s.getCost(), "OTHER SERVICES"));
            }
        }
        rows.sort((a, b) -> ((String) b.get("expenseDate")).compareTo((String) a.get("expenseDate")));
        return rows;
    }

    private Map<String, Object> expenseRow(LocalDate date, Double amount, String category) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("expenseDate", date.toString());
        r.put("amount", amount);
        r.put("category", category);
        return r;
    }

    @Override
    public List<Map<String, Object>> salaryReport(LocalDate from, LocalDate to) {
        List<Map<String, Object>> rows = new ArrayList<>();

        for (EmployeeSalary s : employeeSalaryRepository.findByStatusAndDateBetween(RecordStatus.ACTIVE, from, to)) {
            Map<String, Object> r = new LinkedHashMap<>();
            Long empId = s.getEmployee() != null ? s.getEmployee().getEmpId() : null;
            r.put("empId", empId);
            r.put("employeeName", empName(empId));
            r.put("salaryDate", s.getDate().toString());
            r.put("amount", s.getAmount());
            rows.add(r);
        }
        rows.sort((a, b) -> ((String) b.get("salaryDate")).compareTo((String) a.get("salaryDate")));
        return rows;
    }

    @Override
    public List<Map<String, Object>> tripReport(LocalDate from, LocalDate to) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Trip t : tripRepository.findAll()) {
            if (t.getStatus() != RecordStatus.ACTIVE || !inRange(t.getTripDate(), from, to)) continue;
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("tripId", t.getTripId());
            r.put("tripDate", t.getTripDate().toString());
            r.put("busNumber", busNumberOf(t));
            r.put("route", t.getStartLocation() + " -> " + t.getEndLocation());
            r.put("category", t.getTripCategory() != null ? t.getTripCategory().name() : null);
            rows.add(r);
        }
        rows.sort((a, b) -> ((String) b.get("tripDate")).compareTo((String) a.get("tripDate")));
        return rows;
    }

    private static final int SERVICE_DUE_DAYS = 180;
    private static final int SERVICE_DUE_KM = 5000;

    @Override
    public List<Map<String, Object>> serviceReminders() {
        List<Map<String, Object>> alerts = new ArrayList<>();
        List<Bus> buses = busRepository.findAllByStatus(RecordStatus.ACTIVE).stream()
                .filter(b -> b.getBusStatus() == BusStatus.ACTIVE).toList();
        LocalDate today = LocalDate.now();

        for (Bus b : buses) {

            List<Maintenance> busMaint = maintenanceRepository.findByBus_BusIdOrderByServiceDateDesc(b.getBusId());
            Maintenance last = busMaint.isEmpty() ? null : busMaint.get(0);
            double currentMileage = nz(b.getCurrentMileage());

            if (last == null) {
                if (currentMileage >= SERVICE_DUE_KM) {
                    alerts.add(alert("warning", b.getBusNumber() + ": No maintenance on record and mileage is "
                            + (long) currentMileage + " km - a first service is recommended."));
                }
                continue;
            }
            long daysSince = java.time.temporal.ChronoUnit.DAYS.between(last.getServiceDate(), today);
            double kmSince = currentMileage - nz(last.getMileage());

            if (daysSince > SERVICE_DUE_DAYS || kmSince > SERVICE_DUE_KM) {
                alerts.add(alert("danger", b.getBusNumber() + ": Service overdue - last serviced "
                        + last.getServiceDate() + " (" + daysSince + " days / " + Math.max(0, (long) kmSince) + " km ago)."));
            } else if (daysSince > SERVICE_DUE_DAYS - 30 || kmSince > SERVICE_DUE_KM - 1000) {
                alerts.add(alert("warning", b.getBusNumber() + ": Service due soon - last serviced "
                        + last.getServiceDate() + " (" + daysSince + " days / " + Math.max(0, (long) kmSince) + " km ago)."));
            }
        }
        return alerts;
    }

    @Override
    public List<Map<String, Object>> fleetAlerts() {
        List<Map<String, Object>> alerts = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDate soon = today.plusDays(30);

        for (Bus b : busRepository.findAll().stream().filter(x -> x.getStatus() == RecordStatus.ACTIVE).toList()) {
            if (b.getInsuranceExpiryDate() != null) {
                LocalDate d = b.getInsuranceExpiryDate();
                if (d.isBefore(today)) alerts.add(alert("danger", b.getBusNumber() + ": Insurance expired on " + d));
                else if (d.isBefore(soon))
                    alerts.add(alert("warning", b.getBusNumber() + ": Insurance expiring on " + d));
            }
            if (b.getLicenseRenewalDate() != null) {
                LocalDate d = b.getLicenseRenewalDate();
                if (d.isBefore(today))
                    alerts.add(alert("danger", b.getBusNumber() + ": License renewal overdue since " + d));
                else if (d.isBefore(soon))
                    alerts.add(alert("warning", b.getBusNumber() + ": License renewal due " + d));
            }
        }
        alerts.addAll(serviceReminders());
        return alerts;
    }

    private Map<String, Object> alert(String type, String text) {
        Map<String, Object> a = new LinkedHashMap<>();
        a.put("type", type);
        a.put("text", text);
        return a;
    }

    @Override
    public List<Map<String, Object>> topRoutes(LocalDate from, LocalDate to, int limit) {
        Map<String, Map<String, Object>> map = new LinkedHashMap<>();
        for (Trip t : tripRepository.findAll()) {
            if (t.getStatus() != RecordStatus.ACTIVE || !inRange(t.getTripDate(), from, to)) continue;
            String key = t.getStartLocation() + " -> " + t.getEndLocation();
            Map<String, Object> r = map.computeIfAbsent(key, k -> routeRow(key));
            r.put("occurrences", ((Number) r.get("occurrences")).intValue() + 1);
            r.put("income", ((Number) r.get("income")).doubleValue() + nz(t.getTotalIncome()));
        }
        for (Event e : eventRepository.findByStatusAndEventDateBetween(RecordStatus.ACTIVE, from, to)) {
            String key = e.getStartLocation() + " -> " + e.getEndLocation();
            Map<String, Object> r = map.computeIfAbsent(key, k -> routeRow(key));
            r.put("occurrences", ((Number) r.get("occurrences")).intValue() + 1);
        }
        return map.values().stream()
                .sorted((a, b) -> Double.compare(((Number) b.get("income")).doubleValue(), ((Number) a.get("income")).doubleValue()))
                .limit(limit)
                .toList();
    }

    private Map<String, Object> routeRow(String route) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("route", route);
        r.put("occurrences", 0);
        r.put("income", 0.0);
        return r;
    }

    @Override
    public List<Map<String, Object>> topDrivers(LocalDate from, LocalDate to, int limit) {
        return topCrew(from, to, limit, List.of(RoleInTrip.DRIVER1, RoleInTrip.DRIVER2), false);
    }

    @Override
    public List<Map<String, Object>> topConductors(LocalDate from, LocalDate to, int limit) {
        return topCrew(from, to, limit, List.of(RoleInTrip.CONDUCTOR), true);
    }

    private List<Map<String, Object>> topCrew(LocalDate from, LocalDate to, int limit, List<RoleInTrip> roles, boolean rankByAvg) {
        List<Trip> trips = tripRepository.findAll().stream()
                .filter(t -> t.getStatus() == RecordStatus.ACTIVE && inRange(t.getTripDate(), from, to))
                .toList();
        Set<Long> tripIds = trips.stream().map(Trip::getTripId).collect(Collectors.toSet());
        Map<Long, Double> tripIncomeById = trips.stream()
                .collect(Collectors.toMap(Trip::getTripId, t -> nz(t.getTotalIncome()), (a, b) -> a));

        Map<Long, Map<String, Object>> map = new LinkedHashMap<>();
        for (TripEmployee te : tripEmployeeRepository.findAll()) {
            if (te.getStatus() != RecordStatus.ACTIVE) continue;
            Long teTripId = te.getTrip() != null ? te.getTrip().getTripId() : null;
            Long teEmpId = te.getEmployee() != null ? te.getEmployee().getEmpId() : null;
            if (teTripId == null || teEmpId == null) continue;
            if (!tripIds.contains(teTripId) || !roles.contains(te.getRoleInTrip())) continue;
            Map<String, Object> r = map.computeIfAbsent(teEmpId, id -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("empId", id);
                row.put("name", empName(id));
                row.put("trips", 0);
                row.put("income", 0.0);
                return row;
            });
            r.put("trips", ((Number) r.get("trips")).intValue() + 1);
            r.put("income", ((Number) r.get("income")).doubleValue() + tripIncomeById.getOrDefault(teTripId, 0.0));
        }

        List<Map<String, Object>> list = new ArrayList<>(map.values());
        if (rankByAvg) {
            for (Map<String, Object> r : list) {
                int tripCount = ((Number) r.get("trips")).intValue();
                double income = ((Number) r.get("income")).doubleValue();
                r.put("avgIncome", tripCount > 0 ? income / tripCount : 0.0);
            }
            list.sort((a, b) -> Double.compare(((Number) b.get("avgIncome")).doubleValue(), ((Number) a.get("avgIncome")).doubleValue()));
        } else {
            list.sort((a, b) -> Integer.compare(((Number) b.get("trips")).intValue(), ((Number) a.get("trips")).intValue()));
        }
        return list.stream().limit(limit).toList();
    }

    @Override
    public Map<String, Object> momComparison() {
        LocalDate now = LocalDate.now();
        LocalDate curStart = now.withDayOfMonth(1);
        LocalDate curEnd = now;
        LocalDate prevMonth = now.minusMonths(1);
        LocalDate prevStart = prevMonth.withDayOfMonth(1);
        LocalDate prevEnd = curStart.minusDays(1);

        Map<String, Object> cur = summaryStats(curStart, curEnd);
        Map<String, Object> prev = summaryStats(prevStart, prevEnd);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("curLabel", now.getMonth().getDisplayName(java.time.format.TextStyle.FULL, Locale.ENGLISH) + " " + now.getYear());
        out.put("prevLabel", prevMonth.getMonth().getDisplayName(java.time.format.TextStyle.FULL, Locale.ENGLISH) + " " + prevMonth.getYear());
        out.put("income", changeBlock(cur.get("totalIncome"), prev.get("totalIncome")));
        out.put("expenses", changeBlock(cur.get("totalExpenses"), prev.get("totalExpenses")));
        out.put("profit", changeBlock(cur.get("netProfit"), prev.get("netProfit")));
        out.put("trips", changeBlock(cur.get("totalTrips"), prev.get("totalTrips")));
        return out;
    }

    private Map<String, Object> changeBlock(Object curVal, Object prevVal) {
        double curV = ((Number) curVal).doubleValue();
        double prevV = ((Number) prevVal).doubleValue();
        double pct = prevV == 0 ? (curV == 0 ? 0 : 100) : ((curV - prevV) / Math.abs(prevV)) * 100;
        Map<String, Object> b = new LinkedHashMap<>();
        b.put("cur", curVal);
        b.put("prev", prevVal);
        b.put("pct", pct);
        return b;
    }

    @Override
    public List<Map<String, Object>> expenseBreakdown(LocalDate from, LocalDate to) {
        Map<String, Object> s = summaryStats(from, to);
        List<Object[]> defs = List.of(
                new Object[]{"Trip Expenses", s.get("tripExpenses"), "#e0663e"},
                new Object[]{"Salaries", s.get("salaries"), "#3565e8"},
                new Object[]{"Maintenance", s.get("maintenance"), "#c98a1f"},
                new Object[]{"Parts", s.get("partPurchases"), "#7454c7"},
                new Object[]{"Other Services", s.get("otherServices"), "#0c8a86"}
        );
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] d : defs) {
            double value = ((Number) d[1]).doubleValue();
            if (value <= 0) continue;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("label", d[0]);
            row.put("value", value);
            row.put("color", d[2]);
            out.add(row);
        }
        return out;
    }
}
