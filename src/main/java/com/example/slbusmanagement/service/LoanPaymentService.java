package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.LoanPaymentDTO;

import java.util.List;

public interface LoanPaymentService {
    List<LoanPaymentDTO> getAll();
    LoanPaymentDTO add(LoanPaymentDTO dto);
    LoanPaymentDTO update(Long id, LoanPaymentDTO dto);
    void delete(Long id);
}
