package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.contant.CommonResponse;
import com.example.slbusmanagement.dto.UserDTO;
import com.example.slbusmanagement.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Manage Users — Owner role only (enforced in SecurityConfig). */
@RestController
@RequestMapping(value = "v1/user")
@CrossOrigin
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping(value = "/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse getAll() {
        List<UserDTO> items = userService.getAll();
        return new CommonResponse(0, items, "Get all users");
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public CommonResponse add(@RequestBody UserDTO dto) {
        UserDTO saved = userService.add(dto);
        return new CommonResponse(0, saved, "User added successfully");
    }
}
