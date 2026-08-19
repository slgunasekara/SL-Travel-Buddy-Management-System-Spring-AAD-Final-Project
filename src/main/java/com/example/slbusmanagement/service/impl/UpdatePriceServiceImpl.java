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
        return List.of();
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
        return null;
    }

    @Override
    public void delete(Long id) {

    }

}
