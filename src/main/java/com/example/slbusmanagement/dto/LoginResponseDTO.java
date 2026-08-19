package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @AllArgsConstructor @NoArgsConstructor
public class LoginResponseDTO {
    private Long userId;
    private String username;
    private String name;
    private String role;
    private String contact;
    private String nic;
    private String email;
    private String createdAt;
    private String token;
    private boolean twoFactorEnabled;
    /** True when the password check passed but an email OTP is still
     *  required before a usable token is issued — token/other fields are
     *  intentionally null in that case (see AuthServiceImpl.login()). */
    private boolean otpRequired;
}
