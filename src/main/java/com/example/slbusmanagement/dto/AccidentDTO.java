package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AccidentDTO {
    private Long accidentId;
    private Long busId;
    private Long tripId;
    private Long driverId;
    private String location;
    private String accidentDate;
    private Double estimatedCost;
    private String description;
    private String photo1Url;
    private String photo2Url;
    private String photo3Url;
    private Long createdBy;
    private String createdAt;
}
