package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdatePriceDTO {
    private Long updatePricesId;
    private String updateType;
    private String changeType;
    private Double previousValue;
    private Double newValue;
    private Double changeAmount;
    private Double percentageChange;
    private String changeDate;
    private String description;
    private Long createdBy;
}