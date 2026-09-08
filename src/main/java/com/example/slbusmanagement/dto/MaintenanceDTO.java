package com.example.slbusmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MaintenanceDTO {
    private Long maintId;

    @NotNull(message = "Bus is required")
    private Long busId;

    @NotBlank(message = "Maintenance type is required")
    private String maintenanceType;

    @NotBlank(message = "Service date is required")
    private String serviceDate;

    private Double mileage;

    @NotNull(message = "Cost is required")
    @Positive(message = "Cost must be greater than zero")
    private Double cost;

    private String technician;
    private String description;
    private String photoFileName;
    private Long createdBy;
}