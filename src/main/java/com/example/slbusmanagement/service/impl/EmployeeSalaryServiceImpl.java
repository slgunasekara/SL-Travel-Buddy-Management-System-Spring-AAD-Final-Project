package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.EmployeeSalaryDTO;
import com.example.slbusmanagement.entity.EmployeeSalary;
import com.example.slbusmanagement.enumiration.RecordStatus;
import com.example.slbusmanagement.exception.CustomeException;
import com.example.slbusmanagement.repository.EmployeeSalaryRepository;
import com.example.slbusmanagement.service.EmployeeSalaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmployeeSalaryServiceImpl implements EmployeeSalaryService {

    private final EmployeeSalaryRepository employeeSalaryRepository;

    private EmployeeSalaryDTO toDto(EmployeeSalary entity) {
        EmployeeSalaryDTO dto = new EmployeeSalaryDTO();
        BeanUtils.copyProperties(entity, dto);
        return dto;
    }


    @Override
    public List<EmployeeSalaryDTO> getAll() {
        return List.of();
    }

    @Override
    public EmployeeSalaryDTO add(EmployeeSalaryDTO dto) {
        log.info("Save EmployeeSalary Method Executed....");
        EmployeeSalary entity = new EmployeeSalary();
        BeanUtils.copyProperties(dto, entity);
        entity.setStatus(RecordStatus.ACTIVE);
        employeeSalaryRepository.save(entity);
        log.info("EmployeeSalary Saved Successfully....");
        return toDto(entity);
    }

    @Override
    public EmployeeSalaryDTO update(Long id, EmployeeSalaryDTO dto) {
        return null;
    }

    @Override
    public void delete(Long id) {

    }

}
