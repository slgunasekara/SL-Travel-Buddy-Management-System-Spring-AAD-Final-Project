package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.EventDTO;
import com.example.slbusmanagement.entity.Event;
import com.example.slbusmanagement.enumiration.RecordStatus;
import com.example.slbusmanagement.exception.CustomeException;
import com.example.slbusmanagement.repository.EventRepository;
import com.example.slbusmanagement.service.EventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;

    private EventDTO toDto(Event entity) {
        EventDTO dto = new EventDTO();
        BeanUtils.copyProperties(entity, dto);
        return dto;
    }


    @Override
    public List<EventDTO> getAll() {
        log.info("Get All Event Method Executed....");

        return eventRepository.findAll().stream()
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .map(this::toDto).toList();
    }


    @Override
    public EventDTO add(EventDTO dto) {
        log.info("Save Event Method Executed....");
        Event entity = new Event();
        BeanUtils.copyProperties(dto, entity);
        entity.setStatus(RecordStatus.ACTIVE);
        eventRepository.save(entity);
        log.info("Event Saved Successfully....");
        return toDto(entity);
    }

    @Override
    public EventDTO update(Long id, EventDTO dto) {
        log.info("Update Event Method Executed....");
        Event entity = eventRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomeException(404, "Event not found with ID: " + id));

        entity.setBusId(dto.getBusId());
        entity.setLinkedTripId(dto.getLinkedTripId());
        entity.setStartLocation(dto.getStartLocation());
        entity.setEndLocation(dto.getEndLocation());
        entity.setEventValue(dto.getEventValue());
        entity.setEventDate(dto.getEventDate());
        entity.setCustomerName(dto.getCustomerName());
        entity.setCustomerContact(dto.getCustomerContact());
        entity.setCustomerNic(dto.getCustomerNic());
        entity.setCustomerAddress(dto.getCustomerAddress());
        entity.setDescription(dto.getDescription());
        entity.setEventCompleted(dto.getEventCompleted());
        entity.setCreatedBy(dto.getCreatedBy());
        entity.setCreatedAt(dto.getCreatedAt());
        entity.setUpdatedAt(dto.getUpdatedAt());

        eventRepository.save(entity);
        log.info("Event Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {

    }
}
