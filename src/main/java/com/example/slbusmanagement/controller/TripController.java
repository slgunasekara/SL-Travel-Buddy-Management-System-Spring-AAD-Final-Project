package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.contant.CommonResponse;
import com.example.slbusmanagement.dto.TripDTO;
import com.example.slbusmanagement.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "v1/trip")
@CrossOrigin
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;


    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse add(@RequestBody TripDTO dto) {
        TripDTO saved = tripService.add(dto);
        return new CommonResponse(0, saved, "Trip added successfully");
    }
}
