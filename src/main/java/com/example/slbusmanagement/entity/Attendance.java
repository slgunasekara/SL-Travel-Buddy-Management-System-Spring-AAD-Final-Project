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
public class Attendance {

    @Id
    private Long attendanceId;

    private Long empId;

    private String date;

    private String attendanceStatus;

    private String leaveType;

    private String notes;

    private Long createdBy;

    private String createdAt;

    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.ACTIVE;
}
