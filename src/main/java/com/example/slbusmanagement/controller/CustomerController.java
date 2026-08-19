package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.contant.CommonResponse;
import com.example.slbusmanagement.dto.CustomerDTO;
import com.example.slbusmanagement.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "v1/customer")
@CrossOrigin
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping(value = "/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse getAll() {
        List<CustomerDTO> items = customerService.getAll();
        return new CommonResponse(0, items, "Get all Customer");
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse add(@RequestBody CustomerDTO dto) {
        CustomerDTO saved = customerService.add(dto);
        return new CommonResponse(0, saved, "Customer added successfully");
    }

    @PutMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse update(@PathVariable Long id, @RequestBody CustomerDTO dto) {
        CustomerDTO updated = customerService.update(id, dto);
        return new CommonResponse(0, updated, "Customer updated successfully");
    }
}
