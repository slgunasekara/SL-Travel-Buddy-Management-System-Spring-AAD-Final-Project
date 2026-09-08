package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.BusDTO;
import com.example.slbusmanagement.entity.Bus;
import com.example.slbusmanagement.enumeration.RecordStatus;
import com.example.slbusmanagement.exception.CustomException;
import com.example.slbusmanagement.repository.BusRepository;
import com.example.slbusmanagement.repository.EventRepository;
import com.example.slbusmanagement.repository.MaintenanceRepository;
import com.example.slbusmanagement.repository.OtherServiceRepository;
import com.example.slbusmanagement.repository.PartPurchaseRepository;
import com.example.slbusmanagement.repository.TripRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Issue 17: unit tests for BusServiceImpl — the "Bus number must be unique"
 * check (Issue 27) and the "can't delete a bus that's still referenced
 * elsewhere" guard (Issue 7) are exactly the two pieces of real business
 * logic in this service, so they're what's covered here rather than
 * re-testing what JpaRepository/BeanUtils already guarantee.
 */
@ExtendWith(MockitoExtension.class)
class BusServiceImplTest {

    @Mock private BusRepository busRepository;
    @Mock private TripRepository tripRepository;
    @Mock private EventRepository eventRepository;
    @Mock private MaintenanceRepository maintenanceRepository;
    @Mock private PartPurchaseRepository partPurchaseRepository;
    @Mock private OtherServiceRepository otherServiceRepository;

    @InjectMocks
    private BusServiceImpl busService;

    private BusDTO validDto;

    @BeforeEach
    void setUp() {
        validDto = new BusDTO();
        validDto.setBusBrandName("Ashok Leyland");
        validDto.setBusNumber("NB-1234");
        validDto.setBusType("LUXURY");
        validDto.setNoOfSeats(45);
        validDto.setBusStatus("ACTIVE");
    }

    @Test
    void add_throwsConflict_whenBusNumberAlreadyExists() {
        when(busRepository.findByBusNumberIgnoreCaseAndStatus("NB-1234", RecordStatus.ACTIVE))
                .thenReturn(List.of(new Bus()));

        CustomException ex = assertThrows(CustomException.class, () -> busService.add(validDto));
        assertEquals(409, ex.getStatus());
        verify(busRepository, never()).save(any());
    }

    @Test
    void add_savesNewBus_whenBusNumberIsUnique() {
        when(busRepository.findByBusNumberIgnoreCaseAndStatus("NB-1234", RecordStatus.ACTIVE))
                .thenReturn(Collections.emptyList());
        when(busRepository.save(any(Bus.class))).thenAnswer(inv -> inv.getArgument(0));

        BusDTO result = busService.add(validDto);

        assertEquals("NB-1234", result.getBusNumber());
        assertEquals("ACTIVE", result.getBusStatus());
        verify(busRepository, times(1)).save(any(Bus.class));
    }

    @Test
    void add_neverSendsAClientSuppliedId_toSave() {
        // Issue 6: ids must always come from @GeneratedValue(IDENTITY),
        // never from the caller — a non-null id here would make JPA treat
        // the insert as an update against a row that doesn't exist yet.
        validDto.setBusId(999L);
        when(busRepository.findByBusNumberIgnoreCaseAndStatus(any(), any())).thenReturn(Collections.emptyList());
        when(busRepository.save(any(Bus.class))).thenAnswer(inv -> inv.getArgument(0));

        busService.add(validDto);

        verify(busRepository).save(argThat(b -> b.getBusId() == null));
    }

    @Test
    void delete_throwsNotFound_whenBusDoesNotExist() {
        when(busRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> busService.delete(1L));
    }

    @Test
    void delete_throwsBadRequest_whenBusHasLinkedTrips() {
        Bus existing = new Bus();
        existing.setBusId(1L);
        existing.setStatus(RecordStatus.ACTIVE);
        when(busRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(tripRepository.existsByBus_BusIdAndStatus(1L, RecordStatus.ACTIVE)).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () -> busService.delete(1L));
        assertEquals(400, ex.getStatus());
        verify(busRepository, never()).save(any());
    }

    @Test
    void delete_softDeletes_whenBusHasNoReferences() {
        Bus existing = new Bus();
        existing.setBusId(1L);
        existing.setStatus(RecordStatus.ACTIVE);
        when(busRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(tripRepository.existsByBus_BusIdAndStatus(anyLong(), any())).thenReturn(false);
        when(eventRepository.existsByBus_BusIdAndStatus(anyLong(), any())).thenReturn(false);
        when(maintenanceRepository.existsByBus_BusIdAndStatus(anyLong(), any())).thenReturn(false);
        when(partPurchaseRepository.findByBus_BusIdAndStatus(anyLong(), any())).thenReturn(Collections.emptyList());
        when(otherServiceRepository.existsByBus_BusIdAndStatus(anyLong(), any())).thenReturn(false);

        busService.delete(1L);

        // Issue 27 note: this must be a soft delete (status flips to
        // INACTIVE) — the row is never actually removed from the table.
        assertEquals(RecordStatus.INACTIVE, existing.getStatus());
        verify(busRepository, times(1)).save(existing);
    }
}
