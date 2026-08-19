package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.EmployeeDTO;
import com.example.slbusmanagement.entity.Employee;
import com.example.slbusmanagement.entity.SalaryRateHistory;
import com.example.slbusmanagement.enumiration.RecordStatus;
import com.example.slbusmanagement.exception.CustomeException;
import com.example.slbusmanagement.repository.EmployeeRepository;
import com.example.slbusmanagement.repository.SalaryRateHistoryRepository;
import com.example.slbusmanagement.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final SalaryRateHistoryRepository salaryRateHistoryRepository;

    private EmployeeDTO toDto(Employee entity) {
        EmployeeDTO dto = new EmployeeDTO();
        BeanUtils.copyProperties(entity, dto);
        return dto;
    }

    @Override
    public List<EmployeeDTO> getAll() {
        log.info("Get All Employee Method Executed....");

        return employeeRepository.findAll().stream()
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .map(this::toDto).toList();
    }

    @Override
    public EmployeeDTO add(EmployeeDTO dto) {
        log.info("Save Employee Method Executed....");
        Employee entity = new Employee();
        BeanUtils.copyProperties(dto, entity);
        entity.setStatus(RecordStatus.ACTIVE);
        employeeRepository.save(entity);

        if (dto.getBaseSalaryRate() != null) {
            recordRateChange(entity.getEmpId(), dto.getBaseSalaryRate());
        }
        log.info("Employee Saved Successfully....");
        return toDto(entity);
    }

    private void recordRateChange(Long empId, Double rate) {
        SalaryRateHistory h = new SalaryRateHistory();
        h.setEmpId(empId);
        h.setRate(rate);
        h.setEffectiveDate(java.time.LocalDate.now().toString());
        salaryRateHistoryRepository.save(h);
    }

    @Override
    public EmployeeDTO update(Long id, EmployeeDTO dto) {
        return null;
    }

    @Override
    public void delete(Long id) {

    }
}
