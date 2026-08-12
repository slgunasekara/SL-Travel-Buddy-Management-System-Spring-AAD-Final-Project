package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Mirrors the shape Auth.requestOtp() used to return client-side:
 *  { ok, otp, user } — the OTP is deliberately included here (not emailed
 *  server-side) so the existing "demo mode" panel / EmailJS flow in
 *  index.html keeps working exactly as before. */
@Data @AllArgsConstructor @NoArgsConstructor
public class OtpResponseDTO {
    private boolean ok;
    private String otp;
    private Long userId;
    private String userName;
    private String email;
}
