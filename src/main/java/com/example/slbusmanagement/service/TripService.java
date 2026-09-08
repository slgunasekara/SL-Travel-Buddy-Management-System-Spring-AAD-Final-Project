package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.TripDTO;
import com.example.slbusmanagement.dto.TripWithCrewDTO;

import java.util.List;

public interface TripService {
    List<TripDTO> getAll();
    TripDTO add(TripDTO dto);
    TripDTO addWithCrew(TripWithCrewDTO dto);
    TripDTO update(Long id, TripDTO dto);
    void delete(Long id);
}
