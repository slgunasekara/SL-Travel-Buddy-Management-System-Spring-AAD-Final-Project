package com.example.slbusmanagement.entity;

import com.example.slbusmanagement.enumiration.RecordStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A loan taken out for a bus purchase. startDate/endDate define the loan
 *  term; total months owed is derived from that range on the frontend
 *  (Q.loanTermMonths) rather than stored, so it never goes stale if a
 *  correction is made to either date. */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class BusLoan {

    @Id
    private Long loanId;

    private Long busId;

    private Double loanAmount;

    private String financialBank;

    private String startDate;

    private String endDate;

    private Long createdBy;

    private String createdAt;

    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.ACTIVE;
}
