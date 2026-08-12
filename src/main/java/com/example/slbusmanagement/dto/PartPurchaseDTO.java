package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PartPurchaseDTO {
    private Long purchaseId;
    private Long busId;
    private Long maintId;
    private String partName;
    private Integer quantity;
    private Double unitPrice;
    private Double totalCost;
    private String supplierName;
    private String date;
    private String partDescription;
    private Long createdBy;
}