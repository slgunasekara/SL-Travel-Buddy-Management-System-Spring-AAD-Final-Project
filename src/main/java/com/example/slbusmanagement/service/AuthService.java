package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.*;

public interface AuthService {
    LoginResponseDTO login(LoginRequestDTO request);
    OtpResponseDTO requestOtp(OtpRequestDTO request);
    OtpVerifyResponseDTO verifyOtp(OtpVerifyRequestDTO request);
    void resetPassword(ResetPasswordRequestDTO request);

    void changePassword(String username, ChangePasswordRequestDTO request);
}
