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
public class PartPurchaseDTO {
    private Long purchaseId;

    @NotNull(message = "Bus is required")
    private Long busId;

    private Long maintId;

    @NotBlank(message = "Part name is required")
    private String partName;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be greater than zero")
    private Integer quantity;

    @NotNull(message = "Unit price is required")
    @Positive(message = "Unit price must be greater than zero")
    private Double unitPrice;

    private Double totalCost;

    @NotBlank(message = "Supplier name is required")
    private String supplierName;

    @NotBlank(message = "Purchase date is required")
    private String date;

    private String partDescription;
    private String photoFileName;
    private Long createdBy;
}