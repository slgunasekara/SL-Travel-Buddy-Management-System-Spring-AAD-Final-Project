package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.MaintenanceDTO;
import com.example.slbusmanagement.entity.Bus;
import com.example.slbusmanagement.entity.Maintenance;
import com.example.slbusmanagement.enumeration.RecordStatus;
import com.example.slbusmanagement.enumeration.MaintenanceType;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.exception.CustomException;
import com.example.slbusmanagement.repository.BusRepository;
import com.example.slbusmanagement.repository.MaintenanceRepository;
import com.example.slbusmanagement.repository.PartPurchaseRepository;
import com.example.slbusmanagement.service.MaintenanceService;
import com.example.slbusmanagement.util.DateUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Transactional
@Service
@Slf4j
@RequiredArgsConstructor
public class MaintenanceServiceImpl implements MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final PartPurchaseRepository partPurchaseRepository;
    private final BusRepository busRepository;

    private Bus resolveBus(Long busId) {
        if (busId == null) return null;
        return busRepository.findById(busId)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
    }

    private MaintenanceDTO toDto(Maintenance entity) {
        MaintenanceDTO dto = new MaintenanceDTO();
        BeanUtils.copyProperties(entity, dto);
        dto.setBusId(entity.getBus() != null ? entity.getBus().getBusId() : null);
        dto.setMaintenanceType(entity.getMaintenanceType() != null ? entity.getMaintenanceType().name() : null);
        dto.setServiceDate(DateUtil.formatDate(entity.getServiceDate()));
        return dto;
    }

    @Override
    public List<MaintenanceDTO> getAll() {
        log.info("Get All Maintenance Method Executed....");

        return maintenanceRepository.findAllByStatus(RecordStatus.ACTIVE).stream()
                .map(this::toDto).toList();
    }

    @Override
    public MaintenanceDTO add(MaintenanceDTO dto) {
        log.info("Save Maintenance Method Executed....");
        Maintenance entity = new Maintenance();
        BeanUtils.copyProperties(dto, entity);

        entity.setMaintId(null);
        entity.setBus(resolveBus(dto.getBusId()));
        entity.setMaintenanceType(dto.getMaintenanceType() != null ? MaintenanceType.valueOf(dto.getMaintenanceType()) : null);
        entity.setServiceDate(DateUtil.parseDate(dto.getServiceDate()));
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
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

        entity.setBus(resolveBus(dto.getBusId()));
        entity.setMaintenanceType(dto.getMaintenanceType() != null ? MaintenanceType.valueOf(dto.getMaintenanceType()) : null);
        entity.setServiceDate(DateUtil.parseDate(dto.getServiceDate()));
        entity.setMileage(dto.getMileage());
        entity.setCost(dto.getCost());
        entity.setTechnician(dto.getTechnician());
        entity.setDescription(dto.getDescription());
        entity.setPhotoFileName(dto.getPhotoFileName());


        maintenanceRepository.save(entity);
        log.info("Maintenance Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {
        log.info("Delete Maintenance Method Executed....");
        Maintenance entity = maintenanceRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));


        boolean hasParts = partPurchaseRepository.findAll().stream()
                .anyMatch(p -> p.getMaintenance() != null && id.equals(p.getMaintenance().getMaintId()));
        if (hasParts) {
            throw new CustomException(ResponseCode.BAD_REQUEST, "Cannot delete this maintenance record — one or more part purchases are linked to it.");
        }


        entity.setStatus(RecordStatus.INACTIVE);
        maintenanceRepository.save(entity);
        log.info("Maintenance Deleted (soft) Successfully....");
    }
}
