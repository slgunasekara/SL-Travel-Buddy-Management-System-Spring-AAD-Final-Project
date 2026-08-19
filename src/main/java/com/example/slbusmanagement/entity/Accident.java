package com.example.slbusmanagement.entity;

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
public class Accident {

    @Id
    private Long accidentId;

    private Long busId;

    /** Optional — an accident can happen while parked, with no trip running. */
    private Long tripId;

    /** The driver who was driving the bus at the time — references Employee. */
    private Long driverId;

    private String location;

    private String accidentDate;

    private Double estimatedCost;

    private String description;

    private String photo1Url;
    private String photo2Url;
    private String photo3Url;

    private Long createdBy;

    private String createdAt;

    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.ACTIVE;

}
