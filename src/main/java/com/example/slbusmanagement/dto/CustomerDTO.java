package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CustomerDTO {
    private Long customerId;
    private String name;
    private String contact;
    private String nic;
    private String email;
    private String address;
    private String notes;
    private String clientTier;
    private Double agreedRate;
    private String billingCycle;
    private Long createdBy;
    private String createdAt;
}