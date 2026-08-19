package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.contant.CommonResponse;
import com.example.slbusmanagement.dto.BusDTO;
import com.example.slbusmanagement.service.BusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "v1/bus")
@CrossOrigin
@RequiredArgsConstructor
public class BusController {

    private final BusService busService;


    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse add(@RequestBody BusDTO dto) {
        BusDTO saved = busService.add(dto);
        return new CommonResponse(0, saved, "Bus added successfully");
    }
}
