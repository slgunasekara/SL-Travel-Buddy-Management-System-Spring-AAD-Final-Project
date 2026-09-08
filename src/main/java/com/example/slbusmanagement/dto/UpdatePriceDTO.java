package com.example.slbusmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdatePriceDTO {
    private Long updatePricesId;

    @NotBlank(message = "Update type is required")
    private String updateType;

    @NotBlank(message = "Change type is required")
    private String changeType;


    @NotNull(message = "Previous value is required")
    private Double previousValue;

    @NotNull(message = "New value is required")
    @Positive(message = "New value must be greater than zero")
    private Double newValue;

    private Double changeAmount;
    private Double percentageChange;

    @NotBlank(message = "Change date is required")
    private String changeDate;

    private String description;
    private Long createdBy;
}