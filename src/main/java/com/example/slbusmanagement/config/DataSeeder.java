package com.example.slbusmanagement.config;

import com.example.slbusmanagement.entity.Employee;
import com.example.slbusmanagement.entity.UpdatePrice;
import com.example.slbusmanagement.entity.User;
import com.example.slbusmanagement.enumiration.UserRole;
import com.example.slbusmanagement.repository.EmployeeRepository;
import com.example.slbusmanagement.repository.UpdatePriceRepository;
import com.example.slbusmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Seeds the database with exactly the same demo data that used to live in
 * the static db.js seedIfEmpty() function, so the app behaves the same on
 * first run. Only runs when the tables are empty.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final UpdatePriceRepository updatePriceRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUsers();
        seedEmployees();
        seedUpdatePrices();
    }

    private void seedUsers() {
        if (userRepository.count() > 0) return;
        String now = LocalDateTime.now().toString();
        userRepository.saveAll(List.of(
                user(1L, "amg", "amg123", "Praveen Gunasekara", UserRole.Owner, "0771194695", "200318900123", "praveengunasekara7@gmail.com", now),
                user(2L, "sampath", "sampath123", "Sampath Kumara", UserRole.Manager, "0771234567", "200184529425", "mendisdanushka886@gmail.com", now)
        ));
    }

    private User user(Long id, String username, String rawPassword, String name, UserRole role, String contact, String nic, String email, String createdAt) {
        User u = new User();
        u.setUserId(id);
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(rawPassword));
        u.setName(name);
        u.setRole(role);
        u.setContact(contact);
        u.setNic(nic);
        u.setEmail(email);
        u.setCreatedAt(createdAt);
        return u;
    }

    private void seedEmployees() {
        if (employeeRepository.count() > 0) return;
        employeeRepository.saveAll(List.of(
                employee(1L, "DRIVER", "Sunil Perera", "Colombo", "0771234567", "901234567V", "NTC12345", "B1234567", "2022-05-10", "ACTIVE"),
                employee(2L, "DRIVER", "Nimal Fernando", "Kandy", "0723456789", "901987654V", "NTC23456", "B2345678", "2021-09-15", "ACTIVE"),
                employee(3L, "DRIVER", "Mahesh Silva", "Kurunegala", "0713456789", "925678901V", "NTC45678", "B3456789", "2021-07-30", "ACTIVE"),
                employee(4L, "DRIVER", "Chamara Senanayake", "Anuradhapura", "0714567890", "927890123V", "NTC56789", "B4567890", "2023-02-14", "ACTIVE")
        ));
    }

    private Employee employee(Long id, String category, String name, String address, String contactNo, String nicNo, String ntcNo, String licenceNo, String joinDate, String status) {
        Employee e = new Employee();
        e.setEmpId(id);
        e.setEmpCategory(category);
        e.setEmpName(name);
        e.setAddress(address);
        e.setContactNo(contactNo);
        e.setNicNo(nicNo);
        e.setNtcNo(ntcNo);
        e.setDrivingLicenceNo(licenceNo);
        e.setJoinDate(joinDate);
        e.setExitDate(null);
        e.setEmpStatus(status);
        e.setCreatedBy(1L);
        return e;
    }

    private void seedUpdatePrices() {
        if (updatePriceRepository.count() > 0) return;
        updatePriceRepository.saveAll(List.of(
                price(1L, "FUEL", "INCREMENT", 420.00, 450.00, 30.00, 7.14, "2025-01-10", "Fuel price increased by government"),
                price(2L, "TICKET", "DECREMENT", 100.00, 90.00, -10.00, -10.00, "2025-01-10", "Discount for holiday season")
        ));
    }

    private UpdatePrice price(Long id, String type, String changeType, double prev, double next, double amount, double pct, String date, String desc) {
        UpdatePrice p = new UpdatePrice();
        p.setUpdatePricesId(id);
        p.setUpdateType(type);
        p.setChangeType(changeType);
        p.setPreviousValue(prev);
        p.setNewValue(next);
        p.setChangeAmount(amount);
        p.setPercentageChange(pct);
        p.setChangeDate(date);
        p.setDescription(desc);
        p.setCreatedBy(1L);
        return p;
    }
}
