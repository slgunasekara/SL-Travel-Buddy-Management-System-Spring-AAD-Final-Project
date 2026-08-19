package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BusSaleRecordDTO {
    private Long saleId;
    private Long busId;
    private String busNumberAtSale;
    private Double salePrice;
    private String saleDate;
    private Double lifetimeIncome;
    private Double lifetimeExpense;
    private Double lifetimeProfit;
    private Long createdBy;
    private String createdAt;
}
