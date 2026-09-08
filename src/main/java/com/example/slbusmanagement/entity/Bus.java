package com.example.slbusmanagement.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import com.example.slbusmanagement.enumeration.RecordStatus;
import com.example.slbusmanagement.enumeration.BusType;
import com.example.slbusmanagement.enumeration.BusStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Bus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long busId;

    private String busBrandName;

    @jakarta.persistence.Column(unique = true, nullable = false)
    private String busNumber;

    @Enumerated(EnumType.STRING)
    private BusType busType;

    private Integer noOfSeats;

    @Enumerated(EnumType.STRING)
    private BusStatus busStatus;

    private LocalDate manufactureDate;

    private LocalDate insuranceExpiryDate;

    private LocalDate licenseRenewalDate;

    private Double currentMileage;

    private Double fuelEfficiency;


    private String routePermitNo;
    private String permitStartLocation;
    private String permitEndLocation;

    private Long createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;


    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.ACTIVE;

}