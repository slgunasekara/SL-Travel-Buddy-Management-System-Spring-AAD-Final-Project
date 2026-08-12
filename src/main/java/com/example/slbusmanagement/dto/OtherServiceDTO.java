package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OtherServiceDTO {
    private Long serviceId;
    private Long tripId;
    private Long busId;
    private String serviceName;
    private Double cost;
    private String description;
    private String date;
    private Long createdBy;
}