package com.example.slbusmanagement.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class PasswordResetOtp {

    @Id
    private Long otpId;

    private Long userId;
    private String otpCode;
    private String email;
    private String createdAt;
    private String expiresAt;
    private boolean isUsed;
}
