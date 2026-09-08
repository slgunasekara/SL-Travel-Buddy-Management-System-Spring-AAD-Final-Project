package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.EmployeeDTO;
import com.example.slbusmanagement.entity.Employee;
import com.example.slbusmanagement.enumeration.RecordStatus;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.exception.CustomException;
import com.example.slbusmanagement.repository.EmployeeRepository;
import com.example.slbusmanagement.repository.EmployeeSalaryRepository;
import com.example.slbusmanagement.repository.TripEmployeeRepository;
import com.example.slbusmanagement.service.EmployeeService;
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
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeSalaryRepository employeeSalaryRepository;
    private final TripEmployeeRepository tripEmployeeRepository;

    private static final java.util.List<String> LICENCE_REQUIRED_CATEGORIES = java.util.List.of("DRIVER", "MANAGER");

    private EmployeeDTO toDto(Employee entity) {
        EmployeeDTO dto = new EmployeeDTO();
        BeanUtils.copyProperties(entity, dto);
        dto.setJoinDate(DateUtil.formatDate(entity.getJoinDate()));
        dto.setExitDate(DateUtil.formatDate(entity.getExitDate()));
        return dto;
    }


    private void validateDrivingLicence(String category, String category2, String licenceNo) {
        boolean needed = LICENCE_REQUIRED_CATEGORIES.contains(category) || LICENCE_REQUIRED_CATEGORIES.contains(category2);
        if (needed && (licenceNo == null || licenceNo.isBlank())) {
            throw new CustomException(ResponseCode.BAD_REQUEST, "Driving Licence No. is required for Driver/Manager category employees.");
        }
    }

    @Override
    public List<EmployeeDTO> getAll() {
        log.info("Get All Employee Method Executed....");

        return employeeRepository.findAllByStatus(RecordStatus.ACTIVE).stream()
                .map(this::toDto).toList();
    }

    @Override
    public EmployeeDTO add(EmployeeDTO dto) {
        log.info("Save Employee Method Executed....");
        validateDrivingLicence(dto.getEmpCategory(), dto.getEmpCategory2(), dto.getDrivingLicenceNo());

        boolean dup = !employeeRepository.findByNicNoIgnoreCaseAndStatus(dto.getNicNo(), RecordStatus.ACTIVE).isEmpty();
        if (dup) throw new CustomException(ResponseCode.CONFLICT, "An employee with this NIC already exists!");

        Employee entity = new Employee();
        BeanUtils.copyProperties(dto, entity);

        entity.setEmpId(null);
        entity.setJoinDate(DateUtil.parseDate(dto.getJoinDate()));
        entity.setExitDate(DateUtil.parseDate(dto.getExitDate()));
        entity.setStatus(RecordStatus.ACTIVE);
        employeeRepository.save(entity);
        log.info("Employee Saved Successfully....");
        return toDto(entity);
    }

    @Override
    public EmployeeDTO update(Long id, EmployeeDTO dto) {
        log.info("Update Employee Method Executed....");
        validateDrivingLicence(dto.getEmpCategory(), dto.getEmpCategory2(), dto.getDrivingLicenceNo());
        Employee entity = employeeRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

        boolean dup = !employeeRepository.findByNicNoIgnoreCaseAndStatusExcludingId(dto.getNicNo(), RecordStatus.ACTIVE, id).isEmpty();
        if (dup) throw new CustomException(ResponseCode.CONFLICT, "An employee with this NIC already exists!");

        entity.setEmpCategory(dto.getEmpCategory());
        entity.setEmpCategory2(dto.getEmpCategory2());
        entity.setEmpName(dto.getEmpName());
        entity.setAddress(dto.getAddress());
        entity.setContactNo(dto.getContactNo());
        entity.setNicNo(dto.getNicNo());
        entity.setNtcNo(dto.getNtcNo());
        entity.setDrivingLicenceNo(dto.getDrivingLicenceNo());
        entity.setJoinDate(DateUtil.parseDate(dto.getJoinDate()));
        entity.setExitDate(DateUtil.parseDate(dto.getExitDate()));
        entity.setEmpStatus(dto.getEmpStatus());


        employeeRepository.save(entity);
        log.info("Employee Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {
        log.info("Delete Employee Method Executed....");
        Employee entity = employeeRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

        boolean hasSalary = employeeSalaryRepository.findAll().stream()
                .anyMatch(s -> s.getEmployee() != null && id.equals(s.getEmployee().getEmpId()));
        boolean hasTrip = tripEmployeeRepository.findAll().stream()
                .anyMatch(t -> t.getEmployee() != null && id.equals(t.getEmployee().getEmpId()));
        if (hasSalary || hasTrip) {
            throw new CustomException(ResponseCode.BAD_REQUEST, "Cannot delete this employee — salary records or trip assignments reference them.");
        }


        entity.setStatus(RecordStatus.INACTIVE);
        employeeRepository.save(entity);
        log.info("Employee Deleted (soft) Successfully....");
    }
}
