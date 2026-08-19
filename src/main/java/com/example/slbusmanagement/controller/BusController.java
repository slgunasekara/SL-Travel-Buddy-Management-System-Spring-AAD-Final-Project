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

    @GetMapping(value = "/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse getAll() {
        List<BusDTO> items = busService.getAll();
        return new CommonResponse(0, items, "Get all Bus");
    }



    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse add(@RequestBody BusDTO dto) {
        BusDTO saved = busService.add(dto);
        return new CommonResponse(0, saved, "Bus added successfully");
    }

    @PutMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse update(@PathVariable Long id, @RequestBody BusDTO dto) {
        BusDTO updated = busService.update(id, dto);
        return new CommonResponse(0, updated, "Bus updated successfully");
    }

    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse delete(@PathVariable Long id) {
        busService.delete(id);
        return new CommonResponse(0, "Success", "Bus deleted successfully");
    }
}
