package com.example.slbusmanagement.entity;

import com.example.slbusmanagement.enumiration.RecordStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A bus's (route/revenue) license — renewed yearly. Like Insurance, a bus
 *  can have several rows over time; the latest by expireDate is current. */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class License {

    @Id
    private Long licenseId;

    private Long busId;

    private Double renewalCost;

    private String startDate;

    private String expireDate;

    private Long createdBy;

    private String createdAt;

    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.ACTIVE;
}
