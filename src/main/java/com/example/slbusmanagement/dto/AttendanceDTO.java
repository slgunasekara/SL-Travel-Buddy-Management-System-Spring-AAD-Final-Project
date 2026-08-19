package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AttendanceDTO {
    private Long attendanceId;
    private Long empId;
    private String date;
    private String attendanceStatus;
    private String leaveType;
    private String notes;
    private Long createdBy;
    private String createdAt;
}
