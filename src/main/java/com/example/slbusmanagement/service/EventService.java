package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.EventDTO;

import java.util.List;

public interface EventService {
    List<EventDTO> getAll();
    EventDTO add(EventDTO dto);
    EventDTO update(Long id, EventDTO dto);
    void delete(Long id);
}
