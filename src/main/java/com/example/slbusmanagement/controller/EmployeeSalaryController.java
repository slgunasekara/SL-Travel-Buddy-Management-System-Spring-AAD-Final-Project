package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.constant.CommonResponse;
import com.example.slbusmanagement.dto.EmployeeSalaryDTO;
import com.example.slbusmanagement.service.EmployeeSalaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import com.example.slbusmanagement.constant.ResponseCode;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;


@RestController
@RequestMapping(value = "v1/salary")
@CrossOrigin
@RequiredArgsConstructor
public class EmployeeSalaryController {

    private final EmployeeSalaryService employeeSalaryService;

    @GetMapping(value = "/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> getAll() {
        List<EmployeeSalaryDTO> items = employeeSalaryService.getAll();
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, items, "Get all EmployeeSalary"));
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> add(@jakarta.validation.Valid @RequestBody EmployeeSalaryDTO dto) {
        EmployeeSalaryDTO saved = employeeSalaryService.add(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new CommonResponse(ResponseCode.OPERATION_SUCCESS, saved, "EmployeeSalary added successfully"));
    }

    @PutMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> update(@PathVariable Long id, @jakarta.validation.Valid @RequestBody EmployeeSalaryDTO dto) {
        EmployeeSalaryDTO updated = employeeSalaryService.update(id, dto);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, updated, "EmployeeSalary updated successfully"));
    }

    @PreAuthorize("hasAnyRole('Owner','Manager')")
    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> delete(@PathVariable Long id) {
        employeeSalaryService.delete(id);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, "Success", "EmployeeSalary deleted successfully"));
    }
}
