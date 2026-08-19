package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.LicenseDTO;

import java.util.List;

public interface LicenseService {
    List<LicenseDTO> getAll();
    LicenseDTO add(LicenseDTO dto);
    LicenseDTO update(Long id, LicenseDTO dto);
    void delete(Long id);
}
