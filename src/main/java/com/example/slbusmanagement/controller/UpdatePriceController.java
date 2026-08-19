package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.contant.CommonResponse;
import com.example.slbusmanagement.dto.UpdatePriceDTO;
import com.example.slbusmanagement.service.UpdatePriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "v1/price")
@CrossOrigin
@RequiredArgsConstructor
public class UpdatePriceController {

    private final UpdatePriceService updatePriceService;

    @GetMapping(value = "/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse getAll() {
        List<UpdatePriceDTO> items = updatePriceService.getAll();
        return new CommonResponse(0, items, "Get all UpdatePrice");
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse add(@RequestBody UpdatePriceDTO dto) {
        UpdatePriceDTO saved = updatePriceService.add(dto);
        return new CommonResponse(0, saved, "UpdatePrice added successfully");
    }

    @PutMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse update(@PathVariable Long id, @RequestBody UpdatePriceDTO dto) {
        UpdatePriceDTO updated = updatePriceService.update(id, dto);
        return new CommonResponse(0, updated, "UpdatePrice updated successfully");
    }
}
