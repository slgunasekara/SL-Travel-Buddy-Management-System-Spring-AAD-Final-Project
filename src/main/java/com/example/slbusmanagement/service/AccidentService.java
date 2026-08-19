package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.AccidentDTO;

import java.util.List;

public interface AccidentService {
    List<AccidentDTO> getAll();
    AccidentDTO add(AccidentDTO dto);
    AccidentDTO update(Long id, AccidentDTO dto);
    void delete(Long id);
}
