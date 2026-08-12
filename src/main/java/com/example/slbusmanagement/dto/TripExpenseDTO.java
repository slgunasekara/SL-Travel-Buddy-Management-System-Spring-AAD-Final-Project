package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class TripExpenseDTO {
    private Long tripExpId;
    private Long tripId;
    private String date;
    private Double fuelAmount;
    private Double parkingAmount;
    private Double otherAmount;
    private String otherDescription;
    private String notes;
    private Long createdBy;
}
