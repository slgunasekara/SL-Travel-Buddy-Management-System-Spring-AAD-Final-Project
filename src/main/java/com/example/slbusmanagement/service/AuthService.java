package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.*;

public interface AuthService {

    LoginResponseDTO login(LoginRequestDTO request);

    //Completes a login that returned otpRequired=true
    LoginResponseDTO verifyTwoFactor(TwoFactorVerifyRequestDTO request);

    // Self-service
    void toggleTwoFactor(String username, boolean enabled);

    OtpResponseDTO requestOtp(OtpRequestDTO request);

    OtpVerifyResponseDTO verifyOtp(OtpVerifyRequestDTO request);

    void resetPassword(ResetPasswordRequestDTO request);

    //Self-service change of the CURRENTLY authenticated user own
    void changePassword(String username, ChangePasswordRequestDTO request);
}
