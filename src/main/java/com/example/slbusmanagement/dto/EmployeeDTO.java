package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeDTO {
    private Long empId;
    private String empCategory;
    private String empCategory2;
    private String empName;
    private String address;
    private String contactNo;
    private String nicNo;
    private String ntcNo;
    private String drivingLicenceNo;
    private String joinDate;
    private String exitDate;
    private String empStatus;
    private Long createdBy;
}