package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.EventDTO;
import com.example.slbusmanagement.entity.Bus;
import com.example.slbusmanagement.entity.Customer;
import com.example.slbusmanagement.entity.Event;
import com.example.slbusmanagement.entity.Trip;
import com.example.slbusmanagement.enumeration.RecordStatus;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.exception.CustomException;
import com.example.slbusmanagement.repository.BusRepository;
import com.example.slbusmanagement.repository.CustomerRepository;
import com.example.slbusmanagement.repository.EventRepository;
import com.example.slbusmanagement.repository.TripRepository;
import com.example.slbusmanagement.service.EventService;
import com.example.slbusmanagement.util.DateUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Transactional
@Service
@Slf4j
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final BusRepository busRepository;
    private final TripRepository tripRepository;
    private final CustomerRepository customerRepository;

    private Bus resolveBus(Long busId) {
        if (busId == null) return null;
        return busRepository.findById(busId)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
    }

    private Trip resolveLinkedTrip(Long tripId) {
        if (tripId == null) return null;
        return tripRepository.findById(tripId)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
    }


    private Customer findOrCreateCustomer(EventDTO dto) {
        String nic = dto.getCustomerNic();
        String contact = dto.getCustomerContact();

        List<Customer> matches = List.of();
        if (nic != null && !nic.isBlank()) {
            matches = customerRepository.findByNicIgnoreCaseAndStatus(nic, RecordStatus.ACTIVE);
        }
        if (matches.isEmpty() && contact != null && !contact.isBlank()) {
            matches = customerRepository.findByContactAndStatus(contact, RecordStatus.ACTIVE);
        }
        if (!matches.isEmpty()) return matches.get(0);

        Customer customer = new Customer();
        customer.setName(dto.getCustomerName());
        customer.setContact(contact);

        customer.setNic(nic != null && !nic.isBlank() ? nic : null);
        customer.setAddress(dto.getCustomerAddress());
        customer.setCreatedBy(dto.getCreatedBy());
        customer.setCreatedAt(LocalDateTime.now());
        customer.setStatus(RecordStatus.ACTIVE);
        return customerRepository.save(customer);
    }

    private EventDTO toDto(Event entity) {
        EventDTO dto = new EventDTO();
        BeanUtils.copyProperties(entity, dto);
        dto.setBusId(entity.getBus() != null ? entity.getBus().getBusId() : null);
        dto.setLinkedTripId(entity.getLinkedTrip() != null ? entity.getLinkedTrip().getTripId() : null);
        dto.setCustomerId(entity.getCustomer() != null ? entity.getCustomer().getCustomerId() : null);
        dto.setEventDate(DateUtil.formatDate(entity.getEventDate()));
        dto.setCreatedAt(DateUtil.formatDateTime(entity.getCreatedAt()));
        dto.setUpdatedAt(DateUtil.formatDateTime(entity.getUpdatedAt()));
        return dto;
    }

    @Override
    public List<EventDTO> getAll() {
        log.info("Get All Event Method Executed....");

        return eventRepository.findAllByStatus(RecordStatus.ACTIVE).stream()
                .map(this::toDto).toList();
    }

    @Override
    public EventDTO add(EventDTO dto) {
        log.info("Save Event Method Executed....");
        Event entity = new Event();
        BeanUtils.copyProperties(dto, entity);

        entity.setEventId(null);
        entity.setBus(resolveBus(dto.getBusId()));
        entity.setLinkedTrip(resolveLinkedTrip(dto.getLinkedTripId()));
        entity.setCustomer(findOrCreateCustomer(dto));
        entity.setEventDate(DateUtil.parseDate(dto.getEventDate()));
        entity.setStatus(RecordStatus.ACTIVE);
        LocalDateTime now = LocalDateTime.now();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        eventRepository.save(entity);
        log.info("Event Saved Successfully....");
        return toDto(entity);
    }

    @Override
    public EventDTO update(Long id, EventDTO dto) {
        log.info("Update Event Method Executed....");
        Event entity = eventRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

        entity.setBus(resolveBus(dto.getBusId()));
        entity.setLinkedTrip(resolveLinkedTrip(dto.getLinkedTripId()));
        entity.setCustomer(findOrCreateCustomer(dto));
        entity.setStartLocation(dto.getStartLocation());
        entity.setEndLocation(dto.getEndLocation());
        entity.setEventValue(dto.getEventValue());
        entity.setEventDate(DateUtil.parseDate(dto.getEventDate()));
        entity.setCustomerName(dto.getCustomerName());
        entity.setCustomerContact(dto.getCustomerContact());
        entity.setCustomerNic(dto.getCustomerNic());
        entity.setCustomerAddress(dto.getCustomerAddress());
        entity.setDescription(dto.getDescription());
        entity.setEventCompleted(dto.getEventCompleted());
        entity.setPhotoFileName(dto.getPhotoFileName());

        entity.setUpdatedAt(LocalDateTime.now());

        eventRepository.save(entity);
        log.info("Event Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {
        log.info("Delete Event Method Executed....");
        Event entity = eventRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));


        entity.setStatus(RecordStatus.INACTIVE);
        eventRepository.save(entity);
        log.info("Event Deleted (soft) Successfully....");
    }
}
