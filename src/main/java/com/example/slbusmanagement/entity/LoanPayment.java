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
public class LoanPayment {

    @Id
    private Long paymentId;

    private Long loanId;

    private Long busId;

    private Integer forMonth; // 1-12

    private Integer forYear;

    private Double amountPaid;

    private String paidDate;

    private Long createdBy;

    private String createdAt;

    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.ACTIVE;
}
