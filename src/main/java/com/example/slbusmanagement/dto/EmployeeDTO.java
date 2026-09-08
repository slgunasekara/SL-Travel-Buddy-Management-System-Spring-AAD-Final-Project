package com.example.slbusmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeDTO {
    private Long empId;

    @NotBlank(message = "Employee category is required")
    private String empCategory;

    private String empCategory2;

    @NotBlank(message = "Employee name is required")
    private String empName;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "Contact number is required")
    private String contactNo;

    @NotBlank(message = "NIC number is required")
    private String nicNo;

    private String ntcNo;
    private String drivingLicenceNo;

    @NotBlank(message = "Join date is required")
    private String joinDate;

    private String exitDate;

    @NotBlank(message = "Employee status is required")
    private String empStatus;

    private Long createdBy;
}