package com.example.slbusmanagement.entity;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
public class UpdatePrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long updatePricesId;

    private String updateType;

    private String changeType;

    private Double previousValue;

    private Double newValue;

    private Double changeAmount;

    private Double percentageChange;

    private LocalDate changeDate;

    private String description;

    private Long createdBy;


    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.ACTIVE;

}