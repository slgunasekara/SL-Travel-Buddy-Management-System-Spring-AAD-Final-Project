package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.UpdatePriceDTO;
import com.example.slbusmanagement.entity.UpdatePrice;
import com.example.slbusmanagement.enumeration.RecordStatus;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.exception.CustomException;
import com.example.slbusmanagement.repository.UpdatePriceRepository;
import com.example.slbusmanagement.service.UpdatePriceService;
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
public class UpdatePriceServiceImpl implements UpdatePriceService {

    private final UpdatePriceRepository updatePriceRepository;

    private UpdatePriceDTO toDto(UpdatePrice entity) {
        UpdatePriceDTO dto = new UpdatePriceDTO();
        BeanUtils.copyProperties(entity, dto);
        dto.setChangeDate(DateUtil.formatDate(entity.getChangeDate()));
        return dto;
    }

    @Override
    public List<UpdatePriceDTO> getAll() {
        log.info("Get All UpdatePrice Method Executed....");

        return updatePriceRepository.findAll().stream()
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .map(this::toDto).toList();
    }

    @Override
    public UpdatePriceDTO add(UpdatePriceDTO dto) {
        log.info("Save UpdatePrice Method Executed....");
        UpdatePrice entity = new UpdatePrice();
        BeanUtils.copyProperties(dto, entity);

        entity.setUpdatePricesId(null);
        entity.setPreviousValue(dto.getPreviousValue());
        entity.setNewValue(dto.getNewValue());
        entity.setChangeAmount(recomputeChangeAmount(dto.getPreviousValue(), dto.getNewValue()));
        entity.setPercentageChange(recomputePercentageChange(dto.getPreviousValue(), dto.getNewValue()));
        entity.setChangeDate(DateUtil.parseDate(dto.getChangeDate()));
        entity.setStatus(RecordStatus.ACTIVE);
        updatePriceRepository.save(entity);
        log.info("UpdatePrice Saved Successfully....");
        return toDto(entity);
    }


    private Double recomputeChangeAmount(Double previousValue, Double newValue) {
        if (previousValue == null || newValue == null) return null;
        return newValue - previousValue;
    }

    private Double recomputePercentageChange(Double previousValue, Double newValue) {
        if (previousValue == null || newValue == null || previousValue == 0) return 0.0;
        return (recomputeChangeAmount(previousValue, newValue) / previousValue) * 100;
    }

    @Override
    public UpdatePriceDTO update(Long id, UpdatePriceDTO dto) {
        log.info("Update UpdatePrice Method Executed....");
        UpdatePrice entity = updatePriceRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

        entity.setUpdateType(dto.getUpdateType());
        entity.setChangeType(dto.getChangeType());
        entity.setPreviousValue(dto.getPreviousValue());
        entity.setNewValue(dto.getNewValue());
        entity.setChangeAmount(recomputeChangeAmount(dto.getPreviousValue(), dto.getNewValue()));
        entity.setPercentageChange(recomputePercentageChange(dto.getPreviousValue(), dto.getNewValue()));
        entity.setChangeDate(DateUtil.parseDate(dto.getChangeDate()));
        entity.setDescription(dto.getDescription());


        updatePriceRepository.save(entity);
        log.info("UpdatePrice Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {
        log.info("Delete UpdatePrice Method Executed....");
        UpdatePrice entity = updatePriceRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

        entity.setStatus(RecordStatus.INACTIVE);
        updatePriceRepository.save(entity);
        log.info("UpdatePrice Deleted (soft) Successfully....");
    }
}
