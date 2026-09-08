package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.PartPurchaseDTO;
import com.example.slbusmanagement.entity.Bus;
import com.example.slbusmanagement.entity.Maintenance;
import com.example.slbusmanagement.entity.PartPurchase;
import com.example.slbusmanagement.enumeration.RecordStatus;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.exception.CustomException;
import com.example.slbusmanagement.repository.BusRepository;
import com.example.slbusmanagement.repository.MaintenanceRepository;
import com.example.slbusmanagement.repository.PartPurchaseRepository;
import com.example.slbusmanagement.service.PartPurchaseService;
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
public class PartPurchaseServiceImpl implements PartPurchaseService {

    private final PartPurchaseRepository partPurchaseRepository;
    private final BusRepository busRepository;
    private final MaintenanceRepository maintenanceRepository;

    private Bus resolveBus(Long busId) {
        if (busId == null) return null;
        return busRepository.findById(busId)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
    }

    private Maintenance resolveMaintenance(Long maintId) {
        if (maintId == null) return null;
        return maintenanceRepository.findById(maintId)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
    }

    private PartPurchaseDTO toDto(PartPurchase entity) {
        PartPurchaseDTO dto = new PartPurchaseDTO();
        BeanUtils.copyProperties(entity, dto);
        dto.setBusId(entity.getBus() != null ? entity.getBus().getBusId() : null);
        dto.setMaintId(entity.getMaintenance() != null ? entity.getMaintenance().getMaintId() : null);
        dto.setDate(DateUtil.formatDate(entity.getDate()));
        return dto;
    }

    @Override
    public List<PartPurchaseDTO> getAll() {
        log.info("Get All PartPurchase Method Executed....");

        return partPurchaseRepository.findAll().stream()
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .map(this::toDto).toList();
    }

    @Override
    public PartPurchaseDTO add(PartPurchaseDTO dto) {
        log.info("Save PartPurchase Method Executed....");
        PartPurchase entity = new PartPurchase();
        BeanUtils.copyProperties(dto, entity);

        entity.setPurchaseId(null);
        entity.setBus(resolveBus(dto.getBusId()));
        entity.setMaintenance(resolveMaintenance(dto.getMaintId()));

        entity.setTotalCost(recomputeTotalCost(dto.getQuantity(), dto.getUnitPrice()));
        entity.setDate(DateUtil.parseDate(dto.getDate()));
        entity.setStatus(RecordStatus.ACTIVE);
        partPurchaseRepository.save(entity);
        log.info("PartPurchase Saved Successfully....");
        return toDto(entity);
    }

    private Double recomputeTotalCost(Integer quantity, Double unitPrice) {
        if (quantity == null || unitPrice == null) return null;
        return quantity * unitPrice;
    }

    @Override
    public PartPurchaseDTO update(Long id, PartPurchaseDTO dto) {
        log.info("Update PartPurchase Method Executed....");
        PartPurchase entity = partPurchaseRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

        entity.setBus(resolveBus(dto.getBusId()));
        entity.setMaintenance(resolveMaintenance(dto.getMaintId()));
        entity.setPartName(dto.getPartName());
        entity.setQuantity(dto.getQuantity());
        entity.setUnitPrice(dto.getUnitPrice());
        entity.setTotalCost(recomputeTotalCost(dto.getQuantity(), dto.getUnitPrice()));
        entity.setSupplierName(dto.getSupplierName());
        entity.setDate(DateUtil.parseDate(dto.getDate()));
        entity.setPartDescription(dto.getPartDescription());
        entity.setPhotoFileName(dto.getPhotoFileName());


        partPurchaseRepository.save(entity);
        log.info("PartPurchase Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {
        log.info("Delete PartPurchase Method Executed....");
        PartPurchase entity = partPurchaseRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));


        entity.setStatus(RecordStatus.INACTIVE);
        partPurchaseRepository.save(entity);
        log.info("PartPurchase Deleted (soft) Successfully....");
    }
}
