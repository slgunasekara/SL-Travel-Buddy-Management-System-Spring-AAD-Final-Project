package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BudgetCapDTO {
    private Long capId;
    private String category;
    private Double monthlyCap;
    private Long createdBy;
    private String createdAt;
}
