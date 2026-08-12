package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EventDTO {
    private Long eventId;
    private Long busId;
    private Long linkedTripId;
    private String startLocation;
    private String endLocation;
    private Double eventValue;
    private String eventDate;
    private String customerName;
    private String customerContact;
    private String customerNic;
    private String customerAddress;
    private String description;
    private Boolean eventCompleted;
    private Long createdBy;
    private String createdAt;
    private String updatedAt;
}