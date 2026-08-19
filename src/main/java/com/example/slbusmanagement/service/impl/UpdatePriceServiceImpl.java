package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.UpdatePriceDTO;
import com.example.slbusmanagement.entity.UpdatePrice;
import com.example.slbusmanagement.enumiration.RecordStatus;
import com.example.slbusmanagement.exception.CustomeException;
import com.example.slbusmanagement.repository.UpdatePriceRepository;
import com.example.slbusmanagement.service.UpdatePriceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class UpdatePriceServiceImpl implements UpdatePriceService {

    private final UpdatePriceRepository updatePriceRepository;

    private UpdatePriceDTO toDto(UpdatePrice entity) {
        UpdatePriceDTO dto = new UpdatePriceDTO();
        BeanUtils.copyProperties(entity, dto);
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
        entity.setStatus(RecordStatus.ACTIVE);
        updatePriceRepository.save(entity);
        log.info("UpdatePrice Saved Successfully....");
        return toDto(entity);
    }

    @Override
    public UpdatePriceDTO update(Long id, UpdatePriceDTO dto) {
        log.info("Update UpdatePrice Method Executed....");
        UpdatePrice entity = updatePriceRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomeException(404, "UpdatePrice not found with ID: " + id));

        entity.setUpdateType(dto.getUpdateType());
        entity.setChangeType(dto.getChangeType());
        entity.setPreviousValue(dto.getPreviousValue());
        entity.setNewValue(dto.getNewValue());
        entity.setChangeAmount(dto.getChangeAmount());
        entity.setPercentageChange(dto.getPercentageChange());
        entity.setChangeDate(dto.getChangeDate());
        entity.setDescription(dto.getDescription());
        entity.setCreatedBy(dto.getCreatedBy());

        updatePriceRepository.save(entity);
        log.info("UpdatePrice Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {
        log.info("Delete UpdatePrice Method Executed....");
        UpdatePrice entity = updatePriceRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomeException(404, "UpdatePrice not found with ID: " + id));


        entity.setStatus(RecordStatus.INACTIVE);
        updatePriceRepository.save(entity);
        log.info("UpdatePrice Deleted (soft) Successfully....");
    }

}
