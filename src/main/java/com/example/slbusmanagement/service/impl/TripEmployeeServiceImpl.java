package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.TripEmployeeDTO;
import com.example.slbusmanagement.entity.Employee;
import com.example.slbusmanagement.entity.Trip;
import com.example.slbusmanagement.entity.TripEmployee;
import com.example.slbusmanagement.enumeration.RecordStatus;
import com.example.slbusmanagement.enumeration.RoleInTrip;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.exception.CustomException;
import com.example.slbusmanagement.repository.EmployeeRepository;
import com.example.slbusmanagement.repository.TripEmployeeRepository;
import com.example.slbusmanagement.repository.TripRepository;
import com.example.slbusmanagement.service.TripEmployeeService;
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
public class TripEmployeeServiceImpl implements TripEmployeeService {

    private final TripEmployeeRepository tripEmployeeRepository;
    private final TripRepository tripRepository;
    private final EmployeeRepository employeeRepository;


    private Trip resolveTrip(Long tripId) {
        if (tripId == null) return null;
        return tripRepository.findById(tripId)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
    }

    private Employee resolveEmployee(Long empId) {
        if (empId == null) return null;
        return employeeRepository.findById(empId)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
    }

    private TripEmployeeDTO toDto(TripEmployee entity) {
        TripEmployeeDTO dto = new TripEmployeeDTO();
        BeanUtils.copyProperties(entity, dto);
        dto.setTripId(entity.getTrip() != null ? entity.getTrip().getTripId() : null);
        dto.setEmpId(entity.getEmployee() != null ? entity.getEmployee().getEmpId() : null);
        dto.setRoleInTrip(entity.getRoleInTrip() != null ? entity.getRoleInTrip().name() : null);
        dto.setAssignedDate(DateUtil.formatDate(entity.getAssignedDate()));
        return dto;
    }

    @Override
    public List<TripEmployeeDTO> getAll() {
        log.info("Get All TripEmployee Method Executed....");

        return tripEmployeeRepository.findAllByStatus(RecordStatus.ACTIVE).stream()
                .map(this::toDto).toList();
    }

    @Override
    public TripEmployeeDTO add(TripEmployeeDTO dto) {
        log.info("Save TripEmployee Method Executed....");
        TripEmployee entity = new TripEmployee();
        BeanUtils.copyProperties(dto, entity);

        entity.setTripEmpId(null);
        entity.setTrip(resolveTrip(dto.getTripId()));
        entity.setEmployee(resolveEmployee(dto.getEmpId()));
        entity.setRoleInTrip(dto.getRoleInTrip() != null ? RoleInTrip.valueOf(dto.getRoleInTrip()) : null);
        entity.setAssignedDate(DateUtil.parseDate(dto.getAssignedDate()));
        entity.setStatus(RecordStatus.ACTIVE);
        tripEmployeeRepository.save(entity);
        log.info("TripEmployee Saved Successfully....");
        return toDto(entity);
    }


    private boolean wouldRemoveLastDriver(Long tripId, Long awayFromId, RoleInTrip currentRole) {
        if (currentRole != RoleInTrip.DRIVER1 && currentRole != RoleInTrip.DRIVER2) return false;
        return tripEmployeeRepository.findByTrip_TripIdAndStatus(tripId, RecordStatus.ACTIVE).stream()
                .noneMatch(te -> !te.getTripEmpId().equals(awayFromId)
                        && (te.getRoleInTrip() == RoleInTrip.DRIVER1 || te.getRoleInTrip() == RoleInTrip.DRIVER2));
    }

    @Override
    public TripEmployeeDTO update(Long id, TripEmployeeDTO dto) {
        log.info("Update TripEmployee Method Executed....");
        TripEmployee entity = tripEmployeeRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

        RoleInTrip newRole = dto.getRoleInTrip() != null ? RoleInTrip.valueOf(dto.getRoleInTrip()) : null;
        if (newRole != entity.getRoleInTrip()
                && wouldRemoveLastDriver(entity.getTrip().getTripId(), entity.getTripEmpId(), entity.getRoleInTrip())) {
            throw new CustomException(ResponseCode.BAD_REQUEST,
                    "This trip needs at least one driver — assign another driver before changing this one's role.");
        }

        entity.setTrip(resolveTrip(dto.getTripId()));
        entity.setEmployee(resolveEmployee(dto.getEmpId()));
        entity.setRoleInTrip(newRole);
        entity.setAssignedDate(DateUtil.parseDate(dto.getAssignedDate()));


        tripEmployeeRepository.save(entity);
        log.info("TripEmployee Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {
        log.info("Delete TripEmployee Method Executed....");
        TripEmployee entity = tripEmployeeRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

        if (wouldRemoveLastDriver(entity.getTrip().getTripId(), entity.getTripEmpId(), entity.getRoleInTrip())) {
            throw new CustomException(ResponseCode.BAD_REQUEST,
                    "This trip needs at least one driver — assign another driver before removing this one.");
        }

        // to INACTIVE
        entity.setStatus(RecordStatus.INACTIVE);
        tripEmployeeRepository.save(entity);
        log.info("TripEmployee Deleted (soft) Successfully....");
    }
}
