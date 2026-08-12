package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MaintenanceDTO {
    private Long maintId;
    private Long busId;
    private String maintenanceType;
    private String serviceDate;
    private Double mileage;
    private Double cost;
    private String technician;
    private String description;
    private Long createdBy;
}