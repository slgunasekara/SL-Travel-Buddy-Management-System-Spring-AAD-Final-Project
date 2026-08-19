package com.example.slbusmanagement.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** One row per change to an employee's baseSalaryRate — written
 *  automatically by EmployeeServiceImpl.update() whenever the rate
 *  actually changes, never by hand. */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class SalaryRateHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long historyId;

    private Long empId;

    private Double rate;

    private String effectiveDate;
}
