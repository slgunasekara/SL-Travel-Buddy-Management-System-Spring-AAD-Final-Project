package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;


@Service
@RequiredArgsConstructor
@Slf4j
public class BackupServiceImpl implements BackupService {

    private static final DateTimeFormatter FILE_STAMP = DateTimeFormatter.ofPattern("yyyy-MM-dd_HHmmss");

    private final UserService userService;
    private final BusService busService;
    private final EmployeeService employeeService;
    private final TripService tripService;
    private final TripEmployeeService tripEmployeeService;
    private final TripExpenseService tripExpenseService;
    private final EmployeeSalaryService employeeSalaryService;
    private final MaintenanceService maintenanceService;
    private final PartPurchaseService partPurchaseService;
    private final OtherServiceService otherServiceService;
    private final EventService eventService;
    private final UpdatePriceService updatePriceService;
    private final CustomerService customerService;

    private final ObjectMapper backupObjectMapper = new ObjectMapper()
            .enable(SerializationFeature.INDENT_OUTPUT);

    @Value("${app.backup.dir}")
    private String backupDir;

    @Override
    public String backupNow() {

        Map<String, Object> tables = new LinkedHashMap<>();
        tables.put("users", userService.getAll());
        tables.put("buses", busService.getAll());
        tables.put("employees", employeeService.getAll());
        tables.put("trips", tripService.getAll());
        tables.put("tripEmployees", tripEmployeeService.getAll());
        tables.put("tripExpenses", tripExpenseService.getAll());
        tables.put("employeeSalaries", employeeSalaryService.getAll());
        tables.put("maintenance", maintenanceService.getAll());
        tables.put("partPurchases", partPurchaseService.getAll());
        tables.put("otherServices", otherServiceService.getAll());
        tables.put("events", eventService.getAll());
        tables.put("updatePrices", updatePriceService.getAll());
        tables.put("customers", customerService.getAll());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("app", "SL Travel Buddy");
        payload.put("exportedAt", OffsetDateTime.now().toString());
        payload.put("version", 1);
        payload.put("tables", tables);

        try {
            Path dir = Paths.get(backupDir).toAbsolutePath().normalize();
            Files.createDirectories(dir);

            String fileName = "sl-travel-buddy-backup-"
                    + FILE_STAMP.format(Instant.now().atZone(ZoneId.systemDefault())) + ".json";
            Path target = dir.resolve(fileName);

            backupObjectMapper.writeValue(target.toFile(), payload);
            log.info("Nightly backup written: {}", target);
            return fileName;
        } catch (IOException e) {
            log.error("Failed to write nightly backup file", e);
            throw new RuntimeException("Failed to write backup file", e);
        }
    }
}
