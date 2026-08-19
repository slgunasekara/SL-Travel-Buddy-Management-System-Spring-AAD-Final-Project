package com.example.slbusmanagement.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import com.example.slbusmanagement.enumiration.RecordStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Employee {

    @Id
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

    private Double baseSalaryRate;

    private String nicPhotoUrl;

    private String licencePhotoUrl;

    private Long createdBy;


    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.ACTIVE;

}