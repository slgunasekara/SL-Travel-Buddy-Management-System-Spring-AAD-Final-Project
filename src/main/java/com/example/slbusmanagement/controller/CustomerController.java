package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.constant.CommonResponse;
import com.example.slbusmanagement.dto.CustomerDTO;
import com.example.slbusmanagement.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import com.example.slbusmanagement.constant.ResponseCode;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping(value = "v1/customer")
@CrossOrigin
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping(value = "/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> getAll() {
        List<CustomerDTO> items = customerService.getAll();
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, items, "Get all Customer"));
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> add(@jakarta.validation.Valid @RequestBody CustomerDTO dto) {
        CustomerDTO saved = customerService.add(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new CommonResponse(ResponseCode.OPERATION_SUCCESS, saved, "Customer added successfully"));
    }

    @PutMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> update(@PathVariable Long id, @jakarta.validation.Valid @RequestBody CustomerDTO dto) {
        CustomerDTO updated = customerService.update(id, dto);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, updated, "Customer updated successfully"));
    }

    @PreAuthorize("hasAnyRole('Owner','Manager')")
    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> delete(@PathVariable Long id) {
        customerService.delete(id);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, "Success", "Customer deleted successfully"));
    }
}
