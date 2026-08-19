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
        log.info("Get All Trip Method Executed....");

        return tripRepository.findAll().stream()
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .map(this::toDto).toList();
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
        log.info("Update Trip Method Executed....");
        Trip entity = tripRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomeException(404, "Trip not found with ID: " + id));

        entity.setTripCategory(dto.getTripCategory());
        entity.setBusId(dto.getBusId());
        entity.setStartLocation(dto.getStartLocation());
        entity.setEndLocation(dto.getEndLocation());
        entity.setDistance(dto.getDistance());
        entity.setTotalIncome(dto.getTotalIncome());
        entity.setTripDate(dto.getTripDate());
        entity.setDescription(dto.getDescription());
        entity.setCreatedBy(dto.getCreatedBy());

        tripRepository.save(entity);
        log.info("Trip Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {
        log.info("Delete Trip Method Executed....");
        Trip entity = tripRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomeException(404, "Trip not found with ID: " + id));

        entity.setStatus(RecordStatus.INACTIVE);
        tripRepository.save(entity);
        log.info("Trip Deleted (soft) Successfully....");
    }
}
