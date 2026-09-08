package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.constant.CommonResponse;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping(value = "v1/report")
@CrossOrigin
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping(value = "/daily-profit", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> dailyProfitByRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<Map<String, Object>> data = reportService.dailyProfitByRange(from, to);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, data, "Daily profit by range"));
    }

    @GetMapping(value = "/summary-stats", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> summaryStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        Map<String, Object> data = reportService.summaryStats(from, to);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, data, "Summary stats"));
    }

    @GetMapping(value = "/monthly-profit", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> monthlyProfit(@RequestParam int year) {
        List<Map<String, Object>> data = reportService.monthlyProfit(year);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, data, "Monthly profit"));
    }

    @GetMapping(value = "/dashboard-summary", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> dashboardSummary() {
        Map<String, Object> data = reportService.dashboardSummary();
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, data, "Dashboard summary"));
    }

    @GetMapping(value = "/income-report", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> incomeReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<Map<String, Object>> data = reportService.incomeReport(from, to);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, data, "Income report"));
    }

    @GetMapping(value = "/expense-report", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> expenseReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<Map<String, Object>> data = reportService.expenseReport(from, to);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, data, "Expense report"));
    }

    @GetMapping(value = "/salary-report", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> salaryReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<Map<String, Object>> data = reportService.salaryReport(from, to);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, data, "Salary report"));
    }

    @GetMapping(value = "/trip-report", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> tripReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<Map<String, Object>> data = reportService.tripReport(from, to);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, data, "Trip report"));
    }

    @GetMapping(value = "/service-reminders", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> serviceReminders() {
        List<Map<String, Object>> data = reportService.serviceReminders();
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, data, "Service reminders"));
    }

    @GetMapping(value = "/fleet-alerts", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> fleetAlerts() {
        List<Map<String, Object>> data = reportService.fleetAlerts();
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, data, "Fleet alerts"));
    }

    @GetMapping(value = "/top-routes", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> topRoutes(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "5") int limit) {
        List<Map<String, Object>> data = reportService.topRoutes(from, to, limit);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, data, "Top routes"));
    }

    @GetMapping(value = "/top-drivers", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> topDrivers(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "5") int limit) {
        List<Map<String, Object>> data = reportService.topDrivers(from, to, limit);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, data, "Top drivers"));
    }

    @GetMapping(value = "/top-conductors", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> topConductors(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "5") int limit) {
        List<Map<String, Object>> data = reportService.topConductors(from, to, limit);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, data, "Top conductors"));
    }

    @GetMapping(value = "/mom-comparison", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> momComparison() {
        Map<String, Object> data = reportService.momComparison();
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, data, "Month-over-month comparison"));
    }

    @GetMapping(value = "/expense-breakdown", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> expenseBreakdown(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<Map<String, Object>> data = reportService.expenseBreakdown(from, to);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, data, "Expense breakdown"));
    }
}
