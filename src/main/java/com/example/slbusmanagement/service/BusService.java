package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.BusDTO;

import java.util.List;

public interface BusService {
    List<BusDTO> getAll();
    BusDTO add(BusDTO dto);
    BusDTO update(Long id, BusDTO dto);
    void delete(Long id);
}
