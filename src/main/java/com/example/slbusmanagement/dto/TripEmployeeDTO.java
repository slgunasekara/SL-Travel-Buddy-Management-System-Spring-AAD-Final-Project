package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripEmployeeDTO {
    private Long tripEmpId;
    private Long tripId;
    private Long empId;
    private String roleInTrip;
    private String assignedDate;
    private Long createdBy;
}