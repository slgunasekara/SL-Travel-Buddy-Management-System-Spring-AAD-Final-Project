package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.UpdatePriceDTO;

import java.util.List;

public interface UpdatePriceService {
    List<UpdatePriceDTO> getAll();
    UpdatePriceDTO add(UpdatePriceDTO dto);
    UpdatePriceDTO update(Long id, UpdatePriceDTO dto);
    void delete(Long id);
}
