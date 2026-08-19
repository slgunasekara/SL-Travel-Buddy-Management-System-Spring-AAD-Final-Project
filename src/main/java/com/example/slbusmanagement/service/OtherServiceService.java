package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.OtherServiceDTO;

import java.util.List;

public interface OtherServiceService {
    List<OtherServiceDTO> getAll();
    OtherServiceDTO add(OtherServiceDTO dto);
    OtherServiceDTO update(Long id, OtherServiceDTO dto);
    void delete(Long id);
}
