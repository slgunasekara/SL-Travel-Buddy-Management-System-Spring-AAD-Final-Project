package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.BusDTO;
import com.example.slbusmanagement.entity.Bus;
import com.example.slbusmanagement.enumiration.RecordStatus;
import com.example.slbusmanagement.exception.CustomeException;
import com.example.slbusmanagement.repository.BusRepository;
import com.example.slbusmanagement.service.BusService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class BusServiceImpl implements BusService {

    private final BusRepository busRepository;

    private BusDTO toDto(Bus entity) {
        BusDTO dto = new BusDTO();
        BeanUtils.copyProperties(entity, dto);
        return dto;
    }

    @Override
    public List<BusDTO> getAll() {
        log.info("Get All Bus Method Executed....");
        // Soft-deleted (INACTIVE) records are hidden from every list.
        return busRepository.findAll().stream()
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .map(this::toDto).toList();
    }

    @Override
    public BusDTO add(BusDTO dto) {
        log.info("Save Bus Method Executed....");
        Bus entity = new Bus();
        BeanUtils.copyProperties(dto, entity);
        entity.setStatus(RecordStatus.ACTIVE);
        busRepository.save(entity);
        log.info("Bus Saved Successfully....");
        return toDto(entity);
    }

    @Override
    public BusDTO update(Long id, BusDTO dto) {
        log.info("Update Bus Method Executed....");
        Bus entity = busRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomeException(404, "Bus not found with ID: " + id));

        entity.setBusBrandName(dto.getBusBrandName());
        entity.setBusNumber(dto.getBusNumber());
        entity.setBusType(dto.getBusType());
        entity.setNoOfSeats(dto.getNoOfSeats());
        entity.setBusStatus(dto.getBusStatus());
        entity.setManufactureDate(dto.getManufactureDate());
        entity.setInsuranceExpiryDate(dto.getInsuranceExpiryDate());
        entity.setLicenseRenewalDate(dto.getLicenseRenewalDate());
        entity.setCurrentMileage(dto.getCurrentMileage());
        entity.setFuelEfficiency(dto.getFuelEfficiency());
        entity.setRoutePermitNo(dto.getRoutePermitNo());
        entity.setPermitStartLocation(dto.getPermitStartLocation());
        entity.setPermitEndLocation(dto.getPermitEndLocation());
        entity.setCreatedBy(dto.getCreatedBy());
        entity.setCreatedAt(dto.getCreatedAt());
        entity.setUpdatedAt(dto.getUpdatedAt());

        busRepository.save(entity);
        log.info("Bus Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {

    }
}
