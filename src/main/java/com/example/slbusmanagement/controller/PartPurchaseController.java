package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.contant.CommonResponse;
import com.example.slbusmanagement.dto.PartPurchaseDTO;
import com.example.slbusmanagement.service.PartPurchaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "v1/part-purchase")
@CrossOrigin
@RequiredArgsConstructor
public class PartPurchaseController {

    private final PartPurchaseService partPurchaseService;


    @GetMapping(value = "/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse getAll() {
        List<PartPurchaseDTO> items = partPurchaseService.getAll();
        return new CommonResponse(0, items, "Get all PartPurchase");
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse add(@RequestBody PartPurchaseDTO dto) {
        PartPurchaseDTO saved = partPurchaseService.add(dto);
        return new CommonResponse(0, saved, "PartPurchase added successfully");
    }

}
