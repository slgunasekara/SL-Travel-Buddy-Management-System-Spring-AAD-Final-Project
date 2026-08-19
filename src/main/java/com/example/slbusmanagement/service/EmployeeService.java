package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.EmployeeDTO;

import java.util.List;

public interface EmployeeService {
    List<EmployeeDTO> getAll();
    EmployeeDTO add(EmployeeDTO dto);
    EmployeeDTO update(Long id, EmployeeDTO dto);
    void delete(Long id);
}
