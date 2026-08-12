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
public class TripExpense {

    @Id
    private Long tripExpId;

    private Long tripId;
    private String date;
    private Double fuelAmount;
    private Double parkingAmount;
    private Double otherAmount;
    private String otherDescription;
    private String notes;
    private Long createdBy;

    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.ACTIVE;

}
