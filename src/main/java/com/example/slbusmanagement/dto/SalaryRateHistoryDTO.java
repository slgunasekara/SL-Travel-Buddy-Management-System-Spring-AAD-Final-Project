package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SalaryRateHistoryDTO {
    private Long historyId;
    private Long empId;
    private Double rate;
    private String effectiveDate;
}
