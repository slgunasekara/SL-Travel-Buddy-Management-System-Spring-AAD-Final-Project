package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.contant.CommonResponse;
import com.example.slbusmanagement.dto.EventDTO;
import com.example.slbusmanagement.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "v1/event")
@CrossOrigin
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping(value = "/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse getAll() {
        List<EventDTO> items = eventService.getAll();
        return new CommonResponse(0, items, "Get all Event");
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse add(@RequestBody EventDTO dto) {
        EventDTO saved = eventService.add(dto);
        return new CommonResponse(0, saved, "Event added successfully");
    }
}
