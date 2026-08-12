package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BusDTO {
    private Long busId;
    private String busBrandName;
    private String busNumber;
    private String busType;
    private Integer noOfSeats;
    private String busStatus;
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