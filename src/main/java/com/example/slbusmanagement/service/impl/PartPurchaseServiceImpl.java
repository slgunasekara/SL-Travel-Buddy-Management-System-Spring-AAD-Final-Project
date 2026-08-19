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
        // Soft-deleted (INACTIVE) records are hidden from every list.
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
        return null;
    }

    @Override
    public void delete(Long id) {

    }

}
