package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.contant.CommonResponse;
import com.example.slbusmanagement.dto.TripEmployeeDTO;
import com.example.slbusmanagement.service.TripEmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "v1/trip-employee")
@CrossOrigin
@RequiredArgsConstructor
public class TripEmployeeController {

    private final TripEmployeeService tripEmployeeService;


    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse add(@RequestBody TripEmployeeDTO dto) {
        TripEmployeeDTO saved = tripEmployeeService.add(dto);
        return new CommonResponse(0, saved, "TripEmployee added successfully");
    }
}
