package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.InsuranceDTO;

import java.util.List;

public interface InsuranceService {
    List<InsuranceDTO> getAll();
    InsuranceDTO add(InsuranceDTO dto);
    InsuranceDTO update(Long id, InsuranceDTO dto);
    void delete(Long id);
}
