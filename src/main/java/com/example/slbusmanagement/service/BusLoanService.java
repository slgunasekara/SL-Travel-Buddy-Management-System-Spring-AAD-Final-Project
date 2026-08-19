package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.BusLoanDTO;

import java.util.List;

public interface BusLoanService {
    List<BusLoanDTO> getAll();
    BusLoanDTO add(BusLoanDTO dto);
    BusLoanDTO update(Long id, BusLoanDTO dto);
    void delete(Long id);
}
