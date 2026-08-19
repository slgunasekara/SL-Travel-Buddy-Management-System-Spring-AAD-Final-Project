package com.example.slbusmanagement.entity;

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

    /** A bus's NTC Route Permit is fixed to exactly one route — this is
     *  what auto-fills (and locks) Start/End Location on a ROUTE-category
     *  trip, so a trip can never accidentally be logged against a route
     *  this bus isn't actually permitted to run. */
    private String routePermitNo;
    private String permitStartLocation;
    private String permitEndLocation;

    private Long createdBy;

    private String createdAt;

    private String updatedAt;


    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.ACTIVE;

}