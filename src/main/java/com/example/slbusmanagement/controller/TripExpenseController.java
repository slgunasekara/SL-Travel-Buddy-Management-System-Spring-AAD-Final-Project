package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.contant.CommonResponse;
import com.example.slbusmanagement.dto.TripExpenseDTO;
import com.example.slbusmanagement.service.TripExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "v1/trip-expense")
@CrossOrigin
@RequiredArgsConstructor
public class TripExpenseController {

    private final TripExpenseService tripExpenseService;


    @GetMapping(value = "/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse getAll() {
        List<TripExpenseDTO> items = tripExpenseService.getAll();
        return new CommonResponse(0, items, "Get all TripExpense");
    }


    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse add(@RequestBody TripExpenseDTO dto) {
        TripExpenseDTO saved = tripExpenseService.add(dto);
        return new CommonResponse(0, saved, "TripExpense added successfully");
    }


    @PutMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse update(@PathVariable Long id, @RequestBody TripExpenseDTO dto) {
        TripExpenseDTO updated = tripExpenseService.update(id, dto);
        return new CommonResponse(0, updated, "TripExpense updated successfully");
    }

    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse delete(@PathVariable Long id) {
        tripExpenseService.delete(id);
        return new CommonResponse(0, "Success", "TripExpense deleted successfully");
    }

}
