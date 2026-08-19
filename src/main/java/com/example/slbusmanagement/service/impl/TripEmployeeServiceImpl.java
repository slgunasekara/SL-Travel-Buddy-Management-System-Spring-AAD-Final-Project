package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.TripEmployeeDTO;
import com.example.slbusmanagement.dto.TripExpenseDTO;
import com.example.slbusmanagement.entity.TripEmployee;
import com.example.slbusmanagement.enumiration.RecordStatus;
import com.example.slbusmanagement.exception.CustomeException;
import com.example.slbusmanagement.repository.TripEmployeeRepository;
import com.example.slbusmanagement.service.TripEmployeeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class TripEmployeeServiceImpl implements TripEmployeeService {

    private final TripEmployeeRepository tripEmployeeRepository;

    private TripEmployeeDTO toDto(TripEmployee entity) {
        TripEmployeeDTO dto = new TripEmployeeDTO();
        BeanUtils.copyProperties(entity, dto);
        return dto;
    }


    @Override
    public List<TripEmployeeDTO> getAll() {
        log.info("Get All TripEmployee Method Executed....");

        return tripEmployeeRepository.findAll().stream()
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .map(this::toDto).toList();
    }

    @Override
    public TripEmployeeDTO add(TripEmployeeDTO dto) {
        log.info("Save TripEmployee Method Executed....");
        TripEmployee entity = new TripEmployee();
        BeanUtils.copyProperties(dto, entity);
        entity.setStatus(RecordStatus.ACTIVE);
        tripEmployeeRepository.save(entity);
        log.info("TripEmployee Saved Successfully....");
        return toDto(entity);
    }

    @Override
    public TripEmployeeDTO update(Long id, TripEmployeeDTO dto) {
        return null;
    }

    @Override
    public void delete(Long id) {

    }

}
