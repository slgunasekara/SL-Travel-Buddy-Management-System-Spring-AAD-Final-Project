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
public class OtherServiceDTO {
    private Long serviceId;

    @NotNull(message = "Trip is required")
    private Long tripId;

    private Long busId;

    @NotBlank(message = "Service name is required")
    private String serviceName;

    @NotNull(message = "Cost is required")
    @Positive(message = "Cost must be greater than zero")
    private Double cost;

    private String description;
    private String date;
    private Long createdBy;
}