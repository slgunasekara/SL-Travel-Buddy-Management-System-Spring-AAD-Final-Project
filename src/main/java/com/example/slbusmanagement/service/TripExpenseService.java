package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.TripExpenseDTO;

import java.util.List;

public interface TripExpenseService {
    List<TripExpenseDTO> getAll();
    TripExpenseDTO add(TripExpenseDTO dto);
    TripExpenseDTO update(Long id, TripExpenseDTO dto);
    void delete(Long id);
}
