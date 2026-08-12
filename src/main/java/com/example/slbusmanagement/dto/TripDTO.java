package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripDTO {
    private Long tripId;
    private String tripCategory;
    private Long busId;
    private String startLocation;
    private String endLocation;
    private Double distance;
    private Double totalIncome;
    private String tripDate;
    private String description;
    private Long createdBy;
}