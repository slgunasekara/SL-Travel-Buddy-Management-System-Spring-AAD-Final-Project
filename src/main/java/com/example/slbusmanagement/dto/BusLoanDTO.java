package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BusLoanDTO {
    private Long loanId;
    private Long busId;
    private Double loanAmount;
    private String financialBank;
    private String startDate;
    private String endDate;
    private Long createdBy;
    private String createdAt;
}
