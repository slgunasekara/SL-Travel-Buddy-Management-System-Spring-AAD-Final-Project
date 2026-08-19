package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.BusSaleRecordDTO;

import java.util.List;

public interface BusSaleRecordService {
    List<BusSaleRecordDTO> getAll();
    BusSaleRecordDTO add(BusSaleRecordDTO dto);
}
