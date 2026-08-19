package com.example.slbusmanagement.entity;

import com.example.slbusmanagement.enumiration.RecordStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** One monthly spending cap for an expense category (Fuel / Maintenance /
 *  Parts) — Settings → Budget Caps checks the current month's actual spend
 *  against these and raises a fleet alert when a category is
 *  approaching/over its cap. One row per category (the latest ACTIVE row
 *  for a category is the one in effect, same "latest wins" convention as
 *  Insurance/License). */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class BudgetCap {

    @Id
    private Long capId;

    private String category; // FUEL / MAINTENANCE / PARTS

    private Double monthlyCap;

    private Long createdBy;

    private String createdAt;

    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.ACTIVE;
}
