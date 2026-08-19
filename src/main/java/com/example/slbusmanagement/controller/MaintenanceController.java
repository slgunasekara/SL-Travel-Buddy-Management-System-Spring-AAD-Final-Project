package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.contant.CommonResponse;
import com.example.slbusmanagement.dto.MaintenanceDTO;
import com.example.slbusmanagement.service.MaintenanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "v1/maintenance")
@CrossOrigin
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    @GetMapping(value = "/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse getAll() {
        List<MaintenanceDTO> items = maintenanceService.getAll();
        return new CommonResponse(0, items, "Get all Maintenance");
    }


    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse add(@RequestBody MaintenanceDTO dto) {
        MaintenanceDTO saved = maintenanceService.add(dto);
        return new CommonResponse(0, saved, "Maintenance added successfully");
    }

}
