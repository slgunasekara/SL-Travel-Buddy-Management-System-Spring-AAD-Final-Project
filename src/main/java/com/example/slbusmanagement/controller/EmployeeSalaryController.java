package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.contant.CommonResponse;
import com.example.slbusmanagement.dto.EmployeeSalaryDTO;
import com.example.slbusmanagement.service.EmployeeSalaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "v1/salary")
@CrossOrigin
@RequiredArgsConstructor
public class EmployeeSalaryController {

    private final EmployeeSalaryService employeeSalaryService;

    @GetMapping(value = "/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse getAll() {
        List<EmployeeSalaryDTO> items = employeeSalaryService.getAll();
        return new CommonResponse(0, items, "Get all EmployeeSalary");
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse add(@RequestBody EmployeeSalaryDTO dto) {
        EmployeeSalaryDTO saved = employeeSalaryService.add(dto);
        return new CommonResponse(0, saved, "EmployeeSalary added successfully");
    }
}
