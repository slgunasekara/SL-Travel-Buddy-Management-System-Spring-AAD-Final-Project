package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.InsuranceClaimDTO;

import java.util.List;

public interface InsuranceClaimService {
    List<InsuranceClaimDTO> getAll();
    InsuranceClaimDTO add(InsuranceClaimDTO dto);
    InsuranceClaimDTO update(Long id, InsuranceClaimDTO dto);
    void delete(Long id);
}
