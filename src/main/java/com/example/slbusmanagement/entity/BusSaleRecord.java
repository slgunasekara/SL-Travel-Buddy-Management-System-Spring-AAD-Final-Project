package com.example.slbusmanagement.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class BusSaleRecord {

    @Id
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
