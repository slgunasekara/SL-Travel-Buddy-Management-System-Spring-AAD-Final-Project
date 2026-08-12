package com.example.slbusmanagement.dto;

import com.example.slbusmanagement.enumiration.RecordStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Bus {

    @Id
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


    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.ACTIVE;

}