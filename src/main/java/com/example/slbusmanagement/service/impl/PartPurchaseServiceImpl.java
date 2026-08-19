package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.PartPurchaseDTO;
import com.example.slbusmanagement.entity.PartPurchase;
import com.example.slbusmanagement.enumiration.RecordStatus;
import com.example.slbusmanagement.exception.CustomeException;
import com.example.slbusmanagement.repository.PartPurchaseRepository;
import com.example.slbusmanagement.service.PartPurchaseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class PartPurchaseServiceImpl implements PartPurchaseService {

    private final PartPurchaseRepository partPurchaseRepository;

    private PartPurchaseDTO toDto(PartPurchase entity) {
        PartPurchaseDTO dto = new PartPurchaseDTO();
        BeanUtils.copyProperties(entity, dto);
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
        entity.setStatus(RecordStatus.ACTIVE);
        partPurchaseRepository.save(entity);
        log.info("PartPurchase Saved Successfully....");
        return toDto(entity);
    }

    @Override
    public PartPurchaseDTO update(Long id, PartPurchaseDTO dto) {
        log.info("Update PartPurchase Method Executed....");
        PartPurchase entity = partPurchaseRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomeException(404, "PartPurchase not found with ID: " + id));

        entity.setBusId(dto.getBusId());
        entity.setMaintId(dto.getMaintId());
        entity.setPartName(dto.getPartName());
        entity.setQuantity(dto.getQuantity());
        entity.setUnitPrice(dto.getUnitPrice());
        entity.setTotalCost(dto.getTotalCost());
        entity.setSupplierName(dto.getSupplierName());
        entity.setDate(dto.getDate());
        entity.setPartDescription(dto.getPartDescription());
        entity.setReceiptPhotoUrl(dto.getReceiptPhotoUrl());
        entity.setExpectedLifespanMonths(dto.getExpectedLifespanMonths());
        entity.setCreatedBy(dto.getCreatedBy());

        partPurchaseRepository.save(entity);
        log.info("PartPurchase Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {
        log.info("Delete PartPurchase Method Executed....");
        PartPurchase entity = partPurchaseRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomeException(404, "PartPurchase not found with ID: " + id));


        entity.setStatus(RecordStatus.INACTIVE);
        partPurchaseRepository.save(entity);
        log.info("PartPurchase Deleted (soft) Successfully....");
    }

}
