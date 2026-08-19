package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LicenseDTO {
    private Long licenseId;
    private Long busId;
    private Double renewalCost;
    private String startDate;
    private String expireDate;
    private Long createdBy;
    private String createdAt;
}
