package com.example.slbusmanagement.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;


public interface ReportService {
    List<Map<String, Object>> dailyProfitByRange(LocalDate from, LocalDate to);
    Map<String, Object> summaryStats(LocalDate from, LocalDate to);
    List<Map<String, Object>> monthlyProfit(int year);
    Map<String, Object> dashboardSummary();
    List<Map<String, Object>> incomeReport(LocalDate from, LocalDate to);
    List<Map<String, Object>> expenseReport(LocalDate from, LocalDate to);
    List<Map<String, Object>> salaryReport(LocalDate from, LocalDate to);
    List<Map<String, Object>> tripReport(LocalDate from, LocalDate to);
    List<Map<String, Object>> serviceReminders();
    List<Map<String, Object>> fleetAlerts();
    List<Map<String, Object>> topRoutes(LocalDate from, LocalDate to, int limit);
    List<Map<String, Object>> topDrivers(LocalDate from, LocalDate to, int limit);
    List<Map<String, Object>> topConductors(LocalDate from, LocalDate to, int limit);
    Map<String, Object> momComparison();
    List<Map<String, Object>> expenseBreakdown(LocalDate from, LocalDate to);
}
