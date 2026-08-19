package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.contant.CommonResponse;
import com.example.slbusmanagement.dto.AccidentDTO;
import com.example.slbusmanagement.service.AccidentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "v1/accident")
@CrossOrigin
@RequiredArgsConstructor
public class AccidentController {

    private final AccidentService accidentService;

    @GetMapping(value = "/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse getAll() {
        List<AccidentDTO> items = accidentService.getAll();
        return new CommonResponse(0, items, "Get all Accident");
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse add(@RequestBody AccidentDTO dto) {
        AccidentDTO saved = accidentService.add(dto);
        return new CommonResponse(0, saved, "Accident added successfully");
    }
}
