package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.BudgetCapDTO;

import java.util.List;

public interface BudgetCapService {
    List<BudgetCapDTO> getAll();
    BudgetCapDTO add(BudgetCapDTO dto);
    BudgetCapDTO update(Long id, BudgetCapDTO dto);
    void delete(Long id);
}
