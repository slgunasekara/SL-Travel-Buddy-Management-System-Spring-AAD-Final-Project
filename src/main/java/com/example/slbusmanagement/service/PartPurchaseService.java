package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.PartPurchaseDTO;

import java.util.List;

public interface PartPurchaseService {
    List<PartPurchaseDTO> getAll();
    PartPurchaseDTO add(PartPurchaseDTO dto);
    PartPurchaseDTO update(Long id, PartPurchaseDTO dto);
    void delete(Long id);
}
