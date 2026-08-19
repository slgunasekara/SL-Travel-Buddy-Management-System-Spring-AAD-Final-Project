package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoanPaymentDTO {
    private Long paymentId;
    private Long loanId;
    private Long busId;
    private Integer forMonth;
    private Integer forYear;
    private Double amountPaid;
    private String paidDate;
    private Long createdBy;
    private String createdAt;
}
