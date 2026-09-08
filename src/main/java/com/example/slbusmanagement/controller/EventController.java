package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.constant.CommonResponse;
import com.example.slbusmanagement.dto.EventDTO;
import com.example.slbusmanagement.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import com.example.slbusmanagement.constant.ResponseCode;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping(value = "v1/event")
@CrossOrigin
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping(value = "/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> getAll() {
        List<EventDTO> items = eventService.getAll();
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, items, "Get all Event"));
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> add(@jakarta.validation.Valid @RequestBody EventDTO dto) {
        EventDTO saved = eventService.add(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new CommonResponse(ResponseCode.OPERATION_SUCCESS, saved, "Event added successfully"));
    }

    @PutMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> update(@PathVariable Long id, @jakarta.validation.Valid @RequestBody EventDTO dto) {
        EventDTO updated = eventService.update(id, dto);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, updated, "Event updated successfully"));
    }

    @PreAuthorize("hasAnyRole('Owner','Manager')")
    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> delete(@PathVariable Long id) {
        eventService.delete(id);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, "Success", "Event deleted successfully"));
    }
}
