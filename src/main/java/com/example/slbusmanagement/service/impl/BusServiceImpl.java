package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.BusDTO;
import com.example.slbusmanagement.entity.Bus;
import com.example.slbusmanagement.enumeration.BusStatus;
import com.example.slbusmanagement.enumeration.BusType;
import com.example.slbusmanagement.enumeration.RecordStatus;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.exception.CustomException;
import com.example.slbusmanagement.repository.BusRepository;
import com.example.slbusmanagement.repository.TripRepository;
import com.example.slbusmanagement.repository.EventRepository;
import com.example.slbusmanagement.repository.MaintenanceRepository;
import com.example.slbusmanagement.repository.PartPurchaseRepository;
import com.example.slbusmanagement.repository.OtherServiceRepository;
import com.example.slbusmanagement.service.BusService;
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
public class BusServiceImpl implements BusService {

    private final BusRepository busRepository;
    private final TripRepository tripRepository;
    private final EventRepository eventRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final PartPurchaseRepository partPurchaseRepository;
    private final OtherServiceRepository otherServiceRepository;


    private BusDTO toDto(Bus entity) {
        BusDTO dto = new BusDTO();
        BeanUtils.copyProperties(entity, dto);
        dto.setBusType(entity.getBusType() != null ? entity.getBusType().name() : null);
        dto.setBusStatus(entity.getBusStatus() != null ? entity.getBusStatus().name() : null);
        dto.setManufactureDate(DateUtil.formatDate(entity.getManufactureDate()));
        dto.setInsuranceExpiryDate(DateUtil.formatDate(entity.getInsuranceExpiryDate()));
        dto.setLicenseRenewalDate(DateUtil.formatDate(entity.getLicenseRenewalDate()));
        dto.setCreatedAt(DateUtil.formatDateTime(entity.getCreatedAt()));
        dto.setUpdatedAt(DateUtil.formatDateTime(entity.getUpdatedAt()));
        return dto;
    }

    @Override
    public List<BusDTO> getAll() {
        log.info("Get All Bus Method Executed....");

        return busRepository.findAllByStatus(RecordStatus.ACTIVE).stream()
                .map(this::toDto).toList();
    }

    @Override
    public BusDTO add(BusDTO dto) {
        log.info("Save Bus Method Executed....");

        boolean dup = !busRepository.findByBusNumberIgnoreCaseAndStatus(dto.getBusNumber(), RecordStatus.ACTIVE).isEmpty();
        if (dup) throw new CustomException(ResponseCode.CONFLICT, "Bus number already exists!");

        Bus entity = new Bus();
        BeanUtils.copyProperties(dto, entity);

        entity.setBusId(null);
        entity.setBusType(dto.getBusType() != null ? BusType.valueOf(dto.getBusType()) : null);
        entity.setBusStatus(dto.getBusStatus() != null ? BusStatus.valueOf(dto.getBusStatus()) : null);
        entity.setManufactureDate(DateUtil.parseDate(dto.getManufactureDate()));
        entity.setInsuranceExpiryDate(DateUtil.parseDate(dto.getInsuranceExpiryDate()));
        entity.setLicenseRenewalDate(DateUtil.parseDate(dto.getLicenseRenewalDate()));
        entity.setStatus(RecordStatus.ACTIVE);
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        busRepository.save(entity);
        log.info("Bus Saved Successfully....");
        return toDto(entity);
    }

    @Override
    public BusDTO update(Long id, BusDTO dto) {
        log.info("Update Bus Method Executed....");
        Bus entity = busRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

        boolean dup = !busRepository.findByBusNumberIgnoreCaseAndStatusExcludingId(dto.getBusNumber(), RecordStatus.ACTIVE, id).isEmpty();
        if (dup) throw new CustomException(ResponseCode.CONFLICT, "Bus number already exists!");

        entity.setBusBrandName(dto.getBusBrandName());
        entity.setBusNumber(dto.getBusNumber());
        entity.setBusType(dto.getBusType() != null ? BusType.valueOf(dto.getBusType()) : null);
        entity.setNoOfSeats(dto.getNoOfSeats());
        entity.setBusStatus(dto.getBusStatus() != null ? BusStatus.valueOf(dto.getBusStatus()) : null);
        entity.setManufactureDate(DateUtil.parseDate(dto.getManufactureDate()));
        entity.setInsuranceExpiryDate(DateUtil.parseDate(dto.getInsuranceExpiryDate()));
        entity.setLicenseRenewalDate(DateUtil.parseDate(dto.getLicenseRenewalDate()));
        entity.setCurrentMileage(dto.getCurrentMileage());
        entity.setFuelEfficiency(dto.getFuelEfficiency());
        entity.setRoutePermitNo(dto.getRoutePermitNo());
        entity.setPermitStartLocation(dto.getPermitStartLocation());
        entity.setPermitEndLocation(dto.getPermitEndLocation());

        entity.setUpdatedAt(java.time.LocalDateTime.now());

        busRepository.save(entity);
        log.info("Bus Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public BusDTO updateStatus(Long id, String status) {
        log.info("Update Bus Status Method Executed....");
        Bus entity = busRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
        entity.setBusStatus(BusStatus.valueOf(status));
        busRepository.save(entity);
        log.info("Bus Status Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {
        log.info("Delete Bus Method Executed....");
        Bus entity = busRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));


        boolean usedByTrip = tripRepository.existsByBus_BusIdAndStatus(id, RecordStatus.ACTIVE);
        boolean usedByEvent = eventRepository.existsByBus_BusIdAndStatus(id, RecordStatus.ACTIVE);
        boolean usedByMaintenance = maintenanceRepository.existsByBus_BusIdAndStatus(id, RecordStatus.ACTIVE);
        boolean usedByParts = !partPurchaseRepository.findByBus_BusIdAndStatus(id, RecordStatus.ACTIVE).isEmpty();
        boolean usedByServices = otherServiceRepository.existsByBus_BusIdAndStatus(id, RecordStatus.ACTIVE);
        if (usedByTrip || usedByEvent || usedByMaintenance || usedByParts || usedByServices) {
            throw new CustomException(ResponseCode.BAD_REQUEST,
                    "Cannot delete this bus — it has linked trips, event bookings, maintenance records, part purchases, or other-service records.");
        }


        entity.setStatus(RecordStatus.INACTIVE);
        busRepository.save(entity);
        log.info("Bus Deleted (soft) Successfully....");
    }
}
