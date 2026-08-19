package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.TripEmployeeDTO;

import java.util.List;

public interface TripEmployeeService {
    List<TripEmployeeDTO> getAll();
    TripEmployeeDTO add(TripEmployeeDTO dto);
    TripEmployeeDTO update(Long id, TripEmployeeDTO dto);
    void delete(Long id);
}
