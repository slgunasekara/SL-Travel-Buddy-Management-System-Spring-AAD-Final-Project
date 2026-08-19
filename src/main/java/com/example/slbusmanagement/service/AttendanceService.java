package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.AttendanceDTO;

import java.util.List;

public interface AttendanceService {
    List<AttendanceDTO> getAll();
    AttendanceDTO add(AttendanceDTO dto);
    AttendanceDTO update(Long id, AttendanceDTO dto);
    void delete(Long id);
}
