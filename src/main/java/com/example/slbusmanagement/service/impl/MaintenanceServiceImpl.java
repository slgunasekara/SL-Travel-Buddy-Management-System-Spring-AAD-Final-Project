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
        log.info("Get All Maintenance Method Executed....");

        return maintenanceRepository.findAll().stream()
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .map(this::toDto).toList();
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
        log.info("Update Maintenance Method Executed....");
        Maintenance entity = maintenanceRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomeException(404, "Maintenance not found with ID: " + id));

        entity.setBusId(dto.getBusId());
        entity.setMaintenanceType(dto.getMaintenanceType());
        entity.setServiceDate(dto.getServiceDate());
        entity.setMileage(dto.getMileage());
        entity.setCost(dto.getCost());
        entity.setTechnician(dto.getTechnician());
        entity.setDescription(dto.getDescription());
        entity.setReceiptPhotoUrl(dto.getReceiptPhotoUrl());
        entity.setCreatedBy(dto.getCreatedBy());

        maintenanceRepository.save(entity);
        log.info("Maintenance Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {
        log.info("Delete Maintenance Method Executed....");
        Maintenance entity = maintenanceRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomeException(404, "Maintenance not found with ID: " + id));

        entity.setStatus(RecordStatus.INACTIVE);
        maintenanceRepository.save(entity);
        log.info("Maintenance Deleted (soft) Successfully....");
    }

}
