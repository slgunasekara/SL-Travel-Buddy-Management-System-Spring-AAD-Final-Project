package com.example.slbusmanagement.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Bus Retirement/Sale Workflow — written once when a bus is retired/sold,
 *  alongside soft-deleting the Bus itself. Keeps a permanent lifetime P&L
 *  snapshot (computed at the moment of sale) so that history survives even
 *  though the bus itself is no longer in active use. */
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
