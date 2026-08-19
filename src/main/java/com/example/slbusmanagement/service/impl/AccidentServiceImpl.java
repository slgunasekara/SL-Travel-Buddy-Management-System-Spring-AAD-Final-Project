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
        return null;
    }

    @Override
    public void delete(Long id) {

    }

}
