package com.example.slbusmanagement.entity;

import com.example.slbusmanagement.enumiration.RecordStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** One insurance policy for a bus. A bus can have several rows over time
 *  (renewals) — the latest ACTIVE row (by expireDate) is treated as the
 *  bus's current policy wherever it's looked up (claims auto-fill, alerts). */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Insurance {

    @Id
    private Long insuranceId;

    private Long busId;

    private String insuranceCompany;

    private Double amountPaid;

    private String startDate;

    private String expireDate;

    private Long createdBy;

    private String createdAt;

    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.ACTIVE;
}
