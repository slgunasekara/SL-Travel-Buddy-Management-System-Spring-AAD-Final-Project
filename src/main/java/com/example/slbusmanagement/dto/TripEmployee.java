package com.example.slbusmanagement.dto;

import com.example.slbusmanagement.enumiration.RecordStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class TripEmployee {

    @Id
    private Long tripEmpId;

    private Long tripId;

    private Long empId;

    private String roleInTrip;

    private String assignedDate;

    private Long createdBy;


    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.ACTIVE;

}