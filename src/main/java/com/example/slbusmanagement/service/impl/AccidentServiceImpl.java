package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.AccidentDTO;
import com.example.slbusmanagement.entity.Accident;
import com.example.slbusmanagement.enumiration.RecordStatus;
import com.example.slbusmanagement.exception.CustomeException;
import com.example.slbusmanagement.repository.AccidentRepository;
import com.example.slbusmanagement.service.AccidentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class AccidentServiceImpl implements AccidentService {

    private final AccidentRepository accidentRepository;

    private AccidentDTO toDto(Accident entity) {
        AccidentDTO dto = new AccidentDTO();
        BeanUtils.copyProperties(entity, dto);
        return dto;
    }


    @Override
    public List<AccidentDTO> getAll() {
        log.info("Get All Accident Method Executed....");
        return accidentRepository.findAll().stream()
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .map(this::toDto).toList();
    }


    @Override
    public AccidentDTO add(AccidentDTO dto) {
        log.info("Save Accident Method Executed....");
        Accident entity = new Accident();
        BeanUtils.copyProperties(dto, entity);
        entity.setStatus(RecordStatus.ACTIVE);
        accidentRepository.save(entity);
        log.info("Accident Saved Successfully....");
        return toDto(entity);
    }

    @Override
    public AccidentDTO update(Long id, AccidentDTO dto) {
        log.info("Update Accident Method Executed....");
        Accident entity = accidentRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomeException(404, "Accident not found with ID: " + id));

        entity.setBusId(dto.getBusId());
        entity.setTripId(dto.getTripId());
        entity.setDriverId(dto.getDriverId());
        entity.setLocation(dto.getLocation());
        entity.setAccidentDate(dto.getAccidentDate());
        entity.setEstimatedCost(dto.getEstimatedCost());
        entity.setDescription(dto.getDescription());
        entity.setPhoto1Url(dto.getPhoto1Url());
        entity.setPhoto2Url(dto.getPhoto2Url());
        entity.setPhoto3Url(dto.getPhoto3Url());
        entity.setCreatedBy(dto.getCreatedBy());
        entity.setCreatedAt(dto.getCreatedAt());

        accidentRepository.save(entity);
        log.info("Accident Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {

    }

}
