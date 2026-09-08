package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.constant.CommonResponse;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.dto.*;
import com.example.slbusmanagement.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "v1/auth")
@CrossOrigin
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping(value = "/login", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> login(@jakarta.validation.Valid @RequestBody LoginRequestDTO request) {
        LoginResponseDTO response = authService.login(request);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, response, "Login successful"));
    }

    @PostMapping(value = "/forgot/request", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> requestOtp(@jakarta.validation.Valid @RequestBody OtpRequestDTO request) {
        OtpResponseDTO response = authService.requestOtp(request);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, response,
                response.isOk() ? "Verification code generated" : "No account found with that email address."));
    }

    @PostMapping(value = "/forgot/verify", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> verifyOtp(@jakarta.validation.Valid @RequestBody OtpVerifyRequestDTO request) {
        OtpVerifyResponseDTO response = authService.verifyOtp(request);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, response, "Code verified"));
    }

    @PostMapping(value = "/forgot/reset", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> resetPassword(@jakarta.validation.Valid @RequestBody ResetPasswordRequestDTO request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, "Success", "Password reset successfully"));
    }


    @PostMapping(value = "/change-password", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> changePassword(java.security.Principal principal, @jakarta.validation.Valid @RequestBody ChangePasswordRequestDTO request) {
        authService.changePassword(principal.getName(), request);
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, "Success", "Password changed successfully"));
    }
}
