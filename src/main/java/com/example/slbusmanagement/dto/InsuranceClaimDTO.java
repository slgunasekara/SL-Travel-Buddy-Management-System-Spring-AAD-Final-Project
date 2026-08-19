package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InsuranceClaimDTO {
    private Long claimId;
    private Long busId;
    private Long accidentId;
    private Double claimAmountReceived;
    private String claimDate;
    private String description;
    private Long createdBy;
    private String createdAt;
}
