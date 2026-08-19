package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InsuranceDTO {
    private Long insuranceId;
    private Long busId;
    private String insuranceCompany;
    private Double amountPaid;
    private String startDate;
    private String expireDate;
    private Long createdBy;
    private String createdAt;
}
