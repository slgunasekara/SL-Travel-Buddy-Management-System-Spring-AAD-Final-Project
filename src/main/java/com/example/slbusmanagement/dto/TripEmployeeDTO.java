package com.example.slbusmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripEmployeeDTO {
    private Long tripEmpId;
    private Long tripId;

    @NotNull(message = "Employee is required")
    private Long empId;

    @NotBlank(message = "Role in trip is required")
    private String roleInTrip;

    private String assignedDate;
    private Long createdBy;
}