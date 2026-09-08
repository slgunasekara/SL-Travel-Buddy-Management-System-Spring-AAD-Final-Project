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
public class BusDTO {
    private Long busId;

    @NotBlank(message = "Bus brand name is required")
    private String busBrandName;

    @NotBlank(message = "Bus number is required")
    private String busNumber;

    @NotBlank(message = "Bus type is required")
    private String busType;

    @NotNull(message = "Number of seats is required")
    @Positive(message = "Number of seats must be greater than zero")
    private Integer noOfSeats;

    @NotBlank(message = "Bus status is required")
    private String busStatus;

    @NotBlank(message = "Manufacture date is required")
    private String manufactureDate;
    private String insuranceExpiryDate;
    private String licenseRenewalDate;
    private Double currentMileage;
    private Double fuelEfficiency;
    private String routePermitNo;
    private String permitStartLocation;
    private String permitEndLocation;
    private Long createdBy;
    private String createdAt;
    private String updatedAt;
}