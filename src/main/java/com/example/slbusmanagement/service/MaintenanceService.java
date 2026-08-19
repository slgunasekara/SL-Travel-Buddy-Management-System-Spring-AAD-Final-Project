package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.MaintenanceDTO;

import java.util.List;

public interface MaintenanceService {
    List<MaintenanceDTO> getAll();
    MaintenanceDTO add(MaintenanceDTO dto);
    MaintenanceDTO update(Long id, MaintenanceDTO dto);
    void delete(Long id);
}
