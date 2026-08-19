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
        return List.of();
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
        return null;
    }

    @Override
    public void delete(Long id) {

    }
}
