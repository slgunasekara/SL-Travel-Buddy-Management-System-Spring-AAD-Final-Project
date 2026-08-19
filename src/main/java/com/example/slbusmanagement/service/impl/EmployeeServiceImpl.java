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
        log.info("Update Employee Method Executed....");
        Employee entity = employeeRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomeException(404, "Employee not found with ID: " + id));

        entity.setEmpCategory(dto.getEmpCategory());
        entity.setEmpCategory2(dto.getEmpCategory2());
        entity.setEmpName(dto.getEmpName());
        entity.setAddress(dto.getAddress());
        entity.setContactNo(dto.getContactNo());
        entity.setNicNo(dto.getNicNo());
        entity.setNtcNo(dto.getNtcNo());
        entity.setDrivingLicenceNo(dto.getDrivingLicenceNo());
        entity.setJoinDate(dto.getJoinDate());
        entity.setExitDate(dto.getExitDate());
        entity.setEmpStatus(dto.getEmpStatus());
        entity.setNicPhotoUrl(dto.getNicPhotoUrl());
        entity.setLicencePhotoUrl(dto.getLicencePhotoUrl());
        entity.setCreatedBy(dto.getCreatedBy());

        boolean rateChanged = dto.getBaseSalaryRate() != null
                && (entity.getBaseSalaryRate() == null || !entity.getBaseSalaryRate().equals(dto.getBaseSalaryRate()));
        entity.setBaseSalaryRate(dto.getBaseSalaryRate());

        employeeRepository.save(entity);
        if (rateChanged) {
            recordRateChange(entity.getEmpId(), dto.getBaseSalaryRate());
        }
        log.info("Employee Updated Successfully....");
        return toDto(entity);
    }


    @Override
    public void delete(Long id) {
        log.info("Delete Employee Method Executed....");
        Employee entity = employeeRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomeException(404, "Employee not found with ID: " + id));

        entity.setStatus(RecordStatus.INACTIVE);
        employeeRepository.save(entity);
        log.info("Employee Deleted (soft) Successfully....");
    }
}
