package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeSalaryDTO {
    private Long salaryId;
    private Long empId;
    private Long tripId;
    private Double amount;
    private String date;
    private String description;
    private Boolean fromTripExpense;
    private Long createdBy;
}