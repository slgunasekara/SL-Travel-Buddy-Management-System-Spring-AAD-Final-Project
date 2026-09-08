package com.example.slbusmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripDTO {
    private Long tripId;

    @NotBlank(message = "Trip category is required")
    private String tripCategory;

    @NotNull(message = "Bus is required")
    private Long busId;

    @NotBlank(message = "Start location is required")
    private String startLocation;

    @NotBlank(message = "End location is required")
    private String endLocation;


    @Positive(message = "Distance must be greater than zero")
    private Double distance;

    @NotNull(message = "Total income is required")
    @PositiveOrZero(message = "Total income cannot be negative")
    private Double totalIncome;

    @NotBlank(message = "Trip date is required")
    private String tripDate;

    private String description;
    private Long createdBy;
}