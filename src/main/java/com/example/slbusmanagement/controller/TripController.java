package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.constant.CommonResponse;
import com.example.slbusmanagement.dto.TripDTO;
import com.example.slbusmanagement.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import com.example.slbusmanagement.constant.ResponseCode;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping(value = "v1/trip")
@CrossOrigin
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @GetMapping(value = "/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> getAll() {
        List<TripDTO> items = tripService.getAll();
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, items, "Get all Trip"));
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> add(@jakarta.validation.Valid @RequestBody TripDTO dto) {
        TripDTO saved = tripService.add(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new CommonResponse(ResponseCode.OPERATION_SUCCESS, saved, "Trip added successfully"));
    }


    @PostMapping(value = "/with-crew", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> addWithCrew(@jakarta.validation.Valid @RequestBody com.example.slbusmanagement.dto.TripWithCrewDTO dto) {
        TripDTO saved = tripService.addWithCrew(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new CommonResponse(ResponseCode.OPERATION_SUCCESS, saved, "Trip and crew saved successfully"));
    }

    @PutMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> update(@PathVariable Long id, @jakarta.validation.Valid @RequestBody TripDTO dto) {
        TripDTO updated = tripService.update(id, dto);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, updated, "Trip updated successfully"));
    }

    @PreAuthorize("hasAnyRole('Owner','Manager')")
    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> delete(@PathVariable Long id) {
        tripService.delete(id);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, "Success", "Trip deleted successfully"));
    }
}
