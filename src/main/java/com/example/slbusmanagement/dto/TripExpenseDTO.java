package com.example.slbusmanagement.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripExpenseDTO {
    private Long tripExpId;

    @NotNull(message = "Trip is required")
    private Long tripId;

    private String date;
    private Double fuelAmount;
    private Double parkingAmount;
    private Double otherAmount;
    private String otherDescription;
    private String notes;
    private Long createdBy;
}
