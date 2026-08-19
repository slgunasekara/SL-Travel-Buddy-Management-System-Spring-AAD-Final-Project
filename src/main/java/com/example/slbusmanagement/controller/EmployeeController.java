package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.contant.CommonResponse;
import com.example.slbusmanagement.dto.EmployeeDTO;
import com.example.slbusmanagement.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "v1/employee")
@CrossOrigin
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping(value = "/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse getAll() {
        List<EmployeeDTO> items = employeeService.getAll();
        return new CommonResponse(0, items, "Get all Employee");
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse add(@RequestBody EmployeeDTO dto) {
        EmployeeDTO saved = employeeService.add(dto);
        return new CommonResponse(0, saved, "Employee added successfully");
    }

    @PutMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse update(@PathVariable Long id, @RequestBody EmployeeDTO dto) {
        EmployeeDTO updated = employeeService.update(id, dto);
        return new CommonResponse(0, updated, "Employee updated successfully");
    }

    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse delete(@PathVariable Long id) {
        employeeService.delete(id);
        return new CommonResponse(0, "Success", "Employee deleted successfully");
    }

}
