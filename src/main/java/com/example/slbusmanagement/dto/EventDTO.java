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
public class EventDTO {
    private Long eventId;

    @NotNull(message = "Bus is required")
    private Long busId;

    private Long linkedTripId;


    private Long customerId;

    @NotBlank(message = "Start location is required")
    private String startLocation;

    @NotBlank(message = "End location is required")
    private String endLocation;

    @NotNull(message = "Booking value is required")
    @Positive(message = "Booking value must be greater than zero")
    private Double eventValue;

    @NotBlank(message = "Event date is required")
    private String eventDate;

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Customer contact is required")
    private String customerContact;

    private String customerNic;

    @NotBlank(message = "Customer address is required")
    private String customerAddress;

    private String description;
    private Boolean eventCompleted;
    private String photoFileName;
    private Long createdBy;
    private String createdAt;
    private String updatedAt;
}