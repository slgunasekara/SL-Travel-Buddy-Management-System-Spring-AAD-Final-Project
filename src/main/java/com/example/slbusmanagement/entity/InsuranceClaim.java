package com.example.slbusmanagement.entity;

import com.example.slbusmanagement.enumiration.RecordStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A claim filed against a bus's insurance policy — optionally linked to an
 *  Accident record (a claim can also be filed without one, e.g. theft,
 *  natural damage). Company/policy details are looked up from Insurance by
 *  busId at display time rather than duplicated here. */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class InsuranceClaim {

    @Id
    private Long claimId;

    private Long busId;

    private Long accidentId; // nullable — claim need not come from an accident

    private Double claimAmountReceived;

    private String claimDate;

    private String description;

    private Long createdBy;

    private String createdAt;

    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.ACTIVE;
}
