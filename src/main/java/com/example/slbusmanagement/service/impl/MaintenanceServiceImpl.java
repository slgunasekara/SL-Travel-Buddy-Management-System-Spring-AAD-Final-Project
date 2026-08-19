package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.MaintenanceDTO;
import com.example.slbusmanagement.entity.Maintenance;
import com.example.slbusmanagement.enumiration.RecordStatus;
import com.example.slbusmanagement.exception.CustomeException;
import com.example.slbusmanagement.repository.MaintenanceRepository;
import com.example.slbusmanagement.service.MaintenanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class MaintenanceServiceImpl implements MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;

    private MaintenanceDTO toDto(Maintenance entity) {
        MaintenanceDTO dto = new MaintenanceDTO();
        BeanUtils.copyProperties(entity, dto);
        return dto;
    }


    @Override
    public List<MaintenanceDTO> getAll() {
        return List.of();
    }

    @Override
    public MaintenanceDTO add(MaintenanceDTO dto) {
        log.info("Save Maintenance Method Executed....");
        Maintenance entity = new Maintenance();
        BeanUtils.copyProperties(dto, entity);
        entity.setStatus(RecordStatus.ACTIVE);
        maintenanceRepository.save(entity);
        log.info("Maintenance Saved Successfully....");
        return toDto(entity);
    }

    @Override
    public MaintenanceDTO update(Long id, MaintenanceDTO dto) {
        return null;
    }

    @Override
    public void delete(Long id) {

    }

}
