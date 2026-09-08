package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.TripEmployeeDTO;
import com.example.slbusmanagement.entity.Employee;
import com.example.slbusmanagement.entity.Trip;
import com.example.slbusmanagement.entity.TripEmployee;
import com.example.slbusmanagement.enumeration.RecordStatus;
import com.example.slbusmanagement.exception.CustomException;
import com.example.slbusmanagement.repository.EmployeeRepository;
import com.example.slbusmanagement.repository.TripEmployeeRepository;
import com.example.slbusmanagement.repository.TripRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Issue 1/17: TripEmployee.tripId/empId were converted from plain Long
 * fields to real @ManyToOne Trip/Employee relationships. These tests
 * cover the resolve-then-save logic that conversion introduced — the
 * part most at risk of a silent regression since it isn't caught by the
 * compiler (both the old Long field and the new relationship field
 * happily accept null, so a wiring mistake here would only show up at
 * runtime, if the DTO id doesn't round-trip after a save).
 */
@ExtendWith(MockitoExtension.class)
class TripEmployeeServiceImplTest {

    @Mock private TripEmployeeRepository tripEmployeeRepository;
    @Mock private TripRepository tripRepository;
    @Mock private EmployeeRepository employeeRepository;

    @InjectMocks
    private TripEmployeeServiceImpl tripEmployeeService;

    private TripEmployeeDTO dto;
    private Trip trip;
    private Employee employee;

    @BeforeEach
    void setUp() {
        dto = new TripEmployeeDTO();
        dto.setTripId(10L);
        dto.setEmpId(20L);
        dto.setRoleInTrip("DRIVER");
        dto.setAssignedDate("2026-08-21");

        trip = new Trip();
        trip.setTripId(10L);

        employee = new Employee();
        employee.setEmpId(20L);
    }

    @Test
    void add_resolvesTripAndEmployee_andSetsThemOnTheEntity() {
        when(tripRepository.findById(10L)).thenReturn(Optional.of(trip));
        when(employeeRepository.findById(20L)).thenReturn(Optional.of(employee));
        when(tripEmployeeRepository.save(any(TripEmployee.class))).thenAnswer(inv -> inv.getArgument(0));

        TripEmployeeDTO result = tripEmployeeService.add(dto);

        // The DTO/API contract is still flat ids — this is the round trip
        // that proves the object relationship was wired correctly.
        assertEquals(10L, result.getTripId());
        assertEquals(20L, result.getEmpId());
        assertEquals("DRIVER", result.getRoleInTrip());

        verify(tripEmployeeRepository).save(argThat(te ->
                te.getTrip() == trip && te.getEmployee() == employee && te.getTripEmpId() == null));
    }

    @Test
    void add_throwsNotFound_whenTripIdDoesNotExist() {
        when(tripRepository.findById(10L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> tripEmployeeService.add(dto));
        assertEquals(404, ex.getStatus());
        verify(tripEmployeeRepository, never()).save(any());
    }

    @Test
    void add_throwsNotFound_whenEmployeeIdDoesNotExist() {
        when(tripRepository.findById(10L)).thenReturn(Optional.of(trip));
        when(employeeRepository.findById(20L)).thenReturn(Optional.empty());

        assertThrows(CustomException.class, () -> tripEmployeeService.add(dto));
        verify(tripEmployeeRepository, never()).save(any());
    }

    @Test
    void update_reResolvesTripAndEmployee_ifChanged() {
        TripEmployee existing = new TripEmployee();
        existing.setTripEmpId(1L);
        existing.setStatus(RecordStatus.ACTIVE);
        when(tripEmployeeRepository.findById(1L)).thenReturn(Optional.of(existing));

        Trip newTrip = new Trip();
        newTrip.setTripId(99L);
        dto.setTripId(99L);
        when(tripRepository.findById(99L)).thenReturn(Optional.of(newTrip));
        when(employeeRepository.findById(20L)).thenReturn(Optional.of(employee));
        when(tripEmployeeRepository.save(any(TripEmployee.class))).thenAnswer(inv -> inv.getArgument(0));

        TripEmployeeDTO result = tripEmployeeService.update(1L, dto);

        assertEquals(99L, result.getTripId());
        assertSame(newTrip, existing.getTrip());
    }

    @Test
    void delete_softDeletes_doesNotRemoveRow() {
        TripEmployee existing = new TripEmployee();
        existing.setTripEmpId(1L);
        existing.setStatus(RecordStatus.ACTIVE);
        when(tripEmployeeRepository.findById(1L)).thenReturn(Optional.of(existing));

        tripEmployeeService.delete(1L);

        assertEquals(RecordStatus.INACTIVE, existing.getStatus());
        verify(tripEmployeeRepository, never()).delete(any());
        verify(tripEmployeeRepository, times(1)).save(existing);
    }
}
