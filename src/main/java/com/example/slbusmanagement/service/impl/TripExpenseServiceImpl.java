package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.TripExpenseDTO;
import com.example.slbusmanagement.entity.TripExpense;
import com.example.slbusmanagement.enumiration.RecordStatus;
import com.example.slbusmanagement.exception.CustomeException;
import com.example.slbusmanagement.repository.TripExpenseRepository;
import com.example.slbusmanagement.service.TripExpenseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class TripExpenseServiceImpl implements TripExpenseService {

    private final TripExpenseRepository tripExpenseRepository;

    private TripExpenseDTO toDto(TripExpense entity) {
        TripExpenseDTO dto = new TripExpenseDTO();
        BeanUtils.copyProperties(entity, dto);
        return dto;
    }


    @Override
    public List<TripExpenseDTO> getAll() {
        return List.of();
    }

    @Override
    public TripExpenseDTO add(TripExpenseDTO dto) {
        log.info("Save TripExpense Method Executed....");
        TripExpense entity = new TripExpense();
        BeanUtils.copyProperties(dto, entity);
        entity.setStatus(RecordStatus.ACTIVE);
        tripExpenseRepository.save(entity);
        log.info("TripExpense Saved Successfully....");
        return toDto(entity);
    }

    @Override
    public TripExpenseDTO update(Long id, TripExpenseDTO dto) {
        return null;
    }

    @Override
    public void delete(Long id) {

    }
}
