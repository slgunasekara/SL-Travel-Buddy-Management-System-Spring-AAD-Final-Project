package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.EmployeeSalaryDTO;
import com.example.slbusmanagement.entity.Employee;
import com.example.slbusmanagement.entity.EmployeeSalary;
import com.example.slbusmanagement.entity.Trip;
import com.example.slbusmanagement.enumeration.RecordStatus;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.exception.CustomException;
import com.example.slbusmanagement.repository.EmployeeRepository;
import com.example.slbusmanagement.repository.EmployeeSalaryRepository;
import com.example.slbusmanagement.repository.TripRepository;
import com.example.slbusmanagement.service.EmployeeSalaryService;
import com.example.slbusmanagement.util.DateUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Transactional
@Service
@Slf4j
@RequiredArgsConstructor
public class EmployeeSalaryServiceImpl implements EmployeeSalaryService {

    private final EmployeeSalaryRepository employeeSalaryRepository;
    private final EmployeeRepository employeeRepository;
    private final TripRepository tripRepository;

    private Employee resolveEmployee(Long empId) {
        if (empId == null) return null;
        return employeeRepository.findById(empId)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
    }

    private Trip resolveTrip(Long tripId) {
        if (tripId == null) return null;
        return tripRepository.findById(tripId)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
    }

    private EmployeeSalaryDTO toDto(EmployeeSalary entity) {
        EmployeeSalaryDTO dto = new EmployeeSalaryDTO();
        BeanUtils.copyProperties(entity, dto);
        dto.setEmpId(entity.getEmployee() != null ? entity.getEmployee().getEmpId() : null);
        dto.setTripId(entity.getTrip() != null ? entity.getTrip().getTripId() : null);
        dto.setDate(DateUtil.formatDate(entity.getDate()));
        return dto;
    }

    @Override
    public List<EmployeeSalaryDTO> getAll() {
        log.info("Get All EmployeeSalary Method Executed....");

        return employeeSalaryRepository.findAllByStatus(RecordStatus.ACTIVE).stream()
                .map(this::toDto).toList();
    }

    @Override
    public EmployeeSalaryDTO add(EmployeeSalaryDTO dto) {
        log.info("Save EmployeeSalary Method Executed....");
        EmployeeSalary entity = new EmployeeSalary();
        BeanUtils.copyProperties(dto, entity);

        entity.setSalaryId(null);
        entity.setEmployee(resolveEmployee(dto.getEmpId()));
        entity.setTrip(resolveTrip(dto.getTripId()));
        entity.setDate(DateUtil.parseDate(dto.getDate()));
        entity.setStatus(RecordStatus.ACTIVE);
        employeeSalaryRepository.save(entity);
        log.info("EmployeeSalary Saved Successfully....");
        return toDto(entity);
    }

    @Override
    public EmployeeSalaryDTO update(Long id, EmployeeSalaryDTO dto) {
        log.info("Update EmployeeSalary Method Executed....");
        EmployeeSalary entity = employeeSalaryRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

        entity.setEmployee(resolveEmployee(dto.getEmpId()));
        entity.setTrip(resolveTrip(dto.getTripId()));
        entity.setAmount(dto.getAmount());
        entity.setDate(DateUtil.parseDate(dto.getDate()));
        entity.setDescription(dto.getDescription());
        entity.setFromTripExpense(dto.getFromTripExpense());


        employeeSalaryRepository.save(entity);
        log.info("EmployeeSalary Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {
        log.info("Delete EmployeeSalary Method Executed....");
        EmployeeSalary entity = employeeSalaryRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));


        // INACTIVE
        entity.setStatus(RecordStatus.INACTIVE);
        employeeSalaryRepository.save(entity);
        log.info("EmployeeSalary Deleted (soft) Successfully....");
    }
}
