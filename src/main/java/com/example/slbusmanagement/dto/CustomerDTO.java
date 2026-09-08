package com.example.slbusmanagement.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CustomerDTO {
    private Long customerId;

    @NotBlank(message = "Customer name is required")
    private String name;

    @NotBlank(message = "Contact number is required")
    private String contact;

    private String nic;

    @Email(message = "Email must be a valid address")
    private String email;

    private String address;
    private String notes;
    private Long createdBy;
    private String createdAt;
}