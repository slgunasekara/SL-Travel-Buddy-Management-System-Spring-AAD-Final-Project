package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.constant.CommonResponse;
import com.example.slbusmanagement.dto.UpdatePriceDTO;
import com.example.slbusmanagement.service.UpdatePriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import com.example.slbusmanagement.constant.ResponseCode;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;


@RestController
@RequestMapping(value = "v1/price")
@CrossOrigin
@RequiredArgsConstructor
public class UpdatePriceController {

    private final UpdatePriceService updatePriceService;

    @GetMapping(value = "/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> getAll() {
        List<UpdatePriceDTO> items = updatePriceService.getAll();
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, items, "Get all UpdatePrice"));
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> add(@jakarta.validation.Valid @RequestBody UpdatePriceDTO dto) {
        UpdatePriceDTO saved = updatePriceService.add(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new CommonResponse(ResponseCode.OPERATION_SUCCESS, saved, "UpdatePrice added successfully"));
    }

    @PutMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> update(@PathVariable Long id, @jakarta.validation.Valid @RequestBody UpdatePriceDTO dto) {
        UpdatePriceDTO updated = updatePriceService.update(id, dto);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, updated, "UpdatePrice updated successfully"));
    }

    @PreAuthorize("hasAnyRole('Owner','Manager')")
    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> delete(@PathVariable Long id) {
        updatePriceService.delete(id);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, "Success", "UpdatePrice deleted successfully"));
    }
}
