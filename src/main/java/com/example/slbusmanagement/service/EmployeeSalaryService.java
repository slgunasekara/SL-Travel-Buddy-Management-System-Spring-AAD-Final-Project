package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.EmployeeSalaryDTO;

import java.util.List;

public interface EmployeeSalaryService {
    List<EmployeeSalaryDTO> getAll();
    EmployeeSalaryDTO add(EmployeeSalaryDTO dto);
    EmployeeSalaryDTO update(Long id, EmployeeSalaryDTO dto);
    void delete(Long id);
}
