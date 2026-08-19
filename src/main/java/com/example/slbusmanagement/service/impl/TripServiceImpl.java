package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.TripDTO;
import com.example.slbusmanagement.entity.Trip;
import com.example.slbusmanagement.enumiration.RecordStatus;
import com.example.slbusmanagement.exception.CustomeException;
import com.example.slbusmanagement.repository.TripRepository;
import com.example.slbusmanagement.service.TripService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class TripServiceImpl implements TripService {

    private final TripRepository tripRepository;

    private TripDTO toDto(Trip entity) {
        TripDTO dto = new TripDTO();
        BeanUtils.copyProperties(entity, dto);
        return dto;
    }


    @Override
    public List<TripDTO> getAll() {
        return List.of();
    }

    @Override
    public TripDTO add(TripDTO dto) {
        log.info("Save Trip Method Executed....");
        Trip entity = new Trip();
        BeanUtils.copyProperties(dto, entity);
        entity.setStatus(RecordStatus.ACTIVE);
        tripRepository.save(entity);
        log.info("Trip Saved Successfully....");
        return toDto(entity);
    }

    @Override
    public TripDTO update(Long id, TripDTO dto) {
        return null;
    }

    @Override
    public void delete(Long id) {

    }
}
