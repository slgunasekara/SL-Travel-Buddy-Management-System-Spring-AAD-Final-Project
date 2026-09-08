package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.TripDTO;
import com.example.slbusmanagement.dto.TripWithCrewDTO;
import com.example.slbusmanagement.dto.TripEmployeeDTO;
import com.example.slbusmanagement.entity.Bus;
import com.example.slbusmanagement.entity.Employee;
import com.example.slbusmanagement.entity.Trip;
import com.example.slbusmanagement.entity.TripEmployee;
import com.example.slbusmanagement.enumeration.RecordStatus;
import com.example.slbusmanagement.enumeration.RoleInTrip;
import com.example.slbusmanagement.enumeration.TripCategory;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.exception.CustomException;
import com.example.slbusmanagement.repository.BusRepository;
import com.example.slbusmanagement.repository.EmployeeRepository;
import com.example.slbusmanagement.repository.TripEmployeeRepository;
import com.example.slbusmanagement.repository.TripExpenseRepository;
import com.example.slbusmanagement.repository.EmployeeSalaryRepository;
import com.example.slbusmanagement.repository.OtherServiceRepository;
import com.example.slbusmanagement.repository.TripRepository;
import com.example.slbusmanagement.service.TripService;
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
public class TripServiceImpl implements TripService {

    private final TripRepository tripRepository;
    private final BusRepository busRepository;
    private final EmployeeRepository employeeRepository;
    private final TripEmployeeRepository tripEmployeeRepository;
    private final TripExpenseRepository tripExpenseRepository;
    private final EmployeeSalaryRepository employeeSalaryRepository;
    private final OtherServiceRepository otherServiceRepository;


    private Bus resolveBus(Long busId) {
        if (busId == null) return null;
        return busRepository.findById(busId)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
    }


    private void validateRoutePermit(TripCategory category, Bus bus) {
        if (category != TripCategory.ROUTE) return;
        if (bus == null || bus.getPermitStartLocation() == null || bus.getPermitStartLocation().isBlank()
                || bus.getPermitEndLocation() == null || bus.getPermitEndLocation().isBlank()) {
            throw new CustomException(ResponseCode.BAD_REQUEST,
                    "This bus does not have a valid Route Permit — a ROUTE-category trip requires one.");
        }
    }

    private TripDTO toDto(Trip entity) {
        TripDTO dto = new TripDTO();
        BeanUtils.copyProperties(entity, dto);
        dto.setBusId(entity.getBus() != null ? entity.getBus().getBusId() : null);
        dto.setTripCategory(entity.getTripCategory() != null ? entity.getTripCategory().name() : null);
        dto.setTripDate(DateUtil.formatDate(entity.getTripDate()));
        return dto;
    }

    @Override
    public List<TripDTO> getAll() {
        log.info("Get All Trip Method Executed....");

        return tripRepository.findAllByStatus(RecordStatus.ACTIVE).stream()
                .map(this::toDto).toList();
    }

    @Override
    public TripDTO add(TripDTO dto) {
        log.info("Save Trip Method Executed....");
        Trip entity = new Trip();
        BeanUtils.copyProperties(dto, entity);   // copies matching-name fields (dates, etc.); "busId"->"bus" and tripCategory (String->enum) are handled explicitly below

        entity.setTripId(null);
        Bus bus = resolveBus(dto.getBusId());
        TripCategory category = dto.getTripCategory() != null ? TripCategory.valueOf(dto.getTripCategory()) : null;
        validateRoutePermit(category, bus);
        entity.setBus(bus);
        entity.setTripCategory(category);
        entity.setTripDate(DateUtil.parseDate(dto.getTripDate()));
        entity.setStatus(RecordStatus.ACTIVE);
        tripRepository.save(entity);
        log.info("Trip Saved Successfully....");
        return toDto(entity);
    }


    private void validateHasDriver(List<TripEmployeeDTO> crew) {
        boolean hasDriver = crew != null && crew.stream()
                .anyMatch(c -> "DRIVER1".equals(c.getRoleInTrip()) || "DRIVER2".equals(c.getRoleInTrip()));
        if (!hasDriver) {
            throw new CustomException(ResponseCode.BAD_REQUEST,
                    "At least one driver (Driver 1 or Driver 2) must be assigned — a trip can't go out without a driver.");
        }
    }

    @Override
    public TripDTO addWithCrew(TripWithCrewDTO dto) {
        log.info("Save Trip With Crew Method Executed....");
        validateHasDriver(dto.getCrew());


        Trip tripEntity = new Trip();
        TripDTO tripDto = dto.getTrip();
        BeanUtils.copyProperties(tripDto, tripEntity);

        tripEntity.setTripId(null);
        Bus bus = resolveBus(tripDto.getBusId());
        TripCategory category = tripDto.getTripCategory() != null ? TripCategory.valueOf(tripDto.getTripCategory()) : null;
        validateRoutePermit(category, bus);
        tripEntity.setBus(bus);
        tripEntity.setTripCategory(category);
        tripEntity.setTripDate(DateUtil.parseDate(tripDto.getTripDate()));
        tripEntity.setStatus(RecordStatus.ACTIVE);
        tripRepository.save(tripEntity);

        for (TripEmployeeDTO crewDto : dto.getCrew()) {
            TripEmployee te = new TripEmployee();
            te.setTrip(tripEntity);
            Long empId = crewDto.getEmpId();
            Employee emp = empId != null
                    ? employeeRepository.findById(empId).orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND))
                    : null;
            te.setEmployee(emp);
            te.setRoleInTrip(crewDto.getRoleInTrip() != null ? RoleInTrip.valueOf(crewDto.getRoleInTrip()) : null);
            te.setAssignedDate(DateUtil.parseDate(crewDto.getAssignedDate()));
            te.setCreatedBy(crewDto.getCreatedBy());
            te.setStatus(RecordStatus.ACTIVE);
            tripEmployeeRepository.save(te);
        }

        log.info("Trip and {} crew assignment(s) Saved Successfully....", dto.getCrew().size());
        return toDto(tripEntity);
    }

    @Override
    public TripDTO update(Long id, TripDTO dto) {
        log.info("Update Trip Method Executed....");
        Trip entity = tripRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

        entity.setTripCategory(dto.getTripCategory() != null ? TripCategory.valueOf(dto.getTripCategory()) : null);
        Bus bus = resolveBus(dto.getBusId());
        validateRoutePermit(entity.getTripCategory(), bus);
        entity.setBus(bus);
        entity.setStartLocation(dto.getStartLocation());
        entity.setEndLocation(dto.getEndLocation());
        entity.setDistance(dto.getDistance());
        entity.setTotalIncome(dto.getTotalIncome());
        entity.setTripDate(DateUtil.parseDate(dto.getTripDate()));
        entity.setDescription(dto.getDescription());


        tripRepository.save(entity);
        log.info("Trip Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {
        log.info("Delete Trip Method Executed....");
        Trip entity = tripRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));


        boolean hasExpenses = tripExpenseRepository.findAll().stream()
                .anyMatch(e -> e.getTrip() != null && id.equals(e.getTrip().getTripId()));
        boolean hasSalary = employeeSalaryRepository.findAll().stream()
                .anyMatch(s -> s.getTrip() != null && id.equals(s.getTrip().getTripId()));
        boolean hasServices = otherServiceRepository.findAll().stream()
                .anyMatch(s -> s.getTrip() != null && id.equals(s.getTrip().getTripId()));
        if (hasExpenses || hasSalary || hasServices) {
            throw new CustomException(ResponseCode.BAD_REQUEST, "Cannot delete this trip — it has linked expenses, salary, or other-service records.");
        }


        entity.setStatus(RecordStatus.INACTIVE);
        tripRepository.save(entity);
        log.info("Trip Deleted (soft) Successfully....");
    }
}
