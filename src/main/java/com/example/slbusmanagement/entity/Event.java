package com.example.slbusmanagement.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.FetchType;
import com.example.slbusmanagement.enumeration.RecordStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long eventId;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_id")
    private Bus bus;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_trip_id")
    private Trip linkedTrip;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;


    private String startLocation;

    private String endLocation;

    private Double eventValue;

    private LocalDate eventDate;

    private String customerName;

    private String customerContact;

    private String customerNic;

    private String customerAddress;

    private String description;

    private Boolean eventCompleted;

    private String photoFileName;

    private Long createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;


    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.ACTIVE;

}