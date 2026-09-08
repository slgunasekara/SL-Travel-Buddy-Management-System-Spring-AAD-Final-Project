package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.constant.CommonResponse;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.dto.LoginEventDTO;
import com.example.slbusmanagement.security.JwtUtil;
import com.example.slbusmanagement.service.LoginEventService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;


@RestController
@RequestMapping(value = "v1/login-events")
@CrossOrigin
@RequiredArgsConstructor
public class LoginEventController {

    private final LoginEventService loginEventService;
    private final JwtUtil jwtUtil;

    @GetMapping(value = "/recent", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> recent(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, List.of(), "No events"));
        }
        String token = authHeader.substring(7);
        Long selfUserId = jwtUtil.extractUserId(token);
        String selfRole = jwtUtil.extractRole(token);

        List<LoginEventDTO> events = loginEventService.getRecentForRole(selfUserId, selfRole);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, events, "Recent login events"));
    }
}
